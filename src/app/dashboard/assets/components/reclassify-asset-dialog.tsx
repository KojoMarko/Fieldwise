
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import type { Asset } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoaderCircle, PlusCircle } from 'lucide-react';
import { updateAssetNameForModel } from '@/ai/flows/update-asset-name-for-model';


interface ReclassifyAssetDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: Asset;
}

const formSchema = z.object({
  newAssetName: z.string().min(1, 'New asset name is required.'),
});
type FormValues = z.infer<typeof formSchema>;

export function ReclassifyAssetDialog({ open, onOpenChange, asset }: ReclassifyAssetDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [discoveredNames, setDiscoveredNames] = useState<string[]>([]);
  const [isNewNameDialogOpen, setNewNameDialogOpen] = useState(false);
  const [newName, setNewName] = useState('');

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  useEffect(() => {
    if (asset) {
      form.reset({
        newAssetName: asset.name,
      });
    }
  }, [asset, form, open]);

  useEffect(() => {
    if (!user?.companyId) return;

    const assetQuery = query(collection(db, "assets"), where("companyId", "==", user.companyId));
    const unsubscribe = onSnapshot(assetQuery, (snapshot) => {
        const nameSet = new Set<string>();
        snapshot.forEach((doc) => {
            const assetData = doc.data() as Asset;
            if(assetData.name) {
                nameSet.add(assetData.name);
            }
        });
        setDiscoveredNames(Array.from(nameSet).sort());
    });

    return () => unsubscribe();
  }, [user?.companyId]);


  async function onSubmit(data: FormValues) {
    if (!user?.companyId) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'Could not identify your company.' });
      return;
    }

    if (data.newAssetName === asset.name) {
        toast({ variant: 'default', title: 'No Changes Made', description: 'The new asset name is the same as the current one.' });
        onOpenChange(false);
        return;
    }

    setIsSubmitting(true);
    try {
      const result = await updateAssetNameForModel({
        modelName: asset.model,
        newAssetName: data.newAssetName,
        companyId: user.companyId,
      });

      toast({
        title: 'Assets Re-classified',
        description: `Updated ${result.updatedCount} asset(s) of model "${asset.model}" to be named "${data.newAssetName}".`,
      });
      onOpenChange(false);
    } catch (error: any) {
      console.error('Failed to re-classify assets:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  const handleNameChange = (nameValue: string) => {
    if (nameValue === 'add_new_name') {
        setNewNameDialogOpen(true);
    } else {
        form.setValue('newAssetName', nameValue);
    }
  }

  const handleAddNewName = () => {
      if (newName.trim()) {
          if (!discoveredNames.includes(newName)) {
            setDiscoveredNames(prev => [...prev, newName].sort());
          }
          form.setValue('newAssetName', newName);
          setNewNameDialogOpen(false);
          setNewName('');
      }
  }

  return (
    <>
        <AlertDialog open={isNewNameDialogOpen} onOpenChange={setNewNameDialogOpen}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <AlertDialogTitle>Add New Asset Name/Type</AlertDialogTitle>
                    <AlertDialogDescription>
                        Enter the general name for this type of asset (e.g., Chemistry Analyzer, Centrifuge).
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <Input 
                    placeholder="e.g., Chemistry Analyzer"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                />
                <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleAddNewName}>Add Name</AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
        <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent>
            <DialogHeader>
            <DialogTitle>Re-classify Asset Name</DialogTitle>
            <DialogDescription>
                The asset name for all assets with the model <span className="font-semibold text-foreground">"{asset.model}"</span> will be changed.
            </DialogDescription>
            </DialogHeader>
            <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                <FormField
                control={form.control}
                name="newAssetName"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>New Asset Name</FormLabel>
                    <Select
                        onValueChange={handleNameChange}
                        value={field.value}
                    >
                    <FormControl>
                        <SelectTrigger>
                        <SelectValue placeholder="Select an existing name or add new" />
                        </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                        {discoveredNames.map((name) => (
                        <SelectItem key={name} value={name}>
                            {name}
                        </SelectItem>
                        ))}
                        <SelectSeparator />
                        <SelectItem value="add_new_name" className="text-primary focus:text-primary-foreground focus:bg-primary">
                            <div className='flex items-center gap-2'>
                                <PlusCircle className="h-4 w-4" />
                                <span>Add New Name...</span>
                            </div>
                        </SelectItem>
                    </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
                />
                <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                    {isSubmitting ? 'Updating...' : 'Re-classify All'}
                </Button>
                </DialogFooter>
            </form>
            </Form>
        </DialogContent>
        </Dialog>
    </>
  );
}
