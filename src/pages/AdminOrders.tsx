import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, 
  MapPin, 
  ExternalLink, 
  AlertCircle, 
  CheckCircle2, 
  Truck,
  Eye
} from "lucide-react";
import { toast } from "sonner";

// Define the Order Shape
interface Order {
  id: string;
  createdAt: any;
  customer: {
    email: string;
    name: string;
  };
  shippingAddress: {
    country: string;
    city: string;
  };
  total: number;
  status: string; // 'pending', 'processing', 'shipped'
  items: any[];
  
  // POD Integration Fields
  provider?: 'qikink' | 'printify' | 'gelato'; 
  providerOrderId?: string;
  providerStatus?: 'pending' | 'synced' | 'error';
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Live Listen to Orders
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => {
        const data = doc.data();
        // Auto-determine provider based on country logic if not set
        const country = data.shippingAddress?.country || 'IN';
        let provider = 'gelato'; // Default
        if (country === 'IN') provider = 'qikink';
        if (country === 'US') provider = 'printify';

        return {
          id: doc.id,
          ...data,
          provider: data.provider || provider // Fallback logic
        } as Order;
      });
      setOrders(fetchedOrders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);
  console.log(orders);

  // 2. Mock "Manual Sync" (Actual sync happens in backend)
  const handleManualSync = async (order: Order) => {
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)), // Fake API delay
      {
        loading: `Sending to ${order.provider?.toUpperCase()}...`,
        success: () => {
            // In real app, Cloud Function updates this. Here we simulate it.
            updateDoc(doc(db, "orders", order.id), {
                providerStatus: 'synced',
                providerOrderId: `POD-${Math.floor(Math.random() * 10000)}`,
                status: 'processing'
            });
            return `Order successfully sent to ${order.provider}`;
        },
        error: 'Failed to sync'
      }
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans selection:bg-orange-500/30">
      
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600">
             Global Order Command
           </h1>
           <p className="text-slate-400 mt-1">Monitor multi-vendor routing (Qikink / Printify / Gelato)</p>
        </div>
        <div className="flex gap-4">
            <Card className="bg-slate-900 border-white/10 px-4 py-2">
                <span className="text-xs text-slate-500 uppercase">Pending Sync</span>
                <p className="text-2xl font-bold text-orange-500">{orders.filter(o => !o.providerStatus || o.providerStatus === 'pending').length}</p>
            </Card>
            <Card className="bg-slate-900 border-white/10 px-4 py-2">
                <span className="text-xs text-slate-500 uppercase">Revenue</span>
                <p className="text-2xl font-bold text-green-400">₹{orders.reduce((acc, o) => acc + o.total, 0).toFixed(0)}</p>
            </Card>
        </div>
      </div>

      {/* Orders Table */}
      <div className="max-w-7xl mx-auto">
        <Card className="bg-slate-900/50 border border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Recent Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-400">Order ID</TableHead>
                  <TableHead className="text-slate-400">Customer</TableHead>
                  <TableHead className="text-slate-400">Destination</TableHead>
                  <TableHead className="text-slate-400">Items</TableHead>
                  <TableHead className="text-slate-400">Routed To</TableHead>
                  <TableHead className="text-slate-400">Sync Status</TableHead>
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                    
                    {/* ID & Date */}
                    <TableCell className="font-medium">
                        <span className="text-white">#{order.id.slice(0,6)}</span>
                        <div className="text-xs text-slate-500">{new Date(order.createdAt).toLocaleDateString()}</div>
                    </TableCell>

                    {/* Customer */}
                    <TableCell>
                        <div className="text-slate-200">{order.customer.name || 'Name'}</div>
                        <div className="text-xs text-slate-500">{order.customer.email}</div>
                    </TableCell>

                    {/* Destination */}
                    <TableCell>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-3 w-3 text-slate-400" />
                            <span className="text-slate-300">{order.shippingAddress.city}, {order.shippingAddress.country}</span>
                        </div>
                    </TableCell>

                    {/* Items Count */}
                    <TableCell>
                        <span className="inline-flex items-center justify-center px-2 py-1 rounded-md bg-slate-800 text-xs text-slate-300 border border-white/5">
                            {order.items.length} Items
                        </span>
                    </TableCell>

                    {/* ✅ PROVIDER ROUTING LOGIC DISPLAY */}
                    <TableCell>
                        {order.provider === 'qikink' && (
                            <Badge className="bg-orange-900/50 text-orange-400 border-orange-500/20 hover:bg-orange-900/50">🇮🇳 Qikink</Badge>
                        )}
                        {order.provider === 'printify' && (
                            <Badge className="bg-green-900/50 text-green-400 border-green-500/20 hover:bg-green-900/50">🇺🇸 Printify</Badge>
                        )}
                        {order.provider === 'gelato' && (
                            <Badge className="bg-blue-900/50 text-blue-400 border-blue-500/20 hover:bg-blue-900/50">🌍 Gelato</Badge>
                        )}
                    </TableCell>

                    {/* Sync Status */}
                    <TableCell>
                        {order.providerStatus === 'synced' ? (
                            <div className="flex items-center gap-1.5 text-xs text-green-400">
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                <span>Sent ({order.providerOrderId})</span>
                            </div>
                        ) : order.providerStatus === 'error' ? (
                            <div className="flex items-center gap-1.5 text-xs text-red-400">
                                <AlertCircle className="h-3.5 w-3.5" />
                                <span>Failed</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-xs text-yellow-500/80">
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                <span>Pending API</span>
                            </div>
                        )}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                             <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-white">
                                <Eye className="h-4 w-4" />
                             </Button>
                             {(!order.providerStatus || order.providerStatus === 'error') && (
                                <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleManualSync(order)}
                                    className="h-8 text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white"
                                >
                                    <ExternalLink className="mr-1 h-3 w-3" /> Push to {order.provider === 'qikink' ? 'Qikink' : order.provider === 'printify' ? 'Printify' : 'Gelato'}
                                </Button>
                             )}
                        </div>
                    </TableCell>

                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}