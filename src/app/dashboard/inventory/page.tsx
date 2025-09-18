import { File, PlusCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { columns } from './components/columns';
import { sparePartsColumns } from './components/spare-parts-columns';
import { DataTable } from './components/data-table';
import { assets, spareParts } from '@/lib/data';

export default function InventoryPage() {
  return (
    <Tabs defaultValue="assets">
      <div className="flex items-center mb-4">
        <h1 className="text-3xl font-bold tracking-tight">Inventory</h1>
        <div className="ml-auto flex items-center gap-2">
           <TabsList>
            <TabsTrigger value="assets">Assets</TabsTrigger>
            <TabsTrigger value="spare-parts">Spare Parts</TabsTrigger>
          </TabsList>
          <Button size="sm" variant="outline" className="h-8 gap-1 ml-4">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="assets">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle>Assets</CardTitle>
              <CardDescription>
                Manage all company and customer assets.
              </CardDescription>
            </div>
             <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Item
                </span>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={assets} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="spare-parts">
        <Card>
          <CardHeader className="flex-row items-center justify-between">
             <div>
                <CardTitle>Spare Parts</CardTitle>
                <CardDescription>
                Manage all spare parts inventory.
                </CardDescription>
            </div>
             <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Item
                </span>
            </Button>
          </CardHeader>
          <CardContent>
            <DataTable columns={sparePartsColumns} data={spareParts} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
