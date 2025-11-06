
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
import type { SparePart, WorkOrder } from '@/lib/types';
import { useState, useEffect, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoaderCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Building } from 'lucide-react';

interface AddPartsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddParts: (parts: SparePart[]) => void;
  workOrder: WorkOrder;
}

export function AddPartsDialog({
  open,
  onOpenChange,
  onAddParts,
  workOrder,
}: AddPartsDialogProps) {
  const { user } = useAuth();
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedParts, setSelectedParts] = useState<Record<string, boolean>>({});
  const [filter, setFilter] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!open || !user?.companyId) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);

    const partsQuery = query(collection(db, "spare-parts"), where("companyId", "==", user.companyId));
    
    const unsubscribe = onSnapshot(partsQuery, (snapshot) => {
      const partsData: SparePart[] = [];
      snapshot.forEach((doc) => {
        partsData.push({ id: doc.id, ...doc.data() } as SparePart);
      });
      setSpareParts(partsData);
      setIsLoading(false);
    }, (error) => {
        console.error("Error fetching spare parts: ", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not fetch spare parts from the database.'
        });
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [open, user?.companyId, toast]);

  const handleAdd = () => {
    const partsToAdd = spareParts.filter(p => selectedParts[p.id]);
    if (partsToAdd.length === 0) {
        toast({
            variant: 'destructive',
            title: 'No Parts Selected',
            description: 'Please select at least one part to add.'
        })
        return;
    };
    onAddParts(partsToAdd);
    toast({
        title: "Parts Added",
        description: `${partsToAdd.length} part(s) have been added to the work order.`
    });
    setSelectedParts({});
    onOpenChange(false);
  };

  const filteredParts = useMemo(() => {
    return spareParts.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.partNumber.toLowerCase().includes(filter.toLowerCase()));
  }, [spareParts, filter]);

  const getFacilityStock = (part: SparePart) => {
    if (!workOrder.customerId || !part.facilityStock) return null;
    return part.facilityStock.find(stock => stock.facilityId === workOrder.customerId);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>Add Spare Parts</DialogTitle>
          <DialogDescription>
            Select spare parts from the inventory to add to this work order.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
          <Input 
            placeholder="Filter parts by name or number..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          />
          <div className="max-h-[50vh] overflow-y-auto border rounded-md">
            {isLoading ? (
                <div className="flex items-center justify-center h-48">
                    <LoaderCircle className="h-8 w-8 animate-spin" />
                </div>
            ) : (
            <div className="w-full">
              {/* --- Responsive Card View for Mobile --- */}
              <div className="block sm:hidden">
                {filteredParts.length > 0 ? (
                  filteredParts.map(part => {
                    const facilityStock = getFacilityStock(part);
                    return (
                        <div 
                        key={part.id} 
                        className="flex items-start gap-4 p-4 border-b last:border-b-0 cursor-pointer"
                        onClick={() => setSelectedParts(prev => ({...prev, [part.id]: !prev[part.id]}))}
                        >
                        <Checkbox 
                            checked={selectedParts[part.id] || false} 
                            onCheckedChange={(checked) => setSelectedParts(prev => ({...prev, [part.id]: !!checked}))}
                            className="mt-1"
                        />
                        <div className="flex-1">
                            <p className="font-medium">{part.name}</p>
                            <p className="text-sm text-muted-foreground">{part.partNumber}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground mt-2">
                                <span>Warehouse: <Badge variant="secondary">{part.quantity}</Badge></span>
                                {facilityStock && facilityStock.quantity > 0 && (
                                  <span className="flex items-center gap-1">
                                      <Building className="h-3 w-3"/> Facility: <Badge variant="default" className="bg-blue-500">{facilityStock.quantity}</Badge>
                                  </span>
                                )}
                            </div>
                        </div>
                        </div>
                    )
                })
                ) : (
                  <p className="p-8 text-center text-sm text-muted-foreground">No parts found.</p>
                )}
              </div>
              
              {/* --- Table View for Desktop --- */}
              <div className="hidden sm:block">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className='w-[50px]'></TableHead>
                            <TableHead>Part</TableHead>
                            <TableHead>Central Stock</TableHead>
                            <TableHead>Facility Stock</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredParts.length > 0 ? (
                            filteredParts.map((part) => {
                              const facilityStock = getFacilityStock(part);
                              return (
                                <TableRow key={part.id} onClick={() => setSelectedParts(prev => ({...prev, [part.id]: !prev[part.id]}))} className='cursor-pointer'>
                                    <TableCell>
                                        <Checkbox checked={selectedParts[part.id] || false} onCheckedChange={(checked) => setSelectedParts(prev => ({...prev, [part.id]: !!checked}))}/>
                                    </TableCell>
                                    <TableCell>
                                        <div className="font-medium">{part.name}</div>
                                        <div className="text-sm text-muted-foreground">{part.partNumber}</div>
                                    </TableCell>
                                    <TableCell>{part.quantity}</TableCell>
                                    <TableCell>
                                      {facilityStock && facilityStock.quantity > 0 ? (
                                        <Badge variant="default" className="bg-blue-500">{facilityStock.quantity} in stock</Badge>
                                      ) : (
                                        <span className="text-muted-foreground">0</span>
                                      )}
                                    </TableCell>
                                </TableRow>
                              )
                            })
                        ) : (
                          <TableRow>
                            <TableCell colSpan={4} className="h-48 text-center">No parts found.</TableCell>
                          </TableRow>
                        )}
                    </TableBody>
                </Table>
              </div>
            </div>
            )}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAdd}>Add Selected Parts</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
