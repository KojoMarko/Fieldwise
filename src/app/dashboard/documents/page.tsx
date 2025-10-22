
'use client';

import {
  FileText,
  FileSpreadsheet,
  FilePresentation,
  Upload,
  Search,
  MoreHorizontal,
  Download,
} from 'lucide-react';
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
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const documents = [
  { name: 'Enterprise_Contract_AcmeCorp.pdf', category: 'Contract', relatedTo: 'Acme Corp', size: '2.4 MB', uploadedBy: 'Sales Rep', date: '2025-10-15', type: 'pdf' },
  { name: 'Product_Proposal_TechStart.docx', category: 'Proposal', relatedTo: 'TechStart Inc', size: '1.8 MB', uploadedBy: 'Sales Rep', date: '2025-10-14', type: 'doc' },
  { name: 'Pricing_Sheet_Q4_2025.xlsx', category: 'Pricing', relatedTo: 'General', size: '456 KB', uploadedBy: 'Sales Rep', date: '2025-10-10', type: 'xls' },
  { name: 'Demo_Presentation_GlobalSys.pptx', category: 'Presentation', relatedTo: 'Global Systems', size: '5.2 MB', uploadedBy: 'Sales Rep', date: '2025-10-13', type: 'ppt' },
  { name: 'Case_Study_EnterpriseSuccess.pdf', category: 'Case Study', relatedTo: 'General', size: '3.1 MB', uploadedBy: 'Marketing Team', date: '2025-10-08', type: 'pdf' },
  { name: 'Implementation_Plan_InnovLabs.pdf', category: 'Plan', relatedTo: 'Innovation Labs', size: '1.9 MB', uploadedBy: 'Sales Rep', date: '2025-10-12', type: 'pdf' },
  { name: 'Product_Brochure_2025.pdf', category: 'Marketing', relatedTo: 'General', size: '4.5 MB', uploadedBy: 'Marketing Team', date: '2025-09-28', type: 'pdf' },
  { name: 'ROI_Calculator.xlsx', category: 'Tool', relatedTo: 'General', size: '892 KB', uploadedBy: 'Sales Rep', date: '2025-10-11', type: 'xls' },
];

const fileIcons: Record<string, React.ElementType> = {
    pdf: FileText,
    doc: FileText,
    xls: FileSpreadsheet,
    ppt: FilePresentation,
};


export default function DocumentsPage() {
    const totalDocuments = documents.length;
    const contracts = documents.filter(d => d.category === 'Contract').length;
    const proposals = documents.filter(d => d.category === 'Proposal').length;
    const presentations = documents.filter(d => d.category === 'Presentation').length;

    return (
        <div className="space-y-6">
             <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Documents</h1>
                    <p className="text-muted-foreground">Manage your sales documents and files</p>
                </div>
                <div className="sm:ml-auto">
                    <Button>
                        <Upload className="mr-2 h-4 w-4" /> Upload Document
                    </Button>
                </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Total Documents</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalDocuments}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Contracts</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{contracts}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Proposals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{proposals}</div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Presentations</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{presentations}</div>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle>All Documents</CardTitle>
                        <div className="relative w-full sm:w-auto">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search documents..." className="pl-8 sm:w-64" />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                     <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Name</TableHead>
                                    <TableHead className="hidden sm:table-cell">Category</TableHead>
                                    <TableHead className="hidden md:table-cell">Related To</TableHead>
                                    <TableHead className="hidden lg:table-cell">Size</TableHead>
                                    <TableHead className="hidden lg:table-cell">Uploaded By</TableHead>
                                    <TableHead className="hidden sm:table-cell">Date</TableHead>
                                    <TableHead><span className="sr-only">Actions</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {documents.map(doc => {
                                    const Icon = fileIcons[doc.type] || FileText;
                                    return (
                                        <TableRow key={doc.name}>
                                            <TableCell className="font-medium flex items-center gap-2">
                                                <Icon className="h-4 w-4 text-muted-foreground" />
                                                {doc.name}
                                            </TableCell>
                                            <TableCell className="hidden sm:table-cell">
                                                <Badge variant="outline">{doc.category}</Badge>
                                            </TableCell>
                                            <TableCell className="hidden md:table-cell">{doc.relatedTo}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{doc.size}</TableCell>
                                            <TableCell className="hidden lg:table-cell">{doc.uploadedBy}</TableCell>
                                            <TableCell className="hidden sm:table-cell">{doc.date}</TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent>
                                                        <DropdownMenuItem>View</DropdownMenuItem>
                                                        <DropdownMenuItem>Download</DropdownMenuItem>
                                                        <DropdownMenuItem>Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Recent Activity</CardTitle>
                    <CardDescription>Latest document uploads and changes</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {documents.slice(0, 5).map(doc => {
                             const Icon = fileIcons[doc.type] || FileText;
                            return (
                                <div key={doc.name} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Icon className="h-5 w-5 text-muted-foreground" />
                                        <div>
                                            <p className="font-medium">{doc.name}</p>
                                            <p className="text-sm text-muted-foreground">Uploaded by {doc.uploadedBy} on {doc.date}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon">
                                        <Download className="h-4 w-4" />
                                    </Button>
                                </div>
                            )
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
