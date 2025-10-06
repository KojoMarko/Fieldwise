
'use client';
import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Search,
  Filter,
  Book,
  FileText,
  BookOpen,
  Download,
} from 'lucide-react';
import { resources } from '@/lib/data';
import type { Resource } from '@/lib/types';

function ResourceCard({ resource }: { resource: Resource }) {
  return (
    <Card className="flex flex-col">
      <CardContent className="p-6 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-4">
          <BookOpen className="h-6 w-6 text-muted-foreground" />
          <Badge variant="outline">{resource.category}</Badge>
        </div>
        <div className="flex-grow">
          <h3 className="text-lg font-semibold mb-1">{resource.title}</h3>
          <p className="text-sm text-muted-foreground mb-2">
            {resource.equipment}
          </p>
          <p className="text-sm text-muted-foreground/80 mb-4">
            {resource.description}
          </p>
        </div>
        <div className="text-xs text-muted-foreground flex items-center gap-4 mb-6">
          <div className="flex items-center gap-1">
            <FileText className="h-3 w-3" />
            <span>{resource.pages} pages</span>
          </div>
          <span>{resource.version}</span>
          <span>Updated {new Date(resource.updatedDate).toLocaleDateString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button className="w-full">View Document</Button>
          <Button variant="outline" className="w-full">
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function ResourcesPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const categories = useMemo(
    () => [...new Set(resources.map((r) => r.category))],
    []
  );
  const types = useMemo(
    () => [...new Set(resources.map((r) => r.type))],
    []
  );

  const filteredResources = useMemo(() => {
    return resources.filter((resource) => {
      const searchTermLower = searchTerm.toLowerCase();
      const matchesSearch =
        resource.title.toLowerCase().includes(searchTermLower) ||
        resource.equipment.toLowerCase().includes(searchTermLower) ||
        resource.description.toLowerCase().includes(searchTermLower);

      const matchesCategory =
        categoryFilter === 'all' || resource.category === categoryFilter;
      const matchesType = typeFilter === 'all' || resource.type === typeFilter;

      return matchesSearch && matchesCategory && matchesType;
    });
  }, [searchTerm, categoryFilter, typeFilter]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Resource Center</h1>
        <p className="text-muted-foreground">
          Find technical manuals, guides, and documentation.
        </p>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search by equipment, title, or keyword..."
              className="pl-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex items-center gap-2 flex-1">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue placeholder="All Categories" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {types.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>
      
      {filteredResources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredResources.map((resource) => (
            <ResourceCard key={resource.id} resource={resource} />
            ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center rounded-md border-2 border-dashed py-20 text-center">
            <Book className="h-12 w-12 text-muted-foreground" />
            <p className="mt-4 font-semibold">No Resources Found</p>
            <p className="text-sm text-muted-foreground">
                Your search and filters did not match any documents.
            </p>
        </div>
      )}

    </div>
  );
}
