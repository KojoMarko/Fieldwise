
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  // For now, we'll simulate login with the first admin user
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    login('user-1');
  };

  useEffect(() => {
    if (!isLoading && user) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router]);

  if (isLoading || user) {
    return <div className="flex h-screen w-full items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center items-center">
            <Link href="/" className="flex items-center gap-2 font-semibold mb-4">
                 <div
                    className="group flex h-16 w-16 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-14 md:w-14"
                >
                    <Image src="/Field Wise Logo.png" width={40} height={40} alt="FieldWise Logo" className="h-10 w-10 transition-all group-hover:scale-110" />
                    <span className="sr-only">FieldWise</span>
                </div>
            </Link>

          <CardTitle className="text-2xl">Login to your account</CardTitle>
          <CardDescription>
            Enter your email below to login
          </CardDescription>
        </CardHeader>
        <CardContent>
            <form onSubmit={handleLogin}>
                <div className="grid gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                    id="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                    defaultValue="harriet@example.com"
                    />
                </div>
                <div className="grid gap-2">
                    <div className="flex items-center">
                    <Label htmlFor="password">Password</Label>
                    <Link
                        href="#"
                        className="ml-auto inline-block text-sm underline"
                    >
                        Forgot your password?
                    </Link>
                    </div>
                    <Input id="password" type="password" required defaultValue="password" />
                </div>
                <Button type="submit" className="w-full">
                    Login
                </Button>
                </div>
            </form>
            <div className="mt-4 text-center text-sm">
                Don&apos;t have an account?{' '}
                <Link href="/signup" className="underline">
                Sign up
                </Link>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
