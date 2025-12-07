"use client";

import { Facebook, Twitter, Linkedin, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ShareButtonsProps {
  slug: string;
  title: string;
}

export default function ShareButtons({ slug, title }: ShareButtonsProps) {
  // In a real app, these would open share dialogs
  // For now, we'll just implement a basic copy to clipboard or dummy implementation
  const shareUrl = process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/blog/${slug}` : `https://thaiscamdetector.com/blog/${slug}`;

  const handleShare = (platform: string) => {
    // Implement sharing logic here
    console.log(`Sharing on ${platform}: ${shareUrl}`);
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" className="rounded-full hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-slate-800" onClick={() => handleShare('facebook')}>
        <Facebook className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="rounded-full hover:bg-sky-50 hover:text-sky-500 dark:hover:bg-slate-800" onClick={() => handleShare('twitter')}>
        <Twitter className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="rounded-full hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-slate-800" onClick={() => handleShare('linkedin')}>
        <Linkedin className="h-4 w-4" />
      </Button>
      <Button variant="outline" size="icon" className="rounded-full hover:bg-slate-100 dark:hover:bg-slate-800" onClick={() => handleShare('copy')}>
        <Share2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
