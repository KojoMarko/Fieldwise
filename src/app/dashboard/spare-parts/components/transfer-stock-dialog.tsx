
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup } from '@/components/ui/select';
import type { SparePart, Location, Customer } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { LoaderCircle, Building, Warehouse, Check, ChevronsUpDown } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { transferSparePart } from '@/ai/flows/transfer-spare-part';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { cn } from '@/lib/utils';


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
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isComboboxOpen, setComboboxOpen] = useState(false);

  useEffect(() => {
    if (!user?.companyId || !open) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);

    const locationQuery = query(collection(db, "locations"), where("companyId", "==", user.companyId));
    const customerQuery = query(collection(db, "customers"), where("companyId", "==", user.companyId));
    
    let locationsLoaded = false;
    let customersLoaded = false;

    const checkLoading = () => {
        if (locationsLoaded && customersLoaded) {
            setIsLoading(false);
        }
    }

    const unsubLocations = onSnapshot(locationQuery, (snapshot) => {
        const locationsData: Location[] = [];
        snapshot.forEach((doc) => {
            locationsData.push({ id: doc.id, ...doc.data() } as Location);
        });
        setLocations(locationsData);
        locationsLoaded = true;
        checkLoading();
    }, () => { locationsLoaded = true; checkLoading(); });
    
    const unsubCustomers = onSnapshot(customerQuery, (snapshot) => {
        const customersData: Customer[] = [];
        snapshot.forEach((doc) => {
            customersData.push({ id: doc.id, ...doc.data() } as Customer);
        });
        setCustomers(customersData);
        customersLoaded = true;
        checkLoading();
    }, () => { customersLoaded = true; checkLoading(); });


    return () => {
        unsubLocations();
        unsubCustomers();
    };
  }, [user?.companyId, open]);
  
  // Reset local state when dialog is closed/reopened
  useEffect(() => {
    if(open) {
      setQuantity(1);
      setDestinationId('');
    }
  }, [open]);

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
            description: 'Please select a destination location or customer.',
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
      const [type, id] = destinationId.split(':');
      let selectedDestination;

      if (type === 'loc') {
          selectedDestination = locations.find(c => c.id === id);
      } else {
          selectedDestination = customers.find(c => c.id === id);
      }

      if (!selectedDestination) throw new Error("Selected destination not found");

      await transferSparePart({
        partId: part.id,
        quantity,
        toLocationId: id,
        toLocationName: selectedDestination.name,
        companyId: user.companyId,
        transferredBy: user.name,
        transferredById: user.id
      });
      toast({
        title: 'Stock Transferred',
        description: `${quantity} unit(s) of ${part.name} transferred to ${selectedDestination.name}.`,
      });
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

  const getDestinationName = () => {
    if (!destinationId) return "Select a destination...";
    const [type, id] = destinationId.split(':');
    const list = type === 'loc' ? locations : customers;
    const item = list.find(i => i.id === id);
    return item?.name || "Select a destination...";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Transfer Stock: {part.name}</DialogTitle>
          <DialogDescription>
            Move parts from the central warehouse to another location or customer facility. Central stock: {part.quantity}.
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
                <Label>Destination</Label>
                 <Popover open={isComboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isComboboxOpen}
                      className="w-full justify-between"
                      disabled={isLoading}
                    >
                      {getDestinationName()}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <Command>
                      <CommandInput placeholder="Search destination..." />
                      <CommandList>
                        <CommandEmpty>No destination found.</CommandEmpty>
                        <CommandGroup heading="Locations">
                          {locations.map((loc) => (
                            <CommandItem
                              key={`loc:${loc.id}`}
                              value={loc.name}
                              onSelect={() => {
                                setDestinationId(`loc:${loc.id}`);
                                setComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  destinationId === `loc:${loc.id}` ? "opacity-100" : "opacity-0"
                                )}
                              />
                               <Warehouse className="mr-2 h-4 w-4 text-muted-foreground" />
                              {loc.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                        <CommandGroup heading="Customers">
                          {customers.map((cust) => (
                            <CommandItem
                              key={`cust:${cust.id}`}
                              value={cust.name}
                              onSelect={() => {
                                setDestinationId(`cust:${cust.id}`);
                                setComboboxOpen(false);
                              }}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  destinationId === `cust:${cust.id}` ? "opacity-100" : "opacity-0"
                                )}
                              />
                              <Building className="mr-2 h-4 w-4 text-muted-foreground" />
                              {cust.name}
                            </CommandItem>
                          ))}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
            </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleTransferStock} disabled={isSubmitting || isLoading}>
             {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Transfer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
