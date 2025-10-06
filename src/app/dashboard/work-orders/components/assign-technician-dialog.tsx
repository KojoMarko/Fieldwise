
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
import { users } from '@/lib/data';
import type { WorkOrder } from '@/lib/types';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

interface AssignTechnicianDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder;
}

const engineers = users.filter((u) => u.role === 'Engineer');

export function AssignTechnicianDialog({
  open,
  onOpenChange,
  workOrder,
}: AssignTechnicianDialogProps) {
  const [selectedTech, setSelectedTech] = useState<string | undefined>(workOrder.technicianId);
  const { toast } = useToast();

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
