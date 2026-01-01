import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, Search, Filter, Lock, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router";
import { useState, useMemo } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";

export default function DashboardOrders() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        {/* Background Overlay for Unauth State */}
        <div className="absolute inset-0 bg-[#0f172a] -z-20" />
        
        <div className="h-24 w-24 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/10 shadow-xl shadow-blue-900/20">
          <Lock className="h-10 w-10 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">{t("orders.signInTitle")}</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            {t("orders.signInDesc")}
          </p>
        </div>
        <Link to="/auth">
          <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold border-0 shadow-lg shadow-orange-900/40">
            {t("nav.signin")} / {t("auth.getStarted")}
          </Button>
        </Link>
      </div>
    );
  }

  // Mock data
  const orders = [
    { 
      id: "ORD-7829", 
      date: "Oct 24, 2023", 
      items: ["Custom Heavyweight Tee (x2)", "Embroidered Hoodie (x1)"], 
      total: "$145.00", 
      status: "Delivered",
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&auto=format&fit=crop&q=60"
    },
    { 
      id: "ORD-7830", 
      date: "Nov 02, 2023", 
      items: ["Canvas Tote Bag - Minimalist"], 
      total: "$35.00", 
      status: "Shipped",
      image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=100&auto=format&fit=crop&q=60"
    },
    { 
      id: "ORD-7831", 
      date: "Nov 10, 2023", 
      items: ["Premium 5-Panel Cap", "Die-cut Stickers (x50)"], 
      total: "$82.50", 
      status: "Processing",
      image: "https://images.unsplash.com/photo-1588117260148-447884962bc5?w=100&auto=format&fit=crop&q=60"
    },
  ];

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch = 
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some(item => item.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, statusFilter]);

  // Styles for Status Badges
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Delivered": return "bg-green-500/10 text-green-400 border-green-500/20"; 
      case "Shipped": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "Processing": return "bg-orange-500/10 text-orange-400 border-orange-500/20";
      default: return "bg-slate-700/50 text-slate-300 border-slate-600/50";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered": return <CheckCircle className="h-3 w-3 mr-1.5" />;
      case "Shipped": return <Truck className="h-3 w-3 mr-1.5" />;
      case "Processing": return <Clock className="h-3 w-3 mr-1.5" />;
      default: return null;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "Delivered": return t("orders.delivered");
      case "Shipped": return t("orders.shipped");
      case "Processing": return t("orders.processing");
      default: return status;
    }
  };

  return (
    <div className="space-y-8 relative pb-20">
      
      {/* ✅ BACKGROUND: COSMIC SHIVA THEME */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-bold tracking-tight text-white"
            >
              {t("orders.title")}
            </motion.h1>
            
            {/* Filter Controls */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input 
                  placeholder={t("orders.search")}
                  className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 focus:ring-orange-500/50 focus:border-orange-500/50 h-10 rounded-full" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px] bg-slate-800/50 border-white/10 text-slate-200 h-10 rounded-full">
                  <div className="flex items-center gap-2">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <SelectValue placeholder={t("orders.status")} />
                  </div>
                </SelectTrigger>
                <SelectContent className="bg-slate-900 border-white/10 text-slate-300">
                  <SelectItem value="All">{t("orders.allStatuses")}</SelectItem>
                  <SelectItem value="Processing">{t("orders.processing")}</SelectItem>
                  <SelectItem value="Shipped">{t("orders.shipped")}</SelectItem>
                  <SelectItem value="Delivered">{t("orders.delivered")}</SelectItem>
                </SelectContent>
              </Select>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Card className="overflow-hidden hover:bg-white/5 transition-colors cursor-pointer group bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-lg">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-5 p-5 sm:p-6">
                    {/* Image */}
                    <div className="h-20 w-20 rounded-xl bg-slate-700 overflow-hidden flex-shrink-0 border border-white/5 shadow-inner">
                      <img src={order.image} alt="Order Item" className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-lg text-white truncate flex items-center gap-2">
                            {t("orders.orderNumber")}{order.id.replace("ORD-", "")}
                        </h3>
                        <span className="sm:hidden font-bold text-white">{order.total}</span>
                      </div>
                      <p className="text-sm text-slate-300 truncate">
                        {order.items.join(", ")}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {t("orders.placedOn")} <span className="text-slate-400">{order.date}</span>
                      </p>
                    </div>

                    {/* Status & Total (Desktop) */}
                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-8 mt-2 sm:mt-0 w-full sm:w-auto">
                      <Badge className={`px-3 py-1 text-xs font-medium border ${getStatusStyles(order.status)}`}>
                        {getStatusIcon(order.status)}
                        {getStatusLabel(order.status)}
                      </Badge>
                      
                      <div className="hidden sm:block text-right">
                          <span className="block font-bold text-white text-lg">{order.total}</span>
                      </div>

                      <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white hover:bg-white/10 rounded-full h-8 w-8 opacity-0 group-hover:opacity-100 transition-all">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5 text-center">
            <Package className="h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{t("orders.noResults")}</h3>
            <p className="text-slate-400">Try adjusting your filters or search query.</p>
          </div>
        )}
      </div>
    </div>
  );
}