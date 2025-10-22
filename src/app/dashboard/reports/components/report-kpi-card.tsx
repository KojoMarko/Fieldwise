
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from '@/components/ui/card';
import { TrendingDown, TrendingUp } from 'lucide-react';


export function ReportKpiCard({ title, value, change, Icon, changeType }: { title: string, value: string, change: string, Icon: React.ElementType, changeType: 'increase' | 'decrease' }) {
    return (
        <Card>
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
