'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Phone, Send } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const tasks = [
    { id: 'task-1', description: 'Follow up with Acme Corp', time: '10:00 AM', icon: Phone, completed: false },
    { id: 'task-2', description: 'Send proposal to TechStact', time: '11:30 AM', icon: Send, completed: false },
    { id: 'task-3', description: 'Internal sales sync meeting', time: '2:00 PM', icon: Users, completed: true },
];

export function TodaysTasks() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Tasks</CardTitle>
        <CardDescription>Stay on top of your activities</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {tasks.map((task) => (
            <div key={task.id} className="flex items-center gap-4">
                <Checkbox id={task.id} checked={task.completed} />
                <div className='flex-grow'>
                    <label htmlFor={task.id} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">{task.description}</label>
                    <p className="text-sm text-muted-foreground">{task.time}</p>
                </div>
            </div>
        ))}
      </CardContent>
    </Card>
  );
}

// Dummy Users icon for compilation
const Users = (props: any) => (
  <svg
    {...props}
    xmlns="http://www.w3.org/2000/svg"
    width="24"
    height="24"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
