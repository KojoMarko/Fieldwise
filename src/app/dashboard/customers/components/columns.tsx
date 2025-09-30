
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
      const isAdmin = user?.role === 'Admin';
      const targetCustomer = row.original;

      if (!isAdmin) return null;

      return (
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
              <DropdownMenuItem>View Customer Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Customer</DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => console.log('Remove customer', targetCustomer.id)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Remove Customer
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
