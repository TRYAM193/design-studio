import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, MapPin, ExternalLink, AlertCircle, CheckCircle2, Eye, RefreshCw
} from "lucide-react";
import { toast } from "sonner";

// ✅ 1. Match the Interface to YOUR Data Structure
interface Order {
  id: string;
  orderId: string;
  createdAt: any; // Timestamp
  status: string; // 'placed', 'processing', 'shipped'
  
  // Nested Objects
  payment: {
    total: number;
    status: string;
    method: string;
    currency: string;
  };
  
  shippingAddress: {
    fullName: string;
    email: string;
    line1: string;
    city: string;
    state: string;
    country: string;
    countryCode: string; // 'IN', 'US'
    zip: string;
  };

  items: any[];
  
  // Provider Fields
  provider: string; // 'gelato', 'qikink', 'printify'
  providerStatus?: string; // 'synced', 'error'
  providerOrderId?: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  console.log(orders)

  // 1. Live Listen to Orders
  useEffect(() => {
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedOrders = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as Order));
      setOrders(fetchedOrders);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // 2. Logic to Suggest Correct Provider
  const getRecommendedProvider = (countryCode: string) => {
    if (countryCode === 'IN') return 'qikink';
    if (countryCode === 'US') return 'printify';
    return 'gelato'; // Rest of world
  };

  // 3. Update Provider Function (Fixing the wrong assignment)
  const handleReRoute = async (orderId: string, correctProvider: string) => {
    try {
        await updateDoc(doc(db, "orders", orderId), {
            provider: correctProvider
        });
        toast.success(`Rerouted to ${correctProvider.toUpperCase()}`);
    } catch (e) {
        toast.error("Failed to update provider");
    }
  };

  // 4. Mock Sync
  const handleManualSync = async (order: Order) => {
    const targetProvider = order.provider;
    toast.promise(
      new Promise((resolve) => setTimeout(resolve, 2000)), 
      {
        loading: `Pushing to ${targetProvider.toUpperCase()} API...`,
        success: () => {
            updateDoc(doc(db, "orders", order.id), {
                providerStatus: 'synced',
                providerOrderId: `POD-${Math.floor(Math.random() * 10000)}`,
                status: 'processing'
            });
            return `Sent to ${targetProvider}`;
        },
        error: 'Failed to sync'
      }
    );
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><Loader2 className="h-8 w-8 text-orange-500 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans selection:bg-orange-500/30">
      
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600">
             Order Command Center
           </h1>
           <p className="text-slate-400 mt-1">Manage global fulfillment & routing</p>
        </div>
        <div className="flex gap-4">
             {/* Simple Stats */}
            <Card className="bg-slate-900 border-white/10 px-6 py-2">
                <span className="text-xs text-slate-500 uppercase font-bold">Total Sales</span>
                <p className="text-2xl font-bold text-green-400">₹{orders.reduce((acc, o) => acc + (o.payment?.total || 0), 0).toLocaleString()}</p>
            </Card>
        </div>
      </div>

      <div className="max-w-7xl mx-auto">
        <Card className="bg-slate-900/50 border border-white/10 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white">Live Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow className="border-white/10 hover:bg-transparent">
                  <TableHead className="text-slate-400">Order ID</TableHead>
                  <TableHead className="text-slate-400">Customer</TableHead>
                  <TableHead className="text-slate-400">Location</TableHead>
                  <TableHead className="text-slate-400">Total</TableHead>
                  <TableHead className="text-slate-400">Provider</TableHead>
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  // Logic to check if routing is correct
                  const recommended = getRecommendedProvider(order.shippingAddress?.countryCode || 'IN');
                  const isMisrouted = order.provider !== recommended;

                  return (
                    <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      
                      {/* ID */}
                      <TableCell className="font-medium font-mono text-slate-300">
                          #{order.orderId ? order.orderId.slice(-6) : order.id.slice(0,6)}
                          <div className="text-[10px] text-slate-500">{order.createdAt?.seconds ? new Date(order.createdAt.seconds * 1000).toLocaleDateString() : 'Just now'}</div>
                      </TableCell>

                      {/* Customer (Using correct fields) */}
                      <TableCell>
                          <div className="text-slate-200 font-medium">{order.shippingAddress?.fullName}</div>
                          <div className="text-xs text-slate-500">{order.shippingAddress?.email}</div>
                      </TableCell>

                      {/* Location */}
                      <TableCell>
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                              <MapPin className="h-3 w-3 text-slate-500" />
                              {order.shippingAddress?.city}, {order.shippingAddress?.countryCode}
                          </div>
                      </TableCell>

                      {/* Payment Total */}
                      <TableCell>
                          <span className="font-bold text-white">₹{order.payment?.total}</span>
                          <span className="text-xs text-green-400 ml-2 capitalize">({order.payment?.status})</span>
                      </TableCell>

                      {/* Provider Routing (With Fix Button) */}
                      <TableCell>
                          <div className="flex flex-col gap-1 items-start">
                            {/* Current Assigned Provider */}
                            <Badge className={`
                                ${order.provider === 'qikink' ? 'bg-orange-900/50 text-orange-400 border-orange-500/20' : ''}
                                ${order.provider === 'printify' ? 'bg-green-900/50 text-green-400 border-green-500/20' : ''}
                                ${order.provider === 'gelato' ? 'bg-blue-900/50 text-blue-400 border-blue-500/20' : ''}
                            `}>
                                {order.provider?.toUpperCase()}
                            </Badge>

                            {/* Misroute Warning & Fix */}
                            {/* {isMisrouted && !order.providerStatus && (
                                <button 
                                    onClick={() => handleReRoute(order.id, recommended)}
                                    className="flex items-center gap-1 text-[10px] text-yellow-500 hover:text-yellow-400 bg-yellow-500/10 px-2 py-0.5 rounded border border-yellow-500/20 transition-colors"
                                    title={`Click to change provider to ${recommended.toUpperCase()}`}
                                >
                                    <RefreshCw className="h-3 w-3" /> Should be {recommended.toUpperCase()}
                                </button>
                            )} */}
                          </div>
                      </TableCell>

                      {/* Sync Status */}
                      <TableCell>
                          {order.providerStatus === 'synced' ? (
                              <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded-full w-fit">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Synced</span>
                              </div>
                          ) : (
                              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  <span>Pending Push</span>
                              </div>
                          )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                          <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleManualSync(order)}
                              disabled={order.providerStatus === 'synced'}
                              className="h-8 text-xs border-orange-500/30 text-orange-400 hover:bg-orange-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                              <ExternalLink className="mr-1 h-3 w-3" /> Push API
                          </Button>
                      </TableCell>

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}