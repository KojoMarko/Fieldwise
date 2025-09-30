
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
import { EditCustomerDialog } from './edit-customer-dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { deleteCustomer } from '@/ai/flows/delete-customer';
import Link from 'next/link';

export const columns: ColumnDef<Customer>[] = [
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
    accessorKey: 'name',
    header: 'Customer Name',
    cell: ({ row }) => {
      return (
        <div>
            <div className="font-medium">{row.original.name}</div>
            <div className="text-sm text-muted-foreground">{row.original.address}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'contactPerson',
    header: 'Contact Person',
     cell: ({ row }) => {
      return (
        <div>
            <div className="font-medium">{row.original.contactPerson}</div>
            <div className="text-sm text-muted-foreground">{row.original.contactEmail}</div>
        </div>
      );
    },
  },
    {
    accessorKey: 'phone',
    header: 'Phone',
  },
  {
    id: 'actions',
    cell: function Cell({ row }) {
      const { user } = useAuth();
      const { toast } = useToast();
      const isAdmin = user?.role === 'Admin';
      const targetCustomer = row.original;
      
      const [isEditDialogOpen, setEditDialogOpen] = useState(false);
      const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);


      if (!isAdmin) return null;

      const handleRemove = async () => {
        try {
            await deleteCustomer({ customerId: targetCustomer.id });
            toast({
                title: 'Customer Removed',
                description: `Customer "${targetCustomer.name}" has been removed.`,
            });
        } catch (error) {
            console.error("Failed to remove customer:", error);
            toast({
                variant: 'destructive',
                title: 'Removal Failed',
                description: 'Could not remove the customer at this time.',
            });
        }
        setDeleteDialogOpen(false);
      }

      return (
        <>
            <EditCustomerDialog 
                open={isEditDialogOpen}
                onOpenChange={setEditDialogOpen}
                customer={targetCustomer}
            />
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        customer account and all associated data.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleRemove} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
            <div className="text-right">
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
                    <Link href={`/dashboard/customers/${targetCustomer.id}`}>View Customer Details</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>Edit Customer</DropdownMenuItem>
                <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Customer
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
        </>
      );
    },
  },
];
