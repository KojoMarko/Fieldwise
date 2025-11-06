
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Search,
  PanelLeft,
  Home,
  Wrench,
  Users,
  Settings,
  LogOut,
  User as UserIcon,
  Package,
  LayoutDashboard,
  List,
  Building,
  CalendarCheck,
  BookText,
  History,
  Inbox,
  Bell,
  Check,
  Map,
  FileText,
  Activity,
  Briefcase,
  TrendingUp,
  ClipboardList,
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import React, { useState, useEffect } from 'react';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { collection, onSnapshot, query, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Notification } from '@/lib/types';

function capitalize(s: string) {
  if (!s) return '';
  return s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, ' ');
}

function generateBreadcrumbs(pathname: string) {
    const pathSegments = pathname.split('/').filter(segment => segment);

    // If we are at the root of the dashboard, only show 'Dashboard'
    if (pathSegments.length <= 1) {
        return (
            <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
            </BreadcrumbItem>
        );
    }
    
    // Always start with a link to the dashboard
    const breadcrumbs = [
        <BreadcrumbItem key="dashboard">
            <BreadcrumbLink asChild>
              <Link href="/dashboard">Dashboard</Link>
            </BreadcrumbLink>
        </BreadcrumbItem>
    ];

    let currentPath = '/dashboard';
    pathSegments.slice(1).forEach((segment, index) => {
        currentPath += `/${segment}`;
        const isLast = index === pathSegments.length - 2;
        const segmentName = capitalize(segment);
        
        breadcrumbs.push(<BreadcrumbSeparator key={`sep-${index}`} />);

        if (isLast) {
             // The last segment is the current page, so it's not a link
             breadcrumbs.push(
                <BreadcrumbItem key={segment}>
                    <BreadcrumbPage>{segmentName}</BreadcrumbPage>
                </BreadcrumbItem>
            );
        } else {
            // Intermediate segments are links
             breadcrumbs.push(
                <BreadcrumbItem key={segment}>
                    <BreadcrumbLink asChild>
                    <Link href={currentPath}>{segmentName}</Link>
                    </BreadcrumbLink>
                </BreadcrumbItem>
            );
        }
    });

    return breadcrumbs;
}

const adminNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/sales-ledger', icon: ClipboardList, label: 'Sales Ledger' },
  { href: '/dashboard/notifications', icon: Inbox, label: 'Inbox', isNotification: true },
  { href: '/dashboard/work-orders', icon: Wrench, label: 'Work Orders' },
  { href: '/dashboard/ppm', icon: CalendarCheck, label: 'PPM' },
  { href: '/dashboard/map', icon: Map, label: 'Map'},
  { href: '/dashboard/customers', icon: Building, label: 'Customers' },
  { href: '/dashboard/users', icon: Users, label: 'Users' },
  { href: '/dashboard/assets', icon: Package, label: 'Assets' },
  { href: '/dashboard/spare-parts', icon: List, label: 'Spare Parts' },
  { href: '/dashboard/resources', icon: BookText, label: 'Resource Center' },
  { href: '/dashboard/audit-log', icon: History, label: 'Audit Log' },
];

const engineerNavItems = [
    { href: '/dashboard', icon: Home, label: 'My Dashboard' },
    { href: '/dashboard/notifications', icon: Inbox, label: 'Inbox', isNotification: true },
    { href: '/dashboard/work-orders', icon: Wrench, label: 'Work Orders' },
    { href: '/dashboard/ppm', icon: CalendarCheck, label: 'PPM' },
    { href: '/dashboard/map', icon: Map, label: 'Map'},
    { href: '/dashboard/assets', icon: Package, label: 'Assets' },
    { href: '/dashboard/spare-parts', icon: List, label: 'Spare Parts' },
    { href: '/dashboard/resources', icon: BookText, label: 'Resource Center' },
]

const salesRepNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/sales-ledger', icon: ClipboardList, label: 'Sales Ledger' },
    { href: '/dashboard/leads', icon: Users, label: 'Leads' },
    { href: '/dashboard/opportunities', icon: Briefcase, label: 'Opportunities' },
    { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
    { href: '/dashboard/activities', icon: Activity, label: 'Activities' },
    { href: '/dashboard/documents', icon: BookText, label: 'Documents' },
    { href: '/dashboard/forecasts', icon: TrendingUp, label: 'Forecasts' },
];

const customerNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/work-orders', icon: Wrench, label: 'My Service History' },
]

