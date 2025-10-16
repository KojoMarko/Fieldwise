'use client';

import {
  DollarSign,
  CheckCircle,
  Users,
  TrendingUp,
  Briefcase,
  ListTodo,
} from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { useAuth } from '@/hooks/use-auth';
import { Badge } from '@/components/ui/badge';
import { PerformanceChart } from './components/performance-chart';
import { SalesPipeline } from './components/sales-pipeline';
import { ActiveOpportunitiesTable } from './components/active-opportunities';
import { TodaysTasks } from './components/todays-tasks';

export default function SalesDashboardPage() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground">
            Here's what's happening with your sales today.
            </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Sales Portal
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Revenue"
          value="$124,580"
          description="+12.5% from last month"
          Icon={DollarSign}
        />
        <KpiCard
          title="Deals Closed"
          value="23"
          description="+8.3% from last month"
          Icon={CheckCircle}
        />
        <KpiCard
          title="Active Leads"
          value="156"
          description="-3.2% from last month"
          Icon={Users}
        />
        <KpiCard
          title="Target Progress"
          value="78%"
          description="+15.1% from last month"
          Icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <PerformanceChart />
        </div>
        <div>
            <SalesPipeline />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <ActiveOpportunitiesTable />
        </div>
        <div>
            <TodaysTasks />
        </div>
      </div>
    </div>
  );
}
