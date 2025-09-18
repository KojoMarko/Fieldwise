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
import { DataTable } from './components/data-table';
import { workOrders } from '@/lib/data';
import Link from 'next/link';

export default function WorkOrdersPage() {
  const allOrders = workOrders;
  const activeOrders = workOrders.filter(
    (wo) => wo.status === 'Scheduled' || wo.status === 'In-Progress' || wo.status === 'On-Hold'
  );
  const completedOrders = workOrders.filter(
    (wo) => wo.status === 'Completed' || wo.status === 'Invoiced'
  );
  const draftOrders = workOrders.filter((wo) => wo.status === 'Draft');

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          <TabsTrigger value="draft" className="hidden sm:flex">
            Draft
          </TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <File className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              Export
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1" asChild>
            <Link href="/dashboard/work-orders/new">
              <PlusCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Create Work Order
              </span>
            </Link>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>All Work Orders</CardTitle>
            <CardDescription>
              Manage all service jobs and assignments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={allOrders} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="active">
        <Card>
          <CardHeader>
            <CardTitle>Active Work Orders</CardTitle>
            <CardDescription>
              Work orders that are scheduled, in-progress, or on-hold.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={activeOrders} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="completed">
        <Card>
          <CardHeader>
            <CardTitle>Completed Work Orders</CardTitle>
            <CardDescription>
              Work orders that have been completed or invoiced.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={completedOrders} />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="draft">
        <Card>
          <CardHeader>
            <CardTitle>Draft Work Orders</CardTitle>
            <CardDescription>
              Work orders that are not yet scheduled.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DataTable columns={columns} data={draftOrders} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
