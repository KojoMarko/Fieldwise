
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { File, LoaderCircle, ArrowRightLeft } from 'lucide-react';
import type { TransferLogEvent } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';

export function TransfersReportTab() {
  const { user } = useAuth();
  const [transferLogs, setTransferLogs] = useState<TransferLogEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const logsQuery = query(
      collection(db, 'transfer-log'),
      where('companyId', '==', user.companyId),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
      const logsData: TransferLogEvent[] = [];
      snapshot.forEach((doc) => {
        logsData.push({ id: doc.id, ...doc.data() } as TransferLogEvent);
      });
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
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={4}
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
