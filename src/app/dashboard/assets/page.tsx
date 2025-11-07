
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
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, useRef } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { extractAndLogMaintenance } from '@/ai/flows/extract-and-log-maintenance';
import { extractAndCreateAssets } from '@/ai/flows/extract-and-create-assets';
import { Input } from '@/components/ui/input';
import * as xlsx from 'xlsx';

function AiAssetImporter() {
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
      description: 'The AI is analyzing your document to find assets. This may take a moment.',
    });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const result = await extractAndCreateAssets({
          fileDataUri: dataUri,
          companyId: user.companyId,
        });
        
        toast({
          title: 'Extraction Complete!',
          description: `Successfully extracted and created ${result.count} new assets.`,
        });
      };
      reader.onerror = () => {
        throw new Error('Could not read the file.');
      }
    } catch (error) {
      console.error("Error extracting assets:", error);
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: 'The AI could not extract assets from the document. Please try again or add them manually.',
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
          AI Asset Importer
        </CardTitle>
        <CardDescription>
          Have a list of assets in a document? Upload it here and the AI will automatically add them to your inventory.
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


function AiLogImporter() {
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
      title: 'AI Analysis Started',
      description: 'The AI is reading your maintenance document. This may take a moment.',
    });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const result = await extractAndLogMaintenance({
          fileDataUri: dataUri,
          companyId: user.companyId,
        });
        
        toast({
          title: 'Analysis Complete!',
          description: `Successfully logged ${result.count} maintenance event(s).`,
        });
      };
      reader.onerror = () => {
        throw new Error('Could not read the file.');
      }
    } catch (error) {
      console.error("Error extracting maintenance logs:", error);
      toast({
        variant: 'destructive',
        title: 'Analysis Failed',
        description: 'The AI could not process the document. Please add the log manually.',
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
          AI Maintenance Log Importer
        </CardTitle>
        <CardDescription>
          Upload a maintenance or PPM report. The AI will find the correct asset and update its service history automatically.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button onClick={() => fileInputRef.current?.click()} disabled={isExtracting} variant="outline">
              <UploadCloud className="mr-2 h-4 w-4" />
            Upload Report
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


export default function AssetsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const assetsQuery = query(collection(db, "assets"), where("companyId", "==", user.companyId));
    
    const unsubscribe = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData: Asset[] = [];
      snapshot.forEach((doc) => {
        assetsData.push({ id: doc.id, ...doc.data() } as Asset);
      });
      setAssets(assetsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);
  
  const handleExport = () => {
    const worksheet = xlsx.utils.json_to_sheet(assets.map(asset => ({
        ID: asset.id,
        Name: asset.name,
        Model: asset.model,
        'Serial Number': asset.serialNumber,
        'Customer ID': asset.customerId,
        Location: asset.location,
        Status: asset.status,
        'Installation Date': asset.installationDate,
        'Last PPM Date': asset.lastPpmDate,
        'PPM Frequency (Months)': asset.ppmFrequency,
    })));
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "Assets");
    xlsx.writeFileXLSX(workbook, "Asset_Inventory.xlsx");
  };

  const canAddAssets = user?.role === 'Admin' || user?.role === 'Engineer';

  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Assets</h1>
        <div className="ml-auto flex items-center gap-2">
          {user?.role === 'Admin' && (
            <Button size="sm" variant="outline" className="h-8 gap-1" onClick={handleExport}>
              <File className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
          )}
           {canAddAssets && (
             <Button size="sm" className="h-8 gap-1" asChild>
                  <Link href="/dashboard/assets/new">
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Add Asset
                      </span>
                  </Link>
              </Button>
           )}
        </div>
      </div>
       <div className='mb-6 grid gap-6 md:grid-cols-2'>
        <AiAssetImporter />
        <AiLogImporter />
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Asset Inventory</CardTitle>
            <CardDescription>
            Manage all company and customer assets.
            </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center p-10">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading assets...</p>
            </div>
           ) : (
            <DataTable columns={columns} data={assets} />
           )}
        </CardContent>
      </Card>
    </>
  );
}
