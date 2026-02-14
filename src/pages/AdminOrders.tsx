import { useEffect, useState } from "react";
import { db } from "@/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteField, deleteDoc } from "firebase/firestore";

import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, MapPin, AlertCircle, CheckCircle2, Zap, RefreshCw, Terminal 
} from "lucide-react";
import { toast } from "sonner";

interface Order {
  id: string;
  orderId: string;
  createdAt: any;
  status: string;
  payment: { total: number; status: string; };
  shippingAddress: { fullName: string; countryCode: string; city: string; };
  items: any[];
  provider: string;
  providerStatus?: string;
  providerOrderId?: string;
  botLog?: string; // We want to see what the bot is saying
  botError?: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

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

  // 🚀 REAL BOT TRIGGER
  // Instead of faking it, this resets the status so the Cloud Function wakes up
  const handleRetryBot = async (order: Order) => {
    setProcessingId(order.id);
    toast.info("Waking up the Bot...");

    try {
        const orderRef = doc(db, "orders", order.orderId);

        // We update the document to a state that the 'onUpdate' trigger likes:
        // status: 'placed' AND providerStatus: NOT 'synced'
        await updateDoc(orderRef, {
            status: 'placed',        // Ensure it looks new
            providerStatus: 'retry', // Change status to trigger 'onUpdate'
            botError: deleteField(), // Clear old errors
            botLog: "Manual Retry Requested..."
        });

        toast.success("Signal sent! Check logs in Firebase Console.");
    } catch (error) {
        console.error("Retry Error:", error);
        toast.error("Failed to signal bot");
    } finally {
        setProcessingId(null);
    }
  };

  const handleDelete = async (order: Order) => {
    await deleteDoc(doc(db, "orders", order.id));
    toast.success("Order deleted");
  }

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
           <p className="text-slate-400 mt-1">Real-time Bot Monitoring</p>
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
                  <TableHead className="text-slate-400">Status</TableHead>
                  <TableHead className="text-slate-400 w-[300px]">Bot Logs</TableHead>
                  <TableHead className="text-right text-slate-400">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const isProcessingThis = processingId === order.id;
                  const isSynced = order.providerStatus === 'synced';
                  const isError = order.providerStatus === 'error' || order.providerStatus === 'manual_action_needed';
                  const isWorking = order.providerStatus === 'processing';

                  return (
                    <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium font-mono text-slate-300">
                          #{order.orderId ? order.orderId.slice(-6) : order.id.slice(0,6)}
                      </TableCell>

                      <TableCell>
                          <div className="text-slate-200 font-medium">{order.shippingAddress?.fullName}</div>
                          <div className="text-xs text-slate-500">{order.shippingAddress?.countryCode}</div>
                      </TableCell>

                      {/* Status Badge */}
                      <TableCell>
                          {isSynced ? (
                              <Badge className="bg-green-900/50 text-green-400 hover:bg-green-900/50 border-green-800">
                                  <CheckCircle2 className="w-3 h-3 mr-1" /> Fulfilled
                              </Badge>
                          ) : isError ? (
                              <Badge variant="destructive" className="bg-red-900/50 text-red-400 border-red-800">
                                  <AlertCircle className="w-3 h-3 mr-1" /> {order.providerStatus === 'manual_action_needed' ? 'Manual Check' : 'Error'}
                              </Badge>
                          ) : isWorking ? (
                              <Badge className="bg-blue-900/50 text-blue-400 border-blue-800 animate-pulse">
                                  <RefreshCw className="w-3 h-3 mr-1 animate-spin" /> Processing...
                              </Badge>
                          ) : (
                              <Badge variant="outline" className="text-slate-500">
                                  Pending
                              </Badge>
                          )}
                      </TableCell>

                      {/* Bot Logs (Crucial for Debugging) */}
                      <TableCell className="font-mono text-xs text-slate-400">
                          <div className="flex items-start gap-2 max-w-[300px] overflow-hidden">
                              <Terminal className="w-3 h-3 mt-1 text-orange-500 shrink-0" />
                              <div className="flex flex-col">
                                  <span>{order.botLog || "Waiting for bot..."}</span>
                                  {order.botError && (
                                    <span className="text-red-400 mt-1">{order.botError}</span>
                                  )}
                                  {order.providerOrderId && (
                                      <span className="text-green-500 mt-1">ID: {order.providerOrderId}</span>
                                  )}
                              </div>
                          </div>
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                          <Button 
                              size="sm" 
                              onClick={() => handleRetryBot(order)}
                              disabled={isSynced || isWorking || isProcessingThis}
                              className="h-8 text-xs bg-slate-800 hover:bg-slate-700 text-white border border-white/10"
                          >
                              {isProcessingThis ? (
                                  <Loader2 className="h-3 w-3 animate-spin" />
                              ) : isSynced ? (
                                  "Done"
                              ) : (
                                  <><Zap className="mr-1 h-3 w-3 text-yellow-400" /> Retry Bot</>
                              )}
                          </Button>
                          <Button variant="outline" size="sm" onClick={() => handleDelete(order)} className="h-8 text-xs ml-2 border-slate-700 text-slate-400 hover:bg-slate-800">
                              Delete
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