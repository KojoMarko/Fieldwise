
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
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { Asset } from '@/lib/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { LoaderCircle } from 'lucide-react';
import { updateAssetModel } from '@/ai/flows/update-asset-model';
import { useAuth } from '@/hooks/use-auth';

interface EditAssetModelDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: Asset;
}

const formSchema = z.object({
  newModelName: z.string().min(1, 'New model name is required.'),
});
type FormValues = z.infer<typeof formSchema>;

export function EditAssetModelDialog({ open, onOpenChange, asset }: EditAssetModelDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (asset) {
      form.reset({
        newModelName: asset.model,
      });
    }
  }, [asset, form, open]);

  async function onSubmit(data: FormValues) {
    if (!user?.companyId) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'Could not identify your company.' });
      return;
    }

    if (data.newModelName === asset.model) {
        toast({ variant: 'default', title: 'No Changes', description: 'The new model name is the same as the old one.' });
        onOpenChange(false);
        return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateAssetModel({
        oldModelName: asset.model,
        newModelName: data.newModelName,
        companyId: user.companyId,
      });

      toast({
        title: 'Model Name Updated',
        description: `Updated ${result.updatedCount} asset(s) from "${asset.model}" to "${data.newModelName}".`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to update asset model:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Model Name</DialogTitle>
          <DialogDescription>
            This will update the model name for all assets currently using "{asset.model}".
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="newModelName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>New Model Name</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Updating...' : 'Update All Assets'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
