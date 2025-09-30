
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';
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
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/use-auth';
import { createCustomer } from '@/ai/flows/create-customer';
import { useState } from 'react';
import { CreateCustomerInputSchema } from '@/lib/schemas';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { LoaderCircle } from 'lucide-react';

type AddCustomerFormValues = z.infer<typeof CreateCustomerInputSchema>;

interface AddCustomerDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCustomerCreated: (id: string, name: string) => void;
}

export function AddCustomerDialog({ open, onOpenChange, onCustomerCreated }: AddCustomerDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddCustomerFormValues>({
    resolver: zodResolver(CreateCustomerInputSchema),
    defaultValues: {
      companyId: user?.companyId,
      name: '',
      contactPerson: '',
      contactEmail: '',
      address: '',
      phone: ''
    },
  });

  async function onSubmit(data: AddCustomerFormValues) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
        return;
    }

    setIsSubmitting(true);
    try {
        const result = await createCustomer({
            ...data,
            companyId: user.companyId,
        });
        toast({
        title: 'Customer Created',
        description: `Customer "${result.name}" has been successfully created.`,
        });
        form.reset();
        onOpenChange(false);
        onCustomerCreated(result.id, result.name);
    } catch (error) {
        console.error('Failed to create customer:', error);
        toast({
            variant: 'destructive',
            title: 'Failed to Create Customer',
            description: 'An unexpected error occurred. Please try again.'
        });
    } finally {
        setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add a New Customer</DialogTitle>
          <DialogDescription>
            Fill out the form below to add a new customer to the database.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Customer Name / Hospital Name</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., General Hospital" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="contactPerson"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contact Person</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., John Doe" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="contactEmail"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Contact Email</FormLabel>
                        <FormControl>
                            <Input type="email" placeholder="e.g., john.d@example.com" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 555-123-4567" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                    <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Address / Location</FormLabel>
                        <FormControl>
                            <Input placeholder="e.g., 123 Main St, Anytown" {...field} />
                        </FormControl>
                        <FormMessage />
                        </FormItem>
                    )}
                    />
                </div>

                <DialogFooter className='pt-4'>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        {isSubmitting ? 'Creating...' : 'Create Customer'}
                    </Button>
                </DialogFooter>
            </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
