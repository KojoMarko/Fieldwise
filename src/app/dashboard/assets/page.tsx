
'use client';
import { File, PlusCircle, LoaderCircle, UploadCloud, Sparkles, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, useRef, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { Asset } from '@/lib/types';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { extractAndCreateAssets } from '@/ai/flows/extract-and-create-assets';
import { Input } from '@/components/ui/input';

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

export default function AssetsPage() {
  const { user } = useAuth();
  const db = useFirestore();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (!user?.companyId || !db) {
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
  }, [user?.companyId, db]);
  
  const canAddAssets = user?.role === 'Admin' || user?.role === 'Engineer';

  const groupedAssets = useMemo(() => {
    const filtered = filter 
        ? assets.filter(
            (a) =>
            a.name.toLowerCase().includes(filter.toLowerCase()) ||
            a.model.toLowerCase().includes(filter.toLowerCase())
        )
        : assets;

    return filtered.reduce((acc, asset) => {
        const name = asset.name || 'Uncategorized';
        if (!acc[name]) {
            acc[name] = [];
        }
        acc[name].push(asset);
        return acc;
    }, {} as Record<string, Asset[]>);
  }, [filter, assets]);

  return (
    <>
      <div className="flex items-center mb-6">
        <h1 className="text-lg font-semibold md:text-2xl">Assets</h1>
        <div className="ml-auto flex items-center gap-2">
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
       <div className='mb-6'>
        <AiAssetImporter />
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Asset Groups</CardTitle>
            <CardDescription>
            Assets are grouped by their name. Select a group to view all assets and related service intelligence.
            </CardDescription>
            <div className="pt-2">
              <Input 
                placeholder="Filter asset groups..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-sm"
              />
            </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
             <div className="flex items-center justify-center p-10">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading asset groups...</p>
            </div>
           ) : (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(groupedAssets).map(([name, assetGroup]) => (
                <Link key={name} href={`/dashboard/assets/brand/${encodeURIComponent(name)}`}>
                  <Card className="hover:bg-accent hover:border-primary transition-all h-full">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div className='flex-1 min-w-0'>
                        <CardTitle className="truncate">{name}</CardTitle>
                        <CardDescription>{assetGroup.length} assets</CardDescription>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
           )}
        </CardContent>
      </Card>
    </>
  );
}
