import {
  ChevronLeft,
  Copy,
  CreditCard,
  MoreVertical,
  Truck,
  Wrench,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { notFound } from 'next/navigation';
import { workOrders, customers, assets, users } from '@/lib/data';
import type { WorkOrderStatus } from '@/lib/types';
import Link from 'next/link';
import { WorkOrderClientSection } from './components/work-order-client-section';

const statusStyles: Record<WorkOrderStatus, string> = {
  Draft: 'bg-gray-200 text-gray-800',
  Scheduled: 'bg-blue-100 text-blue-800',
  'In-Progress': 'bg-yellow-100 text-yellow-800',
  Completed: 'bg-green-100 text-green-800',
  Invoiced: 'bg-purple-100 text-purple-800',
  Cancelled: 'bg-red-100 text-red-800',
};

export default function WorkOrderDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const workOrder = workOrders.find((wo) => wo.id === params.id);
  if (!workOrder) {
    notFound();
  }

  const customer = customers.find((c) => c.id === workOrder.customerId);
  const asset = assets.find((a) => a.id === workOrder.assetId);
  const technician = users.find((u) => u.id === workOrder.technicianId);

  return (
    <div className="mx-auto grid max-w-6xl flex-1 auto-rows-max gap-4">
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" className="h-7 w-7" asChild>
          <Link href="/dashboard/work-orders">
            <ChevronLeft className="h-4 w-4" />
            <span className="sr-only">Back</span>
          </Link>
        </Button>
        <h1 className="flex-1 shrink-0 whitespace-nowrap text-xl font-semibold tracking-tight sm:grow-0">
          {workOrder.title}
        </h1>
        <Badge variant="outline" className={statusStyles[workOrder.status]}>
          {workOrder.status}
        </Badge>
        <div className="hidden items-center gap-2 md:ml-auto md:flex">
          <Button variant="outline" size="sm">
            Discard
          </Button>
          <Button size="sm">Save</Button>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-[1fr_250px] lg:grid-cols-3 lg:gap-8">
        <div className="grid auto-rows-max items-start gap-4 lg:col-span-2 lg:gap-8">
          <Card>
            <CardHeader>
              <CardTitle>Work Order Details</CardTitle>
              <CardDescription>{workOrder.id}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                {workOrder.description}
              </p>
            </CardContent>
          </Card>
           <WorkOrderClientSection workOrder={workOrder} customer={customer} technician={technician} />
        </div>
        <div className="grid auto-rows-max items-start gap-4 lg:gap-8">
          <Card className="overflow-hidden">
            <CardHeader>
              <CardTitle>Asset Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                <div className="font-semibold">{asset?.name}</div>
                <dl className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Model</dt>
                    <dd>{asset?.model}</dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">S/N</dt>
                    <dd>{asset?.serialNumber}</dd>
                  </div>
                </dl>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Customer Information</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold">{customer?.name}</div>
                <Link href="#" className="text-sm text-primary hover:underline">
                  View Profile
                </Link>
              </div>
              <address className="grid gap-0.5 not-italic text-muted-foreground">
                <span>{customer?.contactPerson}</span>
                <span>{customer?.address}</span>
              </address>
              <Separator />
               <div className="font-semibold">Contact</div>
               <dl className="grid gap-1">
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Email</dt>
                    <dd><a href={`mailto:${customer?.contactEmail}`}>{customer?.contactEmail}</a></dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="text-muted-foreground">Phone</dt>
                    <dd><a href={`tel:${customer?.phone}`}>{customer?.phone}</a></dd>
                  </div>
                </dl>
            </CardContent>
          </Card>
          <Card>
             <CardHeader>
                <CardTitle>Assigned Technician</CardTitle>
             </CardHeader>
             <CardContent>
                {technician ? (
                     <div className="flex items-center gap-2">
                        <Wrench className="h-4 w-4 text-muted-foreground" />
                        <span>{technician.name}</span>
                    </div>
                ) : (
                    <div className="text-sm text-muted-foreground">Unassigned</div>
                )}
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
