'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { workOrders, users, customers } from '@/lib/data';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreHorizontal } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { WorkOrderStatus } from '@/lib/types';
import { useState } from 'react';
import { AssignTechnicianDialog } from '@/app/dashboard/work-orders/components/assign-technician-dialog';


const statusStyles: Record<WorkOrderStatus, string> = {
    Draft: 'bg-gray-200 text-gray-800',
    Scheduled: 'bg-blue-100 text-blue-800',
    'In-Progress': 'bg-yellow-100 text-yellow-800',
    'On-Hold': 'bg-orange-100 text-orange-800',
    Completed: 'bg-green-100 text-green-800',
    Invoiced: 'bg-purple-100 text-purple-800',
    Cancelled: 'bg-red-100 text-red-800',
};


export function RecentWorkOrders() {
  const recentOrders = workOrders.slice(0, 5);
   const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<typeof workOrders[0] | null>(null);

  const handleAssignClick = (order: typeof workOrders[0]) => {
    setSelectedOrder(order);
    setAssignDialogOpen(true);
  }

  return (
    <>
    {selectedOrder && (
        <AssignTechnicianDialog
            open={isAssignDialogOpen}
            onOpenChange={setAssignDialogOpen}
            workOrder={selectedOrder}
        />
    )}
    <Card>
      <CardHeader>
        <CardTitle>Recent Work Orders</CardTitle>
        <CardDescription>A list of the most recent work orders.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer</TableHead>
              <TableHead className="hidden sm:table-cell">Status</TableHead>
              <TableHead className="hidden md:table-cell">Technician</TableHead>
              <TableHead className="text-right">Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {recentOrders.map((order) => {
              const customer = customers.find((c) => c.id === order.customerId);
              const technician = users.find((u) => u.id === order.technicianId);
              return (
                <TableRow key={order.id}>
                  <TableCell>
                    <div className="font-medium">{customer?.name}</div>
                    <div className="hidden text-sm text-muted-foreground md:inline">
                      {order.title}
                    </div>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">
                    <Badge className={cn("hover:bg-none", statusStyles[order.status])} variant="outline">
                      {order.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {technician?.name || 'Unassigned'}
                  </TableCell>
                  <TableCell className="text-right">
                    {new Date(order.scheduledDate).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                           <Link href={`/dashboard/work-orders/${order.id}`}>View Details</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleAssignClick(order)}>Assign Technician</DropdownMenuItem>
                        <DropdownMenuItem>Mark as Completed</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </>
  );
}
