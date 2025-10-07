
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
import type { WorkOrder, WorkOrderStatus, User, Customer } from '@/lib/types';
import Link from 'next/link';
import { AssignTechnicianDialog } from './assign-technician-dialog';
import { GenerateInvoiceDialog } from './generate-invoice-dialog';
import { useEffect, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';


const statusStyles: Record<WorkOrderStatus, string> = {
  Draft: 'bg-gray-200 text-gray-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  Dispatched: 'bg-cyan-100 text-cyan-800',
  'On-Site': 'bg-teal-100 text-teal-800',
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
  const { toast } = useToast();

  const isAdmin = user?.role === 'Admin';

  const handleStatusUpdate = async (status: WorkOrderStatus) => {
    try {
      const workOrderRef = doc(db, 'work-orders', workOrder.id);
      await updateDoc(workOrderRef, { status });
      toast({
        title: 'Status Updated',
        description: `Work order status changed to "${status}".`
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'Could not update status.'
      });
    }
  }
  
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
              <DropdownMenuItem onClick={() => setAssignDialogOpen(true)} disabled={!workOrder.technicianId}>
                {workOrder.technicianId ? 'Re-assign Engineer' : 'Assign Engineer'}
              </DropdownMenuItem>
              {workOrder.status === 'Draft' && (
                 <DropdownMenuItem onClick={() => handleStatusUpdate('Scheduled')}>
                    Schedule Work
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setInvoiceDialogOpen(true)} disabled={workOrder.status !== 'Completed'}>
                Generate Invoice
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}

function CustomerCell({ row }: { row: { original: WorkOrder }}) {
    const [customerName, setCustomerName] = useState('Loading...');
    const { user } = useAuth();

    useEffect(() => {
        if (!user?.companyId || !row.original.customerId) {
            setCustomerName('N/A');
            return;
        }

        const customerRef = doc(db, "customers", row.original.customerId);
        
        const unsubscribe = onSnapshot(customerRef, (doc) => {
            if (doc.exists()) {
                setCustomerName((doc.data() as Customer).name);
            } else {
                setCustomerName('N/A');
            }
        }, () => setCustomerName('Error'));

        return () => unsubscribe();
    }, [row.original.customerId, user?.companyId]);
    
    return <div>{customerName}</div>;
}


function TechnicianCell({ row }: { row: { original: WorkOrder }}) {
    const [techName, setTechName] = useState<string | null>('Unassigned');
     const { user } = useAuth();

    useEffect(() => {
        const techId = row.original.technicianId;
        if (!techId || !user?.companyId) {
            setTechName('Unassigned');
            return;
        };

        const userRef = doc(db, "users", techId);
        const unsubscribe = onSnapshot(userRef, (doc) => {
             if (doc.exists()) {
                setTechName((doc.data() as User).name);
             } else {
                setTechName('Unassigned');
             }
        }, () => setTechName('Error'));

        return () => unsubscribe();
    }, [row.original.technicianId, user?.companyId]);
    
    return techName ? <div>{techName}</div> : <div className="text-muted-foreground">Unassigned</div>;
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
      return (
        <div>
          <div className="font-medium">{row.original.title}</div>
           <div className="text-sm text-muted-foreground md:hidden">
              <CustomerCell row={row} />
            </div>
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
    accessorKey: 'customerId',
    header: 'Customer',
    cell: CustomerCell,
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
    header: 'Engineer',
    cell: TechnicianCell,
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
