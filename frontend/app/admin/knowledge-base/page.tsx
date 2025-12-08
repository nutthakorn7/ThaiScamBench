"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { PremiumTable } from "@/components/admin/PremiumTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BrainCircuit, Search, Plus, Sparkles, Image as ImageIcon, Trash2, Cpu } from "lucide-react";
import { 
    getKnowledgeBase, 
    searchKnowledgeBase, 
    deletePattern, 
    type KnowledgeBaseItem 
} from "@/lib/knowledge-base-api";
import { toast } from "sonner";
import { format } from "date-fns";

export default function KnowledgeBasePage() {
  const [items, setItems] = useState<KnowledgeBaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    loadData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = searchQuery 
        ? await searchKnowledgeBase(searchQuery)
        : await getKnowledgeBase();
      setItems(data);
    } catch (error) {
      console.error("Failed to load knowledge base:", error);
      toast.error("Failed to sync with Vector Database");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleDelete = async (id: string) => {
      try {
          await deletePattern(id);
          toast.success("Pattern removed from memory");
          loadData();
      } catch (error) {
          toast.error("Failed to delete pattern");
      }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const columns: any[] = [
      {
          header: "Pattern Signature",
          accessorKey: "image_url",
          cell: (item: KnowledgeBaseItem) => (
              <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-slate-100 dark:bg-slate-800 border flex items-center justify-center overflow-hidden relative">
                      <ImageIcon className="h-6 w-6 text-slate-400" />
                      {/* In real app: <Image src={item.image_url} ... /> */}
                  </div>
                  <div className="flex flex-col">
                      <span className="font-semibold text-sm">{item.pattern_name}</span>
                      <span className="text-xs text-muted-foreground font-mono">{item.id}</span>
                  </div>
              </div>
          )
      },
      {
          header: "Category",
          accessorKey: "category",
          cell: (item: KnowledgeBaseItem) => (
              <Badge variant="outline" className="capitalize">
                  {item.category?.replace('_', ' ') || 'Uncategorized'}
              </Badge>
          )
      },
      {
          header: "Confidence",
          accessorKey: "confidence",
          cell: (item: KnowledgeBaseItem) => (
              <div className="flex items-center gap-2">
                  <div className="h-1.5 w-16 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                          className="h-full bg-purple-500 rounded-full" 
                          style={{ width: `${item.confidence * 100}%` }}
                      />
                  </div>
                  <span className="text-xs font-mono">{(item.confidence * 100).toFixed(0)}%</span>
              </div>
          )
      },
      {
          header: "Vector ID",
          cell: (item: KnowledgeBaseItem) => (
              <div className="flex flex-col gap-1">
                  <div className="flex gap-0.5">
                      {item.vector_signature?.map((v, i) => (
                          <div key={i} 
                               className="w-1 h-4 rounded-[1px]" 
                               style={{ 
                                   backgroundColor: `rgba(147, 51, 234, ${v})` // Purple opacity based on value
                               }} 
                               title={`Dim ${i}: ${v}`}
                          />
                      )) || <span className="text-xs text-muted-foreground">-</span>}
                  </div>
                  <span className="text-[10px] text-muted-foreground">4096-dim</span>
              </div>
          )
      },
      {
        header: "Learned At",
        accessorKey: "learned_at",
        cell: (item: KnowledgeBaseItem) => (
            <span className="text-xs text-muted-foreground">
                {format(new Date(item.learned_at), "MMM d, yyyy")}
            </span>
        )
      },
      {
          header: "Action",
          cell: (item: KnowledgeBaseItem) => (
              <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => handleDelete(item.id)}>
                  <Trash2 className="h-4 w-4" />
              </Button>
          ),
          className: "text-right"
      }
  ];

  return (
    <AdminLayout>
        <PageHeader
            title="Adaptive Knowledge Base"
            description="Manage the visual patterns and signatures learned by the AI model."
            icon={BrainCircuit}
        >
            <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                <Plus className="h-4 w-4" />
                Upload Pattern
            </Button>
        </PageHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card className="bg-purple-50/50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-800">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">Total Patterns</CardTitle>
                    <BrainCircuit className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold text-purple-700 dark:text-purple-300">{items.length}</div>
                    <p className="text-xs text-purple-600/60 dark:text-purple-400/60">+2 learned today</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Memory Usage</CardTitle>
                    <Cpu className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">14.2 MB</div>
                    <p className="text-xs text-muted-foreground">Vector Index Size</p>
                </CardContent>
            </Card>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Auto-Block Rate</CardTitle>
                    <Sparkles className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                    <div className="text-2xl font-bold">94.8%</div>
                    <p className="text-xs text-muted-foreground">Pattern Match Accuracy</p>
                </CardContent>
            </Card>
        </div>

        <div className="space-y-4">
            <form onSubmit={handleSearch} className="flex w-full max-w-sm items-center space-x-2">
                <Input 
                    placeholder="Search vector signatures..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-background"
                />
                <Button type="submit" size="icon" variant="secondary">
                    <Search className="h-4 w-4" />
                </Button>
            </form>

            <PremiumTable
                data={items}
                columns={columns}
                totalItems={items.length}
                page={page}
                pageSize={10}
                onPageChange={setPage}
                loading={loading}
                emptyMessage="No patterns found in knowledge base."
            />
        </div>
    </AdminLayout>
  );
}
