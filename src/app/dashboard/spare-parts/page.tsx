
'use client';
import { File, PlusCircle, LoaderCircle, UploadCloud, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { sparePartsColumns } from './components/spare-parts-columns';
import { DataTable } from './components/data-table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import type { SparePart } from '@/lib/types';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { AddPartDialog } from './components/add-part-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { extractAndCreateParts } from '@/ai/flows/extract-and-create-parts';
import { useToast } from '@/hooks/use-toast';

function AiPartExtractor() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.companyId) return;

    setFileName(file.name);
    setIsExtracting(true);
    toast({
      title: 'AI Extraction Started',
      description: 'The AI is analyzing your document to find spare parts. This may take a moment.',
    });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const result = await extractAndCreateParts({
          fileDataUri: dataUri,
          companyId: user.companyId,
        });
        
        toast({
          title: 'Extraction Complete!',
          description: `Successfully extracted and created ${result.count} new spare parts.`,
        });
      };
      reader.onerror = () => {
        throw new Error('Could not read the file.');
      }
    } catch (error) {
      console.error("Error extracting parts:", error);
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: 'The AI could not extract parts from the document. Please try again or add them manually.',
      });
    } finally {
      setIsExtracting(false);
      setFileName('');
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="bg-accent/50 border-primary/20 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          AI-Powered Part Importer
        </CardTitle>
        <CardDescription>
          Upload a service manual or parts list. The AI will automatically identify the parts, the machine they belong to, and add them to your inventory.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button onClick={() => fileInputRef.current?.click()} disabled={isExtracting} variant="outline">
              <UploadCloud className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
          <Input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
            disabled={isExtracting}
          />
          {isExtracting && (
            <div className="flex items-center text-sm text-muted-foreground">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              <span>Analyzing document: {fileName}...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


export default function SparePartsPage() {
  const { user } = useAuth();
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isAddPartDialogOpen, setAddPartDialogOpen] = useState(false);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const partsQuery = query(collection(db, "spare-parts"), where("companyId", "==", user.companyId));
    
    const unsubscribe = onSnapshot(partsQuery, (snapshot) => {
      const partsData: SparePart[] = [];
      snapshot.forEach((doc) => {
        partsData.push({ id: doc.id, ...doc.data() } as SparePart);
      });
      setSpareParts(partsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);


  const filteredParts = useMemo(() => {
    if (!filter) return spareParts;
    return spareParts.filter(
        (p) =>
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          p.partNumber.toLowerCase().includes(filter.toLowerCase()) ||
          p.assetModel.toLowerCase().includes(filter.toLowerCase())
      );
  }, [filter, spareParts]);


  return (
    <>
      <AddPartDialog open={isAddPartDialogOpen} onOpenChange={setAddPartDialogOpen} />
      <div className="flex items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Spare Parts</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1 ml-4">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1" onClick={() => setAddPartDialogOpen(true)}>
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Add Part Manually
            </span>
          </Button>
        </div>
      </div>

      <div className='mb-6'>
        <AiPartExtractor />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Spare Parts Inventory</CardTitle>
          <CardDescription>
            Manage all spare parts for your company.
          </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading ? (
             <div className="flex items-center justify-center p-10">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading inventory...</p>
            </div>
           ) : (
            <>
              <div className="mb-4">
                <Input
                  placeholder="Filter by part name, number, or machine model..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="max-w-sm"
                />
              </div>
              <DataTable columns={sparePartsColumns} data={filteredParts} />
            </>
           )}
        </CardContent>
      </Card>
    </>
  );
}
