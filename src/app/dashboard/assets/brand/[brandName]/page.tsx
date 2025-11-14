
'use client';
import { useState, useEffect, use, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset, RepairNote, Resource } from '@/lib/types';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, HardDrive, LoaderCircle, PlusCircle, Sparkles, Wrench, Upload, BookOpen, FileText, Download, User as UserIcon } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { DataTable } from '../../components/data-table';
import { columns } from '../../components/columns';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createRepairNote } from '@/ai/flows/create-repair-note';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { summarizeEscalation } from '@/ai/flows/summarize-escalation';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AddResourceDialog } from '@/app/dashboard/resources/components/add-resource-dialog';

const uniqueCategories = ['Chemistry', 'Hematology', 'Safety', 'Automation', 'Service', 'Sales', 'Immunology'];
const uniqueTypes = ['Manual', 'Guide', 'Procedure', 'Reference', 'Standard', 'Brochure', 'Datasheet'] as const;

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card className="flex flex-col">
      <CardContent className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
          <Badge variant="outline">{resource.category}</Badge>
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold mb-1">{resource.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {resource.equipment}
          </p>
          <p className="text-sm text-muted-foreground/80 mb-4 line-clamp-3">
            {resource.description}
          </p>
        </div>
        <div className="text-xs text-muted-foreground space-y-2 mb-6">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <FileText className="h-3 w-3" />
              <span>{resource.pages} pages</span>
            </div>
            <span>{resource.version}</span>
          </div>
           <div className="flex items-center gap-2">
             <UserIcon className="h-3 w-3" />
             <span>Uploaded by {resource.uploaderName} on {new Date(resource.updatedDate).toLocaleDateString()}</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
          <Button className="w-full" asChild>
            <Link href={resource.fileUrl} target="_blank">View Document</Link>
          </Button>
          <Button variant="outline" className="w-full" asChild>
             <Link href={resource.fileUrl} download={`${resource.title.replace(/\s/g, '_')}.pdf`}>
                <Download className="mr-2 h-4 w-4" />
                Download
             </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


function ResourcesSection({ brandName }: { brandName: string }) {
    const { user } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isAddDialogOpen, setAddDialogOpen] = useState(false);

    useEffect(() => {
        if (!user?.companyId) {
            setIsLoading(false);
            return;
        }

        const resourcesQuery = query(
            collection(db, 'resources'),
            where('companyId', '==', user.companyId),
            where('equipment', '==', brandName)
        );

        const unsubscribe = onSnapshot(resourcesQuery, (snapshot) => {
            const resourcesData: Resource[] = [];
            snapshot.forEach(doc => resourcesData.push({ id: doc.id, ...doc.data() } as Resource));
            setResources(resourcesData);
            setIsLoading(false);
        }, (error) => {
            console.error("Error fetching resources:", error);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [user?.companyId, brandName]);

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-10">
                <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                <span>Loading resources...</span>
            </div>
        );
    }
    
    return (
        <>
            <AddResourceDialog
                open={isAddDialogOpen}
                onOpenChange={setAddDialogOpen}
                categories={uniqueCategories}
                types={uniqueTypes}
                // Pre-fill brand name
                initialEquipment={brandName}
            />
            <div className="mb-6 flex justify-end">
                 <Button onClick={() => setAddDialogOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Resource
                </Button>
            </div>
            {resources.length === 0 ? (
                 <div className="text-center py-10 border-2 border-dashed rounded-lg">
                    <BookOpen className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h3 className="mt-4 text-lg font-medium">No Resources Found for {brandName}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">Get started by adding a manual, guide, or other document.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {resources.map(resource => (
                        <ResourceCard key={resource.id} resource={resource} />
                    ))}
                </div>
            )}
        </>
    );
}

