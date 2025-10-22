
'use client';

import { DollarSign, Filter, List, MoreHorizontal, PlusCircle, User, Users, View } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/kpi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { columns, Opportunity } from './components/columns';
import { DataTable } from './components/data-table';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';

const opportunities: Opportunity[] = [
  { id: 'opp-1', name: 'Starter Package - Innovation...', company: 'Innovation Co', value: 21000, probability: 40, closeDate: '2025-12-10', stage: 'Discovery' },
  { id: 'opp-2', name: 'Professional Plan - TechStart', company: 'TechStart Inc.', value: 32000, probability: 60, closeDate: '2025-11-30', stage: 'Proposal' },
  { id: 'opp-3', name: 'Enterprise Package - Acme Corp', company: 'Acme Corp', value: 45000, probability: 80, closeDate: '2025-11-15', stage: 'Negotiation' },
  { id: 'opp-4', name: 'Custom Solution - Global Systems', company: 'Global Systems', value: 78000, probability: 90, closeDate: '2025-10-25', stage: 'Closing' },
  { id: 'opp-5', name: 'Enterprise Suite - Enterprise Co', company: 'Enterprise Co', value: 95000, probability: 75, closeDate: '2025-11-20', stage: 'Negotiation' },
];

const pipelineStages: { name: Opportunity['stage'], color: string }[] = [
    { name: 'Discovery', color: 'bg-blue-500' },
    { name: 'Qualification', color: 'bg-purple-500' },
    { name: 'Proposal', color: 'bg-yellow-500' },
    { name: 'Negotiation', color: 'bg-orange-500' },
    { name: 'Closing', color: 'bg-green-500' },
];


function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Card>
      <CardHeader className="p-4">
        <div className="flex justify-between items-start">
            <CardTitle className="text-base font-medium">{opportunity.name}</CardTitle>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent>
                    <DropdownMenuItem>View Opportunity</DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Value</span>
            <span className="font-semibold">${opportunity.value.toLocaleString()}</span>
        </div>
        <div className="space-y-1">
            <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Probability</span>
                <span className="font-semibold">{opportunity.probability}%</span>
            </div>
            <Progress value={opportunity.probability} className="h-2" />
        </div>
        <div className="flex items-center text-xs text-muted-foreground gap-2">
            <List className="h-3 w-3" />
            <span>{new Date(opportunity.closeDate).toLocaleDateString()}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function PipelineView() {
  return (
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        {pipelineStages.map(stage => {
            const stageOpportunities = opportunities.filter(o => o.stage === stage.name);
            const stageValue = stageOpportunities.reduce((sum, o) => sum + o.value, 0);

            return (
                <div key={stage.name} className="space-y-4">
                    <div className="flex items-center gap-2">
                        <div className={`h-2 w-2 rounded-full ${stage.color}`}></div>
                        <h3 className="font-semibold">{stage.name}</h3>
                        <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            {stageOpportunities.length}
                        </span>
                        <span className="ml-auto text-sm text-muted-foreground">
                            ${(stageValue / 1000).toFixed(0)}K
                        </span>
                    </div>
                    <div className="space-y-4">
                        {stageOpportunities.length > 0 ? stageOpportunities.map(opp => <OpportunityCard key={opp.id} opportunity={opp} />) : <div className="text-sm text-muted-foreground text-center pt-10">No opportunities in this stage.</div>}
                    </div>
                </div>
            )
        })}
     </div>
  )
}

export default function OpportunitiesPage() {
    const totalPipelineValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
    const weightedValue = opportunities.reduce((sum, opp) => sum + (opp.value * (opp.probability / 100)), 0);
    const activeOpportunities = opportunities.filter(o => o.stage !== 'Closing').length;
    const avgDealSize = opportunities.length > 0 ? totalPipelineValue / opportunities.length : 0;


  return (
    <div className="space-y-6">
       <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Opportunities</h1>
          <p className="text-muted-foreground">Track and manage your sales pipeline</p>
        </div>
        <div className="sm:ml-auto">
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" /> New Opportunity
          </Button>
        </div>
      </div>

       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <KpiCard title="Total Pipeline Value" value={`$${(totalPipelineValue/1000).toFixed(0)}K`} Icon={DollarSign} description="" />
            <KpiCard title="Weighted Value" value={`$${(weightedValue/1000).toFixed(0)}K`} Icon={DollarSign} description="" />
            <KpiCard title="Active Opportunities" value={activeOpportunities.toString()} Icon={Users} description="" />
            <KpiCard title="Avg. Deal Size" value={`$${(avgDealSize/1000).toFixed(0)}K`} Icon={DollarSign} description="" />
      </div>

      <Tabs defaultValue="pipeline">
        <TabsList>
          <TabsTrigger value="pipeline">
            <View className="mr-2" />
            Pipeline View
          </TabsTrigger>
          <TabsTrigger value="list">
            <List className="mr-2" />
            List View
          </TabsTrigger>
        </TabsList>
        <TabsContent value="pipeline" className="pt-4 overflow-x-auto">
            <div className="min-w-[1000px]">
                <PipelineView />
            </div>
        </TabsContent>
        <TabsContent value="list" className="pt-4">
          <Card>
            <CardHeader>
                <CardTitle>All Opportunities</CardTitle>
                <CardDescription>Search and filter all opportunities in a list view.</CardDescription>
            </CardHeader>
            <CardContent>
                <DataTable columns={columns} data={opportunities} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

    </div>
  );
}
