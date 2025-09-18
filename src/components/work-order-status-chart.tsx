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

const chartConfig = {
  total: {
    label: 'Total',
    color: 'hsl(var(--primary))',
  },
} satisfies ChartConfig;

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
      </CardContent>
    </Card>
  );
}
