'use client';

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { users } from '@/lib/data';
import type { User } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  login: (userId: string) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    try {
      const storedUserId = localStorage.getItem('currentUserId');
      if (storedUserId) {
        const currentUser = users.find(u => u.id === storedUserId);
        setUser(currentUser || null);
      }
    } catch (error) {
        console.error("Could not access local storage:", error)
    } finally {
        setIsLoading(false);
    }
  }, []);

  const login = useCallback((userId: string) => {
    const userToLogin = users.find(u => u.id === userId);
    if (userToLogin) {
      localStorage.setItem('currentUserId', userId);
      setUser(userToLogin);
      router.push('/dashboard');
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem('currentUserId');
    setUser(null);
    router.push('/login');
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
