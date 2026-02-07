import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, Search, Filter, Lock, ExternalLink, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";

// 🔥 FIREBASE IMPORTS
import { collection, query, where, orderBy, getDocs } from "firebase/firestore";
import { db } from "@/firebase";

export default function DashboardOrders() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();

  // 1. HOOKS (Must be at the top)
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // 🛠️ HELPER: Map Backend Status to UI (Defined early to avoid issues)
  const mapBackendStatusToUI = (status: string, providerStatus: string) => {
    if (providerStatus === 'shipped') return 'Shipped';
    switch (status) {
      case 'placed': return 'Processing';
      case 'processing': return 'Processing';
      case 'shipped': return 'Shipped';
      case 'delivered': return 'Delivered';
      case 'cancelled': return 'Cancelled';
      default: return 'Processing';
    }
  };

  // 2. FETCH REAL ORDERS
  useEffect(() => {
    async function fetchOrders() {
      if (!user) return;

      try {
        setLoading(true);
        const ordersRef = collection(db, "orders");

        // Note: Ensure you have the Firestore Index for userId + createdAt
        const q = query(
          ordersRef,
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc")
        );

        const snapshot = await getDocs(q);

        const fetchedOrders = snapshot.docs.map(doc => {
          const data = doc.data();
          const firstItem = data.items?.[0] || {};

          return {
            id: data.orderId || doc.id,
            rawData: { id: doc.id, ...data },
            date: data.createdAt?.toDate ? data.createdAt.toDate().toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric"
            }) : "N/A",
            items: data.items.map((item: any) =>
              `${item.title} (${item.variant?.color || 'Custom'}) x${item.quantity}`
            ),
            total: `${data.payment.currency || '$'} ${data.payment.total}`,
            status: mapBackendStatusToUI(data.status, data.providerStatus),
            image: firstItem.thumbnail
          };
        });

        setOrders(fetchedOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    }

    if (isAuthenticated) {
      fetchOrders();
    }
  }, [user, isAuthenticated]);
  console.log(orders)

  // 3. MEMOIZATION (Moved ABOVE the early return)
  // This was the cause of the error!
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesSearch =
        order.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items.some((item: string) => item.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesStatus = statusFilter === "All" || order.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [orders, searchQuery, statusFilter]);

  // Styles for Status Badges (Updated for better readability)
  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Delivered": return "bg-green-500/20 text-green-400 border-green-500/30";
      case "Shipped": return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "Processing": return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "Cancelled": return "bg-red-500/20 text-red-400 border-red-500/30";
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

  // ------------------------------------------------------------------
  // 🎨 CONDITIONAL RENDER (Now Safe)
  // ------------------------------------------------------------------

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
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

  return (
    <div className="space-y-8 relative pb-20">

      {/* BACKGROUND */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* HEADER & FILTERS */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-3xl md:text-4xl font-bold tracking-tight text-white"
          >
            {t("orders.title")}
          </motion.h1>

          {/* Filter Controls (Full width on mobile for easy tapping) */}
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder={t("orders.search")}
                className="pl-10 bg-slate-800/50 border-white/10 text-white placeholder:text-slate-500 h-11 sm:h-10 rounded-xl w-full"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px] bg-slate-800/50 border-white/10 text-slate-200 h-11 sm:h-10 rounded-xl">
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

      {/* ORDERS LIST */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-orange-500" />
          </div>
        ) : filteredOrders.length > 0 ? (
          filteredOrders.map((order, i) => (
            <motion.div
              key={order.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
            >
              <Link to={`/orders/${order.id}`} state={{ orderData: order.rawData }}>
                <Card className="overflow-hidden hover:bg-white/5 transition-colors cursor-pointer group bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-lg">
                  <CardContent className="p-0">
                    <div className="flex flex-col sm:flex-row gap-5 p-5">
                      
                      {/* TOP PART: Image & Info */}
                      <div className="flex items-start gap-4 flex-1">
                        {/* Image */}
                        <div className="h-20 w-20 sm:h-24 sm:w-24 rounded-xl bg-slate-700 overflow-hidden flex-shrink-0 border border-white/5 shadow-inner">
                          <img src={order.image} alt="Order Item" className="h-full w-full object-cover opacity-90 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h3 className="font-bold text-lg text-white truncate flex items-center gap-2">
                              {t("orders.orderNumber")}{order.id}
                            </h3>
                          </div>
                          
                          <p className="text-sm text-slate-300 line-clamp-2 leading-relaxed">
                            {order.items.join(", ")}
                          </p>
                          
                          <p className="text-xs text-slate-500 flex items-center gap-1.5 pt-1">
                            <Clock className="w-3 h-3" />
                            {t("orders.placedOn")} <span className="text-slate-400">{order.date}</span>
                          </p>
                        </div>
                      </div>

                      {/* BOTTOM PART: Status & Price (Stacked on Mobile, Side by Side on Desktop) */}
                      <div className="flex items-center justify-between sm:flex-col sm:items-end sm:justify-center sm:gap-2 mt-2 sm:mt-0 pt-4 sm:pt-0 border-t border-white/5 sm:border-0">
                        
                        <Badge className={`px-3 py-1 text-xs font-medium border ${getStatusStyles(order.status)}`}>
                          {getStatusIcon(order.status)}
                          {order.status}
                        </Badge>

                        <div className="text-right">
                          <span className="block font-bold text-white text-lg sm:text-xl">{order.total}</span>
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              </Link>
            </motion.div>
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-white/10 rounded-3xl bg-white/5 text-center px-6">
            <Package className="h-12 w-12 text-slate-600 mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">{t("orders.noResults")}</h3>
            <p className="text-slate-400">You haven't placed any orders yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}