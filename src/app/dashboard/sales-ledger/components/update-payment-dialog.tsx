
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { Transaction } from '../page';
import { Separator } from '@/components/ui/separator';

const UpdatePaymentSchema = z.object({
  newPayment: z.coerce.number().min(0.01, 'Payment amount must be positive'),
});

type UpdatePaymentFormValues = z.infer<typeof UpdatePaymentSchema>;

interface UpdatePaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  transaction: Transaction;
  onUpdatePayment: (transactionId: string, newPayment: number) => void;
}

export function UpdatePaymentDialog({ open, onOpenChange, transaction, onUpdatePayment }: UpdatePaymentDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const balance = transaction.total - transaction.amountPaid;

  const form = useForm<UpdatePaymentFormValues>({
    resolver: zodResolver(UpdatePaymentSchema),
    defaultValues: {
      newPayment: 0,
    },
  });
  
  // Set default value to balance when dialog opens
  useState(() => {
    form.setValue('newPayment', balance > 0 ? balance : 0);
  });

  async function onSubmit(data: UpdatePaymentFormValues) {
    if (data.newPayment > balance) {
        toast({
            variant: 'destructive',
            title: 'Overpayment Error',
            description: `Payment of GH₵${data.newPayment.toLocaleString()} exceeds the balance of GH₵${balance.toLocaleString()}.`,
        });
        return;
    }

    setIsSubmitting(true);
    try {
      onUpdatePayment(transaction.id, data.newPayment);
      toast({
        title: 'Payment Updated',
        description: `A payment of GH₵${data.newPayment.toLocaleString()} has been recorded for ${transaction.customerName}.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update payment:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Update Payment for {transaction.customerName}</DialogTitle>
          <DialogDescription>
            Transaction ID: {transaction.transactionId}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Total Invoice Value</span>
                <span className="font-medium">GH₵{transaction.total.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Amount Paid</span>
                <span className="font-medium">GH₵{transaction.amountPaid.toLocaleString()}</span>
            </div>
            <Separator/>
            <div className="flex justify-between items-center font-semibold">
                <span>Balance Due</span>
                <span className="text-red-600">GH₵{balance.toLocaleString()}</span>
            </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
              control={form.control}
              name="newPayment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Payment Amount (GH₵)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || balance <= 0}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Recording...' : 'Record Payment'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
