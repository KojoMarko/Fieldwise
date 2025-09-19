
'use client';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { users } from '@/lib/data';
import { useAuth } from '@/hooks/use-auth';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();

  const handleLogin = (userId: string) => {
    login(userId);
  };
  
  useEffect(() => {
    if(!isLoading && user) {
        router.push('/dashboard')
    }
  }, [user, isLoading, router])


  if(isLoading) {
      return <div className="flex h-screen w-full items-center justify-center">Loading...</div>
  }
  
  if (user) {
    return null;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40">
      <Card className="w-full max-w-md">
        <CardHeader className="items-center text-center">
            <div
            className="group mb-4 flex h-12 w-12 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-10 md:w-10 md:text-base"
          >
            <Image src="/Field Wise Logo.png" width={24} height={24} alt="FieldWise Logo" className="h-6 w-6 transition-all group-hover:scale-110" />
            <span className="sr-only">FieldWise</span>
          </div>
          <CardTitle>Welcome to FieldWise</CardTitle>
          <CardDescription>Select a user to sign in</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {users.map((user) => (
            <Button
              key={user.id}
              variant="outline"
              className="w-full justify-start h-14"
              onClick={() => handleLogin(user.id)}
            >
              <Avatar className="mr-4">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <div className="text-left">
                <div className="font-semibold">{user.name}</div>
                <div className="text-sm text-muted-foreground">{user.role}</div>
              </div>
            </Button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
