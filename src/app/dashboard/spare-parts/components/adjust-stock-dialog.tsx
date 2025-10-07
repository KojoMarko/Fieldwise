
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { SparePart } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { spareParts } from '@/lib/data';

interface AdjustStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: SparePart;
}

export function AdjustStockDialog({
  open,
  onOpenChange,
  part,
}: AdjustStockDialogProps) {
  const { toast } = useToast();
  const [adjustment, setAdjustment] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAdjustStock = () => {
    setIsSubmitting(true);
    try {
      // In a real app, you'd call an API here.
      // For now, we'll just simulate updating the local data.
      const partIndex = spareParts.findIndex(p => p.id === part.id);
      if (partIndex > -1) {
          const newQuantity = spareParts[partIndex].quantity + adjustment;
          if (newQuantity < 0) {
              toast({ variant: 'destructive', title: 'Invalid Quantity', description: 'Stock cannot go below zero.' });
              return;
          }
          spareParts[partIndex].quantity = newQuantity;
      }
      
      toast({
        title: 'Stock Adjusted',
        description: `Quantity for ${part.name} is now ${part.quantity + adjustment}.`,
      });
      setAdjustment(0);
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to adjust stock:', error);
      toast({
        variant: 'destructive',
        title: 'Adjustment Failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust Stock for {part.name}</DialogTitle>
          <DialogDescription>
            Current quantity: {part.quantity}. Enter a positive number to add stock, or a negative number to remove it.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <Label htmlFor="adjustment">Adjustment Amount</Label>
            <Input 
                id="adjustment"
                type="number"
                value={adjustment}
                onChange={(e) => setAdjustment(parseInt(e.target.value, 10) || 0)}
                placeholder='e.g., 5 or -2'
            />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdjustStock} disabled={isSubmitting || adjustment === 0}>
             {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
