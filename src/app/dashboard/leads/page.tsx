
'use client';

import { File, PlusCircle, User, Users, CheckCircle, TrendingUp, Filter, Search, LoaderCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { KpiCard } from '@/components/kpi-card';
import { columns } from './components/columns';
import { DataTable } from './components/data-table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import type { Lead } from '@/lib/types';

export default function LeadsPage() {
  const { user } = useAuth();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    if (!user?.companyId) {
        setIsLoading(false);
        return;
    }
    const leadsQuery = query(collection(db, 'leads'), where('companyId', '==', user.companyId));
    const unsubscribe = onSnapshot(leadsQuery, (snapshot) => {
        const leadsData: Lead[] = [];
        snapshot.forEach(doc => leadsData.push({ id: doc.id, ...doc.data() } as Lead));
        setLeads(leadsData);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user?.companyId]);

  const filteredLeads = useMemo(() => {
      return leads.filter(lead => {
          const statusMatch = statusFilter === 'all' || lead.status === statusFilter;
          const searchMatch = searchFilter ? 
            lead.company.toLowerCase().includes(searchFilter.toLowerCase()) || 
            lead.contact.toLowerCase().includes(searchFilter.toLowerCase()) : true;
          return statusMatch && searchMatch;
      });
  }, [leads, statusFilter, searchFilter]);

  const totalLeads = leads.length;
  const newLeads = leads.filter(lead => lead.status === 'New').length;
  const qualifiedLeads = leads.filter(lead => lead.status === 'Qualified').length;
  const convertedLeads = leads.filter(lead => lead.status === 'Converted').length;

  return (
    <div className="w-full max-w-full overflow-hidden">
      <div className="space-y-4 sm:space-y-6">
        {/* Header Section */}
        <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
          <div className="space-y-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Leads</h1>
            <p className="text-sm sm:text-base text-muted-foreground">
              Manage and track your sales leads
            </p>
          </div>
          <Button className="w-full sm:w-auto shrink-0">
            <PlusCircle className="mr-2 h-4 w-4" /> Add Lead
          </Button>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 min-[500px]:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <KpiCard 
            title="Total Leads" 
            value={totalLeads.toString()} 
            Icon={Users} 
            description={`${convertedLeads} leads converted this month`} 
          />
          <KpiCard 
            title="New Leads" 
            value={newLeads.toString()} 
            Icon={User} 
            description="Awaiting initial contact" 
          />
          <KpiCard 
            title="Qualified" 
            value={qualifiedLeads.toString()} 
            Icon={CheckCircle} 
            description="Ready for the next step" 
          />
          <KpiCard 
            title="Converted" 
            value={convertedLeads.toString()} 
            Icon={TrendingUp} 
            description="Successfully turned into customers" 
          />
        </div>

        {/* Data Table Card */}
        <Card className="w-full">
          <CardContent className="p-4 sm:p-6">
            {/* Search and Filter Controls */}
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-4">
              {/* Search Input */}
              <div className="relative w-full sm:flex-1 sm:max-w-sm">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input 
                  placeholder="Search leads..." 
                  className="pl-8 w-full h-9" 
                  value={searchFilter}
                  onChange={e => setSearchFilter(e.target.value)}
                />
              </div>
              
              {/* Filter Controls */}
              <div className="flex flex-col min-[400px]:flex-row items-stretch gap-2 shrink-0">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-9 w-full min-[400px]:w-[140px] sm:w-[160px]">
                    <SelectValue placeholder="All Leads" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    <SelectItem value="New">New</SelectItem>
                    <SelectItem value="Contacted">Contacted</SelectItem>
                    <SelectItem value="Qualified">Qualified</SelectItem>
                    <SelectItem value="Converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" size="sm" className="h-9 whitespace-nowrap">
                  <File className="mr-2 h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
            
            {/* Data Table */}
            <div className="w-full overflow-x-auto">
              {isLoading ? (
                <div className="flex justify-center items-center py-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
              ) : (
                <DataTable columns={columns} data={filteredLeads} />
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
