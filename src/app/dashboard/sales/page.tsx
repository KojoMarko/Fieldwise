
'use client';

import {
  Building,
  DollarSign,
  TrendingUp,
  FileText,
  LoaderCircle,
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

export default function SalesDashboardPage() {
    const { user } = useAuth();
    
    if (!user) return null;
    
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome, {user.name.split(' ')[0]}
        </h1>
        <Badge variant="outline" className="text-sm">Sales Rep Portal</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="New Customers This Month"
          value="12"
          description="+8% from last month"
          Icon={Building}
        />
        <KpiCard
          title="Sales Revenue"
          value="$125,430"
          description="+20.1% from last month"
          Icon={DollarSign}
        />
        <KpiCard
          title="Conversion Rate"
          value="24.5%"
          description="Meeting quarterly targets"
          Icon={TrendingUp}
        />
         <KpiCard
          title="Active Quotes"
          value="28"
          description="Awaiting customer approval"
          Icon={FileText}
        />
      </div>

      <Card>
          <CardHeader>
            <CardTitle>Sales Dashboard</CardTitle>
            <CardDescription>
              This is a placeholder for the sales representative's dashboard. More specific widgets and data can be added here.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-center py-10">
                <p className="text-sm text-muted-foreground">Sales-specific components can be built out here.</p>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
