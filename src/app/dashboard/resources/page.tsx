
'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Book,
  FileText,
  BookOpen,
  Download,
  User,
  PlusCircle,
  LoaderCircle,
} from 'lucide-react';
import { resources as initialResources } from '@/lib/data';
import type { Resource } from '@/lib/types';
import { AddResourceDialog } from './components/add-resource-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

function PdfViewerDialog({ open, onOpenChange, url, title }: { open: boolean, onOpenChange: (open: boolean) => void, url: string | null, title: string | null }) {
    if (!url) return null;
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl h-[90vh]">
                <DialogHeader>
                    <DialogTitle>{title || 'Document Viewer'}</DialogTitle>
                </DialogHeader>
                <div className="flex-grow h-full">
                    <iframe src={url} className="w-full h-full border-0" title={title || 'PDF Viewer'} />
                </div>
            </DialogContent>
        </Dialog>
    )
}

function ResourceCard({ resource, onView }: { resource: Resource, onView: (url: string, title: string) => void }) {
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
          <p className="text-sm text-muted-foreground/80 mb-4">
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
             <User className="h-3 w-3" />
             <span>Uploaded by {resource.uploaderName} on {new Date(resource.updatedDate).toLocaleDateString()}</span>
           </div>
        </div>
        <div className="flex items-center gap-2">
           <Button className="w-full" onClick={() => onView(resource.fileUrl, resource.title)}>View Document</Button>
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

export default function ResourcesPage() {
  const { user } = useAuth();
  const db = useFirestore();
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [selectedPdfTitle, setSelectedPdfTitle] = useState<string | null>(null);


  useEffect(() => {
    if (!user?.companyId || !db) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);
    const resourcesQuery = query(collection(db, "resources"), where("companyId", "==", user.companyId));
    
    const unsubscribe = onSnapshot(resourcesQuery, (snapshot) => {
        const resourcesData: Resource[] = [];
        snapshot.forEach((doc) => {
            resourcesData.push({ id: doc.id, ...doc.data() } as Resource);
        });
        setResources(resourcesData);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.companyId, db]);

  const categories = useMemo(
    () => [...new Set(resources.map((r) => r.category))],
    [resources]
  );
  const types = useMemo(
    () => [...new Set(resources.map((r) => r.type))],
    [resources]
  );

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        resource.title.toLowerCase().includes(searchTermLower) ||
        resource.equipment.toLowerCase().includes(searchTermLower) ||
        resource.description.toLowerCase().includes(searchTermLower);

      const matchesCategory =
        categoryFilter === 'all' || resource.category === categoryFilter;
      const matchesType = typeFilter === 'all' || resource.type === typeFilter;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchTerm, categoryFilter, typeFilter, resources]);

  const uniqueCategories = useMemo(() => [...new Set(initialResources.map(r => r.category))], []);
  const uniqueTypes = useMemo(() => [...new Set(initialResources.map(r => r.type))] as Resource['type'][], []);

  const handleViewResource = (url: string, title: string) => {
    setSelectedPdfUrl(url);
    setSelectedPdfTitle(title);
    setIsViewerOpen(true);
  };


  return (
    <>
    <AddResourceDialog
        open={isAddDialogOpen}
        onOpenChange={setAddDialogOpen}
        categories={uniqueCategories}
        types={uniqueTypes}
    />
     <PdfViewerDialog
        open={isViewerOpen}
        onOpenChange={setIsViewerOpen}
        url={selectedPdfUrl}
        title={selectedPdfTitle}
    />
    <div className="space-y-6">
      <div className="flex items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">Resource Center</h1>
            <p className="text-muted-foreground">
            Find technical manuals, guides, and documentation.
            </p>
        </div>
        <div className="ml-auto flex items-center gap-2">
            <Button size="sm" onClick={() => setAddDialogOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" /> Add Resource
            </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by equipment, title, or keyword..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {isLoading ? (
         <div className="flex items-center justify-center p-10">
            <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading resources...</p>
        </div>
      ) : filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} onView={handleViewResource} />
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed py-20 text-center">
            <Book className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-semibold">No Resources Found</p>
            <p className="text-sm text-muted-foreground">
                Your search and filters did not match any documents.
            </p>
        </div>
      )}

    </div>
    </>
  );
}
