
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
  Building,
  User as UserIcon,
  FileText,
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
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
import type { Activity, Company } from '@/lib/types';
import { formatISO, parseISO, isToday, isFuture, isPast, format, formatDistanceToNow, startOfWeek, startOfMonth, startOfToday, isAfter, isValid } from 'date-fns';
import { cn } from '@/lib/utils';
import { Popover, PopoverTrigger, PopoverContent } from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { generateActivityReport } from '@/ai/flows/generate-activity-report';
import jsPDF from 'jspdf';
import 'jspdf-autotable';


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
            {activity.department && (
              <div className="flex items-center gap-1">
                 <Building className="h-3 w-3" />
                 <span>{activity.department}</span>
              </div>
            )}
             {activity.contactPerson && (
              <div className="flex items-center gap-1">
                 <UserIcon className="h-3 w-3" />
                 <span>{activity.contactPerson}</span>
              </div>
            )}
            <span className="ml-auto">{formatDistanceToNow(activityDate, { addSuffix: true })}</span>
        </div>
      </div>
    </div>
  )
}

function AddActivityDialog({ open, onOpenChange, onAddActivity }: { open: boolean, onOpenChange: (open: boolean) => void, onAddActivity: (activity: Omit<Activity, 'id' | 'status' | 'companyId' | 'ownerId'>) => void }) {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [type, setType] = useState('meeting');
    const [date, setDate] = useState<Date | undefined>(new Date());
    const [time, setTime] = useState('');

    const [facilityName, setFacilityName] = useState('');
    const [location, setLocation] = useState('');
    const [department, setDepartment] = useState('');
    const [contactPerson, setContactPerson] = useState('');
    const [contactPersonNumber, setContactPersonNumber] = useState('');
    const [personMet, setPersonMet] = useState('');
    const [personMetProfession, setPersonMetProfession] = useState('');
    const [personMetNumber, setPersonMetNumber] = useState('');


    const handleSubmit = () => {
        if (!title || !time || !date) return;
        const [hour, minute] = time.split(':').map(Number);
        
        const activityDate = new Date(date);
        activityDate.setHours(hour, minute);
        
        let activityData: Omit<Activity, 'id' | 'status' | 'companyId' | 'ownerId'>;

        if (type === 'meeting') {
            activityData = {
                title,
                description: description,
                type,
                company: facilityName,
                time: formatISO(activityDate),
                location,
                department,
                contactPerson,
                contactPersonNumber,
                personMet,
                personMetProfession,
                personMetNumber
            };
        } else if (type === 'call' || type === 'email') {
            activityData = {
                title,
                description: description,
                type,
                company: facilityName,
                time: formatISO(activityDate),
                contactPerson,
                contactPersonNumber,
            };
        } else { // task or deadline
            activityData = {
                title,
                description: description,
                type,
                time: formatISO(activityDate),
                company: ''
            };
        }


        onAddActivity(activityData);
        onOpenChange(false);
        // Reset form
        setTitle('');
        setDescription('');
        setType('meeting');
        setFacilityName('');
        setDate(new Date());
        setTime('');
        setLocation('');
        setDepartment('');
        setContactPerson('');
        setContactPersonNumber('');
        setPersonMet('');
        setPersonMetProfession('');
        setPersonMetNumber('');
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add New Activity</DialogTitle>
                    <DialogDescription>Fill out the details for your new activity.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 max-h-[70vh] overflow-y-auto px-2">
                    <div className="space-y-2">
                        <Label htmlFor="title">Activity Title</Label>
                        <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., Follow up with Acme Corp" />
                    </div>
                   
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                         <div className="space-y-2">
                            <Label htmlFor="type">Type</Label>
                             <Select value={type} onValueChange={setType}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="meeting">Meeting</SelectItem>
                                    <SelectItem value="call">Call</SelectItem>
                                    <SelectItem value="email">Email</SelectItem>
                                    <SelectItem value="task">Task</SelectItem>
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
                        <div className="space-y-2">
                            <Label htmlFor="time">Time</Label>
                            <Input id="time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
                        </div>
                    </div>

                    {(type === 'task' || type === 'deadline') && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="task-description">Description</Label>
                                <Textarea id="task-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Add more details about this task or deadline..." />
                            </div>
                        </>
                    )}

                    {(type === 'call' || type === 'email') && (
                        <>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="facilityName">Facility/Company Name</Label>
                                <Input id="facilityName" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="e.g., Ministry of Health" />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactPerson">Contact Person</Label>
                                    <Input id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="e.g., Dr. Jane Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactPersonNumber">Contact Number</Label>
                                    <Input id="contactPersonNumber" value={contactPersonNumber} onChange={(e) => setContactPersonNumber(e.target.value)} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="discussion-summary">Summary</Label>
                                <Textarea id="discussion-summary" value={description} onChange={e => setDescription(e.target.value)} placeholder="Summarize the key points of the call or email..." />
                            </div>
                        </>
                    )}

                    {type === 'meeting' && (
                        <>
                            <Separator />
                            <h4 className="text-sm font-medium">Facility Details</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="facilityName">Facility Name</Label>
                                    <Input id="facilityName" value={facilityName} onChange={(e) => setFacilityName(e.target.value)} placeholder="e.g., Ministry of Health" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="location">Facility Location</Label>
                                    <Input id="location" value={location} onChange={(e) => setLocation(e.target.value)} placeholder="e.g., Accra" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="department">Department</Label>
                                    <Input id="department" value={department} onChange={(e) => setDepartment(e.target.value)} placeholder="e.g., Procurement" />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="contactPerson">Main Contact Person</Label>
                                    <Input id="contactPerson" value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="e.g., Dr. Jane Doe" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactPersonNumber">Main Contact's Number</Label>
                                    <Input id="contactPersonNumber" value={contactPersonNumber} onChange={(e) => setContactPersonNumber(e.target.value)} />
                                </div>
                            </div>
                            <Separator />
                            <h4 className="text-sm font-medium">Person Met Details (if different)</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="personMet">Person Met</Label>
                                    <Input id="personMet" value={personMet} onChange={(e) => setPersonMet(e.target.value)} placeholder="e.g., Mr. John Smith" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="personMetProfession">Profession</Label>
                                    <Input id="personMetProfession" value={personMetProfession} onChange={(e) => setPersonMetProfession(e.target.value)} placeholder="e.g., Lab Manager" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="personMetNumber">Person Met's Contact Number</Label>
                                <Input id="personMetNumber" value={personMetNumber} onChange={(e) => setPersonMetNumber(e.target.value)} />
                            </div>
                            <Separator />
                            <div className="space-y-2">
                                <Label htmlFor="discussion">Discussion Summary</Label>
                                <Textarea id="discussion" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Summarize the key points of the discussion..." />
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>Add Activity</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

function GenerateReportDialog({ open, onOpenChange, activities, user, company }: { open: boolean, onOpenChange: (open: boolean) => void, activities: Activity[], user: any, company: Company | null }) {
  const [period, setPeriod] = useState('this-week');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const { toast } = useToast();

  const handleGenerateReport = async () => {
    setIsLoading(true);
    toast({ title: 'Generating Report...', description: 'The AI is summarizing your activities. This may take a moment.' });

    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = startOfToday();
          break;
        case 'this-week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'this-month':
          startDate = startOfMonth(now);
          break;
        default:
          startDate = startOfWeek(now, { weekStartsOn: 1 });
      }

      const filteredActivities = activities.filter(a => isAfter(parseISO(a.time), startDate));

      if (filteredActivities.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Activities Found',
          description: 'There are no activities in the selected period to report on.',
        });
        setIsLoading(false);
        return;
      }
      
      const reportData = await generateActivityReport({
        activities: filteredActivities,
        userName: user.name,
        period: period.replace('-', ' '),
      });
      
      const doc = new jsPDF({ unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 40;
      let y = margin;

      // --- Header ---
      if (company?.logoUrl) {
          try {
              const img = new Image();
              img.crossOrigin = 'Anonymous';
              img.src = company.logoUrl;
              await new Promise<void>((resolve, reject) => {
                  img.onload = () => {
                      doc.addImage(img, 'PNG', margin, y, 40, 40);
                      resolve();
                  };
                  img.onerror = (e) => reject(e);
              });
          } catch (e) {
              console.error("Error adding company logo to PDF:", e);
          }
      }

      const companyName = company?.name || "FieldWise";
      const companyAddress = company?.address || "123 Main St, Anytown";

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(companyName, margin + 50, y + 12);
      doc.text(companyAddress.split('\n'), margin + 50, y + 24);

      const reportTitle = "Activity Report";
      const reportIdText = `For: ${user.name}`;
      const dateText = `Date: ${format(new Date(), 'MMMM do, yyyy')}`;
      
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(reportTitle, pageWidth - margin, y + 12, { align: 'right' });
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text(reportIdText, pageWidth - margin, y + 27, { align: 'right' });
      doc.text(dateText, pageWidth - margin, y + 42, { align: 'right' });

      y += 80;

      // --- Executive Summary ---
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Executive Summary', margin, y);
      y += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const summaryLines = doc.splitTextToSize(reportData.executiveSummary, pageWidth - margin * 2);
      doc.text(summaryLines, margin, y);
      y += summaryLines.length * 12 + 10;
      
      // --- KPIs ---
      (doc as any).autoTable({
        startY: y,
        theme: 'plain',
        body: [
          [
            { content: `Total Activities: ${reportData.kpi.totalActivities}`, styles: { fontStyle: 'bold' } },
            { content: `Meetings: ${reportData.kpi.meetings}`, styles: { fontStyle: 'bold' } },
            { content: `Communications: ${reportData.kpi.calls + reportData.kpi.emails}`, styles: { fontStyle: 'bold' } },
            { content: `Tasks Completed: ${reportData.kpi.tasksCompleted}`, styles: { fontStyle: 'bold' } },
          ]
        ],
        styles: { fontSize: 9 }
      });
      y = (doc as any).lastAutoTable.finalY + 15;
      
      // --- Sections ---
      for (const section of reportData.sections) {
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(section.title, margin, y);
        y += 15;

        doc.setFontSize(10);
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(150);
        const sectionSummaryLines = doc.splitTextToSize(section.summary, pageWidth - margin * 2);
        doc.text(sectionSummaryLines, margin, y);
        y += sectionSummaryLines.length * 12 + 5;
        doc.setTextColor(0);
        doc.setFont('helvetica', 'normal');

        if (section.items && section.items.length > 0) {
          (doc as any).autoTable({
            startY: y,
            head: [['Details']],
            body: section.items.map(item => [item]),
            theme: 'striped',
            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
            bodyStyles: { overflow: 'linebreak' }
          });
          y = (doc as any).lastAutoTable.finalY + 15;
        } else {
            y += 10;
        }
      }

      doc.save(`Activity_Report_${user.name.replace(' ', '_')}_${new Date().toISOString().split('T')[0]}.pdf`);

      toast({
        title: 'Report Generated',
        description: 'Your activity report PDF has been downloaded.',
      });
      onOpenChange(false);

    } catch (e) {
      console.error('Report generation failed', e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to generate the report.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendReport = async () => {
    setIsSending(true);
    toast({ title: 'Sending Report...', description: 'Your report is being sent to all administrators.' });

    try {
      const now = new Date();
      let startDate: Date;

      switch (period) {
        case 'today':
          startDate = startOfToday();
          break;
        case 'this-week':
          startDate = startOfWeek(now, { weekStartsOn: 1 });
          break;
        case 'this-month':
          startDate = startOfMonth(now);
          break;
        default:
          startDate = startOfWeek(now, { weekStartsOn: 1 });
      }

      const filteredActivities = activities.filter(a => isAfter(parseISO(a.time), startDate));

      if (filteredActivities.length === 0) {
        toast({
          variant: 'destructive',
          title: 'No Activities Found',
          description: 'There are no activities in the selected period to report on.',
        });
        setIsSending(false);
        return;
      }
      
      const reportData = await generateActivityReport({
        activities: filteredActivities,
        userName: user.name,
        period: period.replace('-', ' '),
      });
      
      if (user.companyId) {
          await addDoc(collection(db, 'notifications'), {
              type: 'System',
              title: `Activity Report from ${user.name}`,
              description: reportData.executiveSummary,
              timestamp: new Date().toISOString(),
              isRead: false,
              author: user.name,
              companyId: user.companyId,
              recipientRole: 'Admin',
          });
      }

      toast({
        title: 'Report Sent',
        description: 'Your activity report has been sent to all administrators.',
      });
      onOpenChange(false);

    } catch (e) {
      console.error('Report sending failed', e);
      toast({ variant: 'destructive', title: 'Error', description: 'Failed to send the report.' });
    } finally {
      setIsSending(false);
    }
  };


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Generate Activity Report</DialogTitle>
          <DialogDescription>Select a period to generate a report for your activities.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <RadioGroup value={period} onValueChange={setPeriod} className="space-y-2">
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="today" id="today" />
              <Label htmlFor="today">Today's Activities</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="this-week" id="this-week" />
              <Label htmlFor="this-week">This Week</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="this-month" id="this-month" />
              <Label htmlFor="this-month">This Month</Label>
            </div>
          </RadioGroup>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
           <Button onClick={handleSendReport} disabled={isLoading || isSending} variant="secondary">
            {isSending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isSending ? 'Sending...' : 'Send to Admins'}
          </Button>
          <Button onClick={handleGenerateReport} disabled={isLoading || isSending}>
            {isLoading && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Generating...' : 'Generate & Download PDF'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default function ActivitiesPage() {
  const { user } = useAuth();
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('today');
  const [isReportDialogOpen, setReportDialogOpen] = useState(false);
  const [company, setCompany] = useState<Company | null>(null);

  useEffect(() => {
    if (!user?.companyId || !user.id) {
        setIsLoading(false);
        return;
    }

    const companyRef = doc(db, 'companies', user.companyId);
    const unsubCompany = onSnapshot(companyRef, (docSnap) => {
        if (docSnap.exists()) {
            setCompany(docSnap.data() as Company);
        }
    });

    const activitiesQuery = query(
        collection(db, 'activities'), 
        where('companyId', '==', user.companyId),
        where('ownerId', '==', user.id)
    );
    const unsubscribe = onSnapshot(activitiesQuery, (snapshot) => {
        const activitiesData: Activity[] = [];
        snapshot.forEach(doc => activitiesData.push({ id: doc.id, ...doc.data() } as Activity));
        setActivities(activitiesData);
        setIsLoading(false);
    });
    return () => {
        unsubscribe();
        unsubCompany();
    };
  }, [user?.companyId, user?.id]);

  const handleAddActivity = async (newActivityData: Omit<Activity, 'id' | 'status' | 'companyId' | 'ownerId'>) => {
      if (!user?.companyId || !user.id) return;

      const activityPayload: Partial<Omit<Activity, 'id'>> = {
          ...newActivityData,
          status: 'pending',
          companyId: user.companyId,
          ownerId: user.id
      };

      // Clean up optional fields that are empty strings to avoid storing them in Firestore
      Object.keys(activityPayload).forEach(key => {
          const typedKey = key as keyof typeof activityPayload;
          if (activityPayload[typedKey] === '' || activityPayload[typedKey] === undefined) {
              delete (activityPayload as any)[typedKey];
          }
      });
      
      await addDoc(collection(db, 'activities'), activityPayload);
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
      if (!isValid(activityDate)) return;

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

  const TABS = [
    { value: 'today', label: 'Today' },
    { value: 'upcoming', label: 'Upcoming' },
    { value: 'overdue', label: 'Overdue' },
    { value: 'completed', label: 'Completed' },
  ];

  return (
    <>
      <AddActivityDialog open={isAddDialogOpen} onOpenChange={setAddDialogOpen} onAddActivity={handleAddActivity} />
      {user && <GenerateReportDialog open={isReportDialogOpen} onOpenChange={setReportDialogOpen} activities={activities} user={user} company={company} />}
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Activities</h1>
            <p className="text-muted-foreground">
              Manage your tasks, calls, meetings, and emails
            </p>
          </div>
          <div className="sm:ml-auto flex items-center gap-2">
             <Button variant="outline" onClick={() => setReportDialogOpen(true)}>
              <FileText className="mr-2 h-4 w-4" /> Generate Report
            </Button>
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
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <Card>
                <CardHeader>
                  <CardTitle>Activity Timeline</CardTitle>
                   <div className="sm:hidden pt-2">
                    <Select value={activeTab} onValueChange={setActiveTab}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                            {TABS.map((tab) => (
                                <SelectItem key={tab.value} value={tab.value}>
                                    {tab.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                  </div>
                  <TabsList className="hidden sm:grid w-full grid-cols-4 mt-2">
                     {TABS.map((tab) => (
                        <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>
                    ))}
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
