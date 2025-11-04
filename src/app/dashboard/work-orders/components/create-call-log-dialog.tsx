
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { useAuth } from '@/hooks/use-auth';
import type { ServiceCallLog } from '@/lib/types';
import { addDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatISO } from 'date-fns';

const CallLogSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  complainant: z.string().min(1, 'Complainant name is required'),
  assetName: z.string().min(1, 'Asset/Equipment name is required'),
  problemReported: z.string().min(1, 'Problem description is required'),
  immediateActionTaken: z.string().min(1, 'Action taken is required'),
  caseResolved: z.boolean().default(false),
  fieldVisitRequired: z.boolean().default(false),
});

type CallLogFormValues = z.infer<typeof CallLogSchema>;

interface CreateCallLogDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateCallLogDialog({ open, onOpenChange }: CreateCallLogDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CallLogFormValues>({
    resolver: zodResolver(CallLogSchema),
    defaultValues: {
      customerName: '',
      complainant: '',
      assetName: '',
      problemReported: '',
      immediateActionTaken: '',
      caseResolved: false,
      fieldVisitRequired: false,
    },
  });

  async function onSubmit(data: CallLogFormValues) {
    if (!user?.companyId) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not identify your company.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const priority = data.fieldVisitRequired ? 'High' : 'Medium';
      
      const newLog: Omit<ServiceCallLog, 'id'> = {
        ...data,
        reportingTime: formatISO(new Date()),
        priority,
        companyId: user.companyId,
      };

      await addDoc(collection(db, 'service-call-logs'), newLog);

      toast({
        title: 'Call Logged Successfully',
        description: `A new service call for ${data.customerName} has been recorded.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to log call:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Log Call',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Log New Service Call</DialogTitle>
          <DialogDescription>Record the details of a service call received from a customer.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="customerName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <FormControl><Input placeholder="e.g., Korle Bu Teaching Hospital" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="complainant"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Complainant</FormLabel>
                    <FormControl><Input placeholder="e.g., Dr. Ama" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="assetName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Asset / Equipment</FormLabel>
                  <FormControl><Input placeholder="e.g., Vitros 5600 Analyzer" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="problemReported"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Problem Reported</FormLabel>
                  <FormControl><Textarea placeholder="Describe the issue as reported by the customer..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="immediateActionTaken"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Immediate Action Taken (Over the phone)</FormLabel>
                  <FormControl><Textarea placeholder="Describe troubleshooting steps or advice given..." {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <FormField
                control={form.control}
                name="caseResolved"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Case Resolved?</FormLabel>
                      <FormDescription>Was the issue solved over the phone?</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fieldVisitRequired"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Field Visit Required?</FormLabel>
                      <FormDescription>Does an engineer need to go on-site?</FormDescription>
                    </div>
                    <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Logging...' : 'Log Call'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
