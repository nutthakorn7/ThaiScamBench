"use client";

import { useEffect, useState, useCallback } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { PremiumTable } from "@/components/admin/PremiumTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BarChart3, RefreshCw } from "lucide-react";
import { getCategoryStats, type CategoryStats } from "@/lib/admin-api";
import { toast } from "sonner";

export default function CategoriesPage() {
  const [data, setData] = useState<CategoryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getCategoryStats(page, pageSize);
      setData(result);
    } catch (err) {
      console.error('Failed to load category stats:', err);
      toast.error("Failed to load category statistics");
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const columns = [
    {
      header: "Rank",
      cell: (item: any) => {
        const globalIndex = ((page - 1) * pageSize) + (data?.items.indexOf(item) || 0) + 1;
        return (
          <Badge variant="secondary" className="bg-muted text-muted-foreground w-8 h-8 flex items-center justify-center rounded-full p-0">
            #{globalIndex}
          </Badge>
        );
      },
      className: "w-[80px]",
    },
    {
      header: "Category",
      accessorKey: "category",
      cell: (item: any) => (
        <div className="flex flex-col">
            <span className="font-bold text-foreground capitalize text-base">
                {item.category.replace(/_/g, " ")}
            </span>
            <span className="text-xs text-muted-foreground">Scam Type</span>
        </div>
      ),
    },
    {
      header: "Count",
      accessorKey: "count",
      cell: (item: any) => (
        <div className="font-mono text-sm font-medium">{item.count.toLocaleString()} cases</div>
      ),
      className: "text-right",
    },
    {
      header: "Percentage",
      accessorKey: "percentage",
      cell: (item: any) => (
        <div className="font-mono text-sm text-muted-foreground">{item.percentage.toFixed(2)}%</div>
      ),
      className: "text-right",
    },
    {
      header: "Distribution",
      cell: (item: any) => (
        <div className="w-full max-w-[200px]">
          <div className="h-2 w-full bg-muted/50 rounded-full overflow-hidden">
            <div 
                className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full shadow-lg shadow-blue-500/20" 
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
            />
          </div>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Category Distribution" 
        description="Analyze the distribution of different spam and scam categories."
        icon={BarChart3}
      >
        <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      <PremiumTable 
        data={data?.items || []}
        columns={columns}
        totalItems={data?.total || 0}
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No category data found."
      />
    </AdminLayout>
  );
}