export function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [isSheetOpen, setSheetOpen] = useState(false);
    const [unreadNotifications, setUnreadNotifications] = useState<Notification[]>([]);
    const [searchQuery, setSearchQuery] = useState('');

    let navItems = adminNavItems;
    if (user?.role === 'Engineer') {
      navItems = engineerNavItems;
    } else if (user?.role === 'Sales Rep') {
      navItems = salesRepNavItems;
    } else if (user?.role === 'Customer') {
        navItems = customerNavItems;
    }


    const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && searchQuery.trim()) {
            router.push(`/dashboard/search?q=${encodeURIComponent(searchQuery.trim())}`);
        }
    }

    useEffect(() => {
        if (!user?.companyId) return;

        const notificationsQuery = query(
            collection(db, 'notifications'),
            where('companyId', '==', user.companyId),
            where('isRead', '==', false)
        );

        const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
            const fetchedNotifications: Notification[] = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                 if (!data.recipientRole || data.recipientRole === 'All' || data.recipientRole === user.role) {
                    fetchedNotifications.push({ ...data, id: doc.id } as Notification);
                }
            });
            fetchedNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
            setUnreadNotifications(fetchedNotifications);
        });

        return () => unsubscribe();
    }, [user]);

    const handleMarkAsRead = async (notificationId: string, link?: string) => {
        const notifRef = doc(db, 'notifications', notificationId);
        await updateDoc(notifRef, { isRead: true });
        if (link) {
            router.push(link);
        }
    }


    if (!user) {
        return (
             <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <div className="ml-auto" />
             </header>
        )
    }
    
    const breadcrumbs = generateBreadcrumbs(pathname);


  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Sheet open={isSheetOpen} onOpenChange={setSheetOpen}>
        <SheetTrigger asChild>
          <Button size="icon" variant="outline" className="sm:hidden">
            <PanelLeft className="h-5 w-5" />
            <span className="sr-only">Toggle Menu</span>
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="sm:max-w-xs">
          <SheetHeader>
            <SheetTitle className="sr-only">Navigation Menu</SheetTitle>
          </SheetHeader>
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex items-center gap-4 px-2.5 text-foreground"
              onClick={() => setSheetOpen(false)}
            >
              <Image src="/Field Wise Logo.png" width={40} height={40} alt="FieldWise Logo" />
              <span className="font-semibold text-xl">FieldWise</span>
            </Link>
             {navItems.map(item => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                  onClick={() => setSheetOpen(false)}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
             ))}
            <Link
              href="/dashboard/settings"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
               onClick={() => setSheetOpen(false)}
            >
              <Settings className="h-5 w-5" />
              Settings
            </Link>
          </nav>
        </SheetContent>
      </Sheet>
      <Breadcrumb className="hidden md:flex">
        <BreadcrumbList>
          {breadcrumbs}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="relative ml-auto flex-1 md:grow-0">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search..."
          className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyDown={handleSearch}
        />
      </div>
       <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" className="relative rounded-full">
            <Bell className="h-5 w-5" />
            {unreadNotifications.length > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-destructive p-0 text-xs text-destructive-foreground">
                    {unreadNotifications.length}
                </Badge>
            )}
            <span className="sr-only">Notifications</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-80">
          <DropdownMenuLabel>Notifications</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {unreadNotifications.length > 0 ? (
            unreadNotifications.slice(0,3).map((n, index) => (
              <React.Fragment key={n.id}>
                <DropdownMenuItem className="p-0" onSelect={(e) => e.preventDefault()}>
                  <div className="p-2 grid gap-1 w-full" onClick={() => handleMarkAsRead(n.id, n.link)}>
                    <p className="font-semibold text-primary">{n.title}</p>
                    <p className="text-sm text-muted-foreground">{n.description}</p>
                     {n.link && (
                        <Button variant="secondary" size="sm" className="mt-1 h-7 w-fit">
                            {n.type === 'Verification' ? 'Verify Now' : 'View Details'}
                        </Button>
                    )}
                  </div>
                </DropdownMenuItem>
                {index < unreadNotifications.slice(0,3).length - 1 && <DropdownMenuSeparator />}
              </React.Fragment>
            ))
          ) : (
            <DropdownMenuItem disabled>
                <div className='p-2 text-center text-sm text-muted-foreground w-full'>
                    <Inbox className="mx-auto h-8 w-8 mb-2" />
                    No new notifications
                </div>
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-primary font-medium p-0">
                <Link href="/dashboard/notifications" className='py-1.5 w-full'>View all notifications</Link>
            </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="overflow-hidden rounded-full"
          >
            <Avatar>
              <AvatarImage
                src={user.avatarUrl}
                alt={user.name}
                data-ai-hint="person face"
              />
              <AvatarFallback>
                {user.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>My Account</DropdownMenuLabel>
          <DropdownMenuSeparator />
           {(user.role === 'Engineer' || user.role === 'Sales Rep') && (
             <DropdownMenuItem asChild>
                <Link href="/dashboard">
                  <LayoutDashboard className="mr-2 h-4 w-4" />
                  <span>My Dashboard</span>
                </Link>
              </DropdownMenuItem>
           )}
          <DropdownMenuItem asChild>
            <Link href="/dashboard/profile">
              <UserIcon className="mr-2 h-4 w-4" />
              <span>Profile</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-2 h-4 w-4" />
              <span>Settings</span>
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={logout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Logout</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
