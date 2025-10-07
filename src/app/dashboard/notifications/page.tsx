
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Bell,
  Wrench,
  PackageCheck,
  Info,
  PlusCircle,
  Send,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';


type Notification = {
  id: string;
  type: 'Verification' | 'Assignment' | 'System' | 'Message';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
  author?: string;
};

const initialNotifications: Notification[] = [
  {
    id: 'notif-1',
    type: 'Verification',
    title: 'Verification Required',
    description: 'Sojourner Truth has requested handover of "HEPA Filter" for WO-001.',
    timestamp: new Date().toISOString(),
    isRead: false,
    link: '/dashboard/work-orders/hQjZ5LIbZ1g9xS2nC7vA'
  },
  {
    id: 'notif-2',
    type: 'Assignment',
    title: 'New Work Order Assigned',
    description: 'You have been assigned to WO-003: Emergency repair on DxH 900.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
    isRead: false,
    link: '/dashboard/work-orders/some-other-id'
  },
  {
    id: 'notif-3',
    type: 'System',
    title: 'System Update',
    description: 'The spare parts inventory has been updated with new items.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
    isRead: true,
  },
  {
    id: 'notif-4',
    type: 'Verification',
    title: 'Return Verification Needed',
    description: 'Harriet Tubman has requested to return "Reagent Probe" to inventory from WO-002.',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 26 hours ago
    isRead: true,
    link: '/dashboard/work-orders/another-id'
  },
];


const typeIcons: Record<Notification['type'], React.ElementType> = {
  Verification: PackageCheck,
  Assignment: Wrench,
  System: Info,
  Message: Send,
};

function NotificationItem({ notification }: { notification: Notification }) {
    const Icon = typeIcons[notification.type];
    return (
        <div className="flex items-start gap-4 p-4 border-b last:border-b-0">
            <div className={`mt-1 h-2 w-2 rounded-full ${!notification.isRead ? 'bg-primary' : 'bg-transparent'}`} />
            <div className="flex-shrink-0">
                <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-grow grid gap-1">
                <p className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
                 <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground/80">{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</p>
                    {notification.author && <p className="text-xs text-muted-foreground/80">From: {notification.author}</p>}
                </div>
                {notification.link && (
                    <div className='mt-2'>
                        <Button size="sm" asChild>
                            <Link href={notification.link}>
                                {notification.type === 'Verification' ? 'Verify Now' : 'View Details'}
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function NotificationsPage() {
  const [isComposeOpen, setComposeOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messageRecipient, setMessageRecipient] = useState('all');
  const { toast } = useToast();

  const handleSendMessage = () => {
    if (!messageSubject || !messageBody) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please fill out both subject and message fields.'
        });
        return;
    }

    const newMessage: Notification = {
        id: `msg-${Date.now()}`,
        type: 'Message',
        title: messageSubject,
        description: messageBody,
        timestamp: new Date().toISOString(),
        isRead: false,
        author: 'Admin', // In a real app, this would be the current user's name
    };
    
    // Add the new message to the top of the list
    setNotifications([newMessage, ...notifications]);

    toast({
        title: 'Message Sent!',
        description: `Your message has been broadcast to ${messageRecipient === 'all' ? 'All Users' : 'All Engineers'}.`
    });
    
    // Reset form and close dialog
    setComposeOpen(false);
    setMessageSubject('');
    setMessageBody('');
    setMessageRecipient('all');
  }


  const unreadNotifications = notifications.filter(n => !n.isRead);

  return (
    <>
    <Dialog open={isComposeOpen} onOpenChange={setComposeOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Compose Message</DialogTitle>
                <DialogDescription>
                    Broadcast a message to users in the system.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="recipient">Recipient</Label>
                    <Select value={messageRecipient} onValueChange={setMessageRecipient}>
                        <SelectTrigger id="recipient">
                            <SelectValue placeholder="Select recipients" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Users</SelectItem>
                            <SelectItem value="engineers">All Engineers</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input id="subject" value={messageSubject} onChange={(e) => setMessageSubject(e.target.value)} placeholder="e.g., Scheduled Maintenance Downtime" />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea id="message" value={messageBody} onChange={(e) => setMessageBody(e.target.value)} placeholder="Write your message here..." />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setComposeOpen(false)}>Cancel</Button>
                <Button onClick={handleSendMessage}>Send Message</Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Inbox</h1>
        <div className="ml-auto">
            <Button onClick={() => setComposeOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Compose
            </Button>
        </div>
      </div>
      <Tabs defaultValue="unread">
        <TabsList>
            <TabsTrigger value="unread">Unread</TabsTrigger>
            <TabsTrigger value="all">All</TabsTrigger>
        </TabsList>
        <TabsContent value="unread">
            <Card>
                <CardHeader>
                    <CardTitle>Unread Notifications</CardTitle>
                    <CardDescription>
                        Important alerts and requests that need your attention.
                    </CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                    {unreadNotifications.length > 0 ? (
                        unreadNotifications.map(n => <NotificationItem key={n.id} notification={n} />)
                    ) : (
                        <div className="text-center py-20">
                            <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                            <p className="mt-4 text-sm font-medium">You're all caught up!</p>
                            <p className="text-sm text-muted-foreground">No new notifications.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </TabsContent>
         <TabsContent value="all">
            <Card>
                <CardHeader>
                    <CardTitle>All Notifications</CardTitle>
                    <CardDescription>
                       A complete history of all your notifications.
                    </CardDescription>
                </CardHeader>
                <CardContent className='p-0'>
                     {notifications.map(n => <NotificationItem key={n.id} notification={n} />)}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
