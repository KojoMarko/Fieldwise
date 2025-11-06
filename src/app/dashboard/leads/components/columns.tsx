
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export type Lead = {
  id: string;
  company: string;
  contact: string;
  email: string;
  phone: string;
  value: number;
  status: 'Qualified' | 'Contacted' | 'New' | 'Converted';
  source: string;
  lastContact: string;
};

const statusColors: Record<Lead['status'], string> = {
    Qualified: 'bg-primary/20 text-primary-foreground border-primary/30',
    Contacted: 'bg-blue-500/20 text-blue-800 border-blue-500/30',
    New: 'bg-gray-500/20 text-gray-800 border-gray-500/30',
    Converted: 'bg-green-500/20 text-green-800 border-green-500/30',
}

export const columns: ColumnDef<Lead>[] = [
  {
    accessorKey: 'company',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Company
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
     cell: ({ row }) => {
        return (
            <div className="pl-4">
                <div className="font-medium">{row.original.company}</div>
                <div className="text-sm text-muted-foreground">{row.original.contact}</div>
            </div>
        )
     },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => <div className="hidden lg:block">{row.original.email}</div>,
  },
  {
    accessorKey: 'phone',
    header: 'Phone',
     meta: {
        className: 'hidden xl:table-cell'
    }
  },
  {
    accessorKey: 'value',
    header: () => <div className="text-right">Value</div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('value'));
      const formatted = new Intl.NumberFormat('en-GH', {
        style: 'currency',
        currency: 'GHS',
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
    meta: {
        className: 'hidden sm:table-cell'
    }
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
        const status = row.getValue('status') as Lead['status'];
        return <Badge variant="outline" className={statusColors[status]}>{status}</Badge>
    }
  },
  {
    accessorKey: 'source',
    header: 'Source',
     meta: {
        className: 'hidden lg:table-cell'
    }
  },
  {
    accessorKey: 'lastContact',
    header: 'Last Contact',
     meta: {
        className: 'hidden xl:table-cell'
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem>View Lead</DropdownMenuItem>
            <DropdownMenuItem>Edit Lead</DropdownMenuItem>
            <DropdownMenuItem>Mark as Qualified</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete Lead</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
