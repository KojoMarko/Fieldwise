
'use client';
import { useState, useEffect, use } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Asset, RepairNote } from '@/lib/types';
import { notFound } from 'next/navigation';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Edit, HardDrive, LoaderCircle, PlusCircle, Sparkles, Wrench } from 'lucide-react';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { DataTable } from '../../components/data-table';
import { columns } from '../../components/columns';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { createRepairNote } from '@/ai/flows/create-repair-note';
import { formatDistanceToNow, parseISO } from 'date-fns';

function RepairNotesSection({ brandName }: { brandName: string }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [newNote, setNewNote] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notes, setNotes] = useState<RepairNote[]>([]);
    const [isLoading, setIsLoading] = useState(true);

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

    const handleSaveNote = async () => {
        if (!newNote.trim() || !user) return;
        setIsSubmitting(true);
        try {
            await createRepairNote({
                assetBrand: brandName,
                note: newNote,
                authorId: user.id,
                authorName: user.name,
                companyId: user.companyId,
            });
            toast({ title: 'Note Saved', description: 'Your repair note has been added to the knowledge base.' });
            setNewNote('');
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Could not save your note.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-primary" />
                        Service Intelligence
                    </CardTitle>
                    <CardDescription>
                        Add key repair notes and messages for the {brandName} to build a knowledge base.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        placeholder="Add a new note or insight for this machine type..."
                        value={newNote}
                        onChange={(e) => setNewNote(e.target.value)}
                    />
                    <Button className="w-full" onClick={handleSaveNote} disabled={isSubmitting || !newNote.trim()}>
                        {isSubmitting && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
                        Save Note
                    </Button>
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
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
        </div>

        <RepairNotesSection brandName={brandName} />

      </div>
    </div>
  );
}
