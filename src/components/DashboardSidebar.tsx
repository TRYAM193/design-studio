import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen, // Icon for Projects
  ShoppingBag,
  Settings,
  Store, // Icon for Store
  LogOut,
  Menu
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";

export function DashboardSidebar() {
  const location = useLocation();
  const { signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const navItems = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: location.pathname === "/dashboard"
    },
    {
      label: "My Projects", // This is your Saved Designs
      icon: FolderOpen,
      href: "/dashboard/projects",
      active: location.pathname.includes("/dashboard/projects")
    },
    {
      label: "My Orders",
      icon: ShoppingBag,
      href: "/dashboard/orders",
      active: location.pathname.includes("/dashboard/orders")
    },
    {
      label: "Settings",
      icon: Settings,
      href: "/dashboard/settings",
      active: location.pathname.includes("/dashboard/settings")
    },
  ];

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-slate-900 text-white">
      {/* 1. Brand Header */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800">
        <div className="bg-indigo-600 rounded-lg p-2">
          <FolderOpen className="h-5 w-5 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight">DesignStudio</span>
      </div>

      <div className="flex-1 py-6 px-4 space-y-6">
        {/* 2. Main Navigation */}
        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Menu
          </p>
          {navItems.map((item) => (
            <Link key={item.href} to={item.href} onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800 transition-all",
                  item.active && "bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 hover:text-indigo-300 font-medium"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* 3. The "Store" Button (Highlighted) */}
        <div className="pt-4 border-t border-slate-800">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Start Creating
          </p>
          <Link to="/store">
            <Button 
              className="w-full justify-start gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg border-0"
            >
              <Store className="h-4 w-4" />
              Browse Catalog
            </Button>
          </Link>
        </div>
      </div>

      {/* 4. Footer */}
      <div className="p-4 border-t border-slate-800">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-400/10"
          onClick={() => signOut()}
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden md:block w-64 h-screen sticky top-0">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white shadow-md">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-none">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}