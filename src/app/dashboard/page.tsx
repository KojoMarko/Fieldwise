import {
  Wrench,
  CheckCircle,
  TrendingUp,
  Clock,
} from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import { WorkOrderStatusChart } from '@/components/work-order-status-chart';
import { RecentWorkOrders } from '@/components/recent-work-orders';
import { workOrders } from '@/lib/data';

export default function DashboardPage() {
  const openWorkOrders = workOrders.filter(
    (wo) =>
      wo.status === 'Scheduled' ||
      wo.status === 'In-Progress' ||
      wo.status === 'Draft'
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Open Work Orders"
          value={openWorkOrders.toString()}
          description="High priority jobs needing attention"
          Icon={Wrench}
        />
        <KpiCard
          title="Completed This Month"
          value="124"
          description="+15% from last month"
          Icon={CheckCircle}
        />
        <KpiCard
          title="SLA Compliance"
          value="92.8%"
          description="Meeting service level agreements"
          Icon={TrendingUp}
        />
        <KpiCard
          title="Avg. Resolution Time"
          value="4.2 hours"
          description="Down from 5.1 hours last month"
          Icon={Clock}
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <WorkOrderStatusChart />
        <RecentWorkOrders />
      </div>
    </div>
  );
}
