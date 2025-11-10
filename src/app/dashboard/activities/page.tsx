
'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
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
  Briefcase,
  LoaderCircle,
} from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where, addDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Activity } from '@/lib/types';
import { formatISO, parseISO, isToday, isFuture, isPast } from 'date-fns';

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  task: CheckCircle,
  deadline: Briefcase,
};

function ActivityItem({ activity, onToggle }: { activity: Activity, onToggle: (id: string, completed: boolean) => void }) {
  const Icon = activityIcons[activity.type] || CheckCircle;
  const isCompleted = activity.status === 'completed';
  return (
    <div className="flex items-start gap-4 rounded-lg border p-4">
      <Checkbox 
        id={`task-${activity.id}`} 
        className="mt-1" 
        checked={isCompleted}
        onCheckedChange={(checked) => onToggle(activity.id, !!checked)}
      />
      <div className="flex-1 space-y-1">
        <div className="flex items-center justify-between">
          <label
            htmlFor={`task-${activity.id}`}
            className={cn("flex items-center gap-2 font-medium", isCompleted && "line-through text-muted-foreground")}
          >
            <Icon className="h-4 w-4 text-muted-foreground" />
            {activity.title}
          </label>
          <Badge variant="outline" className="text-muted-foreground">
            {activity.status}
          </Badge>
        </div>
        <p className={cn("text-sm text-muted-foreground", isCompleted && "line-through")}>{activity.description}</p>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>{format(parseISO(activity.time), 'p')}</span>
          <span>{activity.company}</span>
        </div>
      </div>
    </div>
  );
}

function AddActivityDialog({ open, onOpenChange, onAddActivity }: { open: boolean, onOpenChange: (open: boolean) => void, onAddActivity: (activity: Omit<Activity, 'id' | 'status' | 'companyId'>) => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('task');
    const [company, setCompany] = useState('');
    const [time, setTime] = useState('');

    const handleSubmit = () => {
        if (!title || !time) return;
        const [hour, minute] = time.split(':').map(Number);
        const activityDate = new Date();
        activityDate.setHours(hour, minute);

        onAddActivity({ title, description, type, company, time: formatISO(activityDate) });
        onOpenChange(false);
        // Reset form
        setTitle('');
        setDescription('');
        setType('task');
        setCompany('');
        setTime('');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Add New Activity</DialogTitle>
                    <DialogDescription>Fill out the details for your new activity.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="title">Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Follow up with Acme Corp" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea id="description" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="e.g., Discuss enterprise package pricing" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                             <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="task">Task</SelectItem>
                                    <SelectItem value="call">Call</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="meeting">Meeting</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company">Company</Label>
                        <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Acme Corp" />
                    </div>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Add Activity</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

export default function ActivitiesPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);

  useEffect(() => {
    if (!user?.companyId) {
        setIsLoading(false);
        return;
    }
    const activitiesQuery = query(collection(db, 'activities'), where('companyId', '==', user.companyId));
    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
        const activitiesData: Activity[] = [];
        snapshot.forEach(doc => activitiesData.push({ id: doc.id, ...doc.data() } as Activity));
        setActivities(activitiesData);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user?.companyId]);

  const handleAddActivity = async (newActivityData: Omit<Activity, 'id' | 'status' | 'companyId'>) => {
      if (!user?.companyId) return;

      const activityDate = parseISO(newActivityData.time);
      let status: Activity['status'] = 'today';
      if(isFuture(activityDate) && !isToday(activityDate)) status = 'upcoming';

      const newActivity: Omit<Activity, 'id'> = {
          ...newActivityData,
          status,
          companyId: user.companyId,
      };
      await addDoc(collection(db, 'activities'), newActivity);
  };
  
  const handleToggleComplete = async (id: string, completed: boolean) => {
      // This is a placeholder for updating the status in Firestore
      console.log(`Toggling activity ${id} to ${completed ? 'completed' : 'today'}`);
  };

  const todayActivities = activities.filter((a) => isToday(parseISO(a.time)) && a.status !== 'completed');
  const upcomingActivities = activities.filter((a) => isFuture(parseISO(a.time)) && !isToday(parseISO(a.time)) && a.status !== 'completed');
  const overdueActivities = activities.filter((a) => isPast(parseISO(a.time)) && !isToday(parseISO(a.time)) && a.status !== 'completed');
  const completedActivities = activities.filter((a) => a.status === 'completed');

  return (
    <>
      <AddActivityDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} onAddActivity={handleAddActivity} />
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
            <p className="text-muted-foreground">
              Manage your tasks, calls, meetings, and emails
            </p>
          </div>
          <div className="sm:ml-auto">
            <Button onClick={() => setAddDialogOpen(true)}>
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
                  <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 mt-2">
                    <TabsTrigger value="today">Today</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="overdue">Overdue</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                  </TabsList>
                </CardHeader>
                <CardContent>
                    {isLoading ? (
                        <div className="flex justify-center items-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        <>
                        <TabsContent value="today" className="space-y-4">
                            {todayActivities.map((activity) => (
                            <ActivityItem key={activity.id} activity={activity} onToggle={handleToggleComplete} />
                            ))}
                        </TabsContent>
                        <TabsContent value="upcoming" className="space-y-4">
                            {upcomingActivities.map((activity) => (
                            <ActivityItem key={activity.id} activity={activity} onToggle={handleToggleComplete} />
                            ))}
                        </TabsContent>
                        <TabsContent value="overdue" className="space-y-4">
                            {overdueActivities.map((activity) => (
                            <ActivityItem key={activity.id} activity={activity} onToggle={handleToggleComplete} />
                            ))}
                        </TabsContent>
                        <TabsContent value="completed" className="space-y-4">
                            {completedActivities.map((activity) => (
                            <ActivityItem key={activity.id} activity={activity} onToggle={handleToggleComplete} />
                            ))}
                        </TabsContent>
                        </>
                    )}
                </CardContent>
              </Card>
            </Tabs>
          </div>
        </div>
      </div>
    </>
  );
}
