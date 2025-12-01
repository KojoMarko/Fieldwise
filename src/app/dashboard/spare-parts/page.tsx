
'use client';
import { File, PlusCircle, LoaderCircle, UploadCloud, Sparkles, Wrench } from 'lucide-react';
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
import type { SparePart } from '@/lib/types';
import { useMemo, useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';
import { AddPartDialog } from './components/add-part-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { extractAndCreateParts } from '@/ai/flows/extract-and-create-parts';
import { useToast } from '@/hooks/use-toast';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PartsUsageReportTab } from './components/parts-usage-report-tab';
import { TransfersReportTab } from './components/transfers-report-tab';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import * as xlsx from 'xlsx';


function PartIntelligence() {
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
          Part Intelligence
        </CardTitle>
        <CardDescription>
          Upload a service manual, parts list, or Excel sheet. The AI will automatically identify the parts, the machine they belong to, and add them to your inventory.
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
            accept=".pdf,.doc,.docx,.txt,.xls,.xlsx"
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

function InventoryTab() {
  const { user } = useAuth();
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('all');
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


  const groupedAndFilteredParts = useMemo(() => {
    if (!spareParts) return {};
    
    let partsToFilter = spareParts.filter(p => p.assetModel !== 'Multiple');

    // Apply stock filter
    if (stockFilter === 'active') {
        partsToFilter = partsToFilter.filter(p => p.quantity > 0);
    } else if (stockFilter === 'low') {
        partsToFilter = partsToFilter.filter(p => p.quantity < 5);
    } else if (stockFilter === 'out_of_stock') {
        partsToFilter = partsToFilter.filter(p => p.quantity === 0);
    }

    const filteredByName = filter 
        ? partsToFilter.filter(
            (p) =>
            p.name.toLowerCase().includes(filter.toLowerCase()) ||
            p.partNumber.toLowerCase().includes(filter.toLowerCase()) ||
            p.assetModel.toLowerCase().includes(filter.toLowerCase())
        )
        : partsToFilter;

    return filteredByName.reduce((acc, part) => {
        const model = part.assetModel || 'Uncategorized';
        if (!acc[model]) {
            acc[model] = [];
        }
        acc[model].push(part);
        return acc;
    }, {} as Record<string, SparePart[]>);
  }, [filter, stockFilter, spareParts]);
  
  const handleExport = () => {
    const dataToExport = Object.values(groupedAndFilteredParts).flat().map(p => ({
        'Part ID': p.id,
        'Part Name': p.name,
        'Part Number': p.partNumber,
        'Asset Model': p.assetModel,
        'Central Stock': p.quantity,
        'Location': p.location,
    }));
    
    const worksheet = xlsx.utils.json_to_sheet(dataToExport);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, "SpareParts");
    
    xlsx.writeFile(workbook, "Spare_Parts_Inventory.xlsx");
  };


  const defaultAccordionValue = useMemo(() => {
      const keys = Object.keys(groupedAndFilteredParts);
      return keys.length > 0 ? [keys[0]] : [];
  }, [groupedAndFilteredParts])

  return (
     <>
      <AddPartDialog open={isAddPartDialogOpen} onOpenChange={setAddPartDialogOpen} />
      <div className='my-6'>
        <PartIntelligence />
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Spare Parts Inventory</CardTitle>
            <CardDescription>Manage all spare parts for your company.</CardDescription>
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-4">
              <Input
                placeholder="Filter by part name, number, or model..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="w-full"
              />
              <div className="w-full sm:w-auto flex gap-2">
                    <Select value={stockFilter} onValueChange={setStockFilter}>
                      <SelectTrigger className="w-full sm:w-[150px]">
                          <SelectValue placeholder="Filter Stock" />
                      </SelectTrigger>
                      <SelectContent>
                          <SelectItem value="all">All Parts</SelectItem>
                          <SelectItem value="active">Active Stock</SelectItem>
                          <SelectItem value="low">Low Stock</SelectItem>
                          <SelectItem value="out_of_stock">Out of Stock</SelectItem>
                      </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" className="h-10 gap-1" onClick={handleExport}>
                      <File className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Export
                      </span>
                  </Button>
                  <Button size="sm" className="h-10 gap-1" onClick={() => setAddPartDialogOpen(true)}>
                      <PlusCircle className="h-3.5 w-3.5" />
                      <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                      Add Part
                      </span>
                  </Button>
              </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
              <div className="flex items-center justify-center p-10">
                  <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
                  <p className="ml-4 text-muted-foreground">Loading inventory...</p>
              </div>
          ) : Object.keys(groupedAndFilteredParts).length > 0 ? (
              <Accordion type="multiple" defaultValue={defaultAccordionValue} className="w-full">
                  {Object.entries(groupedAndFilteredParts).map(([model, parts]) => (
                      <AccordionItem value={model} key={model}>
                          <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                              {model} ({parts.length} parts)
                          </AccordionTrigger>
                          <AccordionContent>
                            <Card>
                              <CardContent className="p-0">
                                <DataTable columns={sparePartsColumns} data={parts} />
                              </CardContent>
                            </Card>
                          </AccordionContent>
                      </AccordionItem>
                  ))}
              </Accordion>
          ) : (
              <div className="p-10 text-center text-muted-foreground">
                  No spare parts found matching your filters.
              </div>
          )}
        </CardContent>
      </Card>
    </>
  )
}

