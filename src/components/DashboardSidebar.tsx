import {
  Bell,
  CreditCard,
  FolderOpen,
  Home,
  LayoutTemplate,
  LogIn,
  LogOut,
  Package,
  Plus,
  Settings,
  ShoppingBag,
} from "lucide-react";
import { Link, useLocation } from "react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Badge } from "@/components/ui/badge";

export function DashboardSidebar() {
  const location = useLocation();
  const { user, signOut, isAuthenticated } = useAuth();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { icon: Home, label: "Home", path: "/dashboard" },
    { icon: LayoutTemplate, label: "Templates", path: "/dashboard/templates" },
    { icon: FolderOpen, label: "Projects", path: "/dashboard/projects" },
    { icon: ShoppingBag, label: "Products", path: "/dashboard/products" },
    { icon: Package, label: "Orders", path: "/dashboard/orders" },
    { icon: CreditCard, label: "Pro Pricing", path: "/dashboard/pricing" },
  ];

  const UserProfileContent = () => (
    <>
      <div className="flex items-center gap-3 p-2">
        <Avatar className="h-10 w-10 border">
          <AvatarImage src={user?.image} />
          <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-semibold truncate">{user?.name || "User Name"}</span>
          <span className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</span>
        </div>
      </div>
      <DropdownMenuSeparator />
      <div className="p-2">
        <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
          <span>Current Plan</span>
          <Badge variant="secondary" className="text-[10px] h-5">PRO</Badge>
        </div>
        <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
          <div className="bg-primary h-full w-[75%]" />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 text-right">75% storage used</p>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem className="cursor-pointer">
        <Settings className="mr-2 h-4 w-4" />
        <span>Settings</span>
      </DropdownMenuItem>
      <DropdownMenuItem className="cursor-pointer">
        <CreditCard className="mr-2 h-4 w-4" />
        <span>Billing</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        className="cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
        onClick={() => signOut()}
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>Log out</span>
      </DropdownMenuItem>
    </>
  );

  return (
    <div className="
      fixed z-30 bg-sidebar border-sidebar-border transition-all duration-300
      /* Mobile: Bottom Bar */
      bottom-0 left-0 w-full h-16 border-t flex flex-row items-center justify-around px-2
      /* Desktop: Left Sidebar */
      sm:top-0 sm:left-0 sm:h-screen sm:w-20 sm:border-r sm:flex-col sm:justify-start sm:py-6
    ">
      {/* Logo Area - Desktop Only */}
      <div className="hidden sm:flex mb-8">
        <Link to="/">
          <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-black">
            <img 
              src="https://harmless-tapir-303.convex.cloud/api/storage/5dd71113-c4f4-4f61-9bdb-a4ddbec1574c" 
              alt="TRYAM Logo" 
              className="h-full w-full object-cover"
            />
          </div>
        </Link>
      </div>

      {/* New Design Button - Desktop Only */}
      <div className="hidden sm:flex mb-6">
        <Button className="h-10 w-10 rounded-full p-0 shadow-none" size="icon" title="New Design">
          <Plus className="h-5 w-5" />
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex items-center w-full justify-around sm:flex-col sm:justify-start sm:space-y-4 sm:w-auto">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant={isActive(item.path) ? "secondary" : "ghost"}
              size="icon"
              className={`rounded-xl transition-all ${
                isActive(item.path) ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-muted-foreground"
              } h-10 w-10`}
              title={item.label}
            >
              <item.icon className="h-5 w-5" />
            </Button>
          </Link>
        ))}

        {/* Mobile Profile Trigger */}
        <div className="sm:hidden">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer outline-none">
                  <Avatar className="h-8 w-8 border hover:ring-2 hover:ring-primary/20 transition-all">
                    <AvatarImage src={user?.image} />
                    <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 mb-2" side="top" align="end">
                <UserProfileContent />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground">
                <LogIn className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Bottom Actions - Desktop Only */}
      <div className="hidden sm:flex space-y-4 flex-col items-center mt-auto">
        {isAuthenticated && (
          <>
            <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10" title="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10" title="Settings">
              <Settings className="h-5 w-5" />
            </Button>
            <Separator className="w-8" />
          </>
        )}

        {/* User Profile */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer outline-none">
                <Avatar className="h-10 w-10 border hover:ring-2 hover:ring-primary/20 transition-all">
                  <AvatarImage src={user?.image} />
                  <AvatarFallback>{user?.name?.charAt(0) || "U"}</AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 ml-4 p-2" side="right" align="end">
              <UserProfileContent />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-muted-foreground" title="Sign In">
              <LogIn className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}