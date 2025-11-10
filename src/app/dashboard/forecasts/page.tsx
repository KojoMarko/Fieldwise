
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function ForecastsPage() {
  return (
    <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
        <Card className="w-full max-w-md text-center">
            <CardHeader>
                <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                    <TrendingUp className="h-10 w-10 text-muted-foreground" />
                </div>
                <CardTitle className="mt-4">Sales Forecasting Under Construction</CardTitle>
                <CardDescription>This feature is temporarily disabled while we work on improvements. We'll have it back up and running soon!</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">Thank you for your patience.</p>
            </CardContent>
        </Card>
    </div>
  );
}
