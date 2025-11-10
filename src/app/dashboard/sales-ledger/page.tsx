
'use client';

import { useState, Fragment, useEffect, useMemo, useRef } from 'react';
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
import { ChevronDown, ChevronRight, File, Search, PlusCircle, Edit, UploadCloud, Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { KpiCard } from '@/components/kpi-card';
import { DollarSign, CheckCircle, Clock, LoaderCircle } from 'lucide-react';
import { AddTransactionDialog } from './components/add-transaction-dialog';
import { UpdatePaymentDialog } from './components/update-payment-dialog';
import { useAuth } from '@/hooks/use-auth';
import { collection, onSnapshot, query, where, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatISO } from 'date-fns';
import { extractAndCreateTransactions } from '@/ai/flows/extract-and-create-transactions';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';


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
  amountPaid: number;
  paymentStatus: 'Fully Paid' | 'Partial Payment' | 'Pending';
  products: Product[];
  companyId: string;
};


const statusColors: Record<Transaction['paymentStatus'], string> = {
  'Fully Paid': 'bg-green-100 text-green-800 border-green-300',
  'Partial Payment': 'bg-yellow-100 text-yellow-800 border-yellow-300',
  'Pending': 'bg-orange-100 text-orange-800 border-orange-300',
};


function AiDebtImporter() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isExtracting, setIsExtracting] = useState(false);
  const [fileName, setFileName] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.companyId) return;

    setFileName(file.name);
    setIsExtracting(true);
    toast({
      title: 'AI Extraction Started',
      description: 'The AI is analyzing your debt tracker to import transactions. This may take a moment.',
    });

    try {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        const dataUri = reader.result as string;
        const result = await extractAndCreateTransactions({
          fileDataUri: dataUri,
          companyId: user.companyId,
        });
        
        toast({
          title: 'Extraction Complete!',
          description: `Successfully extracted and created ${result.count} new transactions.`,
        });
      };
      reader.onerror = () => {
        throw new Error('Could not read the file.');
      }
    } catch (error) {
      console.error("Error extracting transactions:", error);
      toast({
        variant: 'destructive',
        title: 'Extraction Failed',
        description: 'The AI could not extract transactions from the document. Please try again.',
      });
    } finally {
      setIsExtracting(false);
      setFileName('');
      if(fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Card className="bg-accent/50 border-primary/20 border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="text-primary" />
          AI Debt Importer
        </CardTitle>
        <CardDescription>
          Have a debt tracker in a spreadsheet or document? Upload it here and the AI will automatically add the transactions to your sales ledger.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Button onClick={() => fileInputRef.current?.click()} disabled={isExtracting} variant="outline">
              <UploadCloud className="mr-2 h-4 w-4" />
            Upload Document
          </Button>
          <Input 
            type="file" 
            ref={fileInputRef} 
            className="hidden" 
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.xls,.xlsx"
            disabled={isExtracting}
          />
          {isExtracting && (
            <div className="flex items-center text-sm text-muted-foreground">
              <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
              <span>Analyzing: {fileName}...</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}


function TransactionRow({ transaction, onUpdateClick }: { transaction: Transaction, onUpdateClick: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const balance = transaction.total - transaction.amountPaid;
    
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
                            <div className="text-xs text-muted-foreground">{transaction.transactionId}</div>
                        </div>
                    </div>
                </TableCell>
                <TableCell className="hidden sm:table-cell">{transaction.date}</TableCell>
                <TableCell className="text-right">
                    <div>GH₵{transaction.total.toLocaleString()}</div>
                    {transaction.paymentStatus !== 'Fully Paid' && balance > 0 && (
                        <div className="text-xs text-red-500">Balance: GH₵{balance.toLocaleString()}</div>
                    )}
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className={statusColors[transaction.paymentStatus]}>{transaction.paymentStatus}</Badge>
                </TableCell>
                <TableCell className="text-right">
                    <Button variant="outline" size="sm" onClick={onUpdateClick} disabled={balance <= 0}>
                        <Edit className="h-3 w-3 mr-1"/> Update Payment
                    </Button>
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
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddDialogOpen, setAddDialogOpen] = useState(false);
  const [isUpdateDialogOpen, setUpdateDialogOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [searchFilter, setSearchFilter] = useState('');

  useEffect(() => {
    if (!user?.companyId) {
        setIsLoading(false);
        return;
    }
    const transactionsQuery = query(collection(db, "transactions"), where("companyId", "==", user.companyId));
    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
        const transData: Transaction[] = [];
        snapshot.forEach(doc => transData.push({ id: doc.id, ...doc.data() } as Transaction));
        transData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        setTransactions(transData);
        setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user?.companyId]);


  const handleAddTransaction = async (newTransactionData: Omit<Transaction, 'id' | 'transactionId' | 'total' | 'companyId'>) => {
    if (!user?.companyId) return;

    const total = newTransactionData.products.reduce((sum, p) => sum + (p.quantity * p.unitPrice), 0);
    const transactionCount = transactions.length + 1;
    const newTransaction: Omit<Transaction, 'id'> = {
      ...newTransactionData,
      transactionId: `TRN-2024-${String(transactionCount).padStart(3, '0')}`,
      total: total,
      companyId: user.companyId
    };

    await addDoc(collection(db, 'transactions'), newTransaction);
  };
  
  const handleOpenUpdateDialog = (transaction: Transaction) => {
      setSelectedTransaction(transaction);
      setUpdateDialogOpen(true);
  }

  const handleUpdatePayment = async (transactionId: string, newPayment: number) => {
    const transactionRef = doc(db, 'transactions', transactionId);
    const currentTransaction = transactions.find(t => t.id === transactionId);
    if (!currentTransaction) return;

    const updatedAmountPaid = currentTransaction.amountPaid + newPayment;
    let newStatus: Transaction['paymentStatus'] = 'Partial Payment';
    if (updatedAmountPaid >= currentTransaction.total) {
      newStatus = 'Fully Paid';
    }

    await updateDoc(transactionRef, {
        amountPaid: updatedAmountPaid,
        paymentStatus: newStatus
    });
  };

  const filteredTransactions = useMemo(() => {
      return transactions.filter(t => 
        t.customerName.toLowerCase().includes(searchFilter.toLowerCase()) ||
        t.transactionId.toLowerCase().includes(searchFilter.toLowerCase())
      )
  }, [transactions, searchFilter]);

  const totalRevenue = filteredTransactions.reduce((sum, t) => sum + t.total, 0);
  const paidRevenue = filteredTransactions.reduce((sum, t) => sum + t.amountPaid, 0);
  const pendingRevenue = totalRevenue - paidRevenue;

  return (
    <>
    <AddTransactionDialog 
      open={isAddDialogOpen} 
      onOpenChange={setAddDialogOpen}
      onAddTransaction={handleAddTransaction}
    />
    {selectedTransaction && (
      <UpdatePaymentDialog
        open={isUpdateDialogOpen}
        onOpenChange={setUpdateDialogOpen}
        transaction={selectedTransaction}
        onUpdatePayment={handleUpdatePayment}
      />
    )}
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sales Ledger</h1>
          <p className="text-muted-foreground">A chronological record of all sales transactions.</p>
        </div>
      </div>
      
        <Tabs defaultValue="transactions">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="transactions">Transactions</TabsTrigger>
                <TabsTrigger value="debtors">Debtors</TabsTrigger>
            </TabsList>
            <TabsContent value="transactions">
                <Card>
                    <CardHeader>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <CardTitle>Transactions</CardTitle>
                        <div className="flex gap-2">
                            <div className="relative w-full sm:w-auto">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input 
                                    placeholder="Search transactions..." 
                                    className="pl-8 sm:w-64"
                                    value={searchFilter}
                                    onChange={e => setSearchFilter(e.target.value)}
                                />
                            </div>
                            <Button onClick={() => setAddDialogOpen(true)}>
                                <PlusCircle className="mr-2 h-4 w-4" /> New Transaction
                            </Button>
                        </div>
                    </div>
                    </CardHeader>
                    <CardContent>
                    <div className="overflow-x-auto rounded-md border">
                        {isLoading ? (
                            <div className="flex items-center justify-center p-10"><LoaderCircle className="h-8 w-8 animate-spin" /></div>
                        ) : (
                            <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead className="w-[300px]">Customer</TableHead>
                                <TableHead className="hidden sm:table-cell">Date</TableHead>
                                <TableHead className="text-right">Total Value</TableHead>
                                <TableHead>Payment Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredTransactions.map(transaction => (
                                <Collapsible asChild key={transaction.id}>
                                    <TransactionRow transaction={transaction} onUpdateClick={() => handleOpenUpdateDialog(transaction)} />
                                </Collapsible>
                                ))}
                            </TableBody>
                            </Table>
                        )}
                    </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="debtors">
                <div className="space-y-4">
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
                        description="Sum of all paid amounts"
                        Icon={CheckCircle}
                        />
                        <KpiCard
                        title="Outstanding Revenue"
                        value={`GH₵${pendingRevenue.toLocaleString()}`}
                        description="Partial and pending payments"
                        Icon={Clock}
                        />
                    </div>
                    <AiDebtImporter />
                </div>
            </TabsContent>
        </Tabs>
    </div>
    </>
  );
}
