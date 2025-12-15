
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
  SelectSeparator,
} from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { LoaderCircle, PlusCircle, Trash2, CalendarIcon, ChevronsUpDown, Check } from 'lucide-react';
import { Transaction, Product } from '../page';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/use-auth';
import type { Customer } from '@/lib/types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { AddCustomerDialog } from '../../customers/components/add-customer-dialog';
import { Textarea } from '@/components/ui/textarea';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';


const ProductLineSchema = z.object({
    productId: z.string().min(1, 'Product must be selected'),
    productName: z.string(), // Keep for display purposes
    quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
    unitPrice: z.coerce.number().min(0.01, 'Price must be positive'),
});

const AddTransactionSchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  date: z.date({ required_error: "A date is required." }),
  amountPaid: z.coerce.number().min(0, 'Amount paid cannot be negative').optional(),
  products: z.array(ProductLineSchema).min(1, 'At least one product is required'),
  paymentMethod: z.enum(['Cash', 'Cheque', 'Transfer']).optional(),
  bankName: z.string().optional(),
  remarks: z.string().optional(),
});

type AddTransactionFormValues = z.infer<typeof AddTransactionSchema>;

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onAddTransaction: (data: Omit<Transaction, 'id' | 'transactionId' | 'total' | 'paymentStatus'> & { paymentStatus: 'Fully Paid' | 'Partial Payment' | 'Pending' }) => void;
}

