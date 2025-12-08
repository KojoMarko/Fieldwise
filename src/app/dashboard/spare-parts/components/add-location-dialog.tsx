
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
import { useState } from 'react';
import { LoaderCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CreateLocationInputSchema } from '@/lib/schemas';
import { createLocation } from '@/ai/flows/create-location';


type AddLocationFormValues = z.infer<typeof CreateLocationInputSchema>;

interface AddLocationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddLocationDialog({ open, onOpenChange }: AddLocationDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddLocationFormValues>({
    resolver: zodResolver(CreateLocationInputSchema),
    defaultValues: {
      name: '',
      type: 'Warehouse',
      address: '',
      companyId: user?.companyId,
    },
  });

  async function onSubmit(data: AddLocationFormValues) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
        return;
    }

    setIsSubmitting(true);
    try {
      await createLocation({ ...data, companyId: user.companyId });
      toast({
        title: 'Location Added',
        description: `Location "${data.name}" has been added.`,
      });
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add location:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Add Location',
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
          <DialogTitle>Add New Location</DialogTitle>
          <DialogDescription>
            Fill out the form below to add a new storage location.
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
                    <Input placeholder="e.g., Main Warehouse, Van-01" {...field} />
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
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                        <Input placeholder="e.g., 123 Industrial Way" {...field} />
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
                {isSubmitting ? 'Adding...' : 'Add Location'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
