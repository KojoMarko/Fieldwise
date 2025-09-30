
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Asset, Customer } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import Link from 'next/link';
import { EditAssetDialog } from './edit-asset-dialog';
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
import { deleteAsset } from '@/ai/flows/delete-asset';
import { format } from 'date-fns';

function CustomerNameCell({ customerId }: { customerId: string }) {
    const [name, setName] = useState('Loading...');
    
    useEffect(() => {
        const fetchCustomer = async () => {
            if (!customerId) {
                setName('N/A');
                return;
            }
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
    accessorKey: 'installationDate',
    header: 'Installed On',
    cell: ({ row }) => {
      const dateStr = row.original.installationDate;
      if (!dateStr) return <span>N/A</span>;
      try {
        const date = new Date(dateStr);
        return <span>{format(date, 'MMM d, yyyy')}</span>;
      } catch (e) {
        return <span>Invalid Date</span>
      }
    },
    meta: {
      className: 'hidden lg:table-cell',
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const asset = row.original;
      const { toast } = useToast();
      const [isEditDialogOpen, setEditDialogOpen] = useState(false);
      const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

      const handleRemove = async () => {
        try {
            await deleteAsset({ assetId: asset.id });
            toast({
                title: 'Asset Removed',
                description: `Asset "${asset.name}" has been removed.`,
            });
        } catch (error) {
            console.error("Failed to remove asset:", error);
            toast({
                variant: 'destructive',
                title: 'Removal Failed',
                description: 'Could not remove the asset at this time.',
            });
        }
        setDeleteDialogOpen(false);
      }

      return (
        <>
            <EditAssetDialog 
                open={isEditDialogOpen}
                onOpenChange={setEditDialogOpen}
                asset={asset}
            />
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the asset.
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
                    <Link href={`/dashboard/assets/${asset.id}`}>View Asset Details</Link>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>Edit / Transfer Asset</DropdownMenuItem>
                <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Asset
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
        </>
      );
    },
  },
];
