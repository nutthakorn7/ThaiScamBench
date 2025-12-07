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
  MessageSquare
} from "lucide-react";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  {
    name: "Dashboard",
    href: "/admin",
    icon: LayoutDashboard,
  },
  {
    name: "Detection Logs",
    href: "/admin/detections",
    icon: Shield,
  },
  {
    name: "User Feedback",
    href: "/admin/feedback",
    icon: MessageSquare,
  },
  {
    name: "Users",
    href: "/admin/users",
    icon: Users,
  },
  {
    name: "Partners",
    href: "/admin/partners",
    icon: Users,
  },
  {
    name: "Categories",
    href: "/admin/categories",
    icon: BarChart3,
  },
  {
    name: "Review Cases",
    href: "/admin/review",
    icon: AlertTriangle,
  },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <div className="flex h-screen overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-card border-r border-border flex flex-col">
          {/* Logo / Header */}
          <div className="p-6 border-b border-border">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold">Admin Panel</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {navigation.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || 
                              (item.href !== "/admin" && pathname.startsWith(item.href));
              
              return (
                <Button
                  key={item.name}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    isActive && "bg-primary text-primary-foreground"
                  )}
                  onClick={() => router.push(item.href)}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.name}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-y-auto bg-slate-50 dark:bg-slate-950">
          <div className="h-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
