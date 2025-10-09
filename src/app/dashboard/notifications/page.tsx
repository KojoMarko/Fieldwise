
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
  Inbox,
  Wrench,
  PackageCheck,
  Info,
  PlusCircle,
  Send,
  LoaderCircle,
} from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/use-auth';
import type { Notification, UserRole } from '@/lib/types';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, query, where, addDoc, updateDoc, doc, orderBy } from 'firebase/firestore';


const typeIcons: Record<Notification['type'], React.ElementType> = {
  Verification: PackageCheck,
  Assignment: Wrench,
  System: Info,
  Message: Send,
};

function NotificationItem({ notification, onMarkAsRead }: { notification: Notification; onMarkAsRead: (id: string) => void; }) {
    const Icon = typeIcons[notification.type];
    return (
        <div className="flex items-start gap-4 p-4 border-b last:border-b-0 hover:bg-muted/50">
            <div className={`mt-1 h-2 w-2 rounded-full ${!notification.isRead ? 'bg-primary' : 'bg-transparent'}`} />
            <div className="flex-shrink-0">
                <Icon className="h-6 w-6 text-muted-foreground" />
            </div>
            <div className="flex-grow grid gap-1">
                <p className={`font-semibold ${!notification.isRead ? 'text-foreground' : 'text-muted-foreground'}`}>{notification.title}</p>
                <p className="text-sm text-muted-foreground">{notification.description}</p>
                 <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground/80">{formatDistanceToNow(parseISO(notification.timestamp), { addSuffix: true })}</p>
                    {notification.author && <p className="text-xs text-muted-foreground/80">From: {notification.author}</p>}
                </div>
                <div className='mt-2 flex gap-2'>
                    {notification.link && (
                        <Button size="sm" asChild>
                            <Link href={notification.link}>
                                {notification.type === 'Verification' ? 'Verify Now' : 'View Details'}
                            </Link>
                        </Button>
                    )}
                    {!notification.isRead && (
                         <Button size="sm" variant="outline" onClick={() => onMarkAsRead(notification.id)}>Mark as Read</Button>
                    )}
                </div>
            </div>
        </div>
    )
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [isComposeOpen, setComposeOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [messageSubject, setMessageSubject] = useState('');
  const [messageBody, setMessageBody] = useState('');
  const [messageRecipient, setMessageRecipient] = useState<'All' | 'Engineer'>('All');
  const { toast } = useToast();

  useEffect(() => {
      if (!user?.companyId) {
          setIsLoading(false);
          return;
      }
      setIsLoading(true);

      const notificationsQuery = query(
          collection(db, 'notifications'),
          where('companyId', '==', user.companyId)
      );
      
      const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
          const fetchedNotifications: Notification[] = [];
          snapshot.forEach(doc => {
              const data = doc.data();
              // Filtering on client side to show relevant notifications to user role
              if (!data.recipientRole || data.recipientRole === 'All' || data.recipientRole === user.role) {
                fetchedNotifications.push({ ...data, id: doc.id } as Notification);
              }
          });
          // Sort by timestamp descending on the client
          fetchedNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          setNotifications(fetchedNotifications);
          setIsLoading(false);
      });

      return () => unsubscribe();

  }, [user]);

  const handleSendMessage = async () => {
    if (!messageSubject || !messageBody || !user) {
        toast({
            variant: 'destructive',
            title: 'Missing Information',
            description: 'Please fill out all fields.'
        });
        return;
    }

    const newMessage: Omit<Notification, 'id'> = {
        type: 'Message',
        title: messageSubject,
        description: messageBody,
        timestamp: new Date().toISOString(),
        isRead: false, // will be false for others, but sender won't see it this way
        author: user.name,
        companyId: user.companyId,
        recipientRole: messageRecipient
    };

    try {
        await addDoc(collection(db, 'notifications'), newMessage);
        toast({
            title: 'Message Sent!',
            description: `Your message has been broadcast to ${messageRecipient === 'All' ? 'All Users' : 'All Engineers'}.`
        });
        setComposeOpen(false);
        setMessageSubject('');
        setMessageBody('');
        setMessageRecipient('All');
    } catch(error) {
        console.error("Failed to send notification:", error);
        toast({ variant: 'destructive', title: 'Send Failed', description: 'Could not send the message.' });
    }
  }
  
  const handleMarkAsRead = async (id: string) => {
      try {
          const notifRef = doc(db, 'notifications', id);
          await updateDoc(notifRef, { isRead: true });
          // The local state will update automatically due to the onSnapshot listener.
      } catch (error) {
          console.error("Failed to mark as read:", error);
          toast({ variant: 'destructive', title: 'Update Failed', description: 'Could not mark notification as read.'})
      }
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
                    <Select value={messageRecipient} onValueChange={(value) => setMessageRecipient(value as 'All' | 'Engineer')}>
                        <SelectTrigger id="recipient">
                            <SelectValue placeholder="Select recipients" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="All">All Users</SelectItem>
                            <SelectItem value="Engineer">All Engineers</SelectItem>
                             <SelectItem value="Admin">All Admins</SelectItem>
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
        {user?.role === 'Admin' && (
            <div className="ml-auto">
                <Button onClick={() => setComposeOpen(true)}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Compose
                </Button>
            </div>
        )}
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
                    {isLoading ? (
                         <div className="flex justify-center items-center py-20"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                    ) : unreadNotifications.length > 0 ? (
                        unreadNotifications.map(n => <NotificationItem key={n.id} notification={n} onMarkAsRead={handleMarkAsRead} />)
                    ) : (
                        <div className="text-center py-20">
                            <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
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
                    {isLoading ? (
                         <div className="flex justify-center items-center py-20"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                    ) : (
                        notifications.map(n => <NotificationItem key={n.id} notification={n} onMarkAsRead={handleMarkAsRead} />)
                    )}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
