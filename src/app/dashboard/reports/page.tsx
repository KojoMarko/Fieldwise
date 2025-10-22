
'use client';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Target,
  DollarSign,
  TrendingUp,
  Users,
  FileDown,
  TrendingDown,
  Clock,
  Speaker,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LabelList,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { ReportKpiCard } from './components/report-kpi-card';


const lineChartData = [
  { month: 'Jan', revenue: 41000, target: 50000 },
  { month: 'Feb', revenue: 49000, target: 51000 },
  { month: 'Mar', revenue: 51000, target: 52000 },
  { month: 'Apr', revenue: 44000, target: 53000 },
  { month: 'May', revenue: 52000, target: 54000 },
  { month: 'Jun', revenue: 62000, target: 58000 },
  { month: 'Jul', revenue: 55000, target: 60000 },
  { month: 'Aug', revenue: 68000, target: 62000 },
  { month: 'Sep', revenue: 73000, target: 65000 },
];

const barChartData = [
  { month: 'Jan', revenue: 42000 },
  { month: 'Feb', revenue: 48000 },
  { month: 'Mar', revenue: 52000 },
  { month: 'Apr', revenue: 45000 },
  { month: 'May', revenue: 54000 },
  { month: 'Jun', revenue: 58000 },
  { month: 'Jul', revenue: 61000 },
  { month: 'Aug', revenue: 56000 },
  { month: 'Sep', revenue: 67000 },
  { month: 'Oct', revenue: 72000 },
];

const leadSourceData = [
    { source: 'Website', value: 350, fill: 'var(--color-website)' },
    { source: 'Referral', value: 250, fill: 'var(--color-referral)' },
    { source: 'LinkedIn', value: 200, fill: 'var(--color-linkedin)' },
    { source: 'Cold Call', value: 100, fill: 'var(--color-coldcall)' },
    { source: 'Trade Show', value: 100, fill: 'var(--color-tradeshow)' },
];

const lineChartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
  target: {
    label: 'Target',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig;

const barChartConfig = {
  revenue: {
    label: 'Revenue',
    color: 'hsl(var(--chart-1))',
  },
} satisfies ChartConfig;


const leadSourceChartConfig = {
    website: { label: "Website", color: "hsl(var(--chart-1))" },
    referral: { label: "Referral", color: "hsl(var(--chart-2))" },
    linkedin: { label: "LinkedIn", color: "hsl(var(--chart-3))" },
    coldcall: { label: "Cold Call", color: "hsl(var(--chart-4))" },
    tradeshow: { label: "Trade Show", color: "hsl(var(--chart-5))" },
} satisfies ChartConfig;


export default function ReportsPage() {
  const totalLeads = leadSourceData.reduce((acc, curr) => acc + curr.value, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Reports &amp; Analytics</h1>
          <p className="text-muted-foreground">
            Track your sales performance and metrics
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Select defaultValue="30">
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Last 30 days" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">Last 30 days</SelectItem>
              <SelectItem value="90">Last 90 days</SelectItem>
              <SelectItem value="365">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <FileDown className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <ReportKpiCard title="Conversion Rate" value="24%" change="+12%" Icon={Target} changeType="increase" />
        <ReportKpiCard title="Avg Deal Size" value="$52,400" change="+8%" Icon={DollarSign} changeType="increase" />
        <ReportKpiCard title="Win Rate" value="68%" change="-3%" Icon={TrendingUp} changeType="decrease" />
        <ReportKpiCard title="Active Leads" value="156" change="+15%" Icon={Users} changeType="increase" />
      </div>

      <Tabs defaultValue="revenue">
        <TabsList>
          <TabsTrigger value="revenue">Revenue Analysis</TabsTrigger>
          <TabsTrigger value="leads">Lead Sources</TabsTrigger>
          <TabsTrigger value="deals">Deal Activity</TabsTrigger>
        </TabsList>
        <TabsContent value="revenue" className="mt-4">
           <div className="grid gap-6 md:grid-cols-2">
             <Card>
                <CardHeader>
                    <CardTitle>Revenue vs Target</CardTitle>
                    <CardDescription>Monthly revenue compared to targets</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={lineChartConfig} className="min-h-[200px] w-full">
                        <LineChart data={lineChartData} margin={{ left: 12, right: 12 }}>
                            <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                            <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `$${value/1000}k`}/>
                            <Tooltip content={<ChartTooltipContent />} />
                            <Legend content={<ChartLegendContent />} />
                            <Line dataKey="revenue" type="monotone" stroke="var(--color-revenue)" strokeWidth={2} dot={false} />
                            <Line dataKey="target" type="monotone" stroke="var(--color-target)" strokeWidth={2} strokeDasharray="3 3" dot={false} />
                        </LineChart>
                    </ChartContainer>
                </CardContent>
             </Card>
             <Card>
                <CardHeader>
                    <CardTitle>Monthly Growth</CardTitle>
                    <CardDescription>Revenue growth over time</CardDescription>
                </CardHeader>
                <CardContent>
                    <ChartContainer config={barChartConfig} className="min-h-[200px] w-full">
                       <BarChart data={barChartData} margin={{ left: 12, right: 12 }}>
                             <XAxis dataKey="month" tickLine={false} axisLine={false} fontSize={12} />
                            <YAxis tickLine={false} axisLine={false} fontSize={12} tickFormatter={(value) => `$${value/1000}k`}/>
                             <Tooltip content={<ChartTooltipContent />} />
                             <Bar dataKey="revenue" fill="var(--color-revenue)" radius={4} />
                       </BarChart>
                    </ChartContainer>
                </CardContent>
             </Card>
           </div>
        </TabsContent>
         <TabsContent value="leads" className="mt-4">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Lead Source Distribution</CardTitle>
                        <CardDescription>Where your leads are coming from</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <ChartContainer
                          config={leadSourceChartConfig}
                          className="mx-auto aspect-square h-[250px]"
                        >
                            <PieChart>
                                <ChartTooltipContent nameKey="value" hideLabel />
                                <Pie 
                                    data={leadSourceData} 
                                    dataKey="value" 
                                    nameKey="source" 
                                    labelLine={false} 
                                    label={({ cx, cy, midAngle, innerRadius, outerRadius, value, index }) => {
                                        const RADIAN = Math.PI / 180;
                                        const radius = 12 + outerRadius + (outerRadius - innerRadius) * 0.5;
                                        const x = cx + radius * Math.cos(-midAngle * RADIAN);
                                        const y = cy + radius * Math.sin(-midAngle * RADIAN);
                                        const percent = ((value / totalLeads) * 100).toFixed(0);

                                        return (
                                        <text
                                            x={x}
                                            y={y}
                                            fill="hsl(var(--foreground))"
                                            textAnchor={x > cx ? 'start' : 'end'}
                                            dominantBaseline="central"
                                            className="text-xs"
                                        >
                                            {leadSourceData[index].source} ({percent}%)
                                        </text>
                                        );
                                    }}
                                >
                                {leadSourceData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.fill} />
                                ))}
                                </Pie>
                            </PieChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Source Performance</CardTitle>
                        <CardDescription>Lead volume by source</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ChartContainer config={leadSourceChartConfig} className="min-h-[250px] w-full">
                             <BarChart
                                accessibilityLayer
                                data={leadSourceData}
                                layout="vertical"
                                margin={{
                                    left: 0,
                                }}
                                >
                                <YAxis
                                    dataKey="source"
                                    type="category"
                                    tickLine={false}
                                    tickMargin={10}
                                    axisLine={false}
                                    tickFormatter={(value) =>
                                        leadSourceChartConfig[value.toLowerCase() as keyof typeof leadSourceChartConfig]?.label || value
                                    }
                                />
                                <XAxis dataKey="value" type="number" hide />
                                <Tooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                                <Bar dataKey="value" layout="vertical" radius={4}>
                                     {leadSourceData.map((entry) => (
                                        <Cell key={`cell-${entry.source}`} fill={entry.fill} />
                                    ))}
                                    <LabelList
                                        position="insideRight"
                                        offset={8}
                                        className="fill-white"
                                        fontSize={12}
                                        dataKey="value"
                                        formatter={(value: number) => `${((value / totalLeads) * 100).toFixed(0)}%`}
                                    />
                                </Bar>
                            </BarChart>
                        </ChartContainer>
                    </CardContent>
                </Card>
            </div>
        </TabsContent>
         <TabsContent value="deals" className="mt-4">
            <Card>
                <CardHeader><CardTitle>Deal Activity</CardTitle></CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Recent deal activity will be displayed here.</p>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
