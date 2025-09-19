
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Checkbox } from '@/components/ui/checkbox';
import type { WorkOrder, WorkOrderStatus, User } from '@/lib/types';
import { customers, users } from '@/lib/data';
import Link from 'next/link';
import { AssignTechnicianDialog } from './assign-technician-dialog';
import { GenerateInvoiceDialog } from './generate-invoice-dialog';
import { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';


const statusStyles: Record<WorkOrderStatus, string> = {
  Draft: 'bg-gray-200 text-gray-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  'In-Progress': 'bg-yellow-100 text-yellow-800',
  'On-Hold': 'bg-orange-100 text-orange-800',
  Completed: 'bg-green-100 text-green-800',
  Invoiced: 'bg-purple-100 text-purple-800',
  Cancelled: 'bg-red-100 text-red-800',
};

// Custom cell component for actions to handle user roles
function ActionsCell({ row }: { row: { original: WorkOrder }}) {
  const { user } = useAuth();
  const workOrder = row.original;
  const [isAssignDialogOpen, setAssignDialogOpen] = useState(false);
  const [isInvoiceDialogOpen, setInvoiceDialogOpen] = useState(false);

  const isAdmin = user?.role === 'Admin';
  
  return (
    <>
      {isAdmin && (
        <AssignTechnicianDialog
          open={isAssignDialogOpen}
          onOpenChange={setAssignDialogOpen}
          workOrder={workOrder}
        />
      )}
       {isAdmin && (
        <GenerateInvoiceDialog
          open={isInvoiceDialogOpen}
          onOpenChange={setInvoiceDialogOpen}
          workOrder={workOrder}
        />
      )}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem asChild>
            <Link href={`/dashboard/work-orders/${workOrder.id}`}>
              View Details
            </Link>
          </DropdownMenuItem>
          {isAdmin && (
            <>
              <DropdownMenuItem onClick={() => setAssignDialogOpen(true)}>
                Assign Technician
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setInvoiceDialogOpen(true)}>
                Generate Invoice
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}


export const columns: ColumnDef<WorkOrder>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && 'indeterminate')
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'title',
    header: 'Title',
    cell: ({ row }) => {
      const customer = customers.find((c) => c.id === row.original.customerId);
      return (
        <div>
          <div className="font-medium">{row.original.title}</div>
          <div className="text-sm text-muted-foreground md:hidden">{customer?.name}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as WorkOrderStatus;
      return (
        <Badge className={statusStyles[status]} variant="outline">
          {status}
        </Badge>
      );
    },
  },
    {
    accessorKey: 'customer',
    header: 'Customer',
    cell: ({ row }) => {
      const customer = customers.find((c) => c.id === row.original.customerId);
      return customer?.name;
    },
     meta: {
      className: 'hidden md:table-cell',
    },
  },
  {
    accessorKey: 'priority',
    header: 'Priority',
    cell: ({ row }) => {
      const priority = row.getValue('priority') as string;
      const priorityClass =
        priority === 'High'
          ? 'text-destructive'
          : priority === 'Medium'
          ? 'text-amber-600'
          : 'text-muted-foreground';
      return <div className={priorityClass}>{priority}</div>;
    },
     meta: {
      className: 'hidden sm:table-cell',
    },
  },
  {
    accessorKey: 'technicianId',
    header: 'Technician',
    cell: ({ row }) => {
      const techId = row.getValue('technicianId') as string;
      const technician = users.find((u) => u.id === techId);
      return technician ? (
        technician.name
      ) : (
        <span className="text-muted-foreground">Unassigned</span>
      );
    },
     meta: {
      className: 'hidden lg:table-cell',
    },
  },
  {
    accessorKey: 'scheduledDate',
    header: 'Scheduled',
    cell: ({ row }) => {
      const date = new Date(row.getValue('scheduledDate'));
      return new Intl.DateTimeFormat('en-US').format(date);
    },
     meta: {
      className: 'hidden lg:table-cell',
    },
  },
  {
    id: 'actions',
    cell: ActionsCell,
  },
];
