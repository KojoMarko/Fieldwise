
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
import type { SparePart } from '@/lib/types';
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoaderCircle } from 'lucide-react';

interface AddPartsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddParts: (parts: SparePart[]) => void;
}

export function AddPartsDialog({
  open,
  onOpenChange,
  onAddParts,
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

  const filteredParts = spareParts.filter(p => p.name.toLowerCase().includes(filter.toLowerCase()) || p.partNumber.toLowerCase().includes(filter.toLowerCase()));

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
            <div className="relative w-full overflow-auto">
              <Table>
                  <TableHeader>
                      <TableRow>
                          <TableHead className='w-[50px]'></TableHead>
                          <TableHead>Part</TableHead>
                          <TableHead>In Stock</TableHead>
                          <TableHead>Location</TableHead>
                      </TableRow>
                  </TableHeader>
                  <TableBody>
                      {filteredParts.map((part) => (
                          <TableRow key={part.id} onClick={() => setSelectedParts(prev => ({...prev, [part.id]: !prev[part.id]}))} className='cursor-pointer'>
                            <TableCell>
                                <Checkbox checked={selectedParts[part.id] || false} onCheckedChange={(checked) => setSelectedParts(prev => ({...prev, [part.id]: !!checked}))}/>
                            </TableCell>
                            <TableCell>
                                  <div className="font-medium">{part.name}</div>
                                  <div className="text-sm text-muted-foreground">{part.partNumber}</div>
                            </TableCell>
                            <TableCell>{part.quantity}</TableCell>
                            <TableCell>{part.location}</TableCell>
                          </TableRow>
                      ))}
                  </TableBody>
              </Table>
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
