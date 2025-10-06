
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
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { useState, useEffect } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Customer } from '@/lib/types';
import { CreateAssetInputSchema } from '@/lib/schemas';
import { createAsset } from '@/ai/flows/create-asset';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Textarea } from '@/components/ui/textarea';

type AssetFormValues = z.infer<typeof CreateAssetInputSchema>;

export function AssetForm() {
  const { toast } = useToast();
  const router = useRouter();
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
    resolver: zodResolver(CreateAssetInputSchema),
    defaultValues: {
      name: '',
      model: '',
      serialNumber: '',
      customerId: '',
      location: '',
      companyId: user?.companyId,
      lifecycleNotes: [],
      status: 'Operational',
      vendor: '',
    },
  });

  async function onSubmit(data: AssetFormValues) {
    if (!user) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await createAsset({
        ...data,
        companyId: user.companyId,
      });
      toast({
        title: 'Asset Created',
        description: `The asset "${data.name}" has been successfully created.`,
      });
      router.push('/dashboard/assets');
    } catch (error) {
      console.error('Failed to create asset:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Create Asset',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
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
                          format(new Date(field.value), 'PPP')
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
                 <FormDescription>
                  When was this asset installed?
                </FormDescription>
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
         <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Customer</FormLabel>
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
                    <FormMessage />
                </FormItem>
                )}
            />
            <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select asset status" />
                                </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Operational">Operational</SelectItem>
                                <SelectItem value="Maintenance">Maintenance</SelectItem>
                                <SelectItem value="Down">Down</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                )}
            />
        </div>
         <div className="space-y-4 rounded-lg border p-4">
          <h3 className="text-md font-medium">Installation & Warranty</h3>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                 <FormField
                    control={form.control}
                    name="purchaseDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Purchase Date</FormLabel>
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
                                format(new Date(field.value), 'PPP')
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
                            disabled={(date) => date > new Date()}
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
                    name="warrantyExpiry"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Warranty Expiry Date</FormLabel>
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
                                format(new Date(field.value), 'PPP')
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
                    name="vendor"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Vendor</FormLabel>
                        <FormControl>
                        <Input placeholder="e.g., Haas Automation" {...field} />
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
            </div>
         </div>
          <div className="space-y-4 rounded-lg border p-4">
              <h3 className="text-md font-medium">Preventive Maintenance</h3>
               <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                <FormField
                    control={form.control}
                    name="ppmFrequency"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>PPM Frequency (Months)</FormLabel>
                        <FormControl>
                            <Input type="number" placeholder="e.g., 6" {...field} onChange={e => field.onChange(e.target.valueAsNumber)} />
                        </FormControl>
                        <FormDescription>
                            How often should preventive maintenance be done?
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                 <FormField
                    control={form.control}
                    name="lastPpmDate"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Last PPM Date</FormLabel>
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
                                format(new Date(field.value), 'PPP')
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
                            disabled={(date) => date > new Date()}
                            initialFocus
                            />
                        </PopoverContent>
                        </Popover>
                        <FormDescription>
                            When was the last PPM performed?
                        </FormDescription>
                        <FormMessage />
                    </FormItem>
                    )}
                />
               </div>
          </div>
           
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={() => router.back()}>Cancel</Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? 'Creating...' : 'Create Asset'}
          </Button>
        </div>
      </form>
    </Form>
  );
}
