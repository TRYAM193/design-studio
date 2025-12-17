import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, FolderOpen, ShoppingBag, Store, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardHome() {
  const { user } = useAuth();

  const stats = [
    { label: "Total Projects", value: "0", icon: FolderOpen, color: "text-blue-500" },
    { label: "Orders Placed", value: "0", icon: ShoppingBag, color: "text-purple-500" },
    { label: "Wallet Credits", value: "₹0", icon: TrendingUp, color: "text-green-500" },
  ];

  return (
    <div className="space-y-8 p-6">
      {/* 1. Welcome Section with CTA */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-gradient-to-r from-indigo-50 to-purple-50 p-8 rounded-2xl border border-indigo-100">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Welcome back, {user?.displayName || "Creator"}! 👋</h1>
          <p className="text-slate-600 mt-2 max-w-xl">
            Ready to design something amazing today? Pick a product from our catalog to get started.
          </p>
        </div>
        <Link to="/store">
          <Button size="lg" className="bg-indigo-600 hover:bg-indigo-700 shadow-lg gap-2">
            <Store className="h-5 w-5" />
            Start New Project
          </Button>
        </Link>
      </div>

      {/* 2. Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.label}
              </CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 3. Recent Activity / Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Link to="/store">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors group">
                <div className="flex items-center gap-3">
                  <div className="bg-white p-2 rounded-md shadow-sm">
                    <Store className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">Browse Catalog</h4>
                    <p className="text-sm text-slate-500">View blank products</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
            
            <Link to="/dashboard/projects">
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg hover:bg-slate-100 cursor-pointer transition-colors group">
                <div className="flex items-center gap-3">
                   <div className="bg-white p-2 rounded-md shadow-sm">
                    <FolderOpen className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">View My Projects</h4>
                    <p className="text-sm text-slate-500">Edit saved designs</p>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 text-slate-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          </CardContent>
        </Card>

        {/* Placeholder for Recent Orders */}
        <Card className="h-full flex flex-col justify-center items-center text-center p-6 text-muted-foreground border-dashed">
           <ShoppingBag className="h-10 w-10 mb-3 opacity-20" />
           <p>No recent orders found</p>
        </Card>
      </div>
    </div>
  );
}