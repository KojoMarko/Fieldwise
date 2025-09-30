
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
  Map,
  Users,
  Settings,
  Package,
  List,
  Building,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from './ui/badge';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';

const adminNavItems = [
  { href: '/dashboard', icon: Home, label: 'Dashboard' },
  { href: '/dashboard/work-orders', icon: Wrench, label: 'Work Orders', badge: '1' },
  // { href: '/dashboard/map', icon: Map, label: 'Map' },
  { href: '/dashboard/customers', icon: Building, label: 'Customers' },
  { href: '/dashboard/users', icon: Users, label: 'Users' },
  { href: '/dashboard/assets', icon: Package, label: 'Assets' },
  { href: '/dashboard/spare-parts', icon: List, label: 'Spare Parts' },
];

const technicianNavItems = [
    { href: '/dashboard', icon: Home, label: 'My Dashboard' },
    { href: '/dashboard/work-orders', icon: Wrench, label: 'Work Orders' },
    { href: '/dashboard/spare-parts', icon: List, label: 'Spare Parts' },
]

const customerNavItems = [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/dashboard/work-orders', icon: Wrench, label: 'My Service History' },
]

export function AppSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  let navItems = adminNavItems;
  if (user?.role === 'Technician') {
    navItems = technicianNavItems;
  } else if (user?.role === 'Customer') {
      navItems = customerNavItems;
  }


  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-sidebar sm:flex">
      <TooltipProvider>
        <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
          <Link
            href="/dashboard"
            className="group flex h-16 w-16 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-14 md:w-14"
          >
            <Image src="/Field Wise Logo.png" width={40} height={40} alt="FieldWise Logo" className="h-10 w-10 transition-all group-hover:scale-110" />
            <span className="sr-only">FieldWise</span>
          </Link>
          {navItems.map((item) => (
            <Tooltip key={item.href}>
              <TooltipTrigger asChild>
                <Link
                  href={item.href}
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                    (pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href)))
                      ? 'bg-accent text-accent-foreground'
                      : ''
                  )}
                >
                  <item.icon className="h-5 w-5" />
                   {item.badge && (
                    <Badge className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-accent p-0 text-xs text-accent-foreground">
                      {item.badge}
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
                className={cn('flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8',
                  pathname.startsWith('/dashboard/settings') && 'bg-accent text-accent-foreground'
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
