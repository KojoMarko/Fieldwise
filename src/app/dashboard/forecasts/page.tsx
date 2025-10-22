
'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Line,
  LineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Dot,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Target, DollarSign, TrendingUp, Briefcase } from 'lucide-react';

const kpiData = [
  { title: 'Quota', value: '$80K', Icon: Target, description: '' },
  {
    title: 'Committed',
    value: '$72K',
    Icon: DollarSign,
    description: '90% of quota',
  },
  {
    title: 'Best Case',
    value: '$95K',
    Icon: TrendingUp,
    description: '119% of quota',
  },
  {
    title: 'Total Pipeline',
    value: '$125K',
    Icon: Briefcase,
    description: '',
  },
];

const quarterlyPerformanceData = [
  {
    quarter: 'Q1 2025',
    actual: 200000,
    forecast: 190000,
    quota: 210000,
  },
  {
    quarter: 'Q2 2025',
    actual: 220000,
    forecast: 215000,
    quota: 225000,
  },
  {
    quarter: 'Q3 2025',
    actual: 250000,
    forecast: 240000,
    quota: 245000,
  },
  {
    quarter: 'Q4 2025',
    actual: 180000,
    forecast: 270000,
    quota: 280000,
  },
];

const chartConfig = {
  actual: {
    label: 'Actual',
    color: 'hsl(var(--chart-1))',
  },
  forecast: {
    label: 'Forecast',
    color: 'hsl(var(--chart-2))',
  },
  quota: {
    label: 'Quota',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig;

const CustomDot = (props: any) => {
  const { cx, cy, stroke, payload, value, dataKey } = props;

  // Only render dot for the last data point of 'actual'
  if (dataKey === 'actual' && payload.quarter === 'Q4 2025') {
    return <Dot cx={cx} cy={cy} r={4} fill={stroke} stroke={stroke} />;
  }
  // Render dots for specific points if needed, otherwise return null
  if (dataKey !== 'quota' && value > 0) {
      if (quarterlyPerformanceData.findIndex(d => d.quarter === payload.quarter) < quarterlyPerformanceData.length -1 ) {
        return <Dot cx={cx} cy={cy} r={3} fill={stroke} strokeWidth={1} />;
      }
  }


  return null;
};


export default function ForecastsPage() {
  const committedPercentage = (72 / 80) * 100;
  const bestCasePercentage = (95 / 80) * 100;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Forecasts</h1>
          <p className="text-muted-foreground">
            Track and predict your sales performance
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm text-muted-foreground">Current Period</p>
          <p className="font-medium">Q4 2025</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpiData.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{kpi.value}</div>
              <p className="text-xs text-muted-foreground">{kpi.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>October 2025 Forecast</CardTitle>
          <CardDescription>Your progress towards monthly quota</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-medium">Committed (High Confidence)</span>
                <span className="text-muted-foreground">$72K / $80K</span>
              </div>
              <Progress value={committedPercentage} />
            </div>
            <div>
              <div className="flex justify-between items-center mb-1 text-sm">
                <span className="font-medium">Best Case Scenario</span>
                <span className="text-muted-foreground">$95K / $80K</span>
              </div>
              <Progress value={bestCasePercentage} indicatorClassName="bg-primary/70"/>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 text-center sm:text-left">
            <div>
              <p className="text-sm text-muted-foreground">Gap to Quota</p>
              <p className="text-xl font-bold">$8K</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Forecast Confidence</p>
              <div className="text-xl font-bold flex items-center justify-center sm:justify-start gap-2">
                High <Badge>90%</Badge>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Days Remaining</p>
              <p className="text-xl font-bold">15</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="quarterly">
        <TabsList>
          <TabsTrigger value="quarterly">Quarterly Trend</TabsTrigger>
          <TabsTrigger value="monthly">Monthly Forecast</TabsTrigger>
          <TabsTrigger value="team">Team Performance</TabsTrigger>
        </TabsList>
        <TabsContent value="quarterly" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Quarterly Performance vs Forecast</CardTitle>
              <CardDescription>
                Actual performance compared to forecasts and quotas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={chartConfig}
                className="min-h-[300px] w-full"
              >
                <LineChart
                  data={quarterlyPerformanceData}
                  margin={{
                    top: 5,
                    right: 20,
                    left: 20,
                    bottom: 5,
                  }}
                >
                  <XAxis
                    dataKey="quarter"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                  />
                  <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) =>
                      value >= 1000 ? `${value / 1000}` : value.toString()
                    }
                    domain={[70000, 280000]}
                    ticks={[70000, 140000, 210000, 280000]}
                  />
                  <Tooltip
                    content={
                      <ChartTooltipContent
                        formatter={(value) => value.toLocaleString()}
                      />
                    }
                  />
                  <Legend content={<ChartLegendContent />} />
                  <Line
                    type="monotone"
                    dataKey="actual"
                    stroke="var(--color-actual)"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                     dot={<CustomDot />}
                  />
                  <Line
                    type="monotone"
                    dataKey="forecast"
                    stroke="var(--color-forecast)"
                    strokeWidth={2}
                    activeDot={{ r: 6 }}
                     dot={<CustomDot />}
                  />
                  <Line
                    type="monotone"
                    dataKey="quota"
                    stroke="var(--color-quota)"
                    strokeWidth={2}
                    strokeDasharray="3 3"
                    dot={false}
                  />
                </LineChart>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="monthly">
            <Card>
                <CardHeader>
                    <CardTitle>Monthly Forecast</CardTitle>
                    <CardDescription>This section is under construction.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-10">
                    Monthly forecast data will be displayed here.
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="team">
            <Card>
                <CardHeader>
                    <CardTitle>Team Performance</CardTitle>
                    <CardDescription>This section is under construction.</CardDescription>
                </CardHeader>
                <CardContent className="text-center text-muted-foreground py-10">
                    Team performance metrics will be displayed here.
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
