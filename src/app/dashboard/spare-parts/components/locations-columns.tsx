
'use client';

import type { ColumnDef } from '@tanstack/react-table';
import { Checkbox } from '@/components/ui/checkbox';
import type { Location } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2, Eye } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useState } from 'react';
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
import { Badge } from '@/components/ui/badge';
import { EditLocationDialog } from './edit-location-dialog';
import { deleteLocation } from '@/ai/flows/delete-location';

interface LocationsColumnsProps {
  onLocationClick: (location: Location) => void;
}

export const locationsColumns = ({ onLocationClick }: LocationsColumnsProps): ColumnDef<Location>[] => [
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
    header: 'Location Name',
    cell: ({ row }) => (
      <button
        className="font-medium text-primary hover:underline"
        onClick={() => onLocationClick(row.original)}
      >
        {row.original.name}
      </button>
    ),
  },
  {
    accessorKey: 'type',
    header: 'Type',
    cell: ({ row }) => {
        return <Badge variant="secondary">{row.original.type}</Badge>;
    }
  },
  {
    accessorKey: 'address',
    header: 'Address / Description',
  },
  {
    id: 'actions',
    cell: function Cell({ row }) {
      const { user } = useAuth();
      const { toast } = useToast();
      const isAdmin = user?.role === 'Admin';
      const targetLocation = row.original;
      
      const [isEditDialogOpen, setEditDialogOpen] = useState(false);
      const [isDeleteDialogOpen, setDeleteDialogOpen] = useState(false);

      if (!isAdmin) return null;

      const handleRemove = async () => {
        try {
            await deleteLocation({ locationId: targetLocation.id });
            toast({
                title: 'Location Removed',
                description: `Location "${targetLocation.name}" has been removed.`,
            });
        } catch (error) {
            console.error("Failed to remove location:", error);
            toast({
                variant: 'destructive',
                title: 'Removal Failed',
                description: 'Could not remove the location at this time.',
            });
        }
        setDeleteDialogOpen(false);
      }

      return (
        <>
            <EditLocationDialog 
                open={isEditDialogOpen}
                onOpenChange={setEditDialogOpen}
                location={targetLocation}
            />
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                    <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the
                        location from your records.
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
                <DropdownMenuItem onClick={() => onLocationClick(targetLocation)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Stock
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>Edit Location</DropdownMenuItem>
                <DropdownMenuItem
                    className="text-destructive"
                    onClick={() => setDeleteDialogOpen(true)}
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remove Location
                </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
            </div>
        </>
      );
    },
  },
];
