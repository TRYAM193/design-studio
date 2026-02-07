import { useState, useEffect } from "react";
import { db, auth } from "@/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteField } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { 
  Loader2, RefreshCw, Truck, AlertCircle, CheckCircle, 
  ExternalLink, Search, Copy, Terminal 
} from "lucide-react";
import { toast } from "sonner";

// 🔒 SECURITY: Replace with your actual email
const ADMIN_EMAILS = ["tryam193@gmail.com", 'shreyaskumaraswamy2007@gmail.com']; 

export default function AdminDashboard() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  
  // Modal State
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingInput, setTrackingInput] = useState("");
  const [manualLoading, setManualLoading] = useState(false);

  // 1. FETCH ALL ORDERS (Real-time)
  useEffect(() => {
    if (!user) return;
    
    // Simple Admin Check
    if (!ADMIN_EMAILS.includes(user.email || "")) {
       // Optional: Redirect or show "Access Denied"
       // return; 
    }

    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // 2. RETRY BOT (Force Restart)
  const handleRetryBot = async (orderId: string) => {
    try {
      toast.info("Retrying Bot...");
      const orderRef = doc(db, "orders", orderId);
      
      // We set providerStatus back to null to re-trigger the Cloud Function
      await updateDoc(orderRef, {
        providerStatus: deleteField(), // Deleting it forces the "onUpdate" check to see it as 'fresh'
        botError: deleteField()
      });
      
      // Small timeout then set it to something that triggers change if needed
      // Actually, just deleting/updating a field triggers onUpdate in Cloud Functions
      // To be safe, we can toggle a 'retry' timestamp
      await updateDoc(orderRef, {
        retryTrigger: Date.now(),
        providerStatus: "pending_retry" // The bot looks for !synced
      });
      
      toast.success("Bot restart command sent!");
    } catch (error) {
      toast.error("Failed to retry.");
    }
  };

  // 3. MANUAL FULFILLMENT (Override API)
  const handleManualFulfill = async () => {
    if (!selectedOrder || !trackingInput) return;
    setManualLoading(true);
    try {
      const orderRef = doc(db, "orders", selectedOrder.id);
      await updateDoc(orderRef, {
        status: "shipped",
        providerStatus: "manual", // Mark as manually handled
        providerData: {
            provider: "manual",
            trackingUrl: trackingInput,
            trackingCode: "MANUAL-ENTRY",
            estimatedDelivery: new Date(Date.now() + 7 * 86400000).toISOString()
        }
      });
      toast.success("Order manually marked as Shipped!");
      setSelectedOrder(null);
      setTrackingInput("");
    } catch (error) {
      toast.error("Update failed.");
    } finally {
      setManualLoading(false);
    }
  };

  // Filter Logic
  const filteredOrders = orders.filter(o => 
     o.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
     o.shippingAddress?.fullName.toLowerCase().includes(searchTerm.toLowerCase())
  );

//   if (!user || !ADMIN_EMAILS.includes(user.email || "")) {
//       return (
//           <div className="h-screen flex flex-col items-center justify-center text-slate-400">
//              <AlertCircle className="h-12 w-12 mb-4 text-red-500" />
//              <h1 className="text-xl text-white font-bold">Access Denied</h1>
//              <p>This area is restricted to administrators.</p>
//           </div>
//       );
//   }

  return (
    <div className="p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen pb-20">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
                <Terminal className="h-8 w-8 text-orange-500" /> Admin Command
            </h1>
            <p className="text-slate-400">Monitor bots, fix errors, and manage fulfillment.</p>
        </div>
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
                placeholder="Search Order ID or Name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white"
            />
        </div>
      </div>

      {/* STATS ROW (Optional but cool) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
         <StatCard label="Total Orders" value={orders.length} icon={Copy} color="text-blue-400" />
         <StatCard label="Pending Bot" value={orders.filter(o => o.providerStatus !== 'synced' && o.providerStatus !== 'manual').length} icon={Loader2} color="text-yellow-400" />
         <StatCard label="API Errors" value={orders.filter(o => o.providerStatus === 'error').length} icon={AlertCircle} color="text-red-400" />
         <StatCard label="Shipped" value={orders.filter(o => o.status === 'shipped').length} icon={Truck} color="text-green-400" />
      </div>

      {/* ORDERS TABLE */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
            <CardTitle className="text-white">Live Operations</CardTitle>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-slate-900">
                        <TableHead className="text-slate-400">Order ID</TableHead>
                        <TableHead className="text-slate-400">Customer</TableHead>
                        <TableHead className="text-slate-400">Item</TableHead>
                        <TableHead className="text-slate-400">Bot Status</TableHead>
                        <TableHead className="text-slate-400">Provider</TableHead>
                        <TableHead className="text-right text-slate-400">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-slate-500">
                                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                            </TableCell>
                        </TableRow>
                    ) : filteredOrders.map((order) => (
                        <TableRow key={order.id} className="border-slate-800 hover:bg-slate-800/50">
                            
                            {/* ID & DATE */}
                            <TableCell className="font-mono text-slate-300">
                                <div>{order.orderId}</div>
                                <div className="text-xs text-slate-500">
                                    {order.createdAt?.toDate().toLocaleDateString()}
                                </div>
                            </TableCell>

                            {/* CUSTOMER */}
                            <TableCell>
                                <div className="text-white font-medium">{order.shippingAddress?.fullName}</div>
                                <div className="text-xs text-slate-500">{order.shippingAddress?.country}</div>
                            </TableCell>

                            {/* ITEM INFO */}
                            <TableCell className="text-slate-300 text-sm">
                                {order.items?.[0]?.productId} <br/>
                                <span className="text-xs text-slate-500">
                                    {order.items?.[0]?.variant?.color} / {order.items?.[0]?.variant?.size}
                                </span>
                            </TableCell>

                            {/* BOT STATUS */}
                            <TableCell>
                                <StatusBadge status={order.providerStatus} error={order.botError} />
                            </TableCell>

                            {/* PROVIDER INFO */}
                            <TableCell className="text-slate-300 text-sm">
                                {order.provider ? (
                                    <div className="flex items-center gap-1 uppercase font-bold text-xs tracking-wider">
                                        <CheckCircle className="h-3 w-3 text-green-500" />
                                        {order.provider}
                                    </div>
                                ) : (
                                    <span className="text-slate-600">-</span>
                                )}
                                {order.providerOrderId && (
                                    <div className="text-xs text-slate-500 font-mono mt-1">
                                        #{order.providerOrderId}
                                    </div>
                                )}
                            </TableCell>

                            {/* ACTIONS */}
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {/* 1. RETRY BUTTON (Only if error or stuck) */}
                                    {(order.providerStatus === 'error' || order.providerStatus === 'processing') && (
                                        <Button 
                                            size="sm" variant="outline" 
                                            className="h-8 border-yellow-600/50 text-yellow-500 hover:bg-yellow-600/10"
                                            onClick={() => handleRetryBot(order.id)}
                                        >
                                            <RefreshCw className="h-3 w-3 mr-1" /> Retry
                                        </Button>
                                    )}

                                    {/* 2. MANUAL OVERRIDE (Always available as backup) */}
                                    <Button 
                                        size="sm" variant="secondary" 
                                        className="h-8 bg-slate-800 text-slate-300 hover:text-white"
                                        onClick={() => setSelectedOrder(order)}
                                    >
                                        Edit
                                    </Button>

                                    {/* 3. VIEW DESIGN (Link to Mockup) */}
                                    {order.mockupFiles?.front && (
                                        <Button size="icon" variant="ghost" className="h-8 w-8" asChild>
                                            <a href={order.mockupFiles.front} target="_blank" rel="noreferrer">
                                                <ExternalLink className="h-4 w-4 text-slate-500" />
                                            </a>
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

      {/* MANUAL FULFILLMENT MODAL */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white">
            <DialogHeader>
                <DialogTitle>Manual Override: {selectedOrder?.orderId}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm text-yellow-200">
                    <p className="font-bold flex items-center gap-2"><AlertCircle className="h-4 w-4"/> Warning</p>
                    Use this only if the Bot failed and you placed the order manually on Qikink/Printify.
                </div>

                <div className="space-y-2">
                    <Label>Tracking URL / Number</Label>
                    <Input 
                        placeholder="e.g., https://bluedart.com/track/12345"
                        value={trackingInput}
                        onChange={(e) => setTrackingInput(e.target.value)}
                        className="bg-slate-800 border-slate-600 text-white"
                    />
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={() => setSelectedOrder(null)}>Cancel</Button>
                <Button 
                    className="bg-green-600 hover:bg-green-700" 
                    onClick={handleManualFulfill}
                    disabled={manualLoading}
                >
                    {manualLoading ? <Loader2 className="animate-spin mr-2"/> : <Truck className="mr-2 h-4 w-4"/>}
                    Mark as Shipped
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- HELPER COMPONENTS ---

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-6 flex items-center justify-between">
                <div>
                    <p className="text-slate-500 text-sm font-medium">{label}</p>
                    <h3 className="text-3xl font-bold text-white mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-full bg-slate-800 ${color}`}>
                    <Icon className="h-6 w-6" />
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status, error }: { status: string, error?: string }) {
    if (status === 'synced') {
        return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Synced</Badge>;
    }
    if (status === 'manual') {
        return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Manual</Badge>;
    }
    if (status === 'error') {
        return (
            <div className="flex flex-col items-start gap-1">
                <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20">Bot Error</Badge>
                {error && <span className="text-[10px] text-red-400 max-w-[120px] truncate" title={error}>{error}</span>}
            </div>
        );
    }
    if (status === 'processing') {
        return <Badge variant="outline" className="text-yellow-400 border-yellow-500/20 animate-pulse">Processing...</Badge>;
    }
    return <Badge variant="secondary" className="bg-slate-800 text-slate-400">Pending</Badge>;
}