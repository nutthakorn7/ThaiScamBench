"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { PremiumTable } from "@/components/admin/PremiumTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Users, RefreshCw, Crown, Medal } from "lucide-react";
import { getPartnerStats, type PartnerStats } from "@/lib/admin-api";
import { toast } from "sonner";

type PartnerItem = PartnerStats['items'][0];

export default function PartnersPage() {
  const [data, setData] = useState<PartnerStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page]);

  const loadData = async () => {
    setLoading(true);
    try {
      const result = await getPartnerStats(page, pageSize);
      setData(result);
    } catch (err) {
      console.error('Failed to load partner stats:', err);
      toast.error("Failed to load partner statistics");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    switch (index) {
      case 0: return <Crown className="h-4 w-4 text-yellow-500" />;
      case 1: return <Medal className="h-4 w-4 text-gray-400" />;
      case 2: return <Medal className="h-4 w-4 text-amber-600" />;
      default: return <span className="text-muted-foreground text-xs font-mono">#{index + 1}</span>;
    }
  };

  const columns = [
    {
      header: "Rank",
      cell: (item: PartnerItem) => {
        // Calculate index based on current page
        const globalIndex = ((page - 1) * pageSize) + (data?.items.indexOf(item) || 0);
        return (
          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-muted/50">
            {getRankIcon(globalIndex)}
          </div>
        );
      },
      className: "w-[80px] text-center",
    },
    {
      header: "Partner ID",
      accessorKey: "partner_id",
      cell: (item: PartnerItem) => (
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground">
          {item.partner_id}
        </code>
      ),
    },
    {
      header: "Name",
      accessorKey: "name",
      cell: (item: PartnerItem) => (
        <span className="font-medium text-foreground">{item.name}</span>
      ),
    },
    {
      header: "Total Requests",
      accessorKey: "total_requests",
      cell: (item: PartnerItem) => (
        <div className="font-mono text-sm">{item.total_requests.toLocaleString()}</div>
      ),
      className: "text-right",
    },
    {
      header: "Scam Detected",
      accessorKey: "scam_detected",
      cell: (item: PartnerItem) => (
        <div className="font-mono text-sm text-red-500 dark:text-red-400 font-semibold">
          {item.scam_detected.toLocaleString()}
        </div>
      ),
      className: "text-right",
    },
    {
      header: "Detection Rate",
      cell: (item: PartnerItem) => {
        const rate = (item.scam_detected / item.total_requests) * 100;
        let colorClass = "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 hover:bg-green-100"; // Low risk
        
        if (rate > 50) colorClass = "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 hover:bg-red-100"; // High scam rate
        else if (rate > 20) colorClass = "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 hover:bg-orange-100";

        return (
          <div className="flex justify-end">
            <Badge variant="secondary" className={`font-mono transition-colors ${colorClass}`}>
              {rate.toFixed(1)}%
            </Badge>
          </div>
        );
      },
      className: "text-right",
    },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="Partner Statistics" 
        description="Monitor partner performance and scam detection effectiveness."
        icon={Users}
      >
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
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
        emptyMessage="No partner data found."
      />
    </AdminLayout>
  );
}
