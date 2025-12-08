
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { SparePart, Location } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { transferSparePart } from '@/ai/flows/transfer-spare-part';


interface TransferStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: SparePart;
}

export function TransferStockDialog({
  open,
  onOpenChange,
  part,
}: TransferStockDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [destinationId, setDestinationId] = useState('');
  const [locations, setLocations] = useState<Location[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingLocations, setIsLoadingLocations] = useState(true);

  useEffect(() => {
    if (!user?.companyId || !open) {
      setIsLoadingLocations(false);
      return;
    }

    const locationQuery = query(collection(db, "locations"), where("companyId", "==", user.companyId));
    const unsubscribe = onSnapshot(locationQuery, (snapshot) => {
        const locationsData: Location[] = [];
        snapshot.forEach((doc) => {
            locationsData.push({ id: doc.id, ...doc.data() } as Location);
        });
        setLocations(locationsData);
        setIsLoadingLocations(false);
    });

    return () => unsubscribe();
  }, [user?.companyId, open]);

  const handleTransferStock = async () => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
      return;
    }
    if (quantity > part.quantity) {
      toast({
        variant: 'destructive',
        title: 'Insufficient Stock',
        description: `Cannot transfer ${quantity} units. Only ${part.quantity} available in central stock.`,
      });
      return;
    }
    if (!destinationId) {
        toast({
            variant: 'destructive',
            title: 'No Destination Selected',
            description: 'Please select a destination location.',
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const selectedLocation = locations.find(c => c.id === destinationId);
      if (!selectedLocation) throw new Error("Selected location not found");

      await transferSparePart({
        partId: part.id,
        quantity,
        toLocationId: destinationId,
        toLocationName: selectedLocation.name,
        companyId: user.companyId,
        transferredBy: user.name,
        transferredById: user.id
      });
      toast({
        title: 'Stock Transferred',
        description: `${quantity} unit(s) of ${part.name} transferred to ${selectedLocation.name}.`,
      });
      setQuantity(1);
      setDestinationId('');
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to transfer stock:', error);
      toast({
        variant: 'destructive',
        title: 'Transfer Failed',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
        setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Stock: {part.name}</DialogTitle>
          <DialogDescription>
            Move parts from the central warehouse to another location. Central stock: {part.quantity}.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <div className="space-y-2">
                <Label htmlFor="quantity">Quantity to Transfer</Label>
                <Input 
                    id="quantity"
                    type="number"
                    value={quantity}
                    onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                    min={1}
                    max={part.quantity}
                />
            </div>
             <div className="space-y-2">
                <Label htmlFor="facility">Destination Location</Label>
                <Select value={destinationId} onValueChange={setDestinationId} disabled={isLoadingLocations}>
                    <SelectTrigger id="facility">
                        <SelectValue placeholder={isLoadingLocations ? "Loading locations..." : "Select a location"} />
                    </SelectTrigger>
                    <SelectContent>
                        {locations.map(loc => (
                            <SelectItem key={loc.id} value={loc.id}>{loc.name} ({loc.type})</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleTransferStock} disabled={isSubmitting || isLoadingLocations}>
             {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
