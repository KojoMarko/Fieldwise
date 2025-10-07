
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import type { SparePart } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

interface ViewPartDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: SparePart;
}

export function ViewPartDetailsDialog({
  open,
  onOpenChange,
  part,
}: ViewPartDetailsDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{part.name}</DialogTitle>
          <DialogDescription>
            Part Number: {part.partNumber}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className='flex justify-between items-center'>
                <span className="text-sm text-muted-foreground">Quantity in Stock</span>
                <span className="font-medium">{part.quantity}</span>
            </div>
            <Separator />
             <div className='flex justify-between items-center'>
                <span className="text-sm text-muted-foreground">Storage Location</span>
                <span className="font-medium">{part.location}</span>
            </div>
            <Separator />
             <div className='flex justify-between items-center'>
                <span className="text-sm text-muted-foreground">Associated Asset Model</span>
                <span className="font-medium">{part.assetModel}</span>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
