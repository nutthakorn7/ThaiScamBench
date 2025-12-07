"use client";

import { useEffect, useState } from "react";
import { ShieldAlert, ShieldCheck } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { getRecentActivity, type RecentActivityItem } from "@/lib/admin-api";

export function ActivityTicker() {
  const [activities, setActivities] = useState<RecentActivityItem[]>([]);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const data = await getRecentActivity(10);
        setActivities(data);
      } catch (error) {
        console.error("Failed to fetch activity:", error);
      }
    };

    fetchActivities();
    
    // Poll every 10 seconds
    const interval = setInterval(fetchActivities, 10000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-4">
      <AnimatePresence mode="popLayout">
        {activities.map((activity) => (
          <motion.div
            key={activity.id}
            initial={{ opacity: 0, x: -20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20 }}
            transition={{ duration: 0.3 }}
            className={`flex items-center justify-between p-3 rounded-xl border ${
              activity.type === "scam"
                ? "bg-red-500/10 border-red-500/20"
                : "bg-green-500/10 border-green-500/20"
            }`}
          >
            <div className="flex items-center gap-3 overflow-hidden">
              <div
                className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                  activity.type === "scam" ? "bg-red-500/20" : "bg-green-500/20"
                }`}
              >
                {activity.type === "scam" ? (
                  <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400" />
                ) : (
                  <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate text-foreground">
                  {activity.message}
                </p>
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  {activity.location} • {activity.time}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
