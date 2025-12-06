"use client";

import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  AlertTriangle,
  LogOut,
  Shield,
  MessageSquare
} from "lucide-react";
import { removeAdminToken } from "@/lib/auth";
import { toast } from "sonner";

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

  const handleLogout = () => {
    removeAdminToken();
    toast.success("Logout สำเร็จ");
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">Admin Panel</h1>
          </div>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Logout
          </Button>
        </div>
      </div>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r border-gray-200 min-h-[calc(100vh-73px)] sticky top-[73px]">
          <nav className="p-4 space-y-1">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Button
                  key={item.href}
                  variant={isActive ? "default" : "ghost"}
                  className={cn(
                    "w-full justify-start",
                    !isActive && "hover:bg-gray-100"
                  )}
                  onClick={() => router.push(item.href)}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                </Button>
              );
            })}
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
