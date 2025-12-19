
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
  Map,
  FileText,
  Activity,
  Briefcase,
  TrendingUp,
  ClipboardList,
  ShoppingCart,
  PenSquare,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { ScrollArea } from './ui/scroll-area';

const adminNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/articles/new', icon: PenSquare, label: 'Write Article' },
  { href: '/dashboard/sales-ledger', icon: ClipboardList, label: 'Sales Ledger' },
  { href: '/dashboard/notifications', icon: Inbox, label: 'Inbox', isNotification: true },
  { href: '/dashboard/activities', icon: Activity, label: 'Activities' },
  { href: '/dashboard/work-orders', icon: Wrench, label: 'Work Orders' },
  { href: '/dashboard/ppm', icon: CalendarCheck, label: 'PPM' },
  { href: '/dashboard/map', icon: Map, label: 'Map'},
  { href: '/dashboard/customers', icon: Building, label: 'Customers' },
  { href: '/dashboard/users', icon: Users, label: 'Users' },
  { href: '/dashboard/assets', icon: Package, label: 'Assets' },
  { href: '/dashboard/spare-parts', icon: List, label: 'Spare Parts & Locations' },
  { href: '/dashboard/resources', icon: BookText, label: 'Resource Center' },
  { href: '/dashboard/audit-log', icon: History, label: 'Audit Log' },
  { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
];

const engineerNavItems = [
    { href: '/dashboard', icon: Home, label: 'My Dashboard' },
    { href: '/dashboard/articles/new', icon: PenSquare, label: 'Write Article' },
    { href: '/dashboard/notifications', icon: Inbox, label: 'Inbox', isNotification: true },
    { href: '/dashboard/work-orders', icon: Wrench, label: 'Work Orders' },
    { href: '/dashboard/customers', icon: Building, label: 'Customers' },
    { href: '/dashboard/ppm', icon: CalendarCheck, label: 'PPM' },
    { href: '/dashboard/map', icon: Map, label: 'Map'},
    { href: '/dashboard/assets', icon: Package, label: 'Assets' },
    { href: '/dashboard/spare-parts', icon: List, label: 'Spare Parts & Locations' },
    { href: '/dashboard/resources', icon: BookText, label: 'Resource Center' },
    { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
]

const salesRepNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/articles/new', icon: PenSquare, label: 'Write Article' },
    { href: '/dashboard/sales-ledger', icon: ClipboardList, label: 'Sales Ledger' },
    { href: '/dashboard/products', icon: ShoppingCart, label: 'Products' },
    { href: '/dashboard/activities', icon: Activity, label: 'Activities' },
    { href: '/dashboard/customers', icon: Building, label: 'Customers' },
    { href: '/dashboard/assets', icon: Package, label: 'Assets' },
    { href: '/dashboard/leads', icon: Users, label: 'Leads' },
    { href: '/dashboard/opportunities', icon: Briefcase, label: 'Opportunities' },
    { href: '/dashboard/reports', icon: FileText, label: 'Reports' },
    { href: '/dashboard/forecasts', icon: TrendingUp, label: 'Forecasts' },
];

const customerNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/work-orders', icon: Wrench, label: 'My Service History' },
    { href: '/dashboard/articles/new', icon: PenSquare, label: 'Write Article' },
]

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const db = useFirestore();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user?.companyId || !db) return;
    
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
  }, [user, db]);

  let navItems = adminNavItems;
  if (user?.role === 'Engineer') {
    navItems = engineerNavItems;
  } else if (user?.role === 'Sales Rep') {
    navItems = salesRepNavItems;
  } else if (user?.role === 'Customer') {
      navItems = customerNavItems;
  }


  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-sidebar sm:flex">
      <TooltipProvider>
        <div className="flex shrink-0 flex-col items-center gap-4 px-2 py-4">
            <Link
                href="/dashboard"
                className="group flex h-10 w-10 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary-foreground"
            >
                <Image src="/White Logo FW.png" width={40} height={40} alt="FieldWise Logo" className="transition-all group-hover:scale-110" />
                <span className="sr-only">FieldWise</span>
            </Link>
        </div>

        <ScrollArea className="flex-1 overflow-y-auto">
             <nav className="flex flex-col items-center gap-4 px-2 pb-4">
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
        </ScrollArea>

        <nav className="mt-auto flex shrink-0 flex-col items-center gap-4 border-t border-sidebar-border px-2 py-4">
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
