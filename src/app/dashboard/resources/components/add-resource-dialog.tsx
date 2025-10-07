
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
import { Textarea } from '@/components/ui/textarea';
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
import { LoaderCircle, Sparkles } from 'lucide-react';
import type { Resource } from '@/lib/types';
import { analyzeDocument } from '@/ai/flows/analyze-document';
import { useAuth } from '@/hooks/use-auth';
import { CreateResourceInputSchema } from '@/lib/schemas';
import { createResource } from '@/ai/flows/create-resource';

type AddResourceFormValues = z.infer<typeof CreateResourceInputSchema>;

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  types: ('Manual' | 'Guide' | 'Procedure' | 'Reference' | 'Standard')[];
}

export function AddResourceDialog({ open, onOpenChange, categories, types }: AddResourceDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [fileName, setFileName] = useState('');


  const form = useForm<AddResourceFormValues>({
    resolver: zodResolver(CreateResourceInputSchema),
    defaultValues: {
      title: '',
      equipment: '',
      description: '',
      category: '',
      type: '',
      pages: undefined,
      version: ''
    },
  });
  
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setIsAnalyzing(true);
    toast({
      title: 'AI is analyzing your document...',
      description: 'The form will be auto-filled shortly.',
    });
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = async () => {
            const fileDataUri = reader.result as string;
            const analysisResult = await analyzeDocument({ fileDataUri });

            // Populate form with AI results
            form.setValue('title', analysisResult.title);
            form.setValue('equipment', analysisResult.equipment);
            form.setValue('description', analysisResult.description);
            form.setValue('category', analysisResult.category);
            form.setValue('type', analysisResult.type);
            form.setValue('pages', analysisResult.pages);
            form.setValue('version', analysisResult.version);
            
            toast({
              title: 'Analysis Complete!',
              description: 'Please review the auto-filled information.',
            });
        };
    } catch (error) {
        console.error("Error analyzing document:", error);
        toast({
            variant: 'destructive',
            title: 'Analysis Failed',
            description: 'Could not analyze the document automatically. Please fill the form manually.'
        });
    } finally {
        setIsAnalyzing(false);
    }
  }


  async function onSubmit(data: AddResourceFormValues) {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
        return;
    }
    setIsSubmitting(true);
    try {
      await createResource({
          ...data,
          uploaderName: user.name,
          companyId: user.companyId,
      });

      toast({
        title: 'Resource Added',
        description: `"${data.title}" has been successfully added to the resource center.`,
      });
      form.reset();
      setFileName('');
      onOpenChange(false);
    } catch (error) {
      console.error('Failed to add resource:', error);
      toast({
        variant: 'destructive',
        title: 'Failed to Add',
        description: 'An unexpected error occurred. Please try again.',
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add New Resource</DialogTitle>
          <DialogDescription>
            Upload a document and let AI fill in the details, or enter them manually.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-h-[70vh] overflow-y-auto p-1">
             <FormItem>
                <FormLabel>Upload File</FormLabel>
                 <FormControl>
                  <div className="relative">
                    <Input id="file-upload" type="file" onChange={handleFileChange} className="pr-12" disabled={isAnalyzing}/>
                    <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                       {isAnalyzing ? (
                        <LoaderCircle className="my-auto h-5 w-5 animate-spin text-primary" />
                       ) : (
                        <Sparkles className="my-auto h-5 w-5 text-muted-foreground" />
                       )}
                    </div>
                  </div>
                </FormControl>
                {fileName && !isAnalyzing ? (
                  <FormDescription>File selected: {fileName}</FormDescription>
                ) : (
                  <FormDescription>Select a PDF or document file to have AI analyze it.</FormDescription>
                )}
             </FormItem>
            
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Document Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Vitros 5600 Service Manual" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="equipment"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Associated Equipment</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Vitros 5600" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="A brief summary of what the document contains." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Document Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a type" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {types.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
             <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                 <FormField
                  control={form.control}
                  name="version"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Version</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Rev. 2.1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="pages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Number of Pages</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="e.g., 150" {...field} value={field.value ?? ''} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || isAnalyzing}>
                {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                {isSubmitting ? 'Uploading...' : 'Add to Resources'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
