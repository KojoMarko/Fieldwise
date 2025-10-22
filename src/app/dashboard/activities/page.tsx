
'use client';

import { useState } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  PlusCircle,
  Clock,
  Calendar as CalendarIcon,
  AlertCircle,
  CheckCircle,
  Phone,
  Mail,
  Users,
} from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';

const activities = [
  {
    id: '1',
    type: 'call',
    title: 'Follow up call with Acme Corp',
    description: 'Discuss enterprise package pricing and implementation timeline',
    time: '10:00 AM',
    company: 'Acme Corp',
    status: 'today',
  },
  {
    id: '2',
    type: 'email',
    title: 'Send proposal to TechStart',
    description: 'Professional plan proposal with custom pricing',
    time: '11:30 AM',
    company: 'TechStart Inc',
    status: 'today',
  },
  {
    id: '3',
    type: 'meeting',
    title: 'Demo presentation - Global Systems',
    description: 'Product demo and Q&A session',
    time: '2:00 PM',
    company: 'Global Systems',
    status: 'today',
  },
   {
    id: '4',
    type: 'task',
    title: 'Prepare slides for tomorrow\'s pitch',
    description: 'Finalize the presentation for the new client.',
    time: '4:00 PM',
    company: 'Internal',
    status: 'today',
  },
  {
    id: '5',
    type: 'meeting',
    title: 'Quarterly review with Enterprise Co',
    description: 'Review performance and discuss next quarter goals.',
    time: 'Tomorrow, 10:00 AM',
    company: 'Enterprise Co',
    status: 'upcoming',
  },
   {
    id: '6',
    type: 'call',
    title: 'Check in with MegaCorp Industries',
    description: 'Follow up on the signed contract and next steps.',
    time: 'Yesterday, 3:00 PM',
    company: 'MegaCorp Industries',
    status: 'overdue',
  },
   {
    id: '7',
    type: 'email',
    title: 'Send invoice to StartUp Studios',
    description: 'Invoice for the completed project phase.',
    time: 'Last week',
    company: 'StartUp Studios',
    status: 'completed',
  },
];

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  task: CheckCircle,
};

function ActivityItem({ activity }: { activity: (typeof activities)[0] }) {
  const Icon = activityIcons[activity.type] || CheckCircle;
  return (
    <div className="flex items-start gap-4 rounded-lg border p-4">
      <Checkbox id={`task-${activity.id}`} className="mt-1" />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor={`task-${activity.id}`}
            className="flex items-center gap-2 font-medium"
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            {activity.title}
          </label>
          <Badge variant="outline" className="text-muted-foreground">
            pending
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{activity.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{activity.time}</span>
          <span>{activity.company}</span>
        </div>
      </div>
    </div>
  );
}

export default function ActivitiesPage() {
  const [date, setDate] = useState<Date | undefined>(new Date('2025-10-22'));

  const todayActivities = activities.filter((a) => a.status === 'today');
  const upcomingActivities = activities.filter((a) => a.status === 'upcoming');
  const overdueActivities = activities.filter((a) => a.status === 'overdue');
  const completedActivities = activities.filter((a) => a.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
          <p className="text-muted-foreground">
            Manage your tasks, calls, meetings, and emails
          </p>
        </div>
        <div className="sm:ml-auto">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Activity
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Today's Activities"
          value={todayActivities.length.toString()}
          description=""
          Icon={Clock}
        />
        <KpiCard
          title="Upcoming"
          value={upcomingActivities.length.toString()}
          description=""
          Icon={CalendarIcon}
        />
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Overdue</CardTitle>
                <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold text-destructive">{overdueActivities.length}</div>
            </CardContent>
        </Card>
         <KpiCard
          title="Completed"
          value={completedActivities.length.toString()}
          description=""
          Icon={CheckCircle}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Tabs defaultValue="today">
            <Card>
              <CardHeader>
                <CardTitle>Activity Timeline</CardTitle>
                <TabsList className="grid w-full grid-cols-4 mt-2">
                  <TabsTrigger value="today">Today</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                  <TabsTrigger value="overdue">Overdue</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>
              </CardHeader>
              <CardContent>
                <TabsContent value="today" className="space-y-4">
                  {todayActivities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </TabsContent>
                <TabsContent value="upcoming" className="space-y-4">
                   {upcomingActivities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </TabsContent>
                <TabsContent value="overdue" className="space-y-4">
                   {overdueActivities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </TabsContent>
                <TabsContent value="completed" className="space-y-4">
                   {completedActivities.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </TabsContent>
              </CardContent>
            </Card>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
