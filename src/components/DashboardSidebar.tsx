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
import { is } from "date-fns/locale";

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
    { icon: LayoutTemplate, label: t("nav.templates"), path: "/dashboard/templates", isSpecial: false },
    { icon: FolderOpen, label: t("nav.projects"), path: "/dashboard/projects", isSpecial: false },
    { icon: Package, label: t("nav.orders"), path: "/dashboard/orders", isSpecial: false },
    { icon: CreditCard, label: t("nav.pricing"), path: "/dashboard/pricing", isSpecial: false },
  ];

  // Insert "New Design" in the middle for mobile layout logic
  const mobileNavItems = [
    ...navItems.slice(0, 3),
    { icon: Plus, label: t("common.newDesign"), path: "/design", isSpecial: true },
    ...navItems.slice(3)
  ];

  const UserProfileContent = () => (
    <div className="bg-[#0f172a] text-slate-200 border border-white/10 rounded-md shadow-xl w-56">
      <div className="flex items-center gap-2 p-2">
        <Avatar className="h-8 w-8 border border-orange-500/30">
          <AvatarImage src={userImage} />
          <AvatarFallback className="bg-slate-800 text-orange-400 text-xs">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col overflow-hidden">
          <span className="text-xs font-semibold truncate text-white">{displayName}</span>
          <span className="text-[10px] text-slate-400 truncate">{user?.email}</span>
        </div>
      </div>
      <DropdownMenuSeparator className="bg-white/10" />
      <div className="p-2">
        <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
          <span>Plan</span>
          <Badge variant="secondary" className="text-[9px] h-4 px-1 bg-orange-500/10 text-orange-400 border-orange-500/20">PRO</Badge>
        </div>
        <div className="w-full bg-slate-800 h-1 rounded-full overflow-hidden">
          <div className="bg-gradient-to-r from-orange-600 to-red-600 h-full w-[75%]" />
        </div>
      </div>
      <DropdownMenuSeparator className="bg-white/10" />
      <DropdownMenuItem
        className="cursor-pointer text-red-400 focus:text-red-300 focus:bg-red-500/10 text-xs py-1.5"
        onClick={() => signOut()}
      >
        <LogOut className="mr-2 h-3 w-3" />
        <span>{t("nav.logout")}</span>
      </DropdownMenuItem>
    </div>
  );

  return (
    <div className="
      fixed z-30 bg-[#0f172a]/95 backdrop-blur-xl border-white/5 transition-all duration-300
      /* Mobile: Bottom Bar */
      bottom-0 left-0 w-full h-14 border-t flex flex-row items-center justify-between px-4
      /* Desktop: Left Sidebar */
      sm:top-0 sm:left-0 sm:h-screen sm:w-16 sm:border-r sm:flex-col sm:justify-start sm:py-4
      shadow-2xl shadow-black
    ">
      {/* Logo Area (Desktop) */}
      <div className="hidden sm:flex mb-6 justify-center w-full">
        <Link to="/">
          <div className="h-8 w-8 rounded-full overflow-hidden flex items-center justify-center bg-black ring-1 ring-white/10 shadow-lg shadow-orange-500/10">
            <img
              src="/assets/LOGO.png"
              alt="Logo"
              className="h-full w-full object-cover"
            />
          </div>
        </Link>
      </div>

      {/* DESKTOP NAVIGATION */}
      <nav className="hidden sm:flex flex-col items-center w-full space-y-3">
        {/* Special New Design Button at Top */}
        <Link to="/design">
          <Button
            size="icon"
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-900/40 hover:scale-105 border-0"
            title={t("common.newDesign")}
          >
            <Plus className="h-5 w-5" />
          </Button>
        </Link>
        
        <Separator className="w-8 bg-white/10 my-2" />

        {navItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-xl transition-all h-9 w-9 ${
                isActive(item.path) 
                  ? "bg-blue-600/20 text-blue-300 shadow-[0_0_10px_rgba(37,99,235,0.15)]" 
                  : "text-slate-500 hover:text-slate-200 hover:bg-white/5"
              }`}
              title={item.label}
            >
              <item.icon className="h-4 w-4" />
            </Button>
          </Link>
        ))}
      </nav>

      {/* MOBILE NAVIGATION */}
      <nav className="flex sm:hidden items-center w-full justify-between relative">
        {mobileNavItems.map((item) => (
          <Link key={item.path} to={item.path}>
            <Button
              variant="ghost"
              size="icon"
              className={`rounded-xl transition-all h-9 w-9 ${
                item.isSpecial 
                  ? "bg-gradient-to-br from-orange-500 to-red-600 text-white shadow-lg shadow-orange-900/40 scale-110 -translate-y-1" // Special Style for Middle Button
                  : isActive(item.path) 
                    ? "bg-blue-600/20 text-blue-300" 
                    : "text-slate-500 hover:text-slate-200"
              }`}
              title={item.label}
            >
              <item.icon className={`h-4 w-4 ${item.isSpecial ? "h-5 w-5" : ""}`} />
            </Button>
          </Link>
        ))}

        {/* Mobile Profile Trigger */}
        {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="cursor-pointer outline-none">
                  <Avatar className="h-7 w-7 border border-white/20">
                    <AvatarImage src={userImage} />
                    <AvatarFallback className="bg-slate-800 text-slate-200 text-[10px]">{initials}</AvatarFallback>
                  </Avatar>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56 mb-2 mr-2 bg-[#0f172a] border-white/10" side="top" align="end">
                <UserProfileContent />
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link to="/auth">
              <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-slate-400">
                <LogIn className="h-4 w-4" />
              </Button>
            </Link>
          )}
      </nav>

      {/* Desktop Bottom Actions */}
      <div className="hidden sm:flex space-y-3 flex-col items-center mt-auto">
        {isAuthenticated && (
          <>
            <Button variant="ghost" size="icon" className="text-slate-500 hover:text-orange-400 hover:bg-white/5 transition-colors h-8 w-8">
              <Bell className="h-4 w-4" />
            </Button>
            <Link to="/dashboard/settings">
              <Button variant="ghost" size="icon" className="text-slate-500 hover:text-blue-300 hover:bg-white/5 transition-colors h-8 w-8">
                <Settings className="h-4 w-4" />
              </Button>
            </Link>
            <Separator className="w-6 bg-white/10" />
          </>
        )}

        {isAuthenticated ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer outline-none">
                <Avatar className="h-8 w-8 border border-white/10 hover:ring-2 hover:ring-orange-500/50 transition-all">
                  <AvatarImage src={userImage} />
                  <AvatarFallback className="bg-slate-800 text-slate-200 text-xs">{initials}</AvatarFallback>
                </Avatar>
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="ml-4 p-0 bg-transparent border-none shadow-xl" side="right" align="end">
              <UserProfileContent />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl text-slate-500 hover:text-white">
              <LogIn className="h-4 w-4" />
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}