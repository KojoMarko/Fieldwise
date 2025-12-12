
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
import type { ServiceCallLog, User } from '@/lib/types';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { LoaderCircle } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';

interface AssignCallLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  callLog: ServiceCallLog;
}

export function AssignCallLogDialog({
  open,
  onOpenChange,
  callLog,
}: AssignCallLogDialogProps) {
  const { user } = useAuth();
  const db = useFirestore();
  const [engineers, setEngineers] = useState<User[]>([]);
  const [selectedTechId, setSelectedTechId] = useState<string | null>(null);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (callLog) {
      setSelectedTechId(callLog.assignedToId || null);
    }
  }, [callLog]);

  useEffect(() => {
    if (!user?.companyId || !db) return;
    
    const engineersQuery = query(collection(db, 'users'), where('companyId', '==', user.companyId), where('role', '==', 'Engineer'));
    
    const unsubscribe = onSnapshot(engineersQuery, (snapshot) => {
        const engs: User[] = [];
        snapshot.forEach(doc => engs.push({ ...doc.data(), id: doc.id } as User));
        setEngineers(engs);
    });

    return () => unsubscribe();
  }, [user?.companyId, db]);

  const handleAssign = async () => {
    if (!selectedTechId || !db) {
      toast({
        variant: 'destructive',
        title: 'No Engineer Selected',
        description: 'Please select an engineer to assign.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const assignedEngineer = engineers.find(t => t.id === selectedTechId);
      if (!assignedEngineer) {
          throw new Error("Selected engineer not found.");
      }
      
      const callLogRef = doc(db, 'service-call-logs', callLog.id);
      await updateDoc(callLogRef, { 
          assignedToId: selectedTechId,
          assignedToName: assignedEngineer.name 
      });
      
      toast({
        title: 'Engineer Assigned',
        description: `${assignedEngineer.name} has been assigned to call from ${callLog.customerName}.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to assign engineer:', error);
      toast({
        variant: 'destructive',
        title: 'Assignment Failed',
        description: 'Could not assign engineer at this time. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCheckboxChange = (techId: string) => {
    setSelectedTechId(prev => (prev === techId ? null : techId));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Engineer</DialogTitle>
          <DialogDescription>
            Select an engineer for the service call from: {callLog.customerName}
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-64 py-4">
          <div className="space-y-4">
            {engineers.map((tech) => (
              <div key={tech.id} className="flex items-center space-x-3">
                <Checkbox
                  id={`tech-${tech.id}`}
                  checked={selectedTechId === tech.id}
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
            {isSubmitting ? 'Assigning...' : 'Assign Engineer'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
