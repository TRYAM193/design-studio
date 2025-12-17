import {
  Bell,
  FolderOpen,
  LayoutTemplate,
  LogOut,
  Settings,
  ShoppingBag,
  Store, // NEW: For the Store link
  User,
  CreditCard
} from "lucide-react";
import { Link, useLocation } from "react-router"; // Fixed import
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
import { useTranslation } from "@/hooks/use-translation";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

export function DashboardSidebar() {
  const location = useLocation();
  const { user, signOut, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // Keep your existing profile fetching logic
  const [userProfile, setUserProfile] = useState<{ name?: string; image?: string } | null>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (user?.uid) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as any);
        }
      });
      return () => unsub();
    }
  }, [user]);

  const userImage = userProfile?.image || user?.photoURL || undefined;
  const initials = (userProfile?.name || user?.displayName || "U").charAt(0).toUpperCase();

  // User Profile Dropdown Content (Kept from your logic)
  const UserProfileContent = () => (
    <>
      <div className="flex items-center justify-start gap-2 p-2">
        <div className="flex flex-col space-y-1 leading-none">
          <p className="font-medium">{userProfile?.name || user?.displayName}</p>
          <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
        </div>
      </div>
      <DropdownMenuSeparator />
      <DropdownMenuItem asChild>
        <Link to="/dashboard/settings" className="cursor-pointer">
          <User className="mr-2 h-4 w-4" />
          <span>{t("nav.profile")}</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuItem asChild>
        <Link to="/dashboard/pricing" className="cursor-pointer">
          <CreditCard className="mr-2 h-4 w-4" />
          <span>{t("nav.subscription")}</span>
        </Link>
      </DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem 
        className="cursor-pointer text-red-600 focus:text-red-600" 
        onClick={() => signOut()}
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>{t("nav.signout")}</span>
      </DropdownMenuItem>
    </>
  );

  return (
    <div className="h-screen w-[72px] flex flex-col items-center py-6 border-r bg-background/50 backdrop-blur-xl fixed left-0 top-0 z-50">
      {/* Brand Logo */}
      <Link to="/" className="mb-8">
        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary font-bold text-xl">
          D
        </div>
      </Link>

      {/* Main Navigation */}
      <div className="flex-1 flex flex-col gap-4 w-full px-2">
        <Link to="/dashboard">
          <Button
            variant={isActive("/dashboard") ? "secondary" : "ghost"}
            size="icon"
            className="w-full h-10 rounded-xl"
            title={t("nav.dashboard")}
          >
            <LayoutTemplate className="h-5 w-5" />
          </Button>
        </Link>

        {/* NEW: Store Link (Replaces Products) */}
        <Link to="/store">
          <Button
            variant="ghost"
            size="icon"
            className="w-full h-10 rounded-xl text-indigo-500 hover:text-indigo-600 hover:bg-indigo-50"
            title="Browse Catalog"
          >
            <Store className="h-5 w-5" />
          </Button>
        </Link>

        {/* My Projects (Saved Designs) */}
        <Link to="/dashboard/projects">
          <Button
            variant={isActive("/dashboard/projects") ? "secondary" : "ghost"}
            size="icon"
            className="w-full h-10 rounded-xl"
            title="My Projects"
          >
            <FolderOpen className="h-5 w-5" />
          </Button>
        </Link>

        {/* My Orders */}
        <Link to="/dashboard/orders">
          <Button
            variant={isActive("/dashboard/orders") ? "secondary" : "ghost"}
            size="icon"
            className="w-full h-10 rounded-xl"
            title={t("nav.orders")}
          >
            <ShoppingBag className="h-5 w-5" />
          </Button>
        </Link>
      </div>

      {/* Bottom Actions & User Profile */}
      <div className="flex flex-col gap-4 w-full px-2">
        {isAuthenticated && (
          <>
            <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10" title={t("common.notifications")}>
              <Bell className="h-5 w-5" />
            </Button>
            <Link to="/dashboard/settings">
              <Button variant="ghost" size="icon" className="text-muted-foreground h-10 w-10" title={t("nav.settings")}>
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Separator className="w-8 mx-auto" />
          </>
        )}

        {/* User Profile Dropdown */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer outline-none">
                <Avatar className="h-10 w-10 border hover:ring-2 hover:ring-primary/20 transition-all">
                  <AvatarImage src={userImage} />
                  <AvatarFallback>{initials}</AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 ml-4 p-2" side="right" align="end">
              <UserProfileContent />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth">
             {/* Fallback if somehow viewing dashboard without auth */}
          </Link>
        )}
      </div>
    </div>
  );
}