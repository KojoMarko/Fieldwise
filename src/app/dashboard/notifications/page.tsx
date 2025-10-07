
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
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

type Notification = {
  id: string;
  type: 'Verification' | 'Assignment' | 'System';
  title: string;
  description: string;
  timestamp: string;
  isRead: boolean;
  link?: string;
};

const mockNotifications: Notification[] = [
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
                <p className="text-xs text-muted-foreground/80">{formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}</p>
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
  const unreadNotifications = mockNotifications.filter(n => !n.isRead);
  const readNotifications = mockNotifications.filter(n => n.isRead);

  return (
    <>
      <div className="flex items-center mb-4">
        <h1 className="text-lg font-semibold md:text-2xl">Inbox</h1>
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
                     {mockNotifications.map(n => <NotificationItem key={n.id} notification={n} />)}
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </>
  );
}
