
'use client';

import { DollarSign, Filter, List, MoreHorizontal, PlusCircle, User, Users, View, LoaderCircle, File } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KpiCard } from '@/components/kpi-card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { columns, Opportunity } from './components/columns';
import { DataTable } from './components/data-table';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import * as xlsx from 'xlsx';

const pipelineStages: { name: Opportunity['stage'], color: string }[] = [
    { name: 'Discovery', color: 'bg-blue-500' },
    { name: 'Qualification', color: 'bg-purple-500' },
    { name: 'Proposal', color: 'bg-yellow-500' },
    { name: 'Negotiation', color: 'bg-orange-500' },
    { name: 'Closing', color: 'bg-green-500' },
];


function OpportunityCard({ opportunity }: { opportunity: Opportunity }) {
  return (
    <Card className="w-full">
      <CardHeader className="p-4">
        <div className="flex justify-between items-start gap-2">
            <CardTitle className="text-base font-medium line-clamp-2 min-w-0 flex-1">
              {opportunity.name}
            </CardTitle>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem>View Opportunity</DropdownMenuItem>
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </CardHeader>
      <CardContent className="p-4 pt-0 space-y-3">
        <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Value</span>
            <span className="font-semibold">GH₵{opportunity.value.toLocaleString()}</span>
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

function PipelineView({ opportunities }: { opportunities: Opportunity[] }) {
  return (
     <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 sm:gap-6">
        {pipelineStages.map(stage => {
            const stageOpportunities = opportunities.filter(o => o.stage === stage.name);
            const stageValue = stageOpportunities.reduce((sum, o) => sum + o.value, 0);

            return (
                <div key={stage.name} className="space-y-4 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <div className={`h-2 w-2 rounded-full ${stage.color} shrink-0`}></div>
                        <h3 className="font-semibold">{stage.name}</h3>
                        <span className="text-sm font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                            {stageOpportunities.length}
                        </span>
                        <span className="ml-auto text-sm text-muted-foreground whitespace-nowrap">
                            GH₵{(stageValue / 1000).toFixed(0)}K
                        </span>
                    </div>
                    <div className="space-y-4">
                        {stageOpportunities.length > 0 ? (
                          stageOpportunities.map(opp => <OpportunityCard key={opp.id} opportunity={opp} />)
                        ) : (
                          <div className="text-sm text-muted-foreground text-center pt-10">
                            No opportunities in this stage.
                          </div>
                        )}
                    </div>
                </div>
            )
        })}
     </div>
  )
}

export default function OpportunitiesPage() {
  const { user } = useAuth();
  const db = useFirestore();
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user?.companyId || !db) {
        setIsLoading(false);
        return;
    }
    const oppsQuery = query(collection(db, 'opportunities'), where('companyId', '==', user.companyId));
    const unsubscribe = onSnapshot(oppsQuery, (snapshot) => {
        const oppsData: Opportunity[] = [];
        snapshot.forEach(doc => oppsData.push({ id: doc.id, ...doc.data() } as Opportunity));
        setOpportunities(oppsData);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user?.companyId, db]);

    const totalPipelineValue = opportunities.reduce((sum, opp) => sum + opp.value, 0);
    const weightedValue = opportunities.reduce((sum, opp) => sum + (opp.value * (opp.probability / 100)), 0);
    const activeOpportunities = opportunities.filter(o => o.stage !== 'Closing').length;
    const avgDealSize = opportunities.length > 0 ? totalPipelineValue / opportunities.length : 0;
    
    const handleExport = () => {
        const dataToExport = opportunities.map(opp => ({
            'Opportunity Name': opp.name,
            'Company': opp.company,
            'Value (GHS)': opp.value,
            'Probability (%)': opp.probability,
            'Stage': opp.stage,
            'Close Date': opp.closeDate,
        }));
        const worksheet = xlsx.utils.json_to_sheet(dataToExport);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Opportunities");
        
        xlsx.writeFile(workbook, "Opportunities_Export.xlsx");
    };


  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Opportunities</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Track and manage your sales pipeline
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport}>
                <File className="mr-2 h-4 w-4" /> Export
            </Button>
            <Button className="w-full sm:w-auto shrink-0">
                <PlusCircle className="mr-2 h-4 w-4" /> New Opportunity
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard 
            title="Total Pipeline Value" 
            value={`GH₵${(totalPipelineValue/1000).toFixed(0)}K`} 
            Icon={DollarSign} 
            description="" 
          />
          <KpiCard 
            title="Weighted Value" 
            value={`GH₵${(weightedValue/1000).toFixed(0)}K`} 
            Icon={DollarSign} 
            description="" 
          />
          <KpiCard 
            title="Active Opportunities" 
            value={activeOpportunities.toString()} 
            Icon={Users} 
            description="" 
          />
          <KpiCard 
            title="Avg. Deal Size" 
            value={`GH₵${(avgDealSize/1000).toFixed(0)}K`} 
            Icon={DollarSign} 
            description="" 
          />
        </div>

        {/* Tabs Section */}
        <Tabs defaultValue="pipeline" className="w-full">
          <TabsList className="grid w-full grid-cols-2 sm:w-auto sm:inline-flex">
            <TabsTrigger value="pipeline" className="flex items-center justify-center gap-2">
              <View className="h-4 w-4" />
              <span className="hidden sm:inline">Pipeline View</span>
              <span className="sm:hidden">Pipeline</span>
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center justify-center gap-2">
              <List className="h-4 w-4" />
              <span className="hidden sm:inline">List View</span>
              <span className="sm:hidden">List</span>
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="pipeline" className="pt-4 w-full">
            {isLoading ? (
              <div className="flex justify-center items-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
            ) : (
              <div className="overflow-x-auto pb-4">
                <PipelineView opportunities={opportunities} />
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="list" className="pt-4 w-full">
            <Card className="w-full">
              <CardHeader>
                <CardTitle>All Opportunities</CardTitle>
                <CardDescription>
                  Search and filter all opportunities in a list view.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="flex justify-center items-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                ) : (
                  <div className="w-full overflow-x-auto">
                    <DataTable columns={columns} data={opportunities} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
