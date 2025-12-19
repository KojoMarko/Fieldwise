
'use client';

import { useState, useRef, use } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronDown,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Code2,
  Link2,
  Image as ImageIcon,
  Film,
  UploadCloud,
} from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/hooks/use-auth';

function ArticleEditor() {
    const { user } = useAuth();
    const [coverImage, setCoverImage] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleCoverImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            setCoverImage(reader.result as string);
        };
        reader.readAsDataURL(file);
        }
    };

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <header className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <Avatar>
                         <AvatarImage src={user?.avatarUrl} />
                        <AvatarFallback>{user?.name?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{user?.name || "Caleb Senyah"}</p>
                        <p className="text-sm text-muted-foreground">Individual article</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline">Manage</Button>
                    <Button>Next</Button>
                </div>
            </header>

            <div className="bg-background rounded-lg border shadow-sm p-4">
                 <div className="flex items-center gap-2 p-2 border-b mb-4 sticky top-14 bg-background z-10">
                    <Button variant="ghost" size="sm" className="flex items-center gap-1">
                        Style <ChevronDown className="h-4 w-4" />
                    </Button>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                    <Button variant="ghost" size="icon"><Bold className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Italic className="h-4 w-4" /></Button>
                     <Separator orientation="vertical" className="h-6 mx-2" />
                    <Button variant="ghost" size="icon"><List className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><ListOrdered className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Quote className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon"><Code2 className="h-4 w-4" /></Button>
                    <Separator orientation="vertical" className="h-6 mx-2" />
                     <Button variant="ghost" size="icon"><Link2 className="h-4 w-4" /></Button>
                     <Button variant="ghost" size="icon"><ImageIcon className="h-4 w-4" /></Button>
                     <Button variant="ghost" size="icon"><Film className="h-4 w-4" /></Button>
                </div>
                <div className="px-2">
                    {coverImage ? (
                        <div className="mb-8 rounded-lg overflow-hidden border">
                            <Image src={coverImage} alt="Cover image" width={800} height={450} className="w-full h-auto object-cover" />
                        </div>
                    ) : (
                         <div className="mb-8 p-8 flex flex-col items-center justify-center border-2 border-dashed rounded-lg text-center bg-muted/50">
                            <UploadCloud className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium text-muted-foreground">Add a cover image or video to your article.</h3>
                            <Button variant="outline" className="mt-4" onClick={() => fileInputRef.current?.click()}>
                                Upload from computer
                            </Button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleCoverImageUpload}
                                className="hidden"
                                accept="image/*,video/*"
                            />
                        </div>
                    )}
                    
                    <Textarea
                        placeholder="Title"
                        className="text-4xl font-bold border-none shadow-none focus-visible:ring-0 p-0 h-auto resize-none mb-4"
                    />
                    <Textarea
                        placeholder="Write here. You can also include @mentions."
                        className="text-lg border-none shadow-none focus-visible:ring-0 p-0 h-auto resize-none min-h-[200px]"
                    />
                </div>
            </div>
        </div>
    );
}

export default function CreateArticlePage() {
    return <ArticleEditor />;
}
