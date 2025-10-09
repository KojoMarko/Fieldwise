
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { SparePart } from '@/lib/types';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { AdjustStockDialog } from './adjust-stock-dialog';
import { ViewPartDetailsDialog } from './view-part-details-dialog';
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
import { deleteSparePart } from '@/ai/flows/delete-spare-part';

function ActionsCell({ part }: { part: SparePart }) {
  const { toast } = useToast();
  const [isAdjustStockOpen, setAdjustStockOpen] = useState(false);
  const [isViewDetailsOpen, setViewDetailsOpen] = useState(false);
  const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleRemove = async () => {
    try {
        await deleteSparePart({ partId: part.id });
        toast({
            title: 'Part Deleted',
            description: `Part "${part.name}" has been deleted.`,
        });
    } catch (error) {
        console.error("Failed to delete part:", error);
        toast({
            variant: 'destructive',
            title: 'Deletion Failed',
            description: 'Could not delete the part at this time.',
        });
    }
    setDeleteDialogOpen(false);
  }

  return (
    <>
      <AdjustStockDialog
        open={isAdjustStockOpen}
        onOpenChange={setAdjustStockOpen}
        part={part}
      />
      <ViewPartDetailsDialog
        open={isViewDetailsOpen}
        onOpenChange={setViewDetailsOpen}
        part={part}
      />
       <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the spare part from your inventory.
                </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleRemove} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem onClick={() => setAdjustStockOpen(true)}>
            Adjust Stock
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setViewDetailsOpen(true)}>
            View Details
          </DropdownMenuItem>
           <DropdownMenuItem
                className="text-destructive"
                onClick={() => setDeleteDialogOpen(true)}
            >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Part
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
}


export const sparePartsColumns: ColumnDef<SparePart>[] = [
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
    header: 'Part Name',
    cell: ({ row }) => {
        return (
            <div>
                <div className="font-medium">{row.original.name}</div>
                <div className="text-sm text-muted-foreground">{row.original.partNumber}</div>
            </div>
        )
    }
  },
    {
    accessorKey: 'assetModel',
    header: 'Asset Model',
  },
  {
    accessorKey: 'quantity',
    header: 'Quantity',
    cell: ({ row }) => {
        const quantity = row.original.quantity;
        let badgeClass = '';
        if (quantity < 5) badgeClass = 'bg-red-100 text-red-800';
        else if (quantity < 20) badgeClass = 'bg-yellow-100 text-yellow-800';
        else badgeClass = 'bg-green-100 text-green-800';
      return <Badge variant="outline" className={badgeClass}>{quantity} in stock</Badge>;
    }
  },
  {
    accessorKey: 'location',
    header: 'Location',
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      return <ActionsCell part={row.original} />;
    },
  },
];
