
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { WorkOrder, User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { updateWorkOrder } from '@/ai/flows/update-work-order';
import { LoaderCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssignTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder;
}

export function AssignTechnicianDialog({
  open,
  onOpenChange,
  workOrder,
}: AssignTechnicianDialogProps) {
  const { user } = useAuth();
  const [engineers, setEngineers] = useState<User[]>([]);
  const [selectedTechs, setSelectedTechs] = useState<string[]>([]);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (workOrder) {
      setSelectedTechs(workOrder.technicianIds || []);
    }
  }, [workOrder]);

  useEffect(() => {
    if (!user?.companyId) return;
    
    const engineersQuery = query(collection(db, 'users'), where('companyId', '==', user.companyId), where('role', '==', 'Engineer'));
    
    const unsubscribe = onSnapshot(engineersQuery, (snapshot) => {
        const engs: User[] = [];
        snapshot.forEach(doc => engs.push({ ...doc.data(), id: doc.id } as User));
        setEngineers(engs);
    });

    return () => unsubscribe();
  }, [user?.companyId]);

  const handleAssign = async () => {
    if (selectedTechs.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Engineer Selected',
        description: 'Please select at least one engineer to assign.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await updateWorkOrder({ id: workOrder.id, technicianIds: selectedTechs });
      const assignedEngineers = engineers
        .filter(t => selectedTechs.includes(t.id))
        .map(t => t.name)
        .join(', ');
      
      toast({
        title: 'Engineers Assigned',
        description: `${assignedEngineers} has been assigned to work order ${workOrder.id}.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to assign engineers:', error);
      toast({
        variant: 'destructive',
        title: 'Assignment Failed',
        description: 'Could not assign engineers at this time. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckboxChange = (techId: string) => {
    setSelectedTechs(prev =>
      prev.includes(techId)
        ? prev.filter(id => id !== techId)
        : [...prev, techId]
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Engineers</DialogTitle>
          <DialogDescription>
            Select one or more engineers for work order: {workOrder.id}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-64 py-4">
          <div className="space-y-4">
            {engineers.map((tech) => (
              <div key={tech.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`tech-${tech.id}`}
                  checked={selectedTechs.includes(tech.id)}
                  onCheckedChange={() => handleCheckboxChange(tech.id)}
                />
                <Label
                  htmlFor={`tech-${tech.id}`}
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {tech.name}
                </Label>
              </div>
            ))}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Assigning...' : 'Assign Engineers'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
