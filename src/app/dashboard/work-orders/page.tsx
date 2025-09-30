
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
import Link from 'next/link';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useMemo, useState } from 'react';
import { getWorkOrders } from '@/lib/services/work-order-service';
import type { WorkOrder } from '@/lib/types';
import { customers } from '@/lib/data'; // Keep for customer role filtering


export default function WorkOrdersPage() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);


  useEffect(() => {
    async function loadWorkOrders() {
      if (!user?.companyId) return;
      setIsLoading(true);
      const fetchedWorkOrders = await getWorkOrders(user.companyId);

      if (user.role === 'Admin') {
        setWorkOrders(fetchedWorkOrders);
      } else if (user.role === 'Technician') {
        setWorkOrders(fetchedWorkOrders.filter(wo => wo.technicianId === user.id));
      } else if (user.role === 'Customer') {
        const customerProfile = customers.find(c => c.contactEmail === user.email);
        if (!customerProfile) {
            setWorkOrders([]);
            return;
        };
        setWorkOrders(fetchedWorkOrders.filter(wo => wo.customerId === customerProfile.id));
      } else {
        setWorkOrders([]);
      }
      setIsLoading(false);
    }

    loadWorkOrders();
  }, [user]);


  const activeOrders = workOrders.filter(
    (wo) => wo.status === 'Scheduled' || wo.status === 'In-Progress' || wo.status === 'On-Hold'
  );
  const completedOrders = workOrders.filter(
    (wo) => wo.status === 'Completed' || wo.status === 'Invoiced'
  );
  const draftOrders = workOrders.filter((wo) => wo.status === 'Draft');

  const canCreateWorkOrder = user?.role === 'Admin' || user?.role === 'Customer';

  const renderDataTable = (data: WorkOrder[], title: string, description: string) => (
     <Card>
        <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading ? <p>Loading...</p> : <DataTable columns={columns} data={data} />}
        </CardContent>
    </Card>
  )

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <h1 className="text-lg font-semibold md:text-2xl mr-auto">Work Orders</h1>
        <div className="hidden sm:flex items-center gap-2">
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
       <div className="flex items-center gap-4 mt-4">
        <TabsList className="grid w-full grid-cols-3 sm:w-auto sm:grid-cols-4">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            {user?.role === 'Admin' && (
                <TabsTrigger value="draft" className="hidden sm:flex">
                Draft
                </TabsTrigger>
            )}
        </TabsList>
         <div className="sm:hidden flex-1">
             {canCreateWorkOrder && (
                <Button size="sm" className="h-8 gap-1 w-full" asChild>
                <Link href="/dashboard/work-orders/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span>
                    {user?.role === 'Customer' ? 'Request Service' : 'New'}
                    </span>
                </Link>
                </Button>
            )}
         </div>
       </div>
      <TabsContent value="all">
        {renderDataTable(workOrders, 'All Work Orders', 'Manage all service jobs and assignments.')}
      </TabsContent>
      <TabsContent value="active">
        {renderDataTable(activeOrders, 'Active Work Orders', 'Work orders that are scheduled, in-progress, or on-hold.')}
      </TabsContent>
      <TabsContent value="completed">
       {renderDataTable(completedOrders, 'Completed Work Orders', 'Work orders that have been completed or invoiced.')}
      </TabsContent>
      {user?.role === 'Admin' && (
        <TabsContent value="draft">
            {renderDataTable(draftOrders, 'Draft Work Orders', 'Work orders that are not yet scheduled.')}
        </TabsContent>
      )}
    </Tabs>
  );
}
