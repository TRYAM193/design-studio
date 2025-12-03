import {
  Bell,
  CreditCard,
  FolderOpen,
  Home,
  LayoutTemplate,
  LogOut,
  Plus,
  Settings,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";

export function DashboardSidebar() {
  const location = useLocation();
  const { user, signOut } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: LayoutTemplate, label: "Templates", path: "/dashboard/templates" },
    { icon: FolderOpen, label: "Projects", path: "/dashboard/projects" },
    { icon: CreditCard, label: "Pro Pricing", path: "/dashboard/pricing" },
  ];

  return (
    <div className="h-screen w-64 border-r bg-sidebar flex flex-col fixed left-0 top-0 z-20">
      {/* Logo Area */}
      <div className="p-6 flex items-center gap-3">
        <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
          <div className="h-3 w-3 bg-background rounded-full" />
        </div>
        <span className="font-bold text-xl tracking-tight">DesignApp</span>
      </div>

      {/* New Design Button */}
      <div className="px-4 mb-6">
        <Button className="w-full justify-start gap-2 h-12 text-base shadow-none" size="lg">
          <Plus className="h-5 w-5" />
          New Design
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-2 space-y-1">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive(item.path) ? "secondary" : "ghost"}
              className={`w-full justify-start gap-3 h-11 font-medium ${
                isActive(item.path) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </Button>
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between px-2">
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Bell className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-muted-foreground">
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        
        <Separator />

        {/* User Profile */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-sidebar-accent cursor-pointer transition-colors">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={user?.image} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</p>
              </div>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80" side="right" align="end">
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarImage src={user?.image} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
                <div>
                  <h4 className="text-sm font-semibold">{user?.name || "User Name"}</h4>
                  <p className="text-sm text-muted-foreground">{user?.email || "user@example.com"}</p>
                </div>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium text-muted-foreground">DOB:</span>
                  <span className="col-span-2">Jan 1, 1990</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium text-muted-foreground">Phone:</span>
                  <span className="col-span-2">+1 (555) 000-0000</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium text-muted-foreground">Address:</span>
                  <span className="col-span-2">123 Design St, Creative City, CA</span>
                </div>
              </div>
              <Separator />
              <Button 
                variant="destructive" 
                className="w-full justify-start gap-2"
                onClick={() => signOut()}
              >
                <LogOut className="h-4 w-4" />
                Log out
              </Button>
            </div>
          </HoverCardContent>
        </HoverCard>
      </div>
    </div>
  );
}
