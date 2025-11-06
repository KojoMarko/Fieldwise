
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useFieldArray } from 'react-hook-form';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { LoaderCircle, PlusCircle, Trash2, CalendarIcon } from 'lucide-react';
import { Transaction } from '../page';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

const ProductSchema = z.object({
    name: z.string().min(1, 'Product name is required'),
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.coerce.number().min(0.01, 'Price must be positive'),
});

const AddTransactionSchema = z.object({
  customerName: z.string().min(1, 'Customer name is required'),
  customerId: z.string().min(1, 'Customer ID is required'),
  date: z.date({ required_error: "A date is required." }),
  paymentStatus: z.enum(['Fully Paid', 'Partial Payment', 'Pending']),
  products: z.array(ProductSchema).min(1, 'At least one product is required'),
});

type AddTransactionFormValues = z.infer<typeof AddTransactionSchema>;

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTransaction: (data: Omit<Transaction, 'id' | 'transactionId' | 'total'>) => void;
}

export function AddTransactionDialog({ open, onOpenChange, onAddTransaction }: AddTransactionDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddTransactionFormValues>({
    resolver: zodResolver(AddTransactionSchema),
    defaultValues: {
      customerName: '',
      customerId: '',
      date: new Date(),
      paymentStatus: 'Pending',
      products: [{ name: '', quantity: 1, unitPrice: 0 }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "products"
  });

  async function onSubmit(data: AddTransactionFormValues) {
    setIsSubmitting(true);
    try {
        const transactionData = {
            ...data,
            date: format(data.date, 'yyyy-MM-dd'),
            products: data.products.map(p => ({...p, id: `prod-${Math.random()}`}))
        };
      onAddTransaction(transactionData);
      toast({
        title: 'Transaction Added',
        description: `New sale for ${data.customerName} has been logged.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add transaction:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Add Transaction',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Transaction</DialogTitle>
          <DialogDescription>
            Enter the details for the new sales transaction.
          </DialogDescription>
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
                    <FormControl><Input placeholder="e.g., Acme Corp" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Customer ID</FormLabel>
                    <FormControl><Input placeholder="e.g., CUST-001" {...field} /></FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="date"
                    render={({ field }) => (
                    <FormItem className="flex flex-col">
                        <FormLabel>Transaction Date</FormLabel>
                        <Popover>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant={'outline'}
                                className={cn('pl-3 text-left font-normal',!field.value && 'text-muted-foreground')}
                            >
                                {field.value ? (format(field.value, 'PPP')) : (<span>Pick a date</span>)}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus/>
                        </PopoverContent>
                        </Popover>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="paymentStatus"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Payment Status</FormLabel>
                         <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                                <SelectItem value="Pending">Pending</SelectItem>
                                <SelectItem value="Partial Payment">Partial Payment</SelectItem>
                                <SelectItem value="Fully Paid">Fully Paid</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             </div>
             <div>
                <FormLabel>Products Sold</FormLabel>
                <div className="space-y-3 mt-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="flex flex-col md:flex-row gap-2 items-start rounded-md border p-3">
                            <FormField
                                control={form.control}
                                name={`products.${index}.name`}
                                render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormLabel className="sr-only">Product Name</FormLabel>
                                    <FormControl><Input placeholder="Product Name" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <div className="flex gap-2 w-full md:w-auto">
                                <FormField
                                    control={form.control}
                                    name={`products.${index}.quantity`}
                                    render={({ field }) => (
                                    <FormItem className="w-20">
                                        <FormLabel className="sr-only">Qty</FormLabel>
                                        <FormControl><Input type="number" placeholder="Qty" {...field} /></FormControl>
                                         <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name={`products.${index}.unitPrice`}
                                    render={({ field }) => (
                                    <FormItem className="flex-1">
                                        <FormLabel className="sr-only">Price</FormLabel>
                                        <FormControl><Input type="number" step="0.01" placeholder="Unit Price" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </div>
                        </div>
                    ))}
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ name: '', quantity: 1, unitPrice: 0 })}>
                        <PlusCircle className="mr-2" /> Add Product
                    </Button>
                </div>
             </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Adding...' : 'Add Transaction'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

