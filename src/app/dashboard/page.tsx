
'use client';
import {
  Wrench,
  CheckCircle,
  TrendingUp,
  Clock,
  LoaderCircle,
} from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import { WorkOrderStatusChart } from '@/components/work-order-status-chart';
import { RecentWorkOrders } from '@/components/recent-work-orders';
import { useAuth } from '@/hooks/use-auth';
import TechnicianDashboardPage from './technician/page';
import CustomerDashboardPage from './customer/page';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { WorkOrder } from '@/lib/types';


export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
      if (!user?.companyId || user.role !== 'Admin') {
        setIsDataLoading(false);
        return;
      };
      
      const fetchWorkOrders = async () => {
        setIsDataLoading(true);
        const q = query(collection(db, 'work-orders'), where('companyId', '==', user.companyId));
        const snapshot = await getDocs(q);
        const orders = snapshot.docs.map(doc => ({...doc.data(), id: doc.id} as WorkOrder));
        setWorkOrders(orders);
        setIsDataLoading(false);
      }
      fetchWorkOrders();

    }, [user])


    if (isLoading || isDataLoading) {
      return (
        <div className="flex h-[80vh] w-full items-center justify-center">
            <LoaderCircle className="h-10 w-10 animate-spin" />
        </div>
      )
    }

    if (user?.role === 'Engineer') {
        return <TechnicianDashboardPage />
    }
    
    if (user?.role === 'Customer') {
        return <CustomerDashboardPage />
    }

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
