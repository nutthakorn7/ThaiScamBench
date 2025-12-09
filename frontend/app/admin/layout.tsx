"use client";

import { AuroraBackground } from "@/components/ui/aurora-background";
// import { AdminNavbar } from "@/components/admin/AdminNavbar"; 
// import { Sidebar } from "@/components/admin/Sidebar";

// Since I don't know if AdminNavbar/Sidebar exist, I will use a generic layout wrapper first.
// If existing pages already have Navbars, I shouldn't duplicate them.
// Let's assume the user wants the BACKGROUND and visual style.
// Existing admin pages likely have their own layout (AdminLayout component?).
// I will just wrap the children in AuroraBackground for now.

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuroraBackground showRadialGradient={true} className="h-full min-h-screen">
      <div className="relative z-10 w-full h-full min-h-screen">
          {children}
      </div>
    </AuroraBackground>
  );
}
