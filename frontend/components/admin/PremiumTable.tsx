"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ChevronLeft, ChevronRight, Loader2, FileText } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface Column<T> {
  header: string;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
}

interface PremiumTableProps<T> {
  data: T[];
  columns: Column<T>[];
  totalItems: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  loading?: boolean;
  searchable?: boolean;
  searchPlaceholder?: string;
  onSearch?: (term: string) => void;
  filters?: React.ReactNode;
  emptyMessage?: string;
}

export function PremiumTable<T extends { id: string | number }>({
  data,
  columns,
  totalItems,
  page,
  pageSize,
  onPageChange,
  loading = false,
  searchable = false,
  searchPlaceholder = "Search...",
  onSearch,
  filters,
  emptyMessage = "No data found."
}: PremiumTableProps<T>) {
  const totalPages = Math.ceil(totalItems / pageSize);
  const [searchTerm, setSearchTerm] = useState("");

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    if (onSearch) onSearch(term);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
          {searchable && (
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={searchPlaceholder}
                className="pl-9 bg-background/50 backdrop-blur-sm border-muted"
                value={searchTerm}
                onChange={handleSearch}
              />
            </div>
          )}
          {filters}
        </div>
      </div>

      {/* Table Container */}
      <div className="rounded-xl border border-border/50 bg-card/50 backdrop-blur-xl overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/50">
            <TableRow>
              {columns.map((col, idx) => (
                <TableHead key={idx} className={cn("font-semibold", col.className)}>
                  {col.header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-48 text-center">
                  <div className="flex flex-col items-center justify-center gap-2 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p>Loading data...</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-64 text-center">
                  <div className="flex flex-col items-center justify-center text-muted-foreground opacity-60">
                    <div className="h-16 w-16 bg-muted rounded-full flex items-center justify-center mb-4">
                      <FileText className="h-8 w-8" />
                    </div>
                    <p className="text-lg font-medium">No results found</p>
                    <p className="text-sm">{emptyMessage}</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              <AnimatePresence mode="wait">
                {data.map((item, index) => (
                  <motion.tr
                    key={item.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className="group border-b transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted"
                  >
                    {columns.map((col, colIdx) => (
                      <TableCell key={colIdx} className={cn("py-3", col.className)}>
                        {col.cell ? col.cell(item) : (item[col.accessorKey as keyof T] as React.ReactNode)}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))}
              </AnimatePresence>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="text-sm text-muted-foreground">
          Showing <span className="font-medium">{data.length > 0 ? (page - 1) * pageSize + 1 : 0}</span> to{" "}
          <span className="font-medium">{Math.min(page * pageSize, totalItems)}</span> of{" "}
          <span className="font-medium">{totalItems}</span> results
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1 || loading}
            className="h-8 w-8 p-0"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            Page {page} / {totalPages || 1}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages || loading}
            className="h-8 w-8 p-0"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
