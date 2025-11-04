
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { SparePart } from '@/lib/types';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Building } from 'lucide-react';

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
                <span className="text-sm text-muted-foreground">Central Warehouse Stock</span>
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
            <Separator />
            <div>
              <h4 className="text-sm text-muted-foreground mb-2">Facility Stock</h4>
              {part.facilityStock && part.facilityStock.length > 0 ? (
                <div className='space-y-2'>
                  {part.facilityStock.map(stock => (
                    <div key={stock.facilityId} className="flex justify-between items-center p-2 bg-muted rounded-md">
                        <div className="flex items-center gap-2">
                           <Building className="h-4 w-4 text-muted-foreground" />
                           <span className="text-sm font-medium">{stock.facilityName}</span>
                        </div>
                        <Badge variant="secondary">{stock.quantity} in stock</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground/80">No stock held at facilities.</p>
              )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
