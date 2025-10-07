
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import type { AllocatedPart } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface VerifyPartUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: AllocatedPart;
  onVerify: (partId: string) => void;
}

export function VerifyPartUsageDialog({
  open,
  onOpenChange,
  part,
  onVerify,
}: VerifyPartUsageDialogProps) {
  const { user } = useAuth();
  const [approver, setApprover] = useState('');
  const { toast } = useToast();

  const handleVerify = () => {
    // In a real app, you would have a more secure way to check the approver.
    // For this demo, we'll just check if a name is entered and it's not the current user.
    if (!approver.trim()) {
        toast({ variant: 'destructive', title: 'Approver Name Required', description: 'Please enter your name to verify.'});
        return;
    }
     if (approver.trim().toLowerCase() === user?.name.toLowerCase()) {
        toast({ variant: 'destructive', title: 'Peer Verification Required', description: 'Another user must verify the part usage.'});
        return;
    }
    onVerify(part.id);
    toast({ title: 'Usage Verified', description: `${part.name} usage has been confirmed.`});
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Verify Spare Part Usage</DialogTitle>
          <DialogDescription>
            A second user must confirm that this part was used.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <Alert>
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Part to Verify</AlertTitle>
                <AlertDescription>
                    <p><strong>Part Name:</strong> {part.name}</p>
                    <p><strong>Part Number:</strong> {part.partNumber}</p>
                    <p><strong>Quantity:</strong> 1</p>
                </AlertDescription>
            </Alert>
             <div className="space-y-2">
                <Label htmlFor="approver-name">Approver Name</Label>
                <Input 
                    id="approver-name"
                    placeholder="Enter your name to confirm"
                    value={approver}
                    onChange={(e) => setApprover(e.target.value)}
                />
             </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleVerify}>
            Confirm Usage
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
