import { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { ArrowLeft, Calendar, Clock, User, Share2 } from "lucide-react";
import { blogPosts } from "@/lib/blog-data";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import ShareButtons from "@/components/Blog/ShareButtons";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    return {
      title: "Blog Post Not Found | ThaiScamDetector",
    };
  }

  return {
    title: `${post.title} | ThaiScamDetector`,
    description: post.description,
    keywords: post.keywords,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      url: `https://thaiscam.zcr.ai/blog/${post.slug}`,
      images: [
        {
          url: post.coverImage,
          width: 800,
          height: 600,
          alt: post.title,
        },
      ],
      publishedTime: post.dateISO,
      authors: [post.author],
    },
    alternates: {
      canonical: `https://thaiscam.zcr.ai/blog/${post.slug}`,
    },
  };
}

export default async function BlogPostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  
  const post = blogPosts.find((p) => p.slug === slug);

  if (!post) {
    notFound();
  }

  // Related posts (same category, exclude current)
  const relatedPosts = blogPosts
    .filter(p => p.category === post.category && p.id !== post.id)
    .slice(0, 2);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": post.title,
    "description": post.description,
    "image": [
      `https://thaiscamdetector.com${post.coverImage}`
    ],
    "datePublished": post.dateISO,
    "author": [{
        "@type": "Organization",
        "name": post.author,
        "url": "https://thaiscamdetector.com"
      }]
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      
      {/* Header Image */}
      <div className="relative h-[400px] w-full overflow-hidden">
        <div className="absolute inset-0 bg-slate-900/40 z-10" />
        <Image 
          src={post.coverImage} 
          alt={post.title}
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 z-20 flex flex-col justify-end container mx-auto px-4 pb-12">
          <Link href="/blog">
            <Button variant="ghost" className="text-white hover:text-white hover:bg-white/20 mb-6 pl-0">
              <ArrowLeft className="mr-2 h-4 w-4" /> กลับไปหน้ารวมบทความ
            </Button>
          </Link>
          <Badge className="w-fit mb-4 bg-blue-600 hover:bg-blue-700 text-white border-none">
            {post.category}
          </Badge>
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 leading-tight max-w-4xl">
            {post.title}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-slate-200 text-sm md:text-base">
            <span className="flex items-center gap-2">
              <User className="h-4 w-4" /> {post.author}
            </span>
            <span className="flex items-center gap-2">
              <Calendar className="h-4 w-4" /> {post.date}
            </span>
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> {post.readTime}
            </span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Main Content */}
        <article className="lg:col-span-8">
          <div className="prose prose-lg dark:prose-invert max-w-none 
            prose-headings:font-bold prose-headings:tracking-tight prose-headings:text-slate-900 dark:prose-headings:text-white
            prose-p:text-slate-600 dark:prose-p:text-slate-300 probe-p:leading-relaxed
            prose-a:text-blue-600 dark:prose-a:text-blue-400 prose-a:no-underline hover:prose-a:underline
            prose-strong:text-slate-900 dark:prose-strong:text-white
            prose-blockquote:border-l-4 prose-blockquote:border-blue-500 prose-blockquote:bg-slate-50 dark:prose-blockquote:bg-slate-900/50 prose-blockquote:py-2 prose-blockquote:px-4 prose-blockquote:rounded-r-lg
            prose-li:text-slate-600 dark:prose-li:text-slate-300
          ">
            <div dangerouslySetInnerHTML={{ __html: post.content }} />
          </div>

          <Separator className="my-12" />

          {/* Share Section */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-2">
              <Share2 className="h-5 w-5" /> แบ่งปันบทความนี้:
            </span>
            <ShareButtons slug={post.slug} title={post.title} />
          </div>
        </article>

        {/* Sidebar */}
        <aside className="lg:col-span-4 space-y-8">
          {/* Related Posts */}
          {relatedPosts.length > 0 && (
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-sm sticky top-24">
              <h3 className="text-xl font-bold mb-6 text-slate-900 dark:text-white">บทความที่เกี่ยวข้อง</h3>
              <div className="space-y-6">
                {relatedPosts.map((related) => (
                  <Link key={related.id} href={`/blog/${related.slug}`} className="group block">
                    <div className="relative aspect-video rounded-lg overflow-hidden mb-3">
                      <Image 
                        src={related.coverImage} 
                        alt={related.title}
                        fill
                        className="object-cover transition-transform duration-300 group-hover:scale-105"
                        sizes="(max-width: 768px) 100vw, 33vw"
                      />
                    </div>
                    <h4 className="font-semibold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-2 mb-2">
                      {related.title}
                    </h4>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                      {related.date}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}
          
          <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-8 text-white text-center">
            <h3 className="text-xl font-bold mb-4">ไม่มั่นใจว่าโดนหลอก?</h3>
            <p className="mb-6 text-blue-100">ตรวจสอบข้อความ ลิงก์ หรือเลขบัญชีต้องสงสัยได้ทันที ฟรี!</p>
            <Link href="/check">
              <Button className="w-full bg-white text-blue-600 hover:bg-blue-50">
                ตรวจสอบเลย
              </Button>
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
