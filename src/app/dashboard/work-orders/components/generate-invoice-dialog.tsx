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
import type { WorkOrder } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';

interface GenerateInvoiceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workOrder: WorkOrder;
}

export function GenerateInvoiceDialog({
  open,
  onOpenChange,
  workOrder,
}: GenerateInvoiceDialogProps) {
    const { toast } = useToast();

    const handleGenerate = () => {
        console.log(`Generating invoice for ${workOrder.id}`);
        toast({
            title: "Invoice Generated",
            description: `An invoice for work order ${workOrder.id} has been generated and sent to the customer.`
        });
        onOpenChange(false);
    }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Invoice</DialogTitle>
          <DialogDescription>
            This will generate an invoice for work order {workOrder.id} and email it to the customer.
          </DialogDescription>
        </DialogHeader>
        <div className='py-4'>
            <p className='text-sm text-muted-foreground'>
                Are you sure you want to proceed? This action cannot be undone.
            </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleGenerate}>Generate and Send</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
