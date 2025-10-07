
'use client';
import { File, PlusCircle, LoaderCircle } from 'lucide-react';
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
import { useMemo, useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { AddPartDialog } from './components/add-part-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

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


  const groupedParts = useMemo(() => {
    let partsToGroup = spareParts;
    if (filter) {
      partsToGroup = spareParts.filter(
        (p) =>
          p.name.toLowerCase().includes(filter.toLowerCase()) ||
          p.partNumber.toLowerCase().includes(filter.toLowerCase()) ||
          p.assetModel.toLowerCase().includes(filter.toLowerCase())
      );
    }

    return partsToGroup.reduce((acc, part) => {
      const { assetModel } = part;
      if (!acc[assetModel]) {
        acc[assetModel] = [];
      }
      acc[assetModel].push(part);
      return acc;
    }, {} as Record<string, SparePart[]>);
  }, [filter, spareParts]);

  const defaultOpenValue = useMemo(() => {
      if (filter && Object.keys(groupedParts).length > 0) {
          return `item-${Object.keys(groupedParts)[0]}`
      }
      return undefined;
  }, [filter, groupedParts])


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
              Add Part
            </span>
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Spare Parts Inventory</CardTitle>
          <CardDescription>
            Manage all spare parts, grouped by the machine they belong to.
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
              <Accordion
                type="single"
                collapsible
                className="w-full"
                key={defaultOpenValue} // Force re-render to open accordion on filter
                defaultValue={defaultOpenValue}
              >
                {Object.entries(groupedParts).length > 0 ? (
                  Object.entries(groupedParts).map(([model, parts]) => (
                    <AccordionItem key={model} value={`item-${model}`}>
                      <AccordionTrigger className="text-lg font-medium">
                        {model} ({parts.length} parts)
                      </AccordionTrigger>
                      <AccordionContent>
                        <DataTable columns={sparePartsColumns} data={parts} />
                      </AccordionContent>
                    </AccordionItem>
                  ))
                ) : (
                  <div className="text-center py-10 text-muted-foreground">
                    No spare parts found.
                  </div>
                )}
              </Accordion>
            </>
           )}
        </CardContent>
      </Card>
    </>
  );
}
