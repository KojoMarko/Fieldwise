
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
import type { SparePart, Customer } from '@/lib/types';
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
  const [facilityId, setFacilityId] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  useEffect(() => {
    if (!user?.companyId || !open) {
      setIsLoadingCustomers(false);
      return;
    }

    const customerQuery = query(collection(db, "customers"), where("companyId", "==", user.companyId));
    const unsubscribe = onSnapshot(customerQuery, (snapshot) => {
        const customersData: Customer[] = [];
        snapshot.forEach((doc) => {
            customersData.push({ id: doc.id, ...doc.data() } as Customer);
        });
        setCustomers(customersData);
        setIsLoadingCustomers(false);
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
    if (!facilityId) {
        toast({
            variant: 'destructive',
            title: 'No Facility Selected',
            description: 'Please select a destination facility.',
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const selectedCustomer = customers.find(c => c.id === facilityId);
      if (!selectedCustomer) throw new Error("Selected customer not found");

      await transferSparePart({
        partId: part.id,
        quantity,
        toFacilityId: facilityId,
        toFacilityName: selectedCustomer.name,
        companyId: user.companyId,
        transferredBy: user.name,
        transferredById: user.id
      });
      toast({
        title: 'Stock Transferred',
        description: `${quantity} unit(s) of ${part.name} transferred to ${selectedCustomer.name}.`,
      });
      setQuantity(1);
      setFacilityId('');
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
            Move parts from the central warehouse to a facility's holding stock. Central stock: {part.quantity}.
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
                <Label htmlFor="facility">Destination Facility</Label>
                <Select value={facilityId} onValueChange={setFacilityId} disabled={isLoadingCustomers}>
                    <SelectTrigger id="facility">
                        <SelectValue placeholder={isLoadingCustomers ? "Loading facilities..." : "Select a facility"} />
                    </SelectTrigger>
                    <SelectContent>
                        {customers.map(customer => (
                            <SelectItem key={customer.id} value={customer.id}>{customer.name}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleTransferStock} disabled={isSubmitting || isLoadingCustomers}>
             {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
