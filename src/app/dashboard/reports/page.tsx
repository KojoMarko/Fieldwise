
'use client';

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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ReportKpiCard } from './components/report-kpi-card';
import {
  Package,
  Layers,
  PackagePlus,
  ShieldAlert,
  LoaderCircle,
  Sparkles,
  Send,
  User,
  Plus,
  MessageSquare,
  Paperclip,
  X,
  Download,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { useAuth } from '@/hooks/use-auth';
import { useEffect, useState, useMemo, useRef } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, useStorage } from '@/lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';
import type { Asset } from '@/lib/types';
import { format, parseISO, isThisMonth, differenceInYears, isValid, startOfMonth, endOfMonth, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { queryData } from '@/ai/flows/query-data-flow';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { ReportView } from './components/report-view';
import Image from 'next/image';
import * as xlsx from 'xlsx';
import { Progress } from '@/components/ui/progress';

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
  attachment?: {
    name: string;
    type: string;
    url: string; // Changed from dataUri to url
    localPreview?: string; // For displaying image previews on the client
  };
};

function ReportChat({ chatSessions, setChatSessions, activeChatIndex, setActiveChatIndex }: {
  chatSessions: ChatMessage[][];
  setChatSessions: React.Dispatch<React.SetStateAction<ChatMessage[][]>>;
  activeChatIndex: number;
  setActiveChatIndex: React.Dispatch<React.SetStateAction<number>>;
}) {
  const { user } = useAuth();
  const storage = useStorage();
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<ChatMessage['attachment'] | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTo({ top: scrollAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [chatSessions, activeChatIndex]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !storage || !user?.companyId) return;

    setIsLoading(true);
    setUploadProgress(0);

    const fileId = uuidv4();
    const storagePath = `uploads/${user.companyId}/${fileId}/${file.name}`;
    const storageRef = ref(storage, storagePath);
    const uploadTask = uploadBytesResumable(storageRef, file);

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (e) => {
      const localPreview = e.target?.result as string;

      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error("Upload failed:", error);
          toast({ variant: 'destructive', title: 'File Upload Failed', description: 'Could not upload the file. Please try again.' });
          setIsLoading(false);
          setUploadProgress(null);
        },
        async () => {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          setAttachment({
            name: file.name,
            type: file.type,
            url: downloadURL,
            localPreview,
          });
          setUploadProgress(null);
          setIsLoading(false);
          toast({ title: 'File Uploaded', description: `${file.name} is ready to be sent.` });
        }
      );
    };
  };

  const handleSendMessage = async () => {
    if ((!question.trim() && !attachment) || !user?.companyId) return;

    const userMessage: ChatMessage = {
      role: 'user',
      content: question,
      ...(attachment && { attachment }),
    };

    const currentMessages = [...chatSessions[activeChatIndex], userMessage];
    const newChatSessions = [...chatSessions];
    newChatSessions[activeChatIndex] = currentMessages;
    setChatSessions(newChatSessions);
    
    setQuestion('');
    setAttachment(null);
    if(fileInputRef.current) fileInputRef.current.value = '';
    setIsLoading(true);

    try {
      const result = await queryData({ question, companyId: user.companyId, fileUrl: attachment?.url });
      const updatedMessages = [...currentMessages, { role: 'assistant', content: result.answer }];
      const updatedChatSessions = [...chatSessions];
      updatedChatSessions[activeChatIndex] = updatedMessages;
      setChatSessions(updatedChatSessions);

    } catch (error: any) {
      console.error('AI query failed:', error);
      toast({
        variant: 'destructive',
        title: 'AI Query Failed',
        description: error.message || 'The AI could not answer your question at this time.',
      });
       const errorMessages = [...currentMessages, { role: 'assistant', content: "Sorry, I encountered an error and couldn't answer your question." }];
       const updatedChatSessions = [...chatSessions];
       updatedChatSessions[activeChatIndex] = errorMessages;
       setChatSessions(updatedChatSessions);
    } finally {
      setIsLoading(false);
    }
  };
  
  const startNewChat = () => {
      setChatSessions(prev => [...prev, []]);
      setActiveChatIndex(chatSessions.length);
  }

  const activeChat = chatSessions[activeChatIndex] || [];

  return (
    <Card className="h-[70vh] flex flex-row">
        <div className="w-1/4 border-r flex flex-col">
            <div className="p-2 border-b">
                 <Button className="w-full" variant="outline" onClick={startNewChat}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Chat
                </Button>
            </div>
            <ScrollArea className="flex-grow">
                <div className="p-2 space-y-1">
                    {chatSessions.map((session, index) => {
                        if (session.length === 0 && chatSessions.length > 1) return null;
                        const title = session[0]?.content ? session[0].content : 'New Chat';
                        return (
                             <Button
                                key={index}
                                variant={activeChatIndex === index ? 'secondary' : 'ghost'}
                                className="w-full justify-start text-left h-auto py-2"
                                onClick={() => setActiveChatIndex(index)}
                            >
                                <MessageSquare className="h-4 w-4 mr-2 shrink-0" />
                                <span className="truncate flex-1">{title}</span>
                            </Button>
                        )
                    })}
                </div>
            </ScrollArea>
        </div>
        <div className="w-3/4 flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Sparkles className="text-primary" />
                Chat with your Data
                </CardTitle>
                <CardDescription>
                Ask questions about your assets, work orders, and more. Attach documents or images for context.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow overflow-hidden flex flex-col p-4">
                <ScrollArea className="flex-grow mb-4 pr-4" ref={scrollAreaRef}>
                <div className="space-y-4">
                    {activeChat.length === 0 && (
                    <div className="text-center text-muted-foreground pt-10">
                        <p>Ask a question to get started, e.g.,</p>
                        <p className="italic">"How many assets are currently down for maintenance?"</p>
                    </div>
                    )}
                    {activeChat.map((msg, index) => (
                      <div key={index} className={`flex items-start gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                          {msg.role === 'assistant' && <div className="p-2 bg-primary text-primary-foreground rounded-full"><Sparkles className="h-4 w-4" /></div>}
                          <div className={`p-3 rounded-lg max-w-[80%] ${msg.role === 'user' ? 'bg-muted' : 'bg-secondary'}`}>
                              {msg.attachment && (
                                <div className="mb-2 p-2 border rounded-md bg-background">
                                  {msg.attachment.type.startsWith('image/') ? (
                                    <Image src={msg.attachment.localPreview || msg.attachment.url} alt={msg.attachment.name} width={150} height={150} className="rounded-md object-cover"/>
                                  ) : (
                                    <div className="flex items-center gap-2 text-sm">
                                      <Paperclip className="h-4 w-4" />
                                      <span>{msg.attachment.name}</span>
                                    </div>
                                  )}
                                </div>
                              )}
                              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                          {msg.role === 'user' && <div className="p-2 bg-muted rounded-full"><User className="h-4 w-4" /></div>}
                      </div>
                    ))}
                    {isLoading && !uploadProgress && (
                    <div className="flex items-start gap-3">
                        <div className="p-2 bg-primary text-primary-foreground rounded-full"><LoaderCircle className="h-4 w-4 animate-spin" /></div>
                        <div className="p-3 rounded-lg bg-secondary">
                        <p className="text-sm text-muted-foreground italic">Thinking...</p>
                        </div>
                    </div>
                    )}
                </div>
                </ScrollArea>
                <div className="space-y-2 pt-4 border-t">
                  {attachment && (
                    <div className="p-2 border rounded-md flex items-center justify-between text-sm bg-muted">
                        <div className="flex items-center gap-2 truncate">
                          {attachment.type.startsWith('image/') ? (
                            <Image src={attachment.localPreview || attachment.url} alt={attachment.name} width={24} height={24} className="rounded object-cover"/>
                          ) : (
                            <Paperclip className="h-4 w-4 flex-shrink-0" />
                          )}
                          <span className="truncate">{attachment.name}</span>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setAttachment(null); if (fileInputRef.current) fileInputRef.current.value = ''; }}>
                            <X className="h-4 w-4"/>
                        </Button>
                    </div>
                  )}
                  {uploadProgress !== null && (
                    <div className="space-y-1">
                      <Progress value={uploadProgress} />
                      <p className="text-xs text-muted-foreground text-center">Uploading... {Math.round(uploadProgress)}%</p>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input
                        placeholder="Ask about your assets, work orders, etc."
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        disabled={isLoading}
                    />
                     <Button variant="ghost" size="icon" onClick={() => fileInputRef.current?.click()} disabled={isLoading}>
                      <Paperclip className="h-5 w-5" />
                    </Button>
                    <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />
                    <Button onClick={handleSendMessage} disabled={isLoading || (!question.trim() && !attachment)}>
                        <Send className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
            </CardContent>
        </div>
    </Card>
  )
}


type DialogDataType = 'assets' | 'categories';

function DataDisplayDialog({ open, onOpenChange, title, data, type }: { open: boolean, onOpenChange: (open: boolean) => void, title: string, data: any[], type: DialogDataType }) {
    
    const handleExport = () => {
        let dataToExport: any[];
        let fileName = `${title.replace(/\s+/g, '_')}_Report.xlsx`;

        if (type === 'assets') {
            dataToExport = data.map((asset: Asset) => ({
                'Asset Name': asset.name,
                'Model': asset.model,
                'Serial Number': asset.serialNumber,
                'Installation Date': asset.installationDate ? format(parseISO(asset.installationDate), 'PPP') : 'N/A',
                'Customer ID': asset.customerId,
                'Location': asset.location
            }));
        } else { // categories
            dataToExport = data.map((category: { name: string, total: number }) => ({
                'Category Name': category.name,
                'Asset Count': category.total,
            }));
        }

        const worksheet = xlsx.utils.json_to_sheet(dataToExport);
        const workbook = xlsx.utils.book_new();
        xlsx.utils.book_append_sheet(workbook, worksheet, "Data");
        xlsx.writeFile(workbook, fileName);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogHeader>
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>
                        A list of all items related to this metric.
                    </DialogDescription>
                </DialogHeader>
                <div className="max-h-[60vh] overflow-y-auto">
                    {type === 'assets' ? (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Asset Name</TableHead>
                                    <TableHead>Model</TableHead>
                                    <TableHead>Serial Number</TableHead>
                                    <TableHead>Installed On</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length > 0 ? (
                                    data.map((asset) => (
                                        <TableRow key={asset.id}>
                                            <TableCell>{asset.name}</TableCell>
                                            <TableCell>{asset.model}</TableCell>
                                            <TableCell>{asset.serialNumber}</TableCell>
                                            <TableCell>
                                                {asset.installationDate && isValid(parseISO(asset.installationDate))
                                                    ? format(parseISO(asset.installationDate), 'PPP')
                                                    : 'N/A'}
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">
                                            No assets to display for this metric.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    ) : (
                         <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Category Name</TableHead>
                                    <TableHead className="text-right">Asset Count</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                 {data.length > 0 ? (
                                    data.map((category) => (
                                        <TableRow key={category.name}>
                                            <TableCell>{category.name}</TableCell>
                                            <TableCell className="text-right"><Badge variant="secondary">{category.total}</Badge></TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                     <TableRow>
                                        <TableCell colSpan={2} className="h-24 text-center">
                                            No categories to display.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    )}
                </div>
                 <DialogFooter>
                    <Button variant="outline" onClick={handleExport}>
                        <Download className="mr-2 h-4 w-4" />
                        Export to Excel
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}


export default function ReportsPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTitle, setDialogTitle] = useState('');
  const [dialogData, setDialogData] = useState<any[]>([]);
  const [dialogType, setDialogType] = useState<DialogDataType>('assets');
  
  const [chatSessions, setChatSessions] = useState<ChatMessage[][]>([[]]);
  const [activeChatIndex, setActiveChatIndex] = useState(0);


  useEffect(() => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }
    const assetsQuery = query(
      collection(db, 'assets'),
      where('companyId', '==', user.companyId)
    );
    const unsubscribe = onSnapshot(assetsQuery, (snapshot) => {
      const assetsData: Asset[] = [];
      snapshot.forEach((doc) =>
        assetsData.push({ id: doc.id, ...doc.data() } as Asset)
      );
      setAssets(assetsData);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  const assetCategories = useMemo(() => {
    const categoryCount: Record<string, number> = {};
    assets.forEach((asset) => {
      categoryCount[asset.name] = (categoryCount[asset.name] || 0) + 1;
    });
    return Object.entries(categoryCount)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }, [assets]);

  const newAssetsThisMonth = useMemo(
    () =>
      assets.filter((asset) => {
        if (!asset.installationDate || !isValid(parseISO(asset.installationDate))) return false;
        return isThisMonth(parseISO(asset.installationDate));
      }),
    [assets]
  );
  
  const assetsNearEOL = useMemo(() => {
    const now = new Date();
    return assets.filter(asset => {
        if (!asset.installationDate || !isValid(parseISO(asset.installationDate))) return false;
        const installDate = parseISO(asset.installationDate);

        const warrantyDate = asset.warrantyExpiry ? parseISO(asset.warrantyExpiry) : null;
        
        const isOld = differenceInYears(now, installDate) >= 5;
        const isWarrantyExpired = warrantyDate && isValid(warrantyDate) ? now > warrantyDate : false;
        
        return isOld || isWarrantyExpired;
    })
  }, [assets]);

  const handleKpiClick = (title: string, data: any[], type: DialogDataType) => {
    setDialogTitle(title);
    setDialogData(data);
    setDialogType(type);
    setDialogOpen(true);
  };

  const now = new Date();
  const dateRanges = {
      monthly: { start: startOfMonth(now), end: endOfMonth(now) },
      quarterly: { start: startOfQuarter(now), end: endOfQuarter(now) },
      yearly: { start: startOfYear(now), end: endOfYear(now) },
  }


  if (isLoading) {
    return (
      <div className="flex h-[80vh] w-full items-center justify-center">
        <LoaderCircle className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  return (
    <>
      <DataDisplayDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={dialogTitle}
        data={dialogData}
        type={dialogType}
      />
      <div className="space-y-6">
        <div className="flex items-center">
          <h1 className="text-3xl font-bold tracking-tight">Reports</h1>
        </div>

        <Tabs defaultValue="overview">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
            <TabsTrigger value="yearly">Yearly</TabsTrigger>
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="mt-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <ReportKpiCard
                  title="Total Assets"
                  value={assets.length.toString()}
                  change=""
                  Icon={Package}
                  changeType="increase"
                  onClick={() => handleKpiClick('Total Assets', assets, 'assets')}
                />
                <ReportKpiCard
                  title="Asset Categories"
                  value={assetCategories.length.toString()}
                  change=""
                  Icon={Layers}
                  changeType="increase"
                   onClick={() => handleKpiClick('Asset Categories', assetCategories, 'categories')}
                />
                <ReportKpiCard
                  title="New This Month"
                  value={newAssetsThisMonth.length.toString()}
                  change=""
                  Icon={PackagePlus}
                  changeType="increase"
                  onClick={() => handleKpiClick('New Assets This Month', newAssetsThisMonth, 'assets')}
                />
                <ReportKpiCard
                  title="Nearing End-of-Life"
                  value={assetsNearEOL.length.toString()}
                  change=""
                  Icon={ShieldAlert}
                  changeType="decrease"
                  onClick={() => handleKpiClick('Assets Nearing End-of-Life', assetsNearEOL, 'assets')}
                />
              </div>
              <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 mt-6">
                <Card className="lg:col-span-3">
                  <CardHeader>
                    <CardTitle>Asset Category Distribution</CardTitle>
                    <CardDescription>
                      A breakdown of all managed assets by their category.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={assetCategories}>
                        <XAxis
                          dataKey="name"
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          angle={-25}
                          textAnchor="end"
                          height={60}
                        />
                        <YAxis
                          stroke="#888888"
                          fontSize={12}
                          tickLine={false}
                          axisLine={false}
                          tickFormatter={(value) => `${value}`}
                        />
                        <Tooltip
                          cursor={{ fill: 'hsl(var(--muted))' }}
                          contentStyle={{
                            backgroundColor: 'hsl(var(--background))',
                            border: '1px solid hsl(var(--border))',
                          }}
                        />
                        <Bar
                          dataKey="total"
                          fill="hsl(var(--primary))"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                  <CardHeader>
                    <CardTitle>Recently Added Assets</CardTitle>
                    <CardDescription>
                      New equipment onboarded this month.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Asset Name</TableHead>
                          <TableHead>Installed On</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {newAssetsThisMonth.length > 0 ? (
                          newAssetsThisMonth.slice(0,5).map((asset) => (
                            <TableRow key={asset.id}>
                              <TableCell>
                                <div className="font-medium">{asset.name}</div>
                                <div className="text-xs text-muted-foreground">{asset.serialNumber}</div>
                              </TableCell>
                              <TableCell>
                                {asset.installationDate && isValid(parseISO(asset.installationDate)) ? format(parseISO(asset.installationDate), 'PPP') : 'N/A'}
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={2} className="h-24 text-center">
                              No new assets added this month.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
          </TabsContent>
          <TabsContent value="monthly" className="mt-6">
             <ReportView title="Monthly Report" assets={assets} dateRange={dateRanges.monthly} />
          </TabsContent>
          <TabsContent value="quarterly" className="mt-6">
             <ReportView title="Quarterly Report" assets={assets} dateRange={dateRanges.quarterly} />
          </TabsContent>
          <TabsContent value="yearly" className="mt-6">
            <ReportView title="Yearly Report" assets={assets} dateRange={dateRanges.yearly} />
          </TabsContent>
           <TabsContent value="chat" className="mt-6">
            <ReportChat 
                chatSessions={chatSessions}
                setChatSessions={setChatSessions}
                activeChatIndex={activeChatIndex}
                setActiveChatIndex={setActiveChatIndex}
            />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
}
