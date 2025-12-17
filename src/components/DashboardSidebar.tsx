import { Link, useLocation } from "react-router-dom"; // In React + Vite + TS, 'react-router-dom' is the standard for web routing.
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderOpen, // For Projects
  ShoppingBag,
  Settings,
  Store, // For Store
  LogOut,
  Menu,
  Sparkles, // For Pro features
  CreditCard,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useState } from "react";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";

export function DashboardSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuth();
  const [open, setOpen] = useState(false);

  // Define your navigation items here
  const navItems = [
    {
      label: "Overview",
      icon: LayoutDashboard,
      href: "/dashboard",
      active: location.pathname === "/dashboard"
    },
    {
      label: "My Projects",
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
        <div>
           <span className="font-bold text-xl tracking-tight block">DesignStudio</span>
           <span className="text-xs text-slate-400">Creator Dashboard</span>
        </div>
      </div>

      {/* 2. Scrollable Content Area */}
      <div className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
        
        {/* Main Navigation */}
        <div className="space-y-1">
          <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Menu
          </p>
          {navItems.map((item) => (
            <Link key={item.href} to={item.href} onClick={() => setOpen(false)}>
              <Button
                variant="ghost"
                className={cn(
                  "w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800 transition-all mb-1",
                  item.active && "bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 hover:text-indigo-300 font-medium"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Button>
            </Link>
          ))}
        </div>

        {/* Store / Create Section */}
        <div>
           <p className="px-4 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            Create
          </p>
          <Link to="/store" onClick={() => setOpen(false)}>
            <Button 
              className="w-full justify-start gap-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg border-0"
            >
              <Store className="h-4 w-4" />
              Browse Catalog
            </Button>
          </Link>
        </div>

        <Separator className="bg-slate-800" />

        {/* PRO Features Section */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-4 mb-2">
             <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
               Pro Tools
             </p>
             <Badge variant="secondary" className="bg-amber-500/10 text-amber-500 text-[10px] px-1 h-5">NEW</Badge>
          </div>
          
          <Link to="/dashboard/pricing" onClick={() => setOpen(false)}>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start gap-3 text-slate-300 hover:text-white hover:bg-slate-800 transition-all mb-1",
                location.pathname.includes("/pricing") && "bg-amber-500/10 text-amber-400"
              )}
            >
              <Crown className="h-4 w-4 text-amber-500" />
              Upgrade to Pro
            </Button>
          </Link>
          <Button variant="ghost" className="w-full justify-start gap-3 text-slate-400 hover:text-slate-200 cursor-not-allowed opacity-70">
            <Sparkles className="h-4 w-4" />
            AI Generator
          </Button>
        </div>
      </div>

      {/* 3. Footer / User Profile */}
      <div className="p-4 border-t border-slate-800 bg-slate-900/50">
        <div className="flex items-center gap-3 mb-4 px-2">
           <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-bold">
             {user?.email?.charAt(0).toUpperCase() || "U"}
           </div>
           <div className="flex-1 overflow-hidden">
             <p className="text-sm font-medium truncate text-white">{user?.displayName || "User"}</p>
             <p className="text-xs text-slate-400 truncate">{user?.email}</p>
           </div>
        </div>
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-red-400 hover:text-red-300 hover:bg-red-400/10 h-9"
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
      <div className="hidden md:block w-64 h-screen sticky top-0 border-r border-slate-800">
        <SidebarContent />
      </div>

      {/* Mobile Sidebar */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon" className="bg-white shadow-md border-slate-200">
              <Menu className="h-5 w-5 text-slate-700" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="p-0 w-72 bg-slate-900 border-r border-slate-800">
            <SidebarContent />
          </SheetContent>
        </Sheet>
      </div>
    </>
  );
}