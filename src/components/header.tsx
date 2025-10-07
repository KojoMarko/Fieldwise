
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
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
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import Image from 'next/image';
import React, { useState } from 'react';

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

export function Header() {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const [isSheetOpen, setSheetOpen] = useState(false);

    if (!user) {
        return (
             <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
                <div className="ml-auto" />
             </header>
        )
    }

    const isAdmin = user.role === 'Admin';
    const isEngineer = user.role === 'Engineer';
    
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
          <nav className="grid gap-6 text-lg font-medium">
            <Link
              href="/dashboard"
              className="group flex h-20 w-20 shrink-0 items-center justify-center gap-2 rounded-full text-lg font-semibold text-primary-foreground"
               onClick={() => setSheetOpen(false)}
            >
              <Image src="/White Logo FW.png" width={80} height={80} alt="FieldWise Logo" className="transition-all group-hover:scale-110" />
              <span className="sr-only">FieldWise</span>
            </Link>
             <Link
              href="/dashboard"
              className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
               onClick={() => setSheetOpen(false)}
            >
              <Home className="h-5 w-5" />
              Dashboard
            </Link>
            <Link
              href="/dashboard/work-orders"
              className="flex items-center gap-4 px-2.5 text-foreground"
               onClick={() => setSheetOpen(false)}
            >
              <Wrench className="h-5 w-5" />
              Work Orders
            </Link>
            {(isAdmin || isEngineer) && (
                <>
                 <Link
                  href="/dashboard/ppm"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                   onClick={() => setSheetOpen(false)}
                >
                  <CalendarCheck className="h-5 w-5" />
                  PPM
                </Link>
                 <Link
                  href="/dashboard/spare-parts"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                   onClick={() => setSheetOpen(false)}
                >
                  <List className="h-5 w-5" />
                  Spare Parts
                </Link>
                 <Link
                  href="/dashboard/resources"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                   onClick={() => setSheetOpen(false)}
                >
                  <BookText className="h-5 w-5" />
                  Resource Center
                </Link>
                </>
            )}
            {isAdmin && (
                <>
                <Link
                  href="/dashboard/customers"
                  className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                   onClick={() => setSheetOpen(false)}
                >
                  <Building className="h-5 w-5" />
                  Customers
                </Link>
                <Link
                href="/dashboard/users"
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                 onClick={() => setSheetOpen(false)}
                >
                <Users className="h-5 w-5" />
                Users
                </Link>
                <Link
                href="/dashboard/assets"
                className="flex items-center gap-4 px-2.5 text-muted-foreground hover:text-foreground"
                 onClick={() => setSheetOpen(false)}
                >
                <Package className="h-5 w-5" />
                Assets
                </Link>
              </>
            )}
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
        />
      </div>
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
           {user.role === 'Engineer' && (
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
