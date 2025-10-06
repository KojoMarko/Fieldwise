
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WorkOrder, User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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
  const [selectedTech, setSelectedTech] = useState<string | undefined>(workOrder.technicianId);
  const { toast } = useToast();

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


  const handleAssign = () => {
    if (!selectedTech) return;
    const engineer = engineers.find(t => t.id === selectedTech);
    console.log(`Assigning ${engineer?.name} to ${workOrder.title}`);
    toast({
        title: "Engineer Assigned",
        description: `${engineer?.name} has been assigned to work order ${workOrder.id}.`
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Engineer</DialogTitle>
          <DialogDescription>
            Assign an engineer to work order: {workOrder.id}
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Select value={selectedTech} onValueChange={setSelectedTech}>
            <SelectTrigger>
              <SelectValue placeholder="Select an engineer" />
            </SelectTrigger>
            <SelectContent>
              {engineers.map((tech) => (
                <SelectItem key={tech.id} value={tech.id}>
                  {tech.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleAssign} disabled={!selectedTech}>Assign</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
