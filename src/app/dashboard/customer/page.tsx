
'use client';

import { useAuth } from '@/hooks/use-auth';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { workOrders, assets, customers } from '@/lib/data';
import { CheckCircle, Clock, HardDrive, PlusCircle } from 'lucide-react';
import Link from 'next/link';

export default function CustomerDashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  // Find the customer profile linked to the user
  const customerProfile = customers.find(c => c.contactEmail === user.email);

  if (!customerProfile) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {user.name.split(' ')[0]}
        </h1>
        <p>Could not find an associated customer account.</p>
      </div>
    );
  }

  const myWorkOrders = workOrders.filter(
    (wo) => wo.customerId === customerProfile.id
  );
  const myAssets = assets.filter((a) => a.customerId === customerProfile.id);

  const completedOrders = myWorkOrders.filter(
    (wo) => wo.status === 'Completed' || wo.status === 'Invoiced'
  ).length;
  const activeOrders = myWorkOrders.length - completedOrders;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {user.name.split(' ')[0]}
        </h1>
        <Badge variant="outline" className="text-sm">
          Customer Portal
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Work Orders
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeOrders}</div>
            <p className="text-xs text-muted-foreground">
              Currently in-progress or scheduled
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Completed Work Orders
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{completedOrders}</div>
            <p className="text-xs text-muted-foreground">
              Total service history
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Your Assets
            </CardTitle>
            <HardDrive className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myAssets.length}</div>
            <p className="text-xs text-muted-foreground">
              Equipment under service contract
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Your Equipment</CardTitle>
            <CardDescription>
              A list of your assets being managed by FieldWise.
            </CardDescription>
          </div>
          <Button size="sm" className="h-8 gap-1" asChild>
                <Link href="/dashboard/work-orders/new">
                    <PlusCircle className="h-3.5 w-3.5" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                        Request Service
                    </span>
                </Link>
            </Button>
        </CardHeader>
        <CardContent>
          <ul className="space-y-4">
            {myAssets.map((asset) => (
              <li
                key={asset.id}
                className="p-4 border rounded-lg flex justify-between items-center"
              >
                <div>
                  <p className="font-medium">{asset.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Model: {asset.model} | S/N: {asset.serialNumber}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Location: {asset.location}
                  </p>
                </div>
                <Button variant="outline" size="sm" asChild>
                    <Link href={`/dashboard/work-orders?assetId=${asset.id}`}>
                        View Service History
                    </Link>
                </Button>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
