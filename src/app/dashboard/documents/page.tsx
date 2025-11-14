
'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { BookText } from 'lucide-react';

export default function DeprecatedDocumentsPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/dashboard/resources');
    }, [router]);

    return (
        <div className="flex items-center justify-center h-[calc(100vh-10rem)]">
            <Card className="w-full max-w-md text-center">
                <CardHeader>
                    <div className="mx-auto bg-muted rounded-full p-3 w-fit">
                        <BookText className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <CardTitle className="mt-4">Page Moved</CardTitle>
                    <CardDescription>The Document Center has been moved. You are being redirected...</CardDescription>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">If you are not redirected, please click the "Resources" tab in the main navigation.</p>
                </CardContent>
            </Card>
        </div>
    );
}
