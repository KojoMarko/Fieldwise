
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import { LoaderCircle, CalendarIcon, PlusCircle, Trash2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';

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

  const form = useForm<AssetFormValues>({
    resolver: zodResolver(UpdateAssetInputSchema),
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'lifecycleNotes',
  });

  useEffect(() => {
    if (asset) {
      form.reset({
        id: asset.id,
        name: asset.name,
        model: asset.model,
        serialNumber: asset.serialNumber,
        customerId: asset.customerId,
        location: asset.location,
        installationDate: asset.installationDate ? parseISO(asset.installationDate) : undefined,
        purchaseDate: asset.purchaseDate ? parseISO(asset.purchaseDate) : undefined,
        vendor: asset.vendor,
        warrantyExpiry: asset.warrantyExpiry ? parseISO(asset.warrantyExpiry) : undefined,
        ppmFrequency: asset.ppmFrequency,
        lastPpmDate: asset.lastPpmDate ? parseISO(asset.lastPpmDate) : undefined,
        lifecycleNotes: asset.lifecycleNotes?.map(note => ({
            ...note,
            date: parseISO(note.date),
        })) || [],
        status: asset.status,
      });
    }
  }, [asset, form]);

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
            Update the details for {asset?.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 max-h-[80vh] overflow-y-auto p-2">
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
                            selected={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)}
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
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
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
                             <FormDescription>
                                The current operational status of the asset.
                            </FormDescription>
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
                                selected={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)}
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
                                selected={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)}
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
                                <Input placeholder="e.g., Haas Automation" {...field} value={field.value ?? ''} />
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
                            <Input type="number" placeholder="e.g., 6" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.valueAsNumber)} />
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
                            selected={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)}
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
            <div className="space-y-4 rounded-lg border p-4">
                 <h3 className="text-md font-medium">Manual Lifecycle Log</h3>
                 <FormDescription>
                    Add historical service records or other important lifecycle events.
                  </FormDescription>
                 {fields.map((field, index) => (
                    <div key={field.id} className="flex items-start gap-2 rounded-md bg-muted p-3">
                       <FormField
                            control={form.control}
                            name={`lifecycleNotes.${index}.date`}
                            render={({ field }) => (
                            <FormItem className="flex-shrink-0">
                                <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                    <Button
                                        variant={'outline'}
                                        size="sm"
                                        className={cn(
                                        'w-[150px] pl-3 text-left font-normal',
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
                                    selected={field.value instanceof Date ? field.value : (field.value ? new Date(field.value) : undefined)}
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
                            name={`lifecycleNotes.${index}.note`}
                            render={({ field }) => (
                                <FormItem className="flex-grow">
                                    <FormControl>
                                        <Textarea placeholder="Describe the event or service..." {...field} className="h-10 bg-background"/>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                ))}
                 <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => append({ date: new Date(), note: '' })}
                    className="mt-2"
                    >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Log Entry
                </Button>
            </div>
            <DialogFooter className="flex justify-end gap-2 pt-4">
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

    