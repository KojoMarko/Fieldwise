
'use client';

import { File, PlusCircle, User, Users, CheckCircle, TrendingUp, Filter, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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

const leadsData = [
    { id: 'lead-1', company: 'Acme Corporation', contact: 'John Smith', email: 'john.smith@acme.com', phone: '+1 (555) 123-4567', value: 45000, status: 'Qualified', source: 'Website', lastContact: '2 days ago' },
    { id: 'lead-2', company: 'TechStart Inc', contact: 'Sarah Johnson', email: 'sarah.j@techstart.com', phone: '+1 (555) 234-5678', value: 32000, status: 'Contacted', source: 'Referral', lastContact: '5 days ago' },
    { id: 'lead-3', company: 'Global Systems', contact: 'Mike Chen', email: 'm.chen@globalsys.com', phone: '+1 (555) 345-6789', value: 78000, status: 'Qualified', source: 'LinkedIn', lastContact: '1 day ago' },
    { id: 'lead-4', company: 'Innovation Labs', contact: 'Emily Davis', email: 'emily@innovlabs.com', phone: '+1 (555) 456-7890', value: 21000, status: 'New', source: 'Cold Call', lastContact: 'Today' },
    { id: 'lead-5', company: 'Enterprise Co', contact: 'David Wilson', email: 'd.wilson@enterprise.co', phone: '+1 (555) 567-8901', value: 95000, status: 'Converted', source: 'Trade Show', lastContact: '1 week ago' },
    { id: 'lead-6', company: 'StartUp Studios', contact: 'Lisa Anderson', email: 'lisa@startupstudios.io', phone: '+1 (555) 678-9012', value: 18500, status: 'Contacted', source: 'Website', lastContact: '3 days ago' },
    { id: 'lead-7', company: 'MegaCorp Industries', contact: 'Robert Taylor', email: 'rtaylor@megacorp.com', phone: '+1 (555) 789-0123', value: 125000, status: 'Qualified', source: 'Partner', lastContact: 'Yesterday' },
    { id: 'lead-8', company: 'Digital Solutions', contact: 'Amanda White', email: 'awhite@digitalsol.com', phone: '+1 (555) 890-1234', value: 42000, status: 'New', source: 'Email Campaign', lastContact: 'Today' },
];

export default function LeadsPage() {
  const totalLeads = leadsData.length;
  const newLeads = leadsData.filter(lead => lead.status === 'New').length;
  const qualifiedLeads = leadsData.filter(lead => lead.status === 'Qualified').length;
  const convertedLeads = leadsData.filter(lead => lead.status === 'Converted').length;

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
                />
              </div>
              
              {/* Filter Controls */}
              <div className="flex flex-col min-[400px]:flex-row items-stretch gap-2 shrink-0">
                <Button variant="outline" size="sm" className="h-9 whitespace-nowrap">
                  <Filter className="mr-2 h-4 w-4" />
                  Filter
                </Button>
                
                <Select defaultValue="all">
                  <SelectTrigger className="h-9 w-full min-[400px]:w-[140px] sm:w-[160px]">
                    <SelectValue placeholder="All Leads" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leads</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
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
              <DataTable columns={columns} data={leadsData} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
