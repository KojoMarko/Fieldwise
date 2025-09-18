
'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface HoldWorkOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (reason: string) => void;
}

export function HoldWorkOrderDialog({
  open,
  onOpenChange,
  onSubmit,
}: HoldWorkOrderDialogProps) {
  const [reason, setReason] = useState('');
  const { toast } = useToast();

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast({
        variant: 'destructive',
        title: 'Reason Required',
        description: 'Please provide a reason for putting the work on hold.',
      });
      return;
    }
    onSubmit(reason);
    setReason('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Put Work on Hold</DialogTitle>
          <DialogDescription>
            Provide a reason for pausing this work order. This will be added to the technician notes.
          </DialogDescription>
        </DialogHeader>
        <div className="py-4 space-y-2">
            <Label htmlFor="hold-reason">Reason for Hold</Label>
            <Textarea 
                id="hold-reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="e.g., Waiting for customer approval, required part is out of stock..."
            />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Confirm Hold</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
