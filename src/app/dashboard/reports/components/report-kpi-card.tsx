
'use client';
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingDown, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ReportKpiCard({ title, value, change, Icon, changeType, onClick }: { title: string, value: string, change: string, Icon: React.ElementType, changeType: 'increase' | 'decrease', onClick?: () => void }) {
    const isClickable = !!onClick;

    return (
        <Card 
            onClick={onClick}
            className={cn(isClickable && 'cursor-pointer hover:bg-accent transition-colors')}
        >
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardDescription>{title}</CardDescription>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </div>
            </CardHeader>
            <CardContent>
                <h3 className="text-2xl font-bold">{value}</h3>
                {change.trim() && (
                    <div className={`flex items-center gap-1 text-xs mt-1 ${changeType === 'increase' ? 'text-green-600' : 'text-red-600'}`}>
                        {changeType === 'increase' ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>{change} from last period</span>
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
