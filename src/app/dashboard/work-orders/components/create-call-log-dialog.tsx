
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
import { useState, useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { ServiceCallLog, Customer, Asset } from '@/lib/types';
import { addDoc, collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { formatISO } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { createWorkOrder } from '@/ai/flows/create-work-order';

const CallLogSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  assetId: z.string().min(1, 'Asset/Equipment is required'),
  complainant: z.string().min(1, 'Complainant name is required'),
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
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const form = useForm<CallLogFormValues>({
    resolver: zodResolver(CallLogSchema),
    defaultValues: {
      customerId: '',
      assetId: '',
      complainant: '',
      problemReported: '',
      immediateActionTaken: '',
      caseResolved: false,
      fieldVisitRequired: false,
    },
  });

  const watchedCustomerId = form.watch('customerId');

  useEffect(() => {
    if (!user?.companyId || !open || !db) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    const customerQuery = query(collection(db, "customers"), where("companyId", "==", user.companyId));
    const assetQuery = query(collection(db, "assets"), where("companyId", "==", user.companyId));

    const unsubscribeCustomers = onSnapshot(customerQuery, (snapshot) => {
      const customersData: Customer[] = [];
      snapshot.forEach((doc) => customersData.push({ id: doc.id, ...doc.data() } as Customer));
      setCustomers(customersData);
      setIsLoading(false);
    });

    const unsubscribeAssets = onSnapshot(assetQuery, (snapshot) => {
      const assetsData: Asset[] = [];
      snapshot.forEach((doc) => assetsData.push({ id: doc.id, ...doc.data() } as Asset));
      setAssets(assetsData);
    });

    return () => {
      unsubscribeCustomers();
      unsubscribeAssets();
    }
  }, [user?.companyId, open, db]);


  async function onSubmit(data: CallLogFormValues) {
    if (!user?.companyId || !user.name || !db) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not identify your company or user profile.' });
      return;
    }

    setIsSubmitting(true);
    
    const selectedCustomer = customers.find(c => c.id === data.customerId);
    const selectedAsset = assets.find(a => a.id === data.assetId);

    if (!selectedCustomer || !selectedAsset) {
      toast({ variant: 'destructive', title: 'Error', description: 'Selected customer or asset not found.' });
      setIsSubmitting(false);
      return;
    }

    try {
      const priority = data.fieldVisitRequired ? 'High' : 'Medium';
      
      const newLog: Omit<ServiceCallLog, 'id'> = {
        ...data,
        customerName: selectedCustomer.name,
        assetName: selectedAsset.name,
        reportingTime: formatISO(new Date()),
        priority,
        companyId: user.companyId,
        loggedById: user.id,
        loggedByName: user.name,
      };

      await addDoc(collection(db, 'service-call-logs'), newLog);

      toast({
        title: 'Call Logged Successfully',
        description: `A new service call for ${selectedCustomer.name} has been recorded.`,
      });

      // Automatically create a work order if needed
      if (data.fieldVisitRequired && !data.caseResolved) {
        await createWorkOrder({
          title: `Service Request for ${selectedAsset.name}`,
          description: data.problemReported,
          customerId: data.customerId,
          assetId: data.assetId,
          priority: 'High',
          type: 'Corrective',
          scheduledDate: new Date(),
          companyId: user.companyId,
          status: 'Scheduled',
        });
        toast({
          title: 'Work Order Created',
          description: 'A new work order has been automatically created and scheduled.',
        });
      }

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
  
  const filteredAssets = assets.filter(asset => asset.customerId === watchedCustomerId);


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
                name="customerId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Customer Name</FormLabel>
                    <Select onValueChange={(value) => { field.onChange(value); form.resetField('assetId'); }} value={field.value} disabled={isLoading}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={isLoading ? "Loading..." : "Select a customer"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {customers.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="assetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset / Equipment</FormLabel>
                     <Select onValueChange={field.onChange} value={field.value} disabled={!watchedCustomerId}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={!watchedCustomerId ? "Select a customer first" : "Select an asset"} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {filteredAssets.map(a => <SelectItem key={a.id} value={a.id}>{a.name} ({a.serialNumber})</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
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
