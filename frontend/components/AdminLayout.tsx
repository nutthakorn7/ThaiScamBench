"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  AlertTriangle,
  Shield,
  MessageSquare,
  ClipboardList,
  LogOut,
  ChevronLeft,
  Settings,
  BrainCircuit // Added
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ThemeProvider } from "next-themes";
import { AuroraBackground } from "@/components/ui/aurora-background";
import { useState } from "react";
import { removeAdminToken } from "@/lib/auth";
import { toast } from "sonner";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { name: "Users", href: "/admin/users", icon: Users },
  { name: "Detection Logs", href: "/admin/detections", icon: Shield },
  { name: "Knowledge Base", href: "/admin/knowledge-base", icon: BrainCircuit }, // Added
  { name: "System Audit", href: "/admin/audit", icon: ClipboardList },
  { name: "Review Cases", href: "/admin/review", icon: AlertTriangle },
  { name: "User Feedback", href: "/admin/feedback", icon: MessageSquare },
  { name: "Partners", href: "/admin/partners", icon: Users },
  { name: "Categories", href: "/admin/categories", icon: BarChart3 },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    removeAdminToken();
    toast.success('Logged out successfully');
    router.push('/admin/login');
  };

  return (
    <div className="h-screen w-full overflow-hidden bg-zinc-50 dark:bg-zinc-950 font-sans selection:bg-indigo-500/30">
        <div className="flex h-full relative z-10 w-full">
            {/* Glassmorphic Sidebar */}
            <motion.aside 
                initial={{ width: 280 }}
                animate={{ width: collapsed ? 80 : 280 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className={cn(
                    "relative flex flex-col border-r border-border/40 bg-card/60 backdrop-blur-xl shadow-xl z-50",
                    collapsed ? "items-center" : ""
                )}
            >
                {/* Header / Logo */}
                <div className={cn("p-6 flex items-center gap-3", collapsed && "justify-center p-4")}>
                    <div className="h-10 w-10 min-w-[40px] rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Shield className="h-6 w-6 text-white" />
                    </div>
                    {!collapsed && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="flex flex-col"
                        >
                            <span className="font-bold text-lg tracking-tight">Admin Panel</span>
                            <span className="text-xs text-muted-foreground">ThaiScamBench v1.0</span>
                        </motion.div>
                    )}
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-hide">
                    {navigation.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
                        
                        return (
                            <div key={item.name} className="relative group">
                                {isActive && (
                                    <motion.div
                                        layoutId="activeNav"
                                        className="absolute inset-0 bg-primary/10 rounded-xl"
                                        initial={false}
                                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                                    />
                                )}
                                <Button
                                    variant="ghost"
                                    className={cn(
                                        "w-full justify-start relative z-10 h-12 mb-1 rounded-xl transition-all duration-200",
                                        isActive ? "text-primary font-semibold" : "text-muted-foreground hover:text-foreground",
                                        collapsed && "justify-center px-0"
                                    )}
                                    onClick={() => router.push(item.href)}
                                    title={collapsed ? item.name : undefined}
                                >
                                    <Icon className={cn("h-5 w-5 transition-transform group-hover:scale-110", !collapsed && "mr-3")} />
                                    {!collapsed && <span>{item.name}</span>}
                                </Button>
                            </div>
                        );
                    })}
                </nav>

                {/* Footer Actions */}
                <div className="p-3 border-t border-border/40 space-y-2">
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => setCollapsed(!collapsed)}
                        className="w-full justify-start text-muted-foreground hover:text-foreground"
                    >
                         <ChevronLeft className={cn("h-5 w-5 transition-transform", !collapsed && "mr-3", collapsed && "rotate-180")} />
                         {!collapsed && "Collapse"}
                    </Button>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={handleLogout}
                        className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/10"
                    >
                        <LogOut className={cn("h-5 w-5", !collapsed && "mr-3")} />
                        {!collapsed && "Logout"}
                    </Button>
                </div>
            </motion.aside>

            {/* Main Content Area with Aurora */}
            <main className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-slate-950">
                 {/* Aurora Background Layer */}
                 <div className="absolute inset-0 z-0 opacity-40 pointer-events-none">
                     <AuroraBackground className="h-full" showRadialGradient={false} />
                 </div>
                 
                 {/* Scrollable Content */}
                 <div className="absolute inset-0 z-10 overflow-y-auto">
                    <div className="h-full p-6 md:p-8 max-w-[1600px] mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, ease: "easeOut" }}
                            className="h-full"
                        >
                            {children}
                        </motion.div>
                    </div>
                 </div>
            </main>
        </div>
    </div>
  );
}
