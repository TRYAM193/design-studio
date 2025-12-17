import { 
  LayoutDashboard, 
  ShoppingBag, 
  Palette, // New icon for Designs
  Settings, 
  LogOut,
  Store // New icon for Store
} from "lucide-react";
// ... other imports

export function DashboardSidebar() {
  // ... existing code

  const navItems = [
    { 
      label: "Overview", 
      icon: LayoutDashboard, 
      href: "/dashboard" 
    },
    { 
      label: "My Designs", // WAS "Products"
      icon: Palette,       // WAS ShoppingBag
      href: "/dashboard/designs" 
    },
    { 
      label: "My Orders", 
      icon: ShoppingBag, 
      href: "/dashboard/orders" 
    },
    // NEW: Direct link to the public store
    { 
      label: "Browse Catalog", 
      icon: Store, 
      href: "/store",
      external: true // Logic to break out of dashboard layout if needed
    },
    { 
      label: "Settings", 
      icon: Settings, 
      href: "/dashboard/settings" 
    },
  ];

  // ... rest of the component
}