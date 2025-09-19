import { File, PlusCircle } from 'lucide-react';
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
import { spareParts } from '@/lib/data';

export default function SparePartsPage() {
  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Spare Parts</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1 ml-4">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
           <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Part
                </span>
            </Button>
        </div>
      </div>
        <Card>
          <CardHeader>
             <CardTitle>Spare Parts</CardTitle>
             <CardDescription>
             Manage all spare parts inventory.
             </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={sparePartsColumns} data={spareParts} />
          </CardContent>
        </Card>
    </>
  );
}
