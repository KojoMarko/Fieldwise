
'use client';

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  ChartContainer,
  ChartTooltipContent,
  type ChartConfig,
} from '@/components/ui/chart';
import type { WorkOrder, WorkOrderStatus } from '@/lib/types';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { LoaderCircle } from 'lucide-react';

const statusOrder: WorkOrderStatus[] = [
  'Draft',
  'Scheduled',
  'In-Progress',
  'On-Hold',
  'Completed',
  'Invoiced',
  'Cancelled',
];

const chartConfig = {
  total: {
    label: 'Total',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

export function WorkOrderStatusChart() {
  const { user } = useAuth();
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
        setIsLoading(false);
        return;
    };
    setIsLoading(true);
    const q = query(collection(db, 'work-orders'), where('companyId', '==', user.companyId));
    const unsubscribe = onSnapshot(q, (snapshot) => {
        const orders: WorkOrder[] = [];
        snapshot.forEach(doc => orders.push({...doc.data(), id: doc.id} as WorkOrder));
        setWorkOrders(orders);
        setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const data = statusOrder.map((status) => ({
    name: status,
    total: workOrders.filter((wo) => wo.status === status).length,
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Work Orders by Status</CardTitle>
        <CardDescription>
          An overview of current work order distribution.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
            <div className="flex items-center justify-center min-h-[300px]">
                <LoaderCircle className="h-8 w-8 animate-spin text-primary" />
            </div>
        ) : (
            <ChartContainer config={chartConfig} className="min-h-[200px] w-full">
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data} accessibilityLayer>
                <XAxis
                    dataKey="name"
                    stroke="hsl(var(--foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="hsl(var(--foreground))"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    content={<ChartTooltipContent />}
                />
                <Bar
                    dataKey="total"
                    fill="var(--color-total)"
                    radius={[4, 4, 0, 0]}
                />
                </BarChart>
            </ResponsiveContainer>
            </ChartContainer>
        )}
      </CardContent>
    </Card>
  );
}
