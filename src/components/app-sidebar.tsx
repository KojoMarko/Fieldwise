
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Home,
  Wrench,
  CalendarCheck,
  Users,
  Settings,
  Package,
  List,
  Building,
  BookText,
  History,
  Inbox,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';

const adminNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/notifications', icon: Inbox, label: 'Inbox', isNotification: true },
  { href: '/dashboard/work-orders', icon: Wrench, label: 'Work Orders' },
  { href: '/dashboard/ppm', icon: CalendarCheck, label: 'PPM' },
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
    { href: '/dashboard/assets', icon: Package, label: 'Assets' },
    { href: '/dashboard/spare-parts', icon: List, label: 'Spare Parts' },
    { href: '/dashboard/resources', icon: BookText, label: 'Resource Center' },
]

const customerNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/work-orders', icon: Wrench, label: 'My Service History' },
]

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.companyId) return;
    
    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('companyId', '==', user.companyId),
      where('isRead', '==', false)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
        let count = 0;
        snapshot.forEach(doc => {
            const data = doc.data();
            if (!data.recipientRole || data.recipientRole === 'All' || data.recipientRole === user.role) {
                count++;
            }
        });
        setUnreadCount(count);
    });

    return () => unsubscribe();
  }, [user]);

  let navItems = adminNavItems;
  if (user?.role === 'Engineer') {
    navItems = engineerNavItems;
  } else if (user?.role === 'Customer') {
      navItems = customerNavItems;
  }


  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-sidebar sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/dashboard"
            className="group flex h-20 w-20 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary-foreground"
          >
            <Image src="/White Logo FW.png" width={80} height={80} alt="FieldWise Logo" className="transition-all group-hover:scale-110" />
            <span className="sr-only">FieldWise</span>
          </Link>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:h-8 md:w-8',
                    (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                      : ''
                  )}
                >
                  <item.icon className="h-5 w-5" />
                   {item.isNotification && unreadCount > 0 && (
                    <Badge className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-destructive p-0 text-xs text-destructive-foreground">
                      {unreadCount}
                    </Badge>
                  )}
                  <span className="sr-only">{item.label}</span>
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right">{item.label}</TooltipContent>
            </Tooltip>
          ))}
        </nav>
        <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
          <Tooltip>
            <TooltipTrigger asChild>
              <Link
                href="/dashboard/settings"
                className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground md:h-8 md:w-8',
                  pathname.startsWith('/dashboard/settings') && 'bg-sidebar-primary text-sidebar-primary-foreground'
                )}
              >
                <Settings className="h-5 w-5" />
                <span className="sr-only">Settings</span>
              </Link>
            </TooltipTrigger>
            <TooltipContent side="right">Settings</TooltipContent>
          </Tooltip>
        </nav>
      </TooltipProvider>
    </aside>
  );
}
