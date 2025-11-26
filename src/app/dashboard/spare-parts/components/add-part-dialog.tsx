
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
import { useState, useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { createSparePart } from '@/ai/flows/create-spare-part';
import { CreateSparePartInputSchema } from '@/lib/schemas';


type AddPartFormValues = z.infer<typeof CreateSparePartInputSchema>;

interface AddPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isTool?: boolean;
}

export function AddPartDialog({ open, onOpenChange, isTool = false }: AddPartDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddPartFormValues>({
    resolver: zodResolver(CreateSparePartInputSchema),
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: '',
        partNumber: '',
        quantity: 0,
        location: '',
        assetModel: isTool ? 'Multiple' : '',
        companyId: user?.companyId,
      });
    }
  }, [open, isTool, form, user?.companyId]);

  async function onSubmit(data: AddPartFormValues) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
        return;
    }

    setIsSubmitting(true);
    try {
      await createSparePart({ ...data, companyId: user.companyId });
      toast({
        title: isTool ? 'Tool Added' : 'Part Added',
        description: `Item "${data.name}" has been added to the inventory.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add item:', error);
      toast({
        variant: 'destructive',
        title: isTool ? 'Failed to Add Tool' : 'Failed to Add Part',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const title = isTool ? 'Add New Tool' : 'Add New Spare Part';
  const description = isTool 
    ? 'Fill out the form below to add a new general-purpose tool to the inventory.'
    : 'Fill out the form below to add a new part to the inventory.';


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{isTool ? 'Tool Name' : 'Part Name'}</FormLabel>
                  <FormControl>
                    <Input placeholder={isTool ? "e.g., Digital Multimeter" : "e.g., HEPA Filter"} {...field} />
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
                    <FormLabel>{isTool ? 'Model/Serial Number' : 'Part Number'}</FormLabel>
                    <FormControl>
                        <Input placeholder={isTool ? "e.g., FLUKE-87V" : "e.g., FIL-HEPA-1212"} {...field} />
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
                        <Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
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
                        <Input placeholder="e.g., Tool Cabinet, Shelf 3" {...field} />
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
                        <Input placeholder="e.g., Vitros 5600" {...field} disabled={isTool} />
                    </FormControl>
                    {isTool && <FormDescription>This is automatically set for tools.</FormDescription>}
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
                {isSubmitting ? 'Adding...' : (isTool ? 'Add Tool' : 'Add Part')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
