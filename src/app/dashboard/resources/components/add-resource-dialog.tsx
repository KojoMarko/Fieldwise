
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
import { useState, useEffect, useRef } from 'react';
import { LoaderCircle, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { CreateResourceInputSchema, ResourceSchema } from '@/lib/schemas';
import { createResource } from '@/ai/flows/create-resource';
import { formatISO } from 'date-fns';
import { analyzeDocument } from '@/ai/flows/analyze-document';
import { useStorage } from '@/firebase/provider';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import { Progress } from '@/components/ui/progress';
import { Label } from '@/components/ui/label';


type AddResourceFormValues = z.infer<typeof CreateResourceInputSchema>;

interface AddResourceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categories: string[];
  types: ('Manual' | 'Guide' | 'Procedure' | 'Reference' | 'Standard')[];
  initialEquipment?: string;
}

export function AddResourceDialog({ open, onOpenChange, categories, types, initialEquipment }: AddResourceDialogProps) {
  const { toast } = useToast();
  const { user } = useAuth();
  const storage = useStorage();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  
  const form = useForm<AddResourceFormValues>({
    resolver: zodResolver(CreateResourceInputSchema),
    defaultValues: {
      title: '',
      equipment: initialEquipment || '',
      description: '',
      category: '',
      version: ''
    },
  });
  
  useEffect(() => {
    if (initialEquipment) {
        form.setValue('equipment', initialEquipment);
    }
  }, [initialEquipment, form]);

  const resetDialog = () => {
    form.reset({
        title: '',
        equipment: initialEquipment || '',
        description: '',
        category: '',
        version: ''
    });
    setFile(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
    setUploadProgress(null);
    setIsSubmitting(false);
    setIsAnalyzing(false);
  }


  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) {
      setFile(null);
      return;
    }

    setFile(selectedFile);
    setIsAnalyzing(true);
    toast({
      title: 'AI is analyzing your document...',
      description: 'The form will be auto-filled shortly.',
    });
    
    try {
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async () => {
            const dataUri = reader.result as string;
            const analysisResult = await analyzeDocument({ fileDataUri: dataUri });

            if (!analysisResult) {
                throw new Error("AI analysis returned no result.");
            }

            // Populate form with AI results
            form.setValue('title', analysisResult.title);
            form.setValue('equipment', analysisResult.equipment);
            form.setValue('description', analysisResult.description);
            form.setValue('category', analysisResult.category);
            
            const isValidType = types.includes(analysisResult.type as any);
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
    if (!user || !user.companyId) {
      toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
      return;
    }
    if (!file || !storage) {
      toast({
        variant: 'destructive',
        title: 'File Required',
        description: 'Please select a file to upload.',
      });
      return;
    }
    
    setIsSubmitting(true);
    setUploadProgress(0);

    const resourceId = uuidv4();
    const storageRef = ref(storage, `resources/${user.companyId}/${resourceId}/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    try {
      const downloadURL = await new Promise<string>((resolve, reject) => {
        uploadTask.on('state_changed',
          (snapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            setUploadProgress(progress);
          },
          (error) => {
            console.error('File upload failed:', error);
            reject(error);
          },
          () => {
            getDownloadURL(uploadTask.snapshot.ref).then(resolve).catch(reject);
          }
        );
      });

      const resourceData = {
        ...data,
        uploaderName: user.name,
        companyId: user.companyId,
        updatedDate: formatISO(new Date()),
        fileUrl: downloadURL,
      };

      const fullResource = ResourceSchema.parse(resourceData);
      await createResource(fullResource);

      toast({
        title: 'Resource Added',
        description: `"${data.title}" has been successfully added.`,
      });

      onOpenChange(false);
      // Delay reset to allow dialog to close smoothly
      setTimeout(resetDialog, 300);

    } catch (error: any) {
      console.error('Failed to add resource:', error);
      const description = error instanceof z.ZodError 
          ? error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ')
          : error.message || 'An unexpected error occurred. Please try again.';
      toast({
        variant: 'destructive',
        title: 'Upload or Save Failed',
        description,
      });
      setIsSubmitting(false);
      setUploadProgress(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      if (!isOpen) {
        resetDialog();
      }
      onOpenChange(isOpen);
    }}>
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
                    <Input ref={fileInputRef} id="file-upload" type="file" onChange={handleFileChange} className="pr-12" disabled={isAnalyzing || isSubmitting}/>
                    <div className="absolute inset-y-0 right-0 flex py-1.5 pr-1.5">
                       {isAnalyzing ? (
                        <LoaderCircle className="my-auto h-5 w-5 animate-spin text-primary" />
                       ) : (
                        <Sparkles className="my-auto h-5 w-5 text-muted-foreground" />
                       )}
                    </div>
                  </div>
                </FormControl>
                {file && !isSubmitting && (
                  <FormDescription>
                    File selected: {file.name}
                  </FormDescription>
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
                        <Input type="number" placeholder="e.g., 150" {...field} value={field.value ?? ''} onChange={e => field.onChange(e.target.value === '' ? undefined : e.target.valueAsNumber)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
             </div>
             {uploadProgress !== null && (
                 <div className="space-y-2">
                     <Label>Upload Progress</Label>
                     <Progress value={uploadProgress} />
                     <p className="text-sm text-muted-foreground text-center">{Math.round(uploadProgress)}%</p>
                 </div>
             )}
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>Cancel</Button>
              <Button type="submit" disabled={isSubmitting || isAnalyzing}>
                {isSubmitting ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                {isSubmitting ? `Uploading... ${uploadProgress !== null ? Math.round(uploadProgress) + '%' : ''}` : 'Add to Resources'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
