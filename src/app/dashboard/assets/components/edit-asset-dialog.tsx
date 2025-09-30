
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoaderCircle, CalendarIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer, Asset } from '@/lib/types';
import { UpdateAssetInputSchema } from '@/lib/schemas';
import { updateAsset } from '@/ai/flows/update-asset';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';

type AssetFormValues = z.infer<typeof UpdateAssetInputSchema>;

interface EditAssetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: Asset;
}

export function EditAssetDialog({ open, onOpenChange, asset }: EditAssetDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoadingCustomers, setIsLoadingCustomers] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoadingCustomers(false);
      return;
    }

    const customerQuery = query(collection(db, "customers"), where("companyId", "==", user.companyId));

    const unsubscribeCustomers = onSnapshot(customerQuery, (snapshot) => {
      const customersData: Customer[] = [];
      snapshot.forEach((doc) => {
        customersData.push({ id: doc.id, ...doc.data() } as Customer);
      });
      setCustomers(customersData);
      setIsLoadingCustomers(false);
    });

    return () => unsubscribeCustomers();
  }, [user?.companyId]);

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(UpdateAssetInputSchema),
    values: {
      id: asset.id,
      name: asset.name,
      model: asset.model,
      serialNumber: asset.serialNumber,
      customerId: asset.customerId,
      location: asset.location,
      installationDate: asset.installationDate ? parseISO(asset.installationDate) : new Date(),
    },
  });

  async function onSubmit(data: AssetFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAsset(data);
      toast({
        title: 'Asset Updated',
        description: `The asset "${data.name}" has been successfully updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update asset:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Update Asset',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Edit Asset</DialogTitle>
          <DialogDescription>
            Update the details for {asset.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
                <FormItem>
                <FormLabel>Asset Name</FormLabel>
                <FormControl>
                    <Input placeholder="e.g., Vitros 5600" {...field} />
                </FormControl>
                <FormDescription>
                    The common name of the equipment.
                </FormDescription>
                <FormMessage />
                </FormItem>
            )}
            />
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <FormField
                control={form.control}
                name="model"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Model</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., Vitros 5600" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="serialNumber"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Serial Number</FormLabel>
                    <FormControl>
                    <Input placeholder="e.g., V5600-001" {...field} />
                    </FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />
            </div>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="installationDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Installation Date</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={'outline'}
                                className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                                )}
                            >
                                {field.value ? (
                                format(field.value, 'PPP')
                                ) : (
                                <span>Pick a date</span>
                                )}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            disabled={(date) => date > new Date() || date < new Date('1900-01-01')}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="location"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Location</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Lab 1, Main Wing" {...field} />
                        </FormControl>
                         <FormDescription>
                            Where at the customer's site is this asset located?
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
            <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Customer (Transfer)</FormLabel>
                    <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isLoadingCustomers}
                    >
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select a customer" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {customers.map((customer) => (
                        <SelectItem key={customer.id} value={customer.id}>
                            {customer.name}
                        </SelectItem>
                        ))}
                    </SelectContent>
                    </Select>
                    <FormDescription>
                        To transfer this asset, select a new customer.
                    </FormDescription>
                    <FormMessage />
                </FormItem>
                )}
            />
            <DialogFooter className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
            </DialogFooter>
        </form>
        </Form>
    </DialogContent>
    </Dialog>
  );
}
