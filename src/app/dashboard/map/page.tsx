
import Image from 'next/image';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { users, workOrders } from '@/lib/data';
import { Wrench, User } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const mapImage = PlaceHolderImages.find(img => img.id === 'map-background');
const technicians = users.filter(u => u.role === 'Technician');
const activeWorkOrders = workOrders.filter(wo => wo.status === 'In-Progress' || wo.status === 'Scheduled');

// Simple hash function to get a pseudo-random position
const getPosition = (id: string) => {
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
        const char = id.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    const x = (Math.abs(hash) % 80) + 10; // 10% to 90%
    const y = (Math.abs(hash * 31) % 70) + 15; // 15% to 85%
    return { top: `${y}%`, left: `${x}%` };
};


export default function MapPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-10rem)]">
      <div className="lg:col-span-2 relative rounded-lg overflow-hidden shadow-lg h-[50vh] lg:h-full">
        {mapImage && 
            <Image
                src={mapImage.imageUrl}
                alt="Map of the city"
                fill
                className="object-cover"
                data-ai-hint={mapImage.imageHint}
            />
        }
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Technician Markers */}
        {technicians.map(tech => (
            <div key={tech.id} className="absolute" style={getPosition(tech.id)}>
                <div className="relative group">
                    <Avatar className="h-10 w-10 border-4 border-primary shadow-lg">
                        <AvatarImage src={tech.avatarUrl} alt={tech.name} />
                        <AvatarFallback>{tech.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                     <div className="absolute bottom-full mb-2 w-max left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {tech.name}
                    </div>
                </div>
            </div>
        ))}

        {/* Work Order Markers */}
        {activeWorkOrders.map(wo => (
             <div key={wo.id} className="absolute" style={getPosition(wo.customerId)}>
                <div className="relative group">
                    <div className="h-8 w-8 bg-accent rounded-full flex items-center justify-center border-2 border-accent-foreground shadow-md">
                        <Wrench className="h-4 w-4 text-accent-foreground" />
                    </div>
                    <div className="absolute bottom-full mb-2 w-max left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs rounded py-1 px-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {wo.title}
                    </div>
                </div>
            </div>
        ))}
      </div>
      <Card className="overflow-hidden">
        <CardHeader>
          <CardTitle>Live Status</CardTitle>
          <CardDescription>Technicians and active jobs.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-y-auto h-full pb-20">
            <h3 className="font-semibold text-sm mb-2">Technicians</h3>
            <ul className="space-y-4 mb-6">
                {technicians.map(tech => (
                    <li key={tech.id} className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                            <AvatarImage src={tech.avatarUrl} alt={tech.name} />
                            <AvatarFallback>{tech.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium text-sm">{tech.name}</p>
                            <p className="text-xs text-muted-foreground">On-site: WO-003</p>
                        </div>
                    </li>
                ))}
            </ul>

            <h3 className="font-semibold text-sm mb-2">Active Jobs</h3>
            <ul className="space-y-4">
                 {activeWorkOrders.map(wo => (
                    <li key={wo.id} className="flex items-start gap-3">
                       <div className="h-9 w-9 bg-muted rounded-full flex items-center justify-center shrink-0">
                            <Wrench className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="font-medium text-sm">{row.title}</p>
                            <p className="text-xs text-muted-foreground">{row.status}</p>
                        </div>
                    </li>
                 ))}
            </ul>
        </CardContent>
      </Card>
    </div>
  );
}