function RepairNotesSection({ brandName }: { brandName: string }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [newNote, setNewNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notes, setNotes] = useState<RepairNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!user?.companyId) {
            setIsLoading(false);
            return;
        }

        const notesQuery = query(
            collection(db, 'repair-notes'),
            where('companyId', '==', user.companyId),
            where('assetBrand', '==', brandName)
        );

        const unsubscribe = onSnapshot(notesQuery, (snapshot) => {
            const notesData: RepairNote[] = [];
            snapshot.forEach(doc => notesData.push({ id: doc.id, ...doc.data() } as RepairNote));
            // Sort client-side to avoid needing a composite index
            notesData.sort((a, b) => parseISO(b.timestamp).getTime() - parseISO(a.timestamp).getTime());
            setNotes(notesData);
            setIsLoading(false);
        });

        return () => unsubscribe();

    }, [user?.companyId, brandName]);
    
    const saveNote = async (noteContent: string) => {
      if (!noteContent.trim() || !user) return;
      setIsSubmitting(true);
      try {
          await createRepairNote({
              assetBrand: brandName,
              note: noteContent,
              authorId: user.id,
              authorName: user.name,
              companyId: user.companyId,
          });
          toast({ title: 'Note Saved', description: 'Your repair note has been added to the knowledge base.' });
          setNewNote(''); // Clear manual entry field
      } catch (error) {
          toast({ variant: 'destructive', title: 'Error', description: 'Could not save your note.' });
      } finally {
          setIsSubmitting(false);
      }
    };


    const handleSaveNote = () => {
      saveNote(newNote);
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file || !user?.companyId) return;

        setIsSubmitting(true);
        toast({
            title: 'AI Summarization Started',
            description: 'The AI is analyzing your escalation document. This may take a moment.',
        });

        try {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = async () => {
                const dataUri = reader.result as string;
                const result = await summarizeEscalation({
                    fileDataUri: dataUri,
                    assetBrand: brandName,
                });
                // Once summarized, save it as a new note
                await saveNote(result.summary);
            };
            reader.onerror = () => {
                throw new Error('Could not read the file.');
            }
        } catch (error: any) {
            console.error("Error summarizing escalation:", error);
            toast({
                variant: 'destructive',
                title: 'Summarization Failed',
                description: error.message || 'The AI could not process the document. Please try again.',
            });
            setIsSubmitting(false);
        } finally {
          if(fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }
    }
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Service Intelligence
                    </CardTitle>
                    <CardDescription>
                        Add key repair notes for the {brandName} or upload an escalation PDF for the AI to summarize.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        placeholder="Manually add a new note or insight..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                    />
                    <div className="grid grid-cols-2 gap-2">
                        <Button className="w-full" onClick={handleSaveNote} disabled={isSubmitting || !newNote.trim()}>
                            {isSubmitting && newNote ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Save Note
                        </Button>
                        <Button className="w-full" variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isSubmitting}>
                           {isSubmitting && !newNote ? <LoaderCircle className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                           Upload PDF
                        </Button>
                        <Input 
                            type="file" 
                            ref={fileInputRef} 
                            className="hidden" 
                            onChange={handleFileUpload}
                            accept="application/pdf"
                            disabled={isSubmitting}
                        />
                    </div>
                </CardContent>
            </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Repair Notes History</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    {isLoading ? (
                         <div className="flex items-center justify-center p-4">
                            <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                            <span>Loading notes...</span>
                        </div>
                    ) : notes.length > 0 ? (
                        notes.map(note => (
                             <div key={note.id} className="border-l-4 border-blue-400 pl-4 py-2 bg-blue-50">
                                <p className="text-sm font-medium whitespace-pre-wrap">{note.note}</p>
                                <p className="text-xs text-muted-foreground mt-2">- {note.authorName}, {formatDistanceToNow(parseISO(note.timestamp), { addSuffix: true })}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-sm text-center text-muted-foreground p-4">No repair notes found for {brandName}.</p>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

export default function AssetBrandPage({
  params,
}: {
  params: Promise<{ brandName: string }>;
}) {
  const { user } = useAuth();
  const resolvedParams = use(params);
  const brandName = decodeURIComponent(resolvedParams.brandName);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('inventory');

  const TABS = [
    { value: 'inventory', label: 'Inventory' },
    { value: 'knowledge_base', label: 'Knowledge Base' },
    { value: 'resources', label: 'Resources' },
  ];

  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }

    const assetsQuery = query(
      collection(db, 'assets'),
      where('companyId', '==', user.companyId),
      where('name', '==', brandName)
    );

    const unsubscribe = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData: Asset[] = [];
      snapshot.forEach((doc) =>
        assetsData.push({ id: doc.id, ...doc.data() } as Asset)
      );
      setAssets(assetsData);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId, brandName]);

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (!isLoading && assets.length === 0) {
    return notFound();
  }

  return (
    <div className="space-y-6">
       <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/assets">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-semibold truncate">{brandName}</h1>
            <p className="text-sm text-muted-foreground">{assets.length} assets in inventory</p>
        </div>
        <Button size="sm" className="h-8 gap-1" asChild>
            <Link href={`/dashboard/assets/new?name=${encodeURIComponent(brandName)}`}>
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Asset
                </span>
            </Link>
        </Button>
      </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
            <div className="block sm:hidden mb-4">
                <Select value={activeTab} onValueChange={setActiveTab}>
                    <SelectTrigger className="justify-center">
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
            <div className="hidden sm:flex justify-center">
                <TabsList className="grid w-full grid-cols-3">
                    {TABS.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>
                            {tab.label}
                        </TabsTrigger>
                    ))}
                </TabsList>
            </div>
            <TabsContent value="inventory" className="mt-4">
                 <Card>
                    <CardHeader>
                        <CardTitle>Asset Inventory</CardTitle>
                        <CardDescription>
                        All registered assets for the {brandName} brand.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <DataTable columns={columns} data={assets} />
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="knowledge_base" className="mt-4">
                <RepairNotesSection brandName={brandName} />
            </TabsContent>
            <TabsContent value="resources" className="mt-4">
                <ResourcesSection brandName={brandName} />
            </TabsContent>
        </Tabs>

    </div>
  );
}