function ToolsTab() {
  const { user } = useAuth();
  const [tools, setTools] = useState<SparePart[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('');
  const [isAddToolDialogOpen, setAddToolDialogOpen] = useState(false);

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    const partsQuery = query(
      collection(db, "spare-parts"), 
      where("companyId", "==", user.companyId),
      where("assetModel", "==", "Multiple")
    );
    
    const unsubscribe = onSnapshot(partsQuery, (snapshot) => {
      const toolsData: SparePart[] = [];
      snapshot.forEach((doc) => {
        toolsData.push({ id: doc.id, ...doc.data() } as SparePart);
      });
      setTools(toolsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId]);
  
  const filteredTools = useMemo(() => {
      return filter ? tools.filter(
            (t) =>
            t.name.toLowerCase().includes(filter.toLowerCase()) ||
            t.partNumber.toLowerCase().includes(filter.toLowerCase())
        ) : tools;
  }, [tools, filter]);

  return (
    <>
      <AddPartDialog open={isAddToolDialogOpen} onOpenChange={setAddToolDialogOpen} isTool={true} />
      <Card className="mt-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Tool Inventory</CardTitle>
              <CardDescription>
                Manage all general purpose tools and equipment.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Input
                placeholder="Filter tools..."
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="max-w-sm"
              />
              <Button size="sm" onClick={() => setAddToolDialogOpen(true)}>
                <PlusCircle className="mr-2" /> Add Tool
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center p-10">
              <LoaderCircle className="h-8 w-8 animate-spin" />
            </div>
          ) : (
            <DataTable columns={sparePartsColumns} data={filteredTools} />
          )}
        </CardContent>
      </Card>
    </>
  );
}


export default function SparePartsPage() {
    const [activeTab, setActiveTab] = useState('inventory');
    const TABS = [
        { value: 'inventory', label: 'Inventory' },
        { value: 'tools', label: 'Tools' },
        { value: 'transfers', label: 'Transfers' },
        { value: 'usage_report', label: 'Usage Report' },
    ];
  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Spare Parts & Tools</h1>
      </div>
      
      <Tabs defaultValue={activeTab} value={activeTab} onValueChange={setActiveTab}>
         <div className="md:hidden mb-4">
            <Select value={activeTab} onValueChange={setActiveTab}>
                <SelectTrigger>
                    <SelectValue placeholder="Select a tab" />
                </SelectTrigger>
                <SelectContent>
                    {TABS.map((tab) => (
                        <SelectItem key={tab.value} value={tab.value}>
                            {tab.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
        <div className="hidden md:block">
             <TabsList className="grid w-full grid-cols-4">
                {TABS.map((tab) => (
                    <TabsTrigger key={tab.value} value={tab.value}>
                        {tab.label}
                    </TabsTrigger>
                ))}
             </TabsList>
        </div>
        <TabsContent value="inventory">
          <InventoryTab />
        </TabsContent>
        <TabsContent value="tools">
          <ToolsTab />
        </TabsContent>
         <TabsContent value="transfers">
          <TransfersReportTab />
        </TabsContent>
        <TabsContent value="usage_report">
          <PartsUsageReportTab />
        </TabsContent>
      </Tabs>
    </>
  );
}
