
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
import { spareParts } from '@/lib/data';

const AddPartFormSchema = z.object({
  name: z.string().min(1, 'Part name is required'),
  partNumber: z.string().min(1, 'Part number is required'),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
  location: z.string().min(1, 'Location is required'),
  assetModel: z.string().min(1, 'Asset model is required'),
});

type AddPartFormValues = z.infer<typeof AddPartFormSchema>;

interface AddPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPartDialog({ open, onOpenChange }: AddPartDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddPartFormValues>({
    resolver: zodResolver(AddPartFormSchema),
    defaultValues: {
      name: '',
      partNumber: '',
      quantity: 0,
      location: '',
      assetModel: '',
    },
  });

  async function onSubmit(data: AddPartFormValues) {
    setIsSubmitting(true);
    try {
      // This is where you would call an API to save the new part.
      // For now, we'll just log it and show a toast.
      console.log('New part data:', data);
      spareParts.push({ ...data, id: `sp-gen-${Math.random()}`});
      
      toast({
        title: 'Part Added',
        description: `Part "${data.name}" has been added to the inventory.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add part:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Add Part',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add New Spare Part</DialogTitle>
          <DialogDescription>
            Fill out the form below to add a new part to the inventory.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Part Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., HEPA Filter" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="partNumber"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Part Number</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., FIL-HEPA-1212" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                        <Input type="number" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                control={form.control}
                name="location"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Storage Location</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Warehouse A, Shelf 3" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <FormField
                control={form.control}
                name="assetModel"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Associated Asset Model</FormLabel>
                    <FormControl>
                        <Input placeholder="e.g., Vitros 5600" {...field} />
                    </FormControl>
                    <FormMessage />
                    </FormItem>
                )}
                />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Adding...' : 'Add Part'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
