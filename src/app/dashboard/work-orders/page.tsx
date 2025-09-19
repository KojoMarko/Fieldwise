
'use client';
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
import { workOrders, customers } from '@/lib/data';
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useMemo } from 'react';

export default function WorkOrdersPage() {
  const { user } = useAuth();

  const userWorkOrders = useMemo(() => {
    if (!user) return [];
    
    if (user.role === 'Admin') {
      return workOrders;
    } else if (user.role === 'Technician') {
      return workOrders.filter(wo => wo.technicianId === user.id);
    } else if (user.role === 'Customer') {
      const customerProfile = customers.find(c => c.contactEmail === user.email);
      if (!customerProfile) return [];
      return workOrders.filter(wo => wo.customerId === customerProfile.id);
    }
    return [];
  }, [user]);

  const allOrders = userWorkOrders;
  const activeOrders = userWorkOrders.filter(
    (wo) => wo.status === 'Scheduled' || wo.status === 'In-Progress' || wo.status === 'On-Hold'
  );
  const completedOrders = userWorkOrders.filter(
    (wo) => wo.status === 'Completed' || wo.status === 'Invoiced'
  );
  const draftOrders = userWorkOrders.filter((wo) => wo.status === 'Draft');

  const canCreateWorkOrder = user?.role === 'Admin' || user?.role === 'Customer';

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl mr-4">Work Orders</h1>
        <TabsList className="hidden sm:flex">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
          {user?.role === 'Admin' && (
            <TabsTrigger value="draft" className="hidden sm:flex">
              Draft
            </TabsTrigger>
          )}
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          {user?.role === 'Admin' && (
            <Button size="sm" variant="outline" className="h-8 gap-1">
                <File className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
                </span>
            </Button>
          )}
          {canCreateWorkOrder && (
            <Button size="sm" className="h-8 gap-1" asChild>
              <Link href="/dashboard/work-orders/new">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  {user?.role === 'Customer' ? 'Request Service' : 'Create Work Order'}
                </span>
              </Link>
            </Button>
          )}
        </div>
      </div>
       <TabsList className="grid w-full grid-cols-3 mt-4 sm:hidden">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>
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
      {user?.role === 'Admin' && (
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
      )}
    </Tabs>
  );
}