export function AddTransactionDialog({ open, onOpenChange, onAddTransaction }: AddTransactionDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const db = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddCustomerOpen, setAddCustomerOpen] = useState(false);
  const [isCustomerComboboxOpen, setCustomerComboboxOpen] = useState(false);
  const [isProductComboboxOpen, setProductComboboxOpen] = useState(false);


  const form = useForm<AddTransactionFormValues>({
    resolver: zodResolver(AddTransactionSchema),
    defaultValues: {
      customerId: '',
      date: new Date(),
      amountPaid: 0,
      products: [],
      paymentMethod: undefined,
      bankName: '',
      remarks: '',
    },
  });

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "products"
  });

  useEffect(() => {
    if (!user?.companyId || !open || !db) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    const customerQuery = query(collection(db, "customers"), where("companyId", "==", user.companyId));
    const productsQuery = query(collection(db, "products"), where("companyId", "==", user.companyId));
    
    const unsubscribeCustomers = onSnapshot(customerQuery, (snapshot) => {
        const customersData: Customer[] = [];
        snapshot.forEach((doc) => customersData.push({ id: doc.id, ...doc.data() } as Customer));
        setCustomers(customersData);
        if (!products.length) setIsLoading(false);
    });

    const unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
        const productsData: Product[] = [];
        snapshot.forEach((doc) => productsData.push({ id: doc.id, ...doc.data() } as Product));
        setProducts(productsData);
        if (!customers.length) setIsLoading(false);
    });


    return () => {
      unsubscribeCustomers();
      unsubscribeProducts();
    }
  }, [user?.companyId, open, db]);

  async function onSubmit(data: AddTransactionFormValues) {
    setIsSubmitting(true);
    try {
        const selectedCustomer = customers.find(c => c.id === data.customerId);
        if (!selectedCustomer) {
            throw new Error("Customer not found");
        }

        const total = data.products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
        const amountPaid = data.amountPaid || 0;
        let paymentStatus: 'Fully Paid' | 'Partial Payment' | 'Pending';

        if (amountPaid >= total) {
            paymentStatus = 'Fully Paid';
        } else if (amountPaid > 0) {
            paymentStatus = 'Partial Payment';
        } else {
            paymentStatus = 'Pending';
        }

        const transactionData = {
            customerName: selectedCustomer.name,
            customerId: selectedCustomer.id,
            date: format(data.date, 'yyyy-MM-dd'),
            amountPaid: amountPaid,
            products: data.products.map(p => ({id: p.productId, name: p.productName, quantity: p.quantity, unitPrice: p.unitPrice})),
            paymentStatus,
            paymentMethod: data.paymentMethod,
            bankName: data.bankName,
            remarks: data.remarks,
        };

      onAddTransaction(transactionData);
      toast({
        title: 'Transaction Added',
        description: `New sale for ${transactionData.customerName} has been logged.`,
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

  const handleCustomerCreated = (newCustomerId: string, newCustomerName?: string) => {
    form.setValue('customerId', newCustomerId);
  };
  
  const handleProductSelect = (productId: string, index: number) => {
      const product = products.find(p => p.id === productId);
      if (product) {
          update(index, {
              productId: product.id,
              productName: product.name,
              quantity: 1,
              unitPrice: product.unitPrice
          });
      }
  }

  return (
    <>
    <AddCustomerDialog
        open={isAddCustomerOpen}
        onOpenChange={setAddCustomerOpen}
        onCustomerCreated={handleCustomerCreated}
      />
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
             <FormField
                control={form.control}
                name="customerId"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Customer</FormLabel>
                    <Popover open={isCustomerComboboxOpen} onOpenChange={setCustomerComboboxOpen}>
                        <PopoverTrigger asChild>
                            <FormControl>
                            <Button
                                variant="outline"
                                role="combobox"
                                className={cn(
                                "w-full justify-between",
                                !field.value && "text-muted-foreground"
                                )}
                                disabled={isLoading}
                            >
                                {field.value
                                ? customers.find(c => c.id === field.value)?.name
                                : "Select a customer"}
                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                            </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                            <Command>
                                <CommandInput placeholder="Search customer..." />
                                <CommandList>
                                <CommandEmpty>No customer found.</CommandEmpty>
                                <CommandGroup>
                                    {customers.map((customer) => (
                                    <CommandItem
                                        value={customer.name}
                                        key={customer.id}
                                        onSelect={() => {
                                            form.setValue("customerId", customer.id);
                                            setCustomerComboboxOpen(false);
                                        }}
                                    >
                                        <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            customer.id === field.value
                                            ? "opacity-100"
                                            : "opacity-0"
                                        )}
                                        />
                                        {customer.name}
                                    </CommandItem>
                                    ))}
                                    <CommandItem
                                        onSelect={() => setAddCustomerOpen(true)}
                                        className="text-primary focus:text-primary-foreground focus:bg-primary mt-1"
                                    >
                                        <PlusCircle className="mr-2 h-4 w-4" />
                                        Add New Customer
                                    </CommandItem>
                                </CommandGroup>
                                </CommandList>
                            </Command>
                        </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Transaction Date</FormLabel>
                     <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn('w-full pl-3 text-left font-normal', !field.value && 'text-muted-foreground')}
                          >
                            {field.value ? format(field.value, 'PPP') : <span>Pick a date</span>}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="amountPaid"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Amount Paid (GH₵)</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="500.00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div>
                <FormLabel>Products Sold</FormLabel>
                <div className="space-y-3 mt-2">
                    {fields.map((field, index) => (
                        <div key={field.id} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-2 rounded-md border p-3">
                           <div className='grid grid-cols-1 sm:grid-cols-3 gap-2'>
                             <FormField
                                control={form.control}
                                name={`products.${index}.productId`}
                                render={({ field: lineItemField }) => (
                                <FormItem className="sm:col-span-2">
                                    <FormLabel className="text-xs text-muted-foreground">Product Name</FormLabel>
                                    <Popover open={isProductComboboxOpen && form.getValues(`products.${index}.productId`) === lineItemField.value} onOpenChange={(open) => setProductComboboxOpen(open && form.getValues(`products.${index}.productId`) === lineItemField.value)}>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                className={cn(
                                                "w-full justify-between",
                                                !lineItemField.value && "text-muted-foreground"
                                                )}
                                            >
                                                {lineItemField.value
                                                ? products.find(p => p.id === lineItemField.value)?.name
                                                : "Select a product"}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                                            <Command>
                                                <CommandInput placeholder="Search product..." />
                                                <CommandList>
                                                <CommandEmpty>No product found.</CommandEmpty>
                                                <CommandGroup>
                                                    {products.map((product) => (
                                                    <CommandItem
                                                        value={product.name}
                                                        key={product.id}
                                                        onSelect={() => {
                                                            handleProductSelect(product.id, index);
                                                            setProductComboboxOpen(false);
                                                        }}
                                                    >
                                                        <Check
                                                        className={cn(
                                                            "mr-2 h-4 w-4",
                                                            product.id === lineItemField.value
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                        )}
                                                        />
                                                        {product.name}
                                                    </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name={`products.${index}.quantity`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">Qty</FormLabel>
                                    <FormControl><Input type="number" placeholder="1" {...field} /></FormControl>
                                        <FormMessage />
                                </FormItem>
                                )}
                            />
                           </div>
                           <div className='grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2 items-end'>
                             <FormField
                                control={form.control}
                                name={`products.${index}.unitPrice`}
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-xs text-muted-foreground">Unit Price (GH₵)</FormLabel>
                                    <FormControl><Input type="number" step="0.01" placeholder="5000.00" {...field} disabled /></FormControl>
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
                    <Button type="button" variant="outline" size="sm" onClick={() => append({ productId: '', productName: '', quantity: 1, unitPrice: 0 })}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="paymentMethod"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Payment Method</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                            <SelectTrigger>
                            <SelectValue placeholder="Select a payment method" />
                            </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Cheque">Cheque</SelectItem>
                            <SelectItem value="Transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                        </Select>
                        <FormMessage />
                    </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="bankName"
                    render={({ field }) => (
                    <FormItem>
                        <FormLabel>Bank Name</FormLabel>
                        <FormControl><Input placeholder="e.g., GCB, Fidelity Bank" {...field} /></FormControl>
                        <FormMessage />
                    </FormItem>
                    )}
                />
             </div>
             <FormField
                control={form.control}
                name="remarks"
                render={({ field }) => (
                <FormItem>
                    <FormLabel>Remarks</FormLabel>
                    <FormControl><Textarea placeholder="Any additional notes or comments..." {...field} /></FormControl>
                    <FormMessage />
                </FormItem>
                )}
            />

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
    </>
  );
}

    
