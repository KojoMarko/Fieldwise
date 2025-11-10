
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
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { LoaderCircle, Sparkles, UploadCloud } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CreateResourceInputSchema, ResourceSchema } from '@/lib/schemas';
import { formatISO } from 'date-fns';
import { analyzeDocument } from '@/ai/flows/analyze-document';
import { createResource } from '@/ai/flows/create-resource';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

type AddResourceFormValues = z.infer<typeof CreateResourceInputSchema>;

const uniqueCategories = ['Chemistry', 'Hematology', 'Safety', 'Automation', 'Service', 'Sales'];
const uniqueTypes = ['Manual', 'Guide', 'Procedure', 'Reference', 'Standard', 'Brochure', 'Datasheet'] as const;

export default function DocumentsPage() {
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
            const dataUri = reader.result as string;
            const analysisResult = await analyzeDocument({ fileDataUri: dataUri });

            if (!analysisResult) {
                throw new Error("AI analysis returned no result.");
            }

            form.setValue('title', analysisResult.title);
            form.setValue('equipment', analysisResult.equipment);
            form.setValue('description', analysisResult.description);
            form.setValue('category', analysisResult.category);
            
            const isValidType = uniqueTypes.includes(analysisResult.type as any);
            if (isValidType) {
              form.setValue('type', analysisResult.type as any);
            } else {
              console.warn(`AI returned an invalid document type: "${analysisResult.type}". User needs to select one manually.`);
              form.setValue('type', undefined);
            }

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
     if (!fileName) {
      toast({
        variant: 'destructive',
        title: 'File Required',
        description: 'Please select a file to upload.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      const resourceData = {
        ...data,
        uploaderName: user.name,
        companyId: user.companyId,
        updatedDate: formatISO(new Date()),
        fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", // Placeholder URL
      };

      const fullResource = ResourceSchema.parse(resourceData);
      
      await createResource(fullResource);

      toast({
        title: 'Resource Added',
        description: `"${data.title}" has been successfully added to the resource center.`,
      });
      form.reset();
      setFileName('');
    } catch (error) {
      console.error('Failed to add resource:', error);
      const description = error instanceof z.ZodError 
        ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
        : 'An unexpected error occurred. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Failed to Add Resource',
        description,
      });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
        <div className="flex items-center">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Document Center</h1>
                <p className="text-muted-foreground">
                    Upload and manage sales brochures, data sheets, and other documents.
                </p>
            </div>
        </div>
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <UploadCloud className="h-6 w-6" />
                    Upload New Document
                </CardTitle>
                <CardDescription>
                    Upload a document and let AI fill in the details, or enter them manually.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 p-1">
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
                        <FormDescription>Select a PDF or document file for the AI to analyze.</FormDescription>
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
                        <FormLabel>Associated Equipment / Product</FormLabel>
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
                                {uniqueCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
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
                                {uniqueTypes.map(type => <SelectItem key={type} value={type}>{type}</SelectItem>)}
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
                                <Input type="number" placeholder="e.g., 150" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                            </FormControl>
                            <FormMessage />
                            </FormItem>
                        )}
                        />
                    </div>
                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={isSubmitting || isAnalyzing}>
                            {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Uploading...' : 'Add to Resources'}
                        </Button>
                    </div>
                </form>
                </Form>
            </CardContent>
        </Card>
    </div>
  );
}
