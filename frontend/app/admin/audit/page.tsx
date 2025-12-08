"use client";

import { useEffect, useState } from "react";
import { AdminLayout } from "@/components/AdminLayout";
import { PageHeader } from "@/components/admin/PageHeader";
import { PremiumTable } from "@/components/admin/PremiumTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getAuditLogs, AuditLog } from "../../../lib/admin-api";
import { format } from "date-fns";
import { ClipboardList, Globe, RefreshCw, Eye } from "lucide-react";
import { toast } from "sonner";

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [actionFilter, setActionFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, [page, actionFilter]);

  const loadData = async () => {
    setLoading(true);
    try {
      const data = await getAuditLogs(page, 50, actionFilter);
      setLogs(data.items);
      setTotalItems(data.total);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
      toast.error("Failed to load audit logs");
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "CREATE_USER": return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300 border-green-200 dark:border-green-800";
      case "DELETE_USER": return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300 border-red-200 dark:border-red-800";
      case "BAN_USER": return "bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300 border-orange-200 dark:border-orange-800";
      case "UNBAN_USER": return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 border-blue-200 dark:border-blue-800";
      case "RESET_PASSWORD": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800";
      default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300";
    }
  };

  const columns = [
    {
      header: "Timestamp",
      accessorKey: "created_at" as keyof AuditLog,
      cell: (item: AuditLog) => (
        <span className="font-mono text-xs text-muted-foreground">
          {format(new Date(item.created_at), "yyyy-MM-dd HH:mm:ss")}
        </span>
      ),
    },
    {
      header: "Actor",
      accessorKey: "actor_id" as keyof AuditLog,
      cell: (item: AuditLog) => (
         <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-bold text-primary">
                {item.actor_id.substring(0, 2).toUpperCase()}
            </div>
            <span className="font-medium text-xs truncate max-w-[120px]" title={item.actor_id}>
                {item.actor_id}
            </span>
         </div>
      ),
    },
    {
      header: "Action",
      accessorKey: "action" as keyof AuditLog,
      cell: (item: AuditLog) => (
        <Badge variant="outline" className={`${getActionColor(item.action)}`}>
          {item.action}
        </Badge>
      ),
    },
    {
      header: "Target",
      accessorKey: "target_id" as keyof AuditLog,
      cell: (item: AuditLog) => (
        <code className="bg-muted px-1.5 py-0.5 rounded text-xs font-mono text-muted-foreground truncate max-w-[150px] block" title={item.target_id}>
           {item.target_id || "-"}
        </code>
      ),
    },
    {
      header: "IP Address",
      accessorKey: "ip_address" as keyof AuditLog,
      cell: (item: AuditLog) => (
        <div className="flex items-center text-xs text-muted-foreground">
          <Globe className="h-3 w-3 mr-1.5 opacity-70" /> 
          {item.ip_address || "Unknown"}
        </div>
      ),
    },
    {
      header: "Details",
      className: "text-right",
      cell: (item: AuditLog) => (
        <div className="flex justify-end">
            <Dialog>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-primary/10 hover:text-primary transition-colors">
                    <Eye className="h-4 w-4" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-xl">
                <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                    <ClipboardList className="h-5 w-5 text-primary" />
                    Audit Log Details
                </DialogTitle>
                <DialogDescription>
                    Event ID: <span className="font-mono text-xs text-foreground">{item.id}</span>
                </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="space-y-1">
                            <span className="text-muted-foreground text-xs">Actor</span>
                            <div className="font-medium">{item.actor_id}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground text-xs">Action</span>
                            <div className="font-medium">{item.action}</div>
                        </div>
                        <div className="space-y-1">
                            <span className="text-muted-foreground text-xs">Date</span>
                            <div className="font-medium">{format(new Date(item.created_at), "PPpp")}</div>
                        </div>
                         <div className="space-y-1">
                            <span className="text-muted-foreground text-xs">IP Address</span>
                            <div className="font-medium">{item.ip_address}</div>
                        </div>
                    </div>
                    
                    <div className="space-y-2">
                        <span className="text-sm font-medium">Payload Data</span>
                        <ScrollArea className="h-[300px] w-full rounded-lg border bg-slate-950 p-4">
                        <pre className="text-xs font-mono text-blue-300 whitespace-pre-wrap leading-relaxed">
                            {item.details ? JSON.stringify(JSON.parse(item.details), null, 2) : "No details provided."}
                        </pre>
                        </ScrollArea>
                    </div>
                </div>
            </DialogContent>
            </Dialog>
        </div>
      ),
    },
  ];

  return (
    <AdminLayout>
      <PageHeader 
        title="System Audit Logs" 
        description="Track and monitor all administrative actions and system security events."
        icon={ClipboardList}
      >
        <Button variant="outline" size="sm" onClick={loadData} disabled={loading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </PageHeader>

      <PremiumTable 
        data={logs}
        columns={columns}
        totalItems={totalItems}
        page={page}
        pageSize={50}
        onPageChange={setPage}
        loading={loading}
        emptyMessage="No audit logs recorded yet."
        filters={
            <Select value={actionFilter} onValueChange={setActionFilter}>
            <SelectTrigger className="w-[180px] bg-background/50 backdrop-blur-sm">
                <SelectValue placeholder="All Actions" />
            </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                <SelectItem value="CREATE_USER">Create User</SelectItem>
                <SelectItem value="UPDATE_USER">Update User</SelectItem>
                <SelectItem value="BAN_USER">Ban User</SelectItem>
                <SelectItem value="UNBAN_USER">Unban User</SelectItem>
                <SelectItem value="DELETE_USER">Delete User</SelectItem>
                <SelectItem value="RESET_PASSWORD">Reset Password</SelectItem>
            </SelectContent>
            </Select>
        }
      />
    </AdminLayout>
  );
}
