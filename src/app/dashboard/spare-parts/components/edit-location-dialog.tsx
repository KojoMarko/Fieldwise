
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { UpdateLocationInputSchema } from '@/lib/schemas';
import { updateLocation } from '@/ai/flows/update-location';
import type { Location } from '@/lib/types';


type EditLocationFormValues = z.infer<typeof UpdateLocationInputSchema>;

interface EditLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  location: Location;
}

export function EditLocationDialog({ open, onOpenChange, location }: EditLocationDialogProps) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<EditLocationFormValues>({
    resolver: zodResolver(UpdateLocationInputSchema),
  });

  useEffect(() => {
    if (open) {
      form.reset({
        id: location.id,
        name: location.name,
        type: location.type,
        address: location.address,
      });
    }
  }, [open, location, form]);


  async function onSubmit(data: EditLocationFormValues) {
    setIsSubmitting(true);
    try {
      await updateLocation(data);
      toast({
        title: 'Location Updated',
        description: `Location "${data.name}" has been updated.`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to update location:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Update Location',
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
          <DialogTitle>Edit Location</DialogTitle>
          <DialogDescription>
            Update the details for the location: {location.name}.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Location Name</FormLabel>
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
                name="type"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                            <SelectItem value="Warehouse">Warehouse</SelectItem>
                            <SelectItem value="Van">Van</SelectItem>
                            <SelectItem value="Site">Site</SelectItem>
                            <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                 <FormField
                control={form.control}
                name="address"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Address / Description</FormLabel>
                    <FormControl>
                        <Input {...field} />
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
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
