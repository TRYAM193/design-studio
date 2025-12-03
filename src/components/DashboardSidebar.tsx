import {
  Bell,
  CreditCard,
  FolderOpen,
  Home,
  LayoutTemplate,
  LogOut,
  Plus,
  Settings,
  ShoppingBag,
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
    { icon: ShoppingBag, label: "Products", path: "/dashboard/products" },
    { icon: CreditCard, label: "Pro Pricing", path: "/dashboard/pricing" },
  ];

  return (
    <div className="h-screen w-20 border-r bg-sidebar flex flex-col fixed left-0 top-0 z-20 items-center py-6">
      {/* Logo Area */}
      <div className="mb-8">
        <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-black">
          <img 
            src="https://harmless-tapir-303.convex.cloud/api/storage/5dd71113-c4f4-4f61-9bdb-a4ddbec1574c" 
            alt="TRYAM Logo" 
            className="h-full w-full object-cover"
          />
        </div>
      </div>

      {/* New Design Button */}
      <div className="mb-6">
        <Button className="h-10 w-10 rounded-full p-0 shadow-none" size="icon" title="New Design">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-4 w-full flex flex-col items-center">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive(item.path) ? "secondary" : "ghost"}
              size="icon"
              className={`h-10 w-10 rounded-xl ${
                isActive(item.path) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"
              }`}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </Link>
        ))}
      </nav>

      {/* Bottom Actions */}
      <div className="space-y-4 flex flex-col items-center mt-auto">
        <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10" title="Notifications">
          <Bell className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10" title="Settings">
          <Settings className="h-5 w-5" />
        </Button>
        
        <Separator className="w-8" />

        {/* User Profile */}
        <HoverCard>
          <HoverCardTrigger asChild>
            <div className="cursor-pointer">
              <Avatar className="h-10 w-10 border">
                <AvatarImage src={user?.image} />
                <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
              </Avatar>
            </div>
          </HoverCardTrigger>
          <HoverCardContent className="w-80 ml-4" side="right" align="end">
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
                  <span className="font-medium text-muted-foreground">Role:</span>
                  <span className="col-span-2">Designer</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <span className="font-medium text-muted-foreground">Plan:</span>
                  <span className="col-span-2">Pro Plan</span>
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