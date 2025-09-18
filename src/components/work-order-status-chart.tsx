'use client';

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { ChartTooltipContent } from '@/components/ui/chart';
import { workOrders } from '@/lib/data';
import type { WorkOrderStatus } from '@/lib/types';

const statusOrder: WorkOrderStatus[] = [
  'Draft',
  'Scheduled',
  'In-Progress',
  'Completed',
  'Invoiced',
  'Cancelled',
];

export function WorkOrderStatusChart() {
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
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
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
              fill="hsl(var(--primary))"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
