"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Search, Clock, Calendar, ChevronRight, BookOpen } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { GlassCard } from "@/components/ui/glass-card";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { BlogPost } from "@/lib/blog-data";

interface BlogListProps {
  initialPosts: BlogPost[];
}

export default function BlogList({ initialPosts }: BlogListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const categories = ["All", ...Array.from(new Set(initialPosts.map((post) => post.category)))];

  const filteredPosts = initialPosts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "All" || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const featuredPost = initialPosts[0];
  
  // Logic: maintain same featured post logic as before
  const isFiltering = searchQuery !== "" || selectedCategory !== "All";
  const displayPosts = isFiltering ? filteredPosts : initialPosts.slice(1);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-slate-900 text-white pb-20 pt-32">
        <div className="absolute inset-0 z-0 opacity-20">
            <AuroraBackground className="h-full w-full pointer-events-none" />
        </div>
        
        <div className="container relative z-10 mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Badge className="mb-4 bg-blue-600 hover:bg-blue-700 text-white border-none px-4 py-1.5 text-sm">
              Knowledge Hub
            </Badge>
            <h1 className="mb-6 text-4xl font-bold leading-tight md:text-6xl lg:text-7xl bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              ศูนย์การเรียนรู้ & ข่าวสารภัยไซเบอร์
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-slate-300 md:text-xl">
              รู้ทันกลโกง อัปเดตข่าวสาร และวิธีป้องกันตัวจากมิจฉาชีพ 
              เพื่อให้คุณปลอดภัยในโลกออนไลน์
            </p>
          </motion.div>

          {/* Search Bar */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="mx-auto mt-10 max-w-xl relative"
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
              <Input 
                type="text" 
                placeholder="ค้นหาบทความ..." 
                className="h-14 rounded-full border-slate-700 bg-slate-800/50 pl-12 pr-4 text-lg text-white backdrop-blur-sm focus:border-blue-500 focus:ring-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-16">
        {/* Categories */}
        <div className="mb-12 flex flex-wrap justify-center gap-3">
          {categories.map((category) => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={`rounded-full px-6 ${
                selectedCategory === category 
                  ? "bg-blue-600 hover:bg-blue-700 text-white" 
                  : "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
              }`}
            >
              {category === "All" ? "ทั้งหมด" : category}
            </Button>
          ))}
        </div>

        {/* Featured Post (Only show if not filtering, or if it matches search) */}
        {!isFiltering && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-16"
          >
            <Link href={`/blog/${featuredPost.slug}`}>
              <div className="group relative overflow-hidden rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl transition-all hover:shadow-2xl">
                <div className="grid md:grid-cols-2">
                  <div className="relative h-64 md:h-full overflow-hidden">
                    <Image 
                      src={featuredPost.coverImage} 
                      alt={featuredPost.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                    <div className="absolute top-4 left-4 z-10">
                      <Badge className="bg-blue-600/90 text-white backdrop-blur-sm border-none">
                        Featured
                      </Badge>
                    </div>
                  </div>
                  <div className="flex flex-col justify-center p-8 md:p-12">
                    <div className="mb-4 flex items-center gap-4 text-sm text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" /> {featuredPost.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-4 w-4" /> {featuredPost.readTime}
                      </span>
                    </div>
                    <h2 className="mb-4 text-3xl font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {featuredPost.title}
                    </h2>
                    <p className="mb-8 text-lg text-slate-600 dark:text-slate-300 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                    <div className="flex items-center text-blue-600 dark:text-blue-400 font-medium group-hover:underline">
                      อ่านต่อ <ChevronRight className="ml-1 h-4 w-4" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        {/* Post Grid */}
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
          {displayPosts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
            >
              <Link href={`/blog/${post.slug}`}>
                <GlassCard className="h-full overflow-hidden transition-all hover:shadow-lg hover:-translate-y-1 group">
                  <div className="relative h-48 overflow-hidden">
                    <Image
                      src={post.coverImage} 
                      alt={post.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute top-3 left-3 z-10">
                      <Badge variant="secondary" className="backdrop-blur-md bg-white/80 dark:bg-black/60">
                        {post.category}
                      </Badge>
                    </div>
                  </div>
                  <CardHeader className="pb-2">
                    <div className="mb-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" /> {post.date}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" /> {post.readTime}
                      </span>
                    </div>
                    <h3 className="line-clamp-2 text-xl font-bold group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {post.title}
                    </h3>
                  </CardHeader>
                  <CardContent>
                    <p className="line-clamp-3 text-sm text-slate-600 dark:text-slate-300">
                      {post.excerpt}
                    </p>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400">
                      อ่านบทความ <ChevronRight className="ml-1 h-3 w-3" />
                    </div>
                  </CardFooter>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>

        {displayPosts.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 mb-4">
              <BookOpen className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white">ไม่พบบทความที่ค้นหา</h3>
            <p className="text-slate-500 dark:text-slate-400">ลองใช้คำค้นหาอื่น หรือเลือกหมวดหมู่ &quot;ทั้งหมด&quot;</p>
          </div>
        )}
      </div>
    </div>
  );
}
