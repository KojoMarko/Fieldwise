
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Phone, Send, CheckCircle, Users } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import type { Activity } from '@/lib/types';
import { isToday, parseISO } from 'date-fns';

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Send,
  meeting: Users,
  task: CheckCircle,
};

export function TodaysTasks({ activities }: { activities: Activity[] }) {

  const todaysActivities = activities.filter(a => a.time && isToday(parseISO(a.time)));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Tasks</CardTitle>
        <CardDescription>Stay on top of your activities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {todaysActivities.length > 0 ? todaysActivities.map((task) => {
            const Icon = activityIcons[task.type] || CheckCircle;
            return (
              <div key={task.id} className="flex items-center gap-4">
                  <Checkbox id={task.id} />
                  <div className='flex-grow'>
                      <label htmlFor={task.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-2">
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {task.title}
                      </label>
                      <p className="text-sm text-muted-foreground">{new Date(task.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
              </div>
            )
        }) : (
            <p className="text-sm text-muted-foreground text-center py-4">No tasks scheduled for today.</p>
        )}
      </CardContent>
    </Card>
  );
}
