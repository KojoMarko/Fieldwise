
'use client';

import {
  DollarSign,
  CheckCircle,
  Users,
  TrendingUp,
} from 'lucide-react';
import { KpiCard } from '@/components/kpi-card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { ActiveOpportunitiesTable } from './components/active-opportunities';
import { TodaysTasks } from './components/todays-tasks';
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Opportunity, Lead, Activity } from '@/lib/types';
import { LoaderCircle } from 'lucide-react';


export default function SalesDashboardPage() {
  const { user, isLoading: isAuthLoading } = useAuth();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [activities, setActivities] = useState<Activity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId) {
        setIsLoading(false);
        return;
    }
    setIsLoading(true);

    const oppsQuery = query(collection(db, 'opportunities'), where('companyId', '==', user.companyId));
    const leadsQuery = query(collection(db, 'leads'), where('companyId', '==', user.companyId));
    const activitiesQuery = query(collection(db, 'activities'), where('companyId', '==', user.companyId));

    const unsubOpps = onSnapshot(oppsQuery, (snapshot) => {
        const oppsData: Opportunity[] = [];
        snapshot.forEach(doc => oppsData.push({ id: doc.id, ...doc.data() } as Opportunity));
        setOpportunities(oppsData);
        if(!leads.length && !activities.length) setIsLoading(false);
    });

    const unsubLeads = onSnapshot(leadsQuery, (snapshot) => {
        const leadsData: Lead[] = [];
        snapshot.forEach(doc => leadsData.push({ id: doc.id, ...doc.data() } as Lead));
        setLeads(leadsData);
        if(!opportunities.length && !activities.length) setIsLoading(false);
    });
    
    const unsubActivities = onSnapshot(activitiesQuery, (snapshot) => {
        const activitiesData: Activity[] = [];
        snapshot.forEach(doc => activitiesData.push({ id: doc.id, ...doc.data() } as Activity));
        setActivities(activitiesData);
        if(!opportunities.length && !leads.length) setIsLoading(false);
    });

    return () => {
        unsubOpps();
        unsubLeads();
        unsubActivities();
    }
  }, [user?.companyId]);
  
  if (isAuthLoading || isLoading) {
      return (
          <div className="flex h-screen w-full items-center justify-center">
              <LoaderCircle className="h-8 w-8 animate-spin" />
          </div>
      )
  }


  if (!user) return null;

  const totalPipelineValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
  const dealsClosed = opportunities.filter(opp => opp.stage === 'Closing').length;
  const activeLeads = leads.filter(lead => lead.status !== 'Converted').length;
  const targetProgress = 78; // Placeholder

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold tracking-tight">
            Welcome back, {user.name.split(' ')[0]}
            </h1>
            <p className="text-muted-foreground">
            Here's what's happening with your sales today.
            </p>
        </div>
        <Badge variant="outline" className="text-sm">
          Sales Portal
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          title="Total Pipeline"
          value={`GH₵${(totalPipelineValue/1000).toFixed(0)}K`}
          description={`${opportunities.length} active opportunities`}
          Icon={DollarSign}
        />
        <KpiCard
          title="Deals Closed (This Qr.)"
          value={dealsClosed.toString()}
          description="Converted opportunities"
          Icon={CheckCircle}
        />
        <KpiCard
          title="Active Leads"
          value={activeLeads.toString()}
          description="Leads not yet converted"
          Icon={Users}
        />
        <KpiCard
          title="Target Progress"
          value={`${targetProgress}%`}
          description="Progress towards quarterly goal"
          Icon={TrendingUp}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
            <ActiveOpportunitiesTable opportunities={opportunities} />
        </div>
        <div>
            <TodaysTasks activities={activities} />
        </div>
      </div>
    </div>
  );
}
