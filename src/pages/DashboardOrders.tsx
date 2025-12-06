import { motion } from "framer-motion";
import { Package, Truck, CheckCircle, Clock, Search, Filter, Lock } from "lucide-react";
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

export default function DashboardOrders() {
  const { isAuthenticated } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="h-20 w-20 bg-secondary/50 rounded-full flex items-center justify-center">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Sign in to view orders</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            Track your shipments, view order history, and manage your purchases by signing in.
          </p>
        </div>
        <Link to="/auth">
          <Button size="lg" className="rounded-full px-8">
            Sign In / Sign Up
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Delivered": return "default"; // Black/Primary
      case "Shipped": return "secondary";
      case "Processing": return "outline";
      default: return "secondary";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Delivered": return <CheckCircle className="h-3 w-3 mr-1" />;
      case "Shipped": return <Truck className="h-3 w-3 mr-1" />;
      case "Processing": return <Clock className="h-3 w-3 mr-1" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-6">
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold tracking-tight"
        >
          Orders
        </motion.h1>

        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search orders..." 
              className="pl-10" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <SelectValue placeholder="Status" />
              </div>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="All">All Statuses</SelectItem>
              <SelectItem value="Processing">Processing</SelectItem>
              <SelectItem value="Shipped">Shipped</SelectItem>
              <SelectItem value="Delivered">Delivered</SelectItem>
            </SelectContent>
          </Select>
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
              <Card className="overflow-hidden hover:bg-secondary/10 transition-colors cursor-pointer group">
                <CardContent className="p-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4 p-4 sm:p-6">
                    {/* Image */}
                    <div className="h-20 w-20 rounded-lg bg-secondary overflow-hidden flex-shrink-0">
                      <img src={order.image} alt="Order Item" className="h-full w-full object-cover" />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold truncate">Order #{order.id}</h3>
                        <span className="sm:hidden font-semibold">{order.total}</span>
                      </div>
                      <p className="text-sm text-muted-foreground truncate">
                        {order.items.join(", ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Placed on {order.date}
                      </p>
                    </div>

                    {/* Status & Total (Desktop) */}
                    <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8 mt-2 sm:mt-0 w-full sm:w-auto">
                      <Badge variant={getStatusColor(order.status) as any} className="flex items-center">
                        {getStatusIcon(order.status)}
                        {order.status}
                      </Badge>
                      <span className="hidden sm:block font-semibold min-w-[80px] text-right">{order.total}</span>
                      <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            No orders found matching your filters.
          </div>
        )}
      </div>
    </div>
  );
}