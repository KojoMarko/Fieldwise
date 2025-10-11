
'use client';

import {
  Wrench,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  ChevronRight,
  LoaderCircle,
} from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { format, isToday, isFuture, parseISO, startOfWeek, isWithinInterval } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import type { WorkOrder, Customer } from '@/lib/types';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';


export default function TechnicianDashboardPage() {
    const { user } = useAuth();
    const [myWorkOrders, setMyWorkOrders] = useState<WorkOrder[]>([]);
    const [customers, setCustomers] = useState<Record<string, Customer>>({});
    const [isLoading, setIsLoading] = useState(true);
    
    useEffect(() => {
        if (!user || !user.companyId) {
            setIsLoading(false);
            return;
        }

        const workOrdersQuery = query(collection(db, 'work-orders'), where('companyId', '==', user.companyId), where('technicianId', '==', user.id));
        const customersQuery = query(collection(db, 'customers'), where('companyId', '==', user.companyId));
        
        const unsubOrders = onSnapshot(workOrdersQuery, (snapshot) => {
            const orders: WorkOrder[] = [];
            snapshot.forEach(doc => orders.push({ id: doc.id, ...doc.data()} as WorkOrder));
            setMyWorkOrders(orders);
            setIsLoading(false);
        });

        const unsubCustomers = onSnapshot(customersQuery, (snapshot) => {
            const custs: Record<string, Customer> = {};
            snapshot.forEach(doc => custs[doc.id] = { id: doc.id, ...doc.data() } as Customer);
            setCustomers(custs);
        });

        return () => {
            unsubOrders();
            unsubCustomers();
        }

    }, [user]);

    
    if (!user) return null;
    
    if (isLoading) {
      return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <LoaderCircle className="h-10 w-10 animate-spin" />
        </div>
      )
    }

    const todaysWorkOrders = myWorkOrders.filter(wo =>
      wo.scheduledDate && isToday(parseISO(wo.scheduledDate))
    );
    const upcomingWorkOrders = myWorkOrders.filter(wo =>
      wo.scheduledDate && isFuture(parseISO(wo.scheduledDate)) && !isToday(parseISO(wo.scheduledDate))
    );

    const completedThisWeek = myWorkOrders.filter(wo => {
        if (!wo.completedDate) return false;
        const completedDate = parseISO(wo.completedDate);
        const today = new Date();
        const start = startOfWeek(today);
        return isWithinInterval(completedDate, { start, end: today });
    }).length;


  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {user.name.split(' ')[0]}
        </h1>
        <Badge variant="outline" className="text-sm">Engineer View</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Today's Appointments"
          value={todaysWorkOrders.length.toString()}
          description="Work orders scheduled for today"
          Icon={Calendar}
        />
        <KpiCard
          title="Upcoming Work Orders"
          value={upcomingWorkOrders.length.toString()}
          description="Work orders in the next 7 days"
          Icon={Clock}
        />
        <KpiCard
          title="Completed This Week"
          value={completedThisWeek.toString()}
          description="Total work orders you've completed"
          Icon={CheckCircle}
        />
         <KpiCard
          title="Total Assigned"
          value={myWorkOrders.length.toString()}
          description="All open and completed work orders"
          Icon={Wrench}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Work Orders</CardTitle>
            <CardDescription>
              Your work orders scheduled for today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaysWorkOrders.length > 0 ? (
              <ul className="space-y-4">
                {todaysWorkOrders.map(wo => {
                    const customer = customers[wo.customerId];
                    return (
                        <li key={wo.id}>
                            <Link href={`/dashboard/work-orders/${wo.id}`} className="block p-4 rounded-lg border hover:bg-muted transition-colors">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{wo.title}</p>
                                        <p className="text-sm text-muted-foreground">{customer?.name}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm mt-2 text-muted-foreground">
                                    <div className="flex items-center gap-1">
                                        <MapPin className="h-4 w-4" />
                                        <span>{customer?.address}</span>
                                    </div>
                                     <div className="flex items-center gap-1">
                                        <Badge variant={wo.priority === 'High' ? 'destructive' : 'secondary'}>{wo.priority}</Badge>
                                    </div>
                                </div>
                            </Link>
                        </li>
                    )
                })}
              </ul>
            ) : (
              <div className="text-center py-10">
                <Calendar className="mx-auto h-12 w-12 text-muted-foreground" />
                <p className="mt-4 text-sm text-muted-foreground">No work orders scheduled for today.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Work Orders</CardTitle>
            <CardDescription>
              Your work orders for the coming days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingWorkOrders.length > 0 ? (
                 <ul className="space-y-4">
                {upcomingWorkOrders.map(wo => {
                    const customer = customers[wo.customerId];
                    return (
                        <li key={wo.id}>
                            <Link href={`/dashboard/work-orders/${wo.id}`} className="block p-4 rounded-lg border hover:bg-muted transition-colors">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{wo.title}</p>
                                        <p className="text-sm text-muted-foreground">{customer?.name}</p>
                                        <p className="text-xs font-semibold text-primary mt-1">{wo.scheduledDate ? format(parseISO(wo.scheduledDate), 'eeee, MMM d') : ''}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </div>
                            </Link>
                        </li>
                    )
                })}
              </ul>
            ) : (
                <div className="text-center py-10">
                    <CheckCircle className="mx-auto h-12 w-12 text-muted-foreground" />
                    <p className="mt-4 text-sm text-muted-foreground">No upcoming work orders on the schedule.</p>
                </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
