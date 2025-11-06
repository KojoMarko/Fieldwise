'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { File, LoaderCircle, ArrowRightLeft, CheckCircle, MoreHorizontal } from 'lucide-react';
import type { TransferLogEvent, WorkOrder } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where, orderBy, doc, updateDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, formatISO, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { createWorkOrder } from '@/ai/flows/create-work-order';


export function TransfersReportTab() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [transferLogs, setTransferLogs] = useState<TransferLogEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState<string | null>(null);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const logsQuery = query(
      collection(db, 'transfer-log'),
      where('companyId', '==', user.companyId)
    );
    
    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsData: TransferLogEvent[] = [];
      snapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() } as TransferLogEvent);
      });
      // Sort client-side to avoid composite index requirement
      logsData.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setTransferLogs(logsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);

  
  const filteredData = useMemo(() => {
    return transferLogs.filter(log => {
      const searchString = filter.toLowerCase();
      return (
        log.partName.toLowerCase().includes(searchString) ||
        log.partNumber.toLowerCase().includes(searchString) ||
        log.toFacilityName.toLowerCase().includes(searchString) ||
        log.transferredBy.toLowerCase().includes(searchString)
      );
    });
  }, [transferLogs, filter]);

  const handleMarkAsUsed = async (log: TransferLogEvent) => {
      if (!user) return;
      setIsSubmitting(log.id);

      try {
          // 1. Create a simplified, completed work order for tracking
          const workOrderRef = doc(collection(db, 'work-orders'));
          const completedDate = new Date();
          const newWorkOrder: Omit<WorkOrder, 'id'> = {
              title: `Direct Part Usage at ${log.toFacilityName}`,
              description: `Part: ${log.partName} (P/N: ${log.partNumber}), Quantity: ${log.quantity}, used directly at the facility.`,
              status: 'Completed',
              priority: 'Low',
              type: 'Corrective', // or a new type like 'Consumption'
              assetId: 'N/A', // No specific asset
              customerId: log.toFacilityId,
              companyId: user.companyId,
              createdAt: log.timestamp, // Use transfer time as creation time
              scheduledDate: log.timestamp,
              completedDate: formatISO(completedDate),
              allocatedParts: [{
                  id: log.partId,
                  name: log.partName,
                  partNumber: log.partNumber,
                  quantity: log.quantity,
                  status: 'Used',
                  companyId: log.companyId,
                  assetModel: '', // Not tied to a specific model in this context
                  location: log.toFacilityName,
              }]
          };

          // 2. Decrement the facility stock for the spare part
          const partRef = doc(db, 'spare-parts', log.partId);
          const partDoc = await db.runTransaction(async (transaction) => {
              const sfDoc = await transaction.get(partRef);
              if (!sfDoc.exists()) {
                  throw "Spare part document not found!";
              }
              const currentData = sfDoc.data();
              const facilityStock = currentData.facilityStock || [];
              const facilityIndex = facilityStock.findIndex((f: any) => f.facilityId === log.toFacilityId);

              if (facilityIndex > -1) {
                  facilityStock[facilityIndex].quantity -= log.quantity;
                  if (facilityStock[facilityIndex].quantity < 0) {
                      // This should ideally not happen if transfers are tracked correctly
                      facilityStock[facilityIndex].quantity = 0;
                  }
              }
              transaction.update(partRef, { facilityStock });
          });
          
          // 3. Set the new work order in a batch
          const batch = writeBatch(db);
          batch.set(workOrderRef, { ...newWorkOrder, id: workOrderRef.id });

          // 4. Commit batch
          await batch.commit();

          toast({
              title: 'Part Usage Recorded',
              description: `${log.quantity} x ${log.partName} marked as used at ${log.toFacilityName}.`,
          });

      } catch (error: any) {
          console.error("Failed to mark part as used:", error);
          toast({
              variant: 'destructive',
              title: 'Update Failed',
              description: error.message || 'An unexpected error occurred.',
          });
      } finally {
          setIsSubmitting(null);
      }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading transfer report...</p>
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>Stock Transfer Report</CardTitle>
                <CardDescription>
                A log of all spare part movements from the central warehouse to facilities.
                </CardDescription>
            </div>
            <Button size="sm" variant="outline" className="h-8 gap-1 w-full sm:w-auto">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export Report
                </span>
            </Button>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row gap-4">
            <Input
                placeholder="Filter by Part, Facility, or User..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-full sm:max-w-sm"
            />
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Part</TableHead>
                <TableHead>Transfer Details</TableHead>
                <TableHead>Transferred By</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className='text-right'>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      <div className="font-medium">{log.partName}</div>
                      <div className="text-sm text-muted-foreground">{log.partNumber}</div>
                    </TableCell>
                    <TableCell>
                        <div className="flex items-center gap-2">
                           <span className="font-semibold">{log.quantity} units</span>
                           <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
                           <span>{log.toFacilityName}</span>
                        </div>
                    </TableCell>
                    <TableCell>{log.transferredBy}</TableCell>
                    <TableCell>{format(parseISO(log.timestamp), 'yyyy-MM-dd, hh:mm a')}</TableCell>
                    <TableCell className='text-right'>
                       <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" disabled={isSubmitting === log.id}>
                                    {isSubmitting === log.id ? <LoaderCircle className="h-4 w-4 animate-spin" /> : <MoreHorizontal className="h-4 w-4" />}
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent>
                                <DropdownMenuItem onClick={() => handleMarkAsUsed(log)}>
                                    <CheckCircle className="mr-2 h-4 w-4" />
                                    Mark as Used
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center"
                  >
                    No stock transfers found matching your criteria.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
