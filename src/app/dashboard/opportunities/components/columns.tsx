
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { MoreHorizontal, ArrowUpDown, List } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

export type Opportunity = {
  id: string;
  name: string;
  company: string;
  value: number;
  probability: number;
  stage: 'Discovery' | 'Qualification' | 'Proposal' | 'Negotiation' | 'Closing';
  closeDate: string;
};

const stageColors: Record<Opportunity['stage'], string> = {
    Discovery: 'bg-blue-500/20 text-blue-800 border-blue-500/30',
    Qualification: 'bg-purple-500/20 text-purple-800 border-purple-500/30',
    Proposal: 'bg-yellow-500/20 text-yellow-800 border-yellow-500/30',
    Negotiation: 'bg-orange-500/20 text-orange-800 border-orange-500/30',
    Closing: 'bg-green-500/20 text-green-800 border-green-500/30',
}

export const columns: ColumnDef<Opportunity>[] = [
  {
    accessorKey: 'name',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Opportunity Name
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      );
    },
     cell: ({ row }) => <div className="pl-4 font-medium">{row.getValue('name')}</div>,
  },
  {
    accessorKey: 'company',
    header: 'Company',
  },
  {
    accessorKey: 'value',
    header: ({ column }) => <div 
        className="text-right"
        onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
    >
        <Button variant="ghost">
            Value
            <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
    </div>,
    cell: ({ row }) => {
      const amount = parseFloat(row.getValue('value'));
      const formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
      }).format(amount);

      return <div className="text-right font-medium">{formatted}</div>;
    },
  },
    {
    accessorKey: 'probability',
    header: 'Probability',
    cell: ({ row }) => {
        const probability = row.getValue('probability') as number;
        return (
            <div className='flex items-center gap-2'>
                <Progress value={probability} className="h-2 w-20" />
                <span>{probability}%</span>
            </div>
        )
    },
    meta: {
        className: 'hidden lg:table-cell',
    }
  },
  {
    accessorKey: 'stage',
    header: 'Stage',
    cell: ({ row }) => {
        const stage = row.getValue('stage') as Opportunity['stage'];
        return <Badge variant="outline" className={stageColors[stage]}>{stage}</Badge>
    }
  },
  {
    accessorKey: 'closeDate',
    header: 'Close Date',
    cell: ({ row }) => {
        const date = new Date(row.getValue('closeDate'));
        return new Intl.DateTimeFormat('en-US').format(date);
    },
    meta: {
        className: 'hidden md:table-cell',
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
            <DropdownMenuItem>View Opportunity</DropdownMenuItem>
            <DropdownMenuItem>Edit</DropdownMenuItem>
            <DropdownMenuItem>Change Stage</DropdownMenuItem>
            <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
