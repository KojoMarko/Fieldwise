
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
import SalesDashboardPage from './sales/page';
import { useEffect, useState } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import type { WorkOrder } from '@/lib/types';
import { isThisMonth, parseISO, differenceInHours } from 'date-fns';


export default function DashboardPage() {
    const { user, isLoading } = useAuth();
    const db = useFirestore();
    const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    useEffect(() => {
      if (!user?.companyId || !db || user.role === 'Customer' || user.role === 'Sales Rep') {
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

    }, [user, db])


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
    
    if (user?.role === 'Sales Rep') {
        return <SalesDashboardPage />
    }

  const openWorkOrders = workOrders.filter(
    (wo) =>
      ['Scheduled', 'In-Progress', 'On-Hold', 'Dispatched', 'On-Site', 'Draft'].includes(wo.status)
  ).length;

  const completedThisMonth = workOrders.filter(
    (wo) => wo.status === 'Completed' && wo.completedDate && isThisMonth(parseISO(wo.completedDate))
  ).length;
  
  const completedOrdersWithDates = workOrders.filter(
    (wo) => wo.status === 'Completed' && wo.completedDate && wo.createdAt
  );

  const totalResolutionTime = completedOrdersWithDates.reduce((acc, wo) => {
    const created = parseISO(wo.createdAt!);
    const completed = parseISO(wo.completedDate!);
    const duration = differenceInHours(completed, created);
    return acc + duration;
  }, 0);
  
  const avgResolutionTime = completedOrdersWithDates.length > 0 
    ? (totalResolutionTime / completedOrdersWithDates.length).toFixed(1)
    : '0.0';

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
          value={completedThisMonth.toString()}
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
          value={`${avgResolutionTime} hours`}
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
