
import { File, PlusCircle } from 'lucide-react';
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
import { assets } from '@/lib/data';

export default function AssetsPage() {
  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Assets</h1>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
           <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Asset
                </span>
            </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
            <CardTitle>Assets</CardTitle>
            <CardDescription>
            Manage all company and customer assets.
            </CardDescription>
        </CardHeader>
        <CardContent>
          <DataTable columns={columns} data={assets} />
        </CardContent>
      </Card>
    </>
  );
}
