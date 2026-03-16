'use client';

import { useState, useEffect, useMemo } from 'react';
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
  FolderKanban,
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
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Activity } from '@/lib/types';
import { formatISO, parseISO, isToday, isFuture, isPast, format, formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';

const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Users,
  task: CheckCircle,
  deadline: FolderKanban,
};

function ActivityItem({ activity, onToggle }: { activity: Activity; onToggle: (id: string, completed: boolean) => void }) {
  const Icon = activityIcons[activity.type] || CheckCircle;
  const isCompleted = activity.status === 'completed';
  const activityDate = parseISO(activity.time);

  const getStatusInfo = () => {
    if (isCompleted) {
        return { text: 'Completed', color: 'bg-green-100 text-green-800' };
    }
    if (isToday(activityDate)) {
        return { text: 'Today', color: 'bg-blue-100 text-blue-800' };
    }
    if (isPast(activityDate)) {
        return { text: 'Overdue', color: 'bg-red-100 text-red-800' };
    }
    return { text: 'Upcoming', color: 'bg-gray-100 text-gray-800' };
  };

  const statusInfo = getStatusInfo();
  
  return (
    <div className={cn("flex items-start gap-4 p-4 transition-colors border-l-4 rounded-r-md bg-card border", isCompleted ? 'border-primary' : 'border-transparent' )}>
      <div className="flex items-center h-full pt-1">
         <Checkbox 
            id={`task-${activity.id}`} 
            checked={isCompleted}
            onCheckedChange={(checked) => onToggle(activity.id, !!checked)}
            className="w-5 h-5"
          />
      </div>
      <div className="flex-1 grid gap-1">
        <div className="flex items-center justify-between">
           <label
            htmlFor={`task-${activity.id}`}
            className={cn("font-semibold flex items-center gap-2 cursor-pointer", isCompleted && "line-through text-muted-foreground")}
          >
            <Icon className="h-4 w-4" />
            {activity.title}
          </label>
           <Badge variant="outline" className={cn("text-xs", statusInfo.color)}>{statusInfo.text}</Badge>
        </div>
        <p className={cn("text-sm text-muted-foreground", isCompleted && "line-through")}>
            {activity.description}
        </p>
         <div className="flex items-center flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>{format(activityDate, 'p')}</span>
            </div>
            {activity.company && (
              <div className="flex items-center gap-1">
                 <Briefcase className="h-3 w-3" />
                 <span>{activity.company}</span>
              </div>
            )}
            <span className="ml-auto">{formatDistanceToNow(activityDate, { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  )
}

function AddActivityDialog({ open, onOpenChange, onAddActivity }: { open: boolean, onOpenChange: (open: boolean) => void, onAddActivity: (activity: Omit<Activity, 'id' | 'status' | 'companyId'>) => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('task');
    const [company, setCompany] = useState('');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState('');

    const handleSubmit = () => {
        if (!title || !time || !date) return;
        const [hour, minute] = time.split(':').map(Number);
        
        const activityDate = new Date(date);
        activityDate.setHours(hour, minute);

        onAddActivity({ title, description, type, company, time: formatISO(activityDate) });
        onOpenChange(false);
        // Reset form
        setTitle('');
        setDescription('');
        setType('task');
        setCompany('');
        setDate(new Date());
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
                                    <SelectItem value="deadline">Deadline</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                    variant={"outline"}
                                    className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !date && "text-muted-foreground"
                                    )}
                                    >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP") : <span>Pick a date</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="company">Company / Institution</Label>
                            <Input id="company" value={company} onChange={(e) => setCompany(e.target.value)} placeholder="e.g., Ministry of Health" />
                        </div>
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

      const newActivity: Omit<Activity, 'id'> = {
          ...newActivityData,
          status: 'pending',
          companyId: user.companyId,
      };
      await addDoc(collection(db, 'activities'), newActivity);
  };
  
  const handleToggleComplete = async (id: string, completed: boolean) => {
      const activityRef = doc(db, 'activities', id);
      const newStatus = completed ? 'completed' : 'pending';
      await updateDoc(activityRef, { status: newStatus });
  };
  
  const categorizedActivities = useMemo(() => {
    const today: Activity[] = [];
    const upcoming: Activity[] = [];
    const overdue: Activity[] = [];
    const completed: Activity[] = [];

    activities.forEach(activity => {
      if (activity.status === 'completed') {
        completed.push(activity);
        return;
      }
      
      const activityDate = parseISO(activity.time);
      if (isPast(activityDate) && !isToday(activityDate)) {
        overdue.push(activity);
      } else if (isToday(activityDate)) {
        today.push(activity);
      } else {
        upcoming.push(activity);
      }
    });

    return { 
        today: today.sort((a,b) => parseISO(a.time).getTime() - parseISO(b.time).getTime()),
        upcoming: upcoming.sort((a,b) => parseISO(a.time).getTime() - parseISO(b.time).getTime()),
        overdue: overdue.sort((a,b) => parseISO(a.time).getTime() - parseISO(b.time).getTime()),
        completed: completed.sort((a,b) => parseISO(b.time).getTime() - parseISO(a.time).getTime())
    };
  }, [activities]);

  const { today: todayActivities, upcoming: upcomingActivities, overdue: overdueActivities, completed: completedActivities } = categorizedActivities;

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
