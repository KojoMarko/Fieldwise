
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import type { Location, SparePart } from '@/lib/types';
import { updateSparePart } from '@/ai/flows/update-spare-part';


const EditPartFormSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Part name is required'),
  partNumber: z.string().min(1, 'Part number is required'),
  location: z.string().min(1, 'Location is required'),
  assetModel: z.string().min(1, 'Asset model is required'),
  quantity: z.coerce.number().min(0, 'Quantity cannot be negative'),
});

type EditPartFormValues = z.infer<typeof EditPartFormSchema>;

interface EditPartDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  part: SparePart;
  locations: Location[];
}

export function EditPartDialog({ open, onOpenChange, part, locations }: EditPartDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditPartFormValues>({
    resolver: zodResolver(EditPartFormSchema),
    defaultValues: {
      id: part.id,
      name: part.name,
      partNumber: part.partNumber,
      location: part.location,
      assetModel: part.assetModel,
      quantity: part.quantity,
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        id: part.id,
        name: part.name,
        partNumber: part.partNumber,
        location: part.location,
        assetModel: part.assetModel,
        quantity: part.quantity,
      });
    }
  }, [open, part, form]);

  async function onSubmit(data: EditPartFormValues) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
        return;
    }

    setIsSubmitting(true);
    try {
      await updateSparePart(data);
      toast({
        title: 'Item Updated',
        description: `Item "${data.name}" has been updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update item:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Update Item',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const isTool = part.assetModel === 'Multiple';
  const title = isTool ? 'Edit Tool' : 'Edit Spare Part';
  const description = isTool 
    ? 'Update the details for this tool.'
    : 'Update the details for this spare part.';


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
                    <Input {...field} />
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
                        <Input {...field} />
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
                     <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a location" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {locations.map((loc) => (
                          <SelectItem key={loc.id} value={loc.name}>
                            {loc.name}
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
                name="assetModel"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Associated Asset Model</FormLabel>
                    <FormControl>
                        <Input {...field} disabled={isTool} />
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
