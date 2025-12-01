
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { File, LoaderCircle } from 'lucide-react';
import type { WorkOrder, Customer, AllocatedPart } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format, parseISO } from 'date-fns';
import { Input } from '@/components/ui/input';
import * as xlsx from 'xlsx';

type UsedPartRecord = {
  id: string;
  partName: string;
  partNumber: string;
  quantity: number;
  facility: string;
  date: string;
}

export function PartsUsageReportTab() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [customers, setCustomers] = useState<Record<string, Customer>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [nameFilter, setNameFilter] = useState('');
  const [facilityFilter, setFacilityFilter] = useState('');

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);

    const workOrdersQuery = query(
      collection(db, 'work-orders'),
      where('companyId', '==', user.companyId)
    );
    const customersQuery = query(
      collection(db, 'customers'),
      where('companyId', '==', user.companyId)
    );

    const unsubWorkOrders = onSnapshot(workOrdersQuery, (snapshot) => {
      const ordersData: WorkOrder[] = [];
      snapshot.forEach((doc) => {
        ordersData.push({ id: doc.id, ...doc.data() } as WorkOrder);
      });
      setWorkOrders(ordersData);
      setIsLoading(false);
    });

    const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
      const customersData: Record<string, Customer> = {};
      snapshot.forEach((doc) => {
        customersData[doc.id] = { id: doc.id, ...doc.data() } as Customer;
      });
      setCustomers(customersData);
    });

    return () => {
      unsubWorkOrders();
      unsubCustomers();
    };
  }, [user?.companyId]);

  const usedPartsData = useMemo(() => {
    const data: UsedPartRecord[] = [];
    workOrders.forEach(wo => {
      if (wo.allocatedParts) {
        wo.allocatedParts.forEach(part => {
          if (part.status === 'Used') {
            data.push({
              id: `${wo.id}-${part.id}`,
              partName: part.name,
              partNumber: part.partNumber,
              quantity: part.quantity,
              facility: customers[wo.customerId]?.name || 'Unknown Facility',
              date: wo.completedDate ? format(parseISO(wo.completedDate), 'yyyy-MM-dd') : 'N/A',
            });
          }
        });
      }
    });
    return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [workOrders, customers]);
  
  const filteredData = useMemo(() => {
    return usedPartsData.filter(part => {
      const nameMatch = nameFilter ? 
        part.partName.toLowerCase().includes(nameFilter.toLowerCase()) || 
        part.partNumber.toLowerCase().includes(nameFilter.toLowerCase()) : true;
      
      const facilityMatch = facilityFilter ? 
        part.facility.toLowerCase().includes(facilityFilter.toLowerCase()) : true;
        
      return nameMatch && facilityMatch;
    });
  }, [usedPartsData, nameFilter, facilityFilter]);
  
  const handleExport = () => {
    const dataToExport = filteredData.map(p => ({
        'Part Name': p.partName,
        'Part Number': p.partNumber,
        'Quantity Used': p.quantity,
        'Facility': p.facility,
        'Date Used': p.date,
    }));
    
    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "PartUsage");
    
    xlsx.writeFile(workbook, "Part_Usage_Report.xlsx");
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-10">
        <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Loading usage report...</p>
      </div>
    );
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <CardTitle>Parts Usage Report</CardTitle>
                <CardDescription>
                A consolidated table of all recently used parts.
                </CardDescription>
            </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2">
            <Input
                placeholder="Filter by Part Name/Number..."
                value={nameFilter}
                onChange={(e) => setNameFilter(e.target.value)}
                className="w-full"
            />
            <div className="w-full sm:w-auto flex gap-2">
                <Input
                    placeholder="Filter by Facility..."
                    value={facilityFilter}
                    onChange={(e) => setFacilityFilter(e.target.value)}
                    className="w-full"
                />
                 <Button size="sm" variant="outline" className="h-10 gap-1 w-full" onClick={handleExport}>
                    <File className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Export
                    </span>
                </Button>
            </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PART NAME</TableHead>
                <TableHead>PART NUMBER</TableHead>
                <TableHead>QUANTITY</TableHead>
                <TableHead>FACILITY</TableHead>
                <TableHead>DATE</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredData.length > 0 ? (
                filteredData.map((part) => (
                  <TableRow key={part.id}>
                    <TableCell className="font-medium">{part.partName}</TableCell>
                    <TableCell>{part.partNumber}</TableCell>
                    <TableCell>{part.quantity}</TableCell>
                    <TableCell>{part.facility}</TableCell>
                    <TableCell>{part.date}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={5}
                    className="h-24 text-center"
                  >
                    No used parts found matching your criteria.
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
