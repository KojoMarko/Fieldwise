
'use client';

import { useState, Fragment } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight, File, Search, PlusCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { KpiCard } from '@/components/kpi-card';
import { DollarSign, CheckCircle, Clock } from 'lucide-react';
import { AddTransactionDialog } from './components/add-transaction-dialog';

export type Product = {
  id: string;
  name: string;
  quantity: number;
  unitPrice: number;
};

export type Transaction = {
  id: string;
  transactionId: string;
  customerName: string;
  customerId: string;
  date: string;
  total: number;
  paymentStatus: 'Fully Paid' | 'Partial Payment' | 'Pending';
  products: Product[];
};

const initialTransactions: Transaction[] = [
  { id: '1', transactionId: 'TRN-2024-001', customerName: 'Acme Corp', customerId: 'CUST-001', date: '2024-07-20', total: 4500, paymentStatus: 'Fully Paid', products: [{ id: 'P-01', name: 'Enterprise Software License', quantity: 1, unitPrice: 4500 }] },
  { id: '2', transactionId: 'TRN-2024-002', customerName: 'TechStart Inc', customerId: 'CUST-002', date: '2024-07-18', total: 1200, paymentStatus: 'Pending', products: [{ id: 'P-02', name: 'Basic Cloud Hosting', quantity: 12, unitPrice: 100 }] },
  { id: '3', transactionId: 'TRN-2024-003', customerName: 'Global Systems', customerId: 'CUST-003', date: '2024-07-15', total: 8000, paymentStatus: 'Partial Payment', products: [{ id: 'P-03', name: 'Advanced AI Module', quantity: 1, unitPrice: 5000 }, { id: 'P-04', name: 'Priority Support Contract', quantity: 1, unitPrice: 3000 }] },
  { id: '4', transactionId: 'TRN-2024-004', customerName: 'Innovate LLC', customerId: 'CUST-004', date: '2024-07-12', total: 250, paymentStatus: 'Fully Paid', products: [{ id: 'P-05', name: 'Consulting Hour', quantity: 2, unitPrice: 125 }] },
  { id: '5', transactionId: 'TRN-2024-005', customerName: 'Enterprise Co', customerId: 'CUST-005', date: '2024-07-10', total: 15000, paymentStatus: 'Pending', products: [{ id: 'P-01', name: 'Enterprise Software License', quantity: 3, unitPrice: 5000 }] },
];

const statusColors: Record<Transaction['paymentStatus'], string> = {
  'Fully Paid': 'bg-green-100 text-green-800 border-green-300',
  'Partial Payment': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Pending': 'bg-orange-100 text-orange-800 border-orange-300',
};


function TransactionRow({ transaction }: { transaction: Transaction }) {
    const [isOpen, setIsOpen] = useState(false);
    
    return (
        <Fragment>
            <TableRow>
                <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="icon" onClick={() => setIsOpen(!isOpen)} className="h-8 w-8">
                                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                            </Button>
                        </CollapsibleTrigger>
                        <div>
                            <div>{transaction.customerName}</div>
                            <div className="text-xs text-muted-foreground">{transaction.customerId}</div>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="hidden md:table-cell">{transaction.transactionId}</TableCell>
                <TableCell className="hidden sm:table-cell">{transaction.date}</TableCell>
                <TableCell className="text-right">GH₵{transaction.total.toLocaleString()}</TableCell>
                <TableCell>
                    <Badge variant="outline" className={statusColors[transaction.paymentStatus]}>{transaction.paymentStatus}</Badge>
                </TableCell>
            </TableRow>
            <CollapsibleContent asChild>
                <TableRow>
                    <TableCell colSpan={5} className="p-0">
                        <div className="p-4 bg-muted/50">
                            <h4 className="font-semibold mb-2">Sale Details</h4>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Product Name</TableHead>
                                        <TableHead className="text-center">Quantity</TableHead>
                                        <TableHead className="text-right">Unit Price</TableHead>
                                        <TableHead className="text-right">Subtotal</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transaction.products.map(p => (
                                        <TableRow key={p.id}>
                                            <TableCell>{p.name}</TableCell>
                                            <TableCell className="text-center">{p.quantity}</TableCell>
                                            <TableCell className="text-right">GH₵{p.unitPrice.toLocaleString()}</TableCell>
                                            <TableCell className="text-right">GH₵{(p.quantity * p.unitPrice).toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </TableCell>
                </TableRow>
            </CollapsibleContent>
        </Fragment>
    )
}

export default function SalesLedgerPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
    
  const totalRevenue = transactions.reduce((sum, t) => sum + t.total, 0);
  const paidRevenue = transactions.filter(t => t.paymentStatus === 'Fully Paid').reduce((sum, t) => sum + t.total, 0);
  const pendingRevenue = transactions.filter(t => t.paymentStatus !== 'Fully Paid').reduce((sum, t) => sum + t.total, 0);
  
  const handleAddTransaction = (newTransactionData: Omit<Transaction, 'id' | 'transactionId' | 'total'>) => {
    const total = newTransactionData.products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const newTransaction: Transaction = {
      ...newTransactionData,
      id: (transactions.length + 1).toString(),
      transactionId: `TRN-2024-${String(transactions.length + 1).padStart(3, '0')}`,
      total: total,
    };
    setTransactions(prev => [newTransaction, ...prev]);
  };

  return (
    <>
    <AddTransactionDialog 
      open={isAddDialogOpen} 
      onOpenChange={setAddDialogOpen}
      onAddTransaction={handleAddTransaction}
    />
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Ledger</h1>
          <p className="text-muted-foreground">A chronological record of all sales transactions.</p>
        </div>
        <Button onClick={() => setAddDialogOpen(true)}>
            <PlusCircle className="mr-2 h-4 w-4" /> New Transaction
        </Button>
      </div>
      
       <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <KpiCard
          title="Total Revenue"
          value={`GH₵${totalRevenue.toLocaleString()}`}
          description="All recorded transactions"
          Icon={DollarSign}
        />
        <KpiCard
          title="Revenue Collected"
          value={`GH₵${paidRevenue.toLocaleString()}`}
          description="Sum of all fully paid transactions"
          Icon={CheckCircle}
        />
        <KpiCard
          title="Pending Revenue"
          value={`GH₵${pendingRevenue.toLocaleString()}`}
          description="Partial and pending payments"
          Icon={Clock}
        />
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle>Transactions</CardTitle>
             <div className="flex gap-2">
                <div className="relative w-full sm:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search transactions..." className="pl-8 sm:w-64" />
                </div>
                 <Button variant="outline"><File className="mr-2 h-4 w-4" /> Export</Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Customer</TableHead>
                  <TableHead className="hidden md:table-cell">Transaction ID</TableHead>
                  <TableHead className="hidden sm:table-cell">Date</TableHead>
                  <TableHead className="text-right">Total Value</TableHead>
                  <TableHead>Payment Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map(transaction => (
                   <Collapsible asChild key={transaction.id}>
                     <TransactionRow transaction={transaction} />
                   </Collapsible>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
    </>
  );
}
