
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
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { LoaderCircle } from 'lucide-react';
import { useState } from 'react';

interface VerifyPartUsageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: AllocatedPart;
  onVerify: (partId: string, verifierName: string) => void;
}

export function VerifyPartUsageDialog({
  open,
  onOpenChange,
  part,
  onVerify,
}: VerifyPartUsageDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const assignedTechnicianId = (part as any).technicianId; // Assuming this is passed with part info in a real app

  const handleVerify = () => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to verify.'});
        return;
    }
    // In a real app, you might check against the assigned technician ID.
    // For this demo, we check if the verifier is the same as the user who presumably used it.
    // This is a placeholder for a real check.
    if (user.id === assignedTechnicianId) {
        toast({ variant: 'destructive', title: 'Peer Verification Required', description: 'Another user must verify the part usage.'});
        return;
    }

    setIsSubmitting(true);
    try {
        onVerify(part.id, user.name);
        toast({ title: 'Usage Verified', description: `${part.name} usage has been confirmed by ${user.name}.`});
        onOpenChange(false);
    } catch(e) {
        toast({ variant: 'destructive', title: 'Verification Failed', description: 'An error occurred.'});
    } finally {
        setIsSubmitting(false);
    }
  };

  const isReturnVerification = part.status === 'Pending Return Verification';
  const title = isReturnVerification ? 'Verify Spare Part Return' : 'Verify Spare Part Usage';
  const description = isReturnVerification
    ? 'A second user must confirm that this part was returned to inventory.'
    : 'A second user must confirm that this part was used for the service.';
  const buttonText = isReturnVerification ? 'Confirm Return' : 'Confirm Usage';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            {description}
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
             <Alert variant="destructive">
                <ShieldCheck className="h-4 w-4" />
                <AlertTitle>Verification Action</AlertTitle>
                <AlertDescription>
                   By clicking {buttonText}, you, <strong>{user?.name}</strong>, are confirming this action. This is logged in the audit trail.
                </AlertDescription>
            </Alert>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleVerify} disabled={isSubmitting}>
             {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {buttonText}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
