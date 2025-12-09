"use client";

import { cn } from "@/lib/utils";
import React from "react";

export const GlassCard = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-white/20 bg-white/10 p-6 shadow-xl backdrop-blur-xl transition-all hover:scale-[1.02] hover:bg-white/20 hover:shadow-2xl dark:border-white/10 dark:bg-black/10 dark:hover:bg-black/20",
        className
      )}
    >
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
      <div className="relative z-10">{children}</div>
    </div>
  );
};
