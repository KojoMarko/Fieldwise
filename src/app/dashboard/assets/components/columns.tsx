
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Asset, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

function CustomerNameCell({ customerId }: { customerId: string }) {
    const [name, setName] = useState('Loading...');
    
    useEffect(() => {
        const fetchCustomer = async () => {
            const docRef = doc(db, "customers", customerId);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                setName((docSnap.data() as Customer).name);
            } else {
                setName('N/A');
            }
        };
        fetchCustomer();
    }, [customerId]);

    return <span>{name}</span>;
}


export const columns: ColumnDef<Asset>[] = [
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
    header: 'Asset Name',
    cell: ({ row }) => {
        return (
            <div>
                <div className="font-medium">{row.original.name}</div>
                <div className="text-sm text-muted-foreground md:hidden">{row.original.serialNumber}</div>
                <div className="hidden text-sm text-muted-foreground md:inline">{row.original.model}</div>
            </div>
        )
    }
  },
    {
    accessorKey: 'serialNumber',
    header: 'Serial Number',
    // Hide this column on mobile, show on tablets and larger
    meta: {
        className: 'hidden md:table-cell'
    }
  },
  {
    accessorKey: 'customerId',
    header: 'Customer',
    cell: ({ row }) => <CustomerNameCell customerId={row.original.customerId} />,
    // Hide this column on smaller screens
     meta: {
        className: 'hidden lg:table-cell'
    }
  },
  {
    accessorKey: 'location',
    header: 'Location',
     // Hide this column on smaller screens
     meta: {
        className: 'hidden lg:table-cell'
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => {
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
              <DropdownMenuItem>View Asset Details</DropdownMenuItem>
              <DropdownMenuItem>Edit Asset</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
