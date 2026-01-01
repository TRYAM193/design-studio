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
  Sparkles,
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
import { useTranslation } from "@/hooks/use-translation";
import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/firebase";

export function DashboardSidebar() {
  const location = useLocation();
  const { user, signOut, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  const [userProfile, setUserProfile] = useState<{ name?: string; image?: string } | null>(null);

  const isActive = (path: string) => location.pathname === path;

  useEffect(() => {
    if (user?.uid) {
      const unsub = onSnapshot(doc(db, "users", user.uid), (doc) => {
        if (doc.exists()) {
          setUserProfile(doc.data() as { name?: string; image?: string });
        }
      });
      return () => unsub();
    } else {
      setUserProfile(null);
    }
  }, [user?.uid]);

  const displayName = userProfile?.name || user?.displayName || user?.email?.split('@')[0] || t("common.guest");
  const initials = displayName.charAt(0).toUpperCase();
  const userImage = userProfile?.image || user?.photoURL || undefined;

  const navItems = [
    { icon: Home, label: t("nav.home"), path: "/dashboard" },
    { icon: LayoutTemplate, label: t("nav.templates"), path: "/dashboard/templates" },
    { icon: FolderOpen, label: t("nav.projects"), path: "/dashboard/projects" },
    { icon: Package, label: t("nav.orders"), path: "/dashboard/orders" },
    { icon: CreditCard, label: t("nav.pricing"), path: "/dashboard/pricing" },
  ];

  const UserProfileContent = () => (
    <div className="bg-[#0f172a] text-slate-200 border border-white/10 rounded-md">
      <div className="flex items-center gap-3 p-3">
        <Avatar className="h-10 w-10 border border-orange-500/30">
          <AvatarImage src={userImage} />
          <AvatarFallback className="bg-slate-800 text-orange-400">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <span className="text-sm font-semibold truncate text-white">{displayName}</span>
          <span className="text-xs text-slate-400 truncate">{user?.email || t("sidebar.signInSync")}</span>
        </div>
      </div>
      <DropdownMenuSeparator className="bg-white/10" />
      <div className="p-3">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
          <span>{t("sidebar.currentPlan")}</span>
          <Badge variant="secondary" className="text-[10px] h-5 bg-orange-500/10 text-orange-400 border-orange-500/20">{t("pricing.plan.pro").toUpperCase()}</Badge>
        </div>
        <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 h-full w-[75%]" />
        </div>
        <p className="text-[10px] text-slate-500 mt-1 text-right">75% {t("sidebar.storageUsed")}</p>
      </div>
      <DropdownMenuSeparator className="bg-white/10" />
      <DropdownMenuItem className="cursor-pointer hover:bg-white/5 focus:bg-white/5 text-slate-300 focus:text-white">
        <CreditCard className="mr-2 h-4 w-4" />
        <span>{t("nav.billing")}</span>
      </DropdownMenuItem>
      <DropdownMenuSeparator className="bg-white/10" />
      <DropdownMenuItem
        className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10"
        onClick={() => signOut()}
      >
        <LogOut className="mr-2 h-4 w-4" />
        <span>{t("nav.logout")}</span>
      </DropdownMenuItem>
    </div>
  );

  return (
    <div className="
      fixed z-30 bg-[#0f172a]/90 backdrop-blur-xl border-white/5 transition-all duration-300
      /* Mobile: Bottom Bar */
      bottom-0 left-0 w-full h-16 border-t flex flex-row items-center justify-around px-2
      /* Desktop: Left Sidebar */
      sm:top-0 sm:left-0 sm:h-screen sm:w-20 sm:border-r sm:flex-col sm:justify-start sm:py-6
      shadow-2xl shadow-black
    ">
      {/* Logo Area */}
      <div className="hidden sm:flex mb-8">
        <Link to="/">
          <div className="h-10 w-10 rounded-full overflow-hidden flex items-center justify-center bg-black ring-2 ring-white/10 shadow-lg shadow-blue-500/20">
            <img
              src="/assets/LOGO.png"
              alt="TRYAM Logo"
              className="h-full w-full object-cover"
            />
          </div>
        </Link>
      </div>

      {/* New Design Button (Floating Orb) */}
      <div className="hidden sm:flex mb-6">
        <Link to="/design">
          <Button 
            className="h-12 w-12 rounded-full p-0 shadow-[0_0_20px_rgba(234,88,12,0.4)] bg-gradient-to-br from-orange-500 to-red-600 hover:scale-110 transition-transform duration-300 border border-white/20" 
            size="icon" 
            title={t("common.newDesign")}
          >
            <Plus className="h-6 w-6 text-white" />
          </Button>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex items-center w-full justify-around sm:flex-col sm:justify-start sm:space-y-4 sm:w-auto">
        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-2xl transition-all h-10 w-10 ${
                isActive(item.path) 
                  ? "bg-blue-600/20 text-blue-300 shadow-[0_0_15px_rgba(37,99,235,0.2)]" 
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              }`}
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
                  <Avatar className="h-8 w-8 border border-white/20">
                    <AvatarImage src={userImage} />
                    <AvatarFallback className="bg-slate-800 text-slate-200">{initials}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-64 mb-2 bg-[#0f172a] border-white/10" side="top" align="end">
                <UserProfileContent />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-400">
                <LogIn className="h-5 w-5" />
              </Button>
            </Link>
          )}
        </div>
      </nav>

      {/* Bottom Actions */}
      <div className="hidden sm:flex space-y-4 flex-col items-center mt-auto">
        {isAuthenticated && (
          <>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-orange-400 hover:bg-white/5 transition-colors h-10 w-10" title={t("common.notifications")}>
              <Bell className="h-5 w-5" />
            </Button>
            <Link to="/dashboard/settings">
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-300 hover:bg-white/5 transition-colors h-10 w-10" title={t("nav.settings")}>
                <Settings className="h-5 w-5" />
              </Button>
            </Link>
            <Separator className="w-8 bg-white/10" />
          </>
        )}

        {/* User Profile */}
        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer outline-none">
                <Avatar className="h-10 w-10 border border-white/10 hover:ring-2 hover:ring-orange-500/50 transition-all">
                  <AvatarImage src={userImage} />
                  <AvatarFallback className="bg-slate-800 text-slate-200">{initials}</AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64 ml-4 p-0 bg-transparent border-none shadow-xl" side="right" align="end">
              <UserProfileContent />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth">
            <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl text-slate-500 hover:text-white" title={t("nav.signin")}>
              <LogIn className="h-5 w-5" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}