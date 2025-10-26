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
  BarChart,
  Bar,
} from 'recharts';
import {
  ChartContainer,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig,
} from '@/components/ui/chart';
import { Target, DollarSign, TrendingUp, Briefcase, TrendingDown } from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';

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

const quarterlyChartConfig = {
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

const monthlyForecastData = [
  { month: 'Oct', committed: 72000, bestCase: 98000, quota: 80000 },
  { month: 'Nov', committed: 65000, bestCase: 90000, quota: 85000 },
  { month: 'Dec', committed: 58000, bestCase: 95000, quota: 92000 },
];

const monthlyChartConfig = {
  committed: {
    label: 'Committed',
    color: 'hsl(var(--chart-1))',
  },
  bestCase: {
    label: 'Best Case',
    color: 'hsl(var(--chart-2))',
  },
  quota: {
    label: 'Quota',
    color: 'hsl(var(--muted-foreground))',
  },
} satisfies ChartConfig;

const teamPerformanceData = [
    { name: 'Sales Rep', committed: 72000, quota: 80000, trend: 'up' },
    { name: 'Sarah Wilson', committed: 68000, quota: 75000, trend: 'up' },
    { name: 'Mike Johnson', committed: 55000, quota: 70000, trend: 'down' },
    { name: 'Emily Chen', committed: 82000, quota: 85000, trend: 'up' },
]


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
    <div className="w-full max-w-full overflow-hidden">
      <div className="space-y-4 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Sales Forecasts</h1>
            <p className="text-muted-foreground">
              Track and predict your sales performance
            </p>
          </div>
          <div className="text-left sm:text-right">
            <p className="text-sm text-muted-foreground">Current Period</p>
            <p className="font-medium">Q4 2025</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <KpiCard title="Quota" value="$80K" Icon={Target} description="" />
          <KpiCard title="Committed" value="$72K" Icon={DollarSign} description="90% of quota" />
          <KpiCard title="Best Case" value="$95K" Icon={TrendingUp} description="119% of quota" />
          <KpiCard title="Total Pipeline" value="$125K" Icon={Briefcase} description="" />
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
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center sm:text-left">
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
              <CardContent className="pr-6">
                  <ChartContainer
                      config={quarterlyChartConfig}
                      className="h-[300px] w-full"
                  >
                      <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                          data={quarterlyPerformanceData}
                          margin={{
                              top: 5,
                              right: 10,
                              left: 0,
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
                              value >= 1000 ? `$${value / 1000}K` : value.toString()
                          }
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
                      </ResponsiveContainer>
                  </ChartContainer>
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="monthly" className="mt-4">
              <Card>
                  <CardHeader>
                      <CardTitle>3-Month Forecast Outlook</CardTitle>
                      <CardDescription>Committed, best case, and pipeline projections</CardDescription>
                  </CardHeader>
                  <CardContent className="pr-6">
                      <ChartContainer config={monthlyChartConfig} className="h-[300px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={monthlyForecastData}  margin={{
                              top: 5,
                              right: 10,
                              left: 0,
                              bottom: 5,
                          }}>
                                  <XAxis
                                      dataKey="month"
                                      tickLine={false}
                                      axisLine={false}
                                      tickMargin={10}
                                  />
                                  <YAxis
                                      tickLine={false}
                                      axisLine={false}
                                      tickMargin={10}
                                      tickFormatter={(value) => value.toLocaleString()}
                                  />
                                  <Tooltip content={<ChartTooltipContent />} />
                                  <Legend content={<ChartLegendContent />} />
                                  <Bar dataKey="committed" fill="var(--color-committed)" radius={4} />
                                  <Bar dataKey="bestCase" fill="var(--color-bestCase)" radius={4} />
                                  <Bar dataKey="quota" fill="var(--color-quota)" radius={4} />
                              </BarChart>
                          </ResponsiveContainer>
                      </ChartContainer>
                  </CardContent>
              </Card>
          </TabsContent>
          <TabsContent value="team" className="mt-4">
              <Card>
                  <CardHeader>
                      <CardTitle>Team Forecast Summary</CardTitle>
                      <CardDescription>Current month forecast by team member</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-8">
                      {teamPerformanceData.map((member) => {
                          const percentage = (member.committed / member.quota) * 100;
                          const TrendIcon = member.trend === 'up' ? TrendingUp : TrendingDown;
                          const trendColor = member.trend === 'up' ? 'text-green-500' : 'text-red-500';

                          return (
                              <div key={member.name} className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-x-8 gap-y-2">
                                  <div className="flex items-center gap-2">
                                      <span className="font-medium">{member.name}</span>
                                      <TrendIcon className={`h-4 w-4 ${trendColor}`} />
                                  </div>
                                  <div className="text-left md:text-right">
                                      <span className="font-semibold">${(member.committed / 1000).toFixed(0)}K</span>
                                      <span className="text-sm text-muted-foreground"> / ${(member.quota / 1000).toFixed(0)}K</span>
                                      <p className="text-xs text-muted-foreground">{percentage.toFixed(0)}% to quota</p>
                                  </div>
                                  <div className="md:col-span-2">
                                      <Progress value={percentage} className="h-2" />
                                  </div>
                              </div>
                          )
                      })}
                  </CardContent>
              </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
