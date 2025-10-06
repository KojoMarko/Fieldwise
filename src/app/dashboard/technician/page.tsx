
'use client';

import {
  Wrench,
  CheckCircle,
  Clock,
  Calendar,
  MapPin,
  ChevronRight,
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
import { workOrders, customers } from '@/lib/data';
import Link from 'next/link';
import { format, isToday, isFuture, parseISO, startOfWeek, isWithinInterval } from 'date-fns';
import { useAuth } from '@/hooks/use-auth';


export default function TechnicianDashboardPage() {
    const { user } = useAuth();
    
    if (!user) return null;

    const myWorkOrders = workOrders.filter(
    wo => wo.technicianId === user.id
    );

    const todaysJobs = myWorkOrders.filter(wo =>
    isToday(parseISO(wo.scheduledDate))
    );
    const upcomingJobs = myWorkOrders.filter(wo =>
    isFuture(parseISO(wo.scheduledDate)) && !isToday(parseISO(wo.scheduledDate))
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
          value={todaysJobs.length.toString()}
          description="Jobs scheduled for today"
          Icon={Calendar}
        />
        <KpiCard
          title="Upcoming Jobs"
          value={upcomingJobs.length.toString()}
          description="Jobs in the next 7 days"
          Icon={Clock}
        />
        <KpiCard
          title="Completed This Week"
          value={completedThisWeek.toString()}
          description="Total jobs you've completed"
          Icon={CheckCircle}
        />
         <KpiCard
          title="Total Assigned"
          value={myWorkOrders.length.toString()}
          description="All open and completed jobs"
          Icon={Wrench}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today's Jobs</CardTitle>
            <CardDescription>
              Your work orders scheduled for today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {todaysJobs.length > 0 ? (
              <ul className="space-y-4">
                {todaysJobs.map(wo => {
                    const customer = customers.find(c => c.id === wo.customerId);
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
                <p className="mt-4 text-sm text-muted-foreground">No jobs scheduled for today.</p>
              </div>
            )}
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Jobs</CardTitle>
            <CardDescription>
              Your work orders for the coming days.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingJobs.length > 0 ? (
                 <ul className="space-y-4">
                {upcomingJobs.map(wo => {
                    const customer = customers.find(c => c.id === wo.customerId);
                    return (
                        <li key={wo.id}>
                            <Link href={`/dashboard/work-orders/${wo.id}`} className="block p-4 rounded-lg border hover:bg-muted transition-colors">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-medium">{wo.title}</p>
                                        <p className="text-sm text-muted-foreground">{customer?.name}</p>
                                        <p className="text-xs font-semibold text-primary mt-1">{format(parseISO(wo.scheduledDate), 'eeee, MMM d')}</p>
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
                    <p className="mt-4 text-sm text-muted-foreground">No upcoming jobs on the schedule.</p>
                </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
