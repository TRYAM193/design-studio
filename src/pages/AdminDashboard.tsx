import { useState, useEffect } from "react";
import { db } from "@/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteField, deleteDoc } from "firebase/firestore";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { 
  Loader2, RefreshCw, Truck, AlertCircle, CheckCircle, 
  Search, Copy, Terminal, IndianRupee, Trash2, Menu 
} from "lucide-react";
import { toast } from "sonner";

// 🔒 SECURITY: Replace with your actual admin emails
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
    
    const q = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  // --- ACTIONS (Same as before) ---

  const handleApproveCOD = async (orderId: string) => {
    try {
      toast.loading("Approving COD Order...");
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        status: "placed",
        paymentStatus: "cod_approved",
        providerStatus: "pending",
        approvedAt: new Date().toISOString()
      });
      toast.dismiss();
      toast.success("COD Order Approved! Bot triggered.");
    } catch (error) {
      toast.error("Failed to approve order.");
    }
  };

  const handleRetryBot = async (orderId: string) => {
    try {
      toast.info("Retrying Bot...");
      const orderRef = doc(db, "orders", orderId);
      await updateDoc(orderRef, {
        providerStatus: "retry",
        botError: deleteField(),
        retryTrigger: Date.now()
      });
      toast.success("Bot restart command sent!");
    } catch (error) {
      toast.error("Failed to retry.");
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if(!confirm("Are you sure you want to delete this order?")) return;
    try {
        await deleteDoc(doc(db, "orders", orderId));
        toast.success("Order deleted permanently");
    } catch (e) {
        toast.error("Could not delete order");
    }
  }

  const handleManualFulfill = async () => {
    if (!selectedOrder || !trackingInput) return;
    setManualLoading(true);
    try {
      const orderRef = doc(db, "orders", selectedOrder.id);
      await updateDoc(orderRef, {
        status: "shipped",
        providerStatus: "manual",
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

  // --- FILTERS ---

  const filteredOrders = orders.filter(o => 
     (o.orderId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
     o.shippingAddress?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const codPendingOrders = filteredOrders.filter(o => 
    (o.payment?.method === 'cod' || o.isCod === true) && 
    o.status !== 'placed' && 
    o.status !== 'shipped' && 
    o.status !== 'delivered' &&
    o.status !== 'cancelled'
  );

  const activeOrders = filteredOrders.filter(o => 
    !codPendingOrders.includes(o)
  );

  return (
    // RESPONSIVE FIX: Reduced padding on mobile (p-4) vs desktop (p-6)
    // Added overflow-x-hidden to prevent body scroll issues
    <div className="p-4 md:p-6 space-y-6 max-w-[1600px] mx-auto min-h-screen pb-20 bg-[#0f172a] text-slate-100 overflow-x-hidden">
      
      {/* HEADER: Stacked on mobile (flex-col), Row on desktop (md:flex-row) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h1 className="text-2xl md:text-3xl font-bold text-white flex items-center gap-2">
                <Terminal className="h-6 w-6 md:h-8 md:w-8 text-orange-500" /> 
                <span className="truncate">Admin Command</span>
            </h1>
            <p className="text-sm text-slate-400">Manage COD & Bots</p>
        </div>
        
        {/* RESPONSIVE FIX: Full width search on mobile */}
        <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
            <Input 
                placeholder="Search Order ID or Name..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-900 border-slate-700 text-white focus:ring-orange-500 w-full"
            />
        </div>
      </div>

      {/* STATS ROW: 1 Col (Mobile) -> 2 Cols (Tablet) -> 4 Cols (Desktop) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
         <StatCard label="Total Orders" value={orders.length} icon={Copy} color="text-blue-400" />
         <StatCard label="COD Pending" value={codPendingOrders.length} icon={IndianRupee} color="text-orange-400" />
         <StatCard label="Bot Errors" value={orders.filter(o => o.providerStatus === 'error').length} icon={AlertCircle} color="text-red-400" />
         <StatCard label="Shipped" value={orders.filter(o => o.status === 'shipped').length} icon={Truck} color="text-green-400" />
      </div>

      {/* TABS */}
      <Tabs defaultValue="live" className="w-full">
        {/* RESPONSIVE FIX: Scrollable tabs list if it gets too wide */}
        <TabsList className="bg-slate-900 border border-slate-800 w-full md:w-auto overflow-x-auto justify-start">
          <TabsTrigger value="live" className="flex-1 md:flex-none">Live Operations</TabsTrigger>
          <TabsTrigger value="cod" className="relative flex-1 md:flex-none">
            COD Verification
            {codPendingOrders.length > 0 && (
                <span className="absolute top-0 right-0 md:-top-1 md:-right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] text-white animate-pulse">
                    {codPendingOrders.length}
                </span>
            )}
          </TabsTrigger>
        </TabsList>

        {/* --- TAB 1: LIVE OPERATIONS --- */}
        <TabsContent value="live" className="mt-4">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader className="px-4 py-4 md:px-6 md:py-6">
                    <CardTitle className="text-white text-lg md:text-xl">Active Orders</CardTitle>
                </CardHeader>
                <CardContent className="p-0 md:p-6 pt-0">
                    <OrderTable 
                        data={activeOrders} 
                        loading={loading} 
                        onRetry={handleRetryBot}
                        onEdit={(o: any) => setSelectedOrder(o)}
                        onDelete={handleDeleteOrder}
                        type="live"
                    />
                </CardContent>
            </Card>
        </TabsContent>

        {/* --- TAB 2: COD APPROVAL QUEUE --- */}
        <TabsContent value="cod" className="mt-4">
             <Card className="bg-slate-900 border-slate-800 border-l-4 border-l-orange-500">
                <CardHeader className="px-4 py-4 md:px-6 md:py-6">
                    <CardTitle className="text-white flex items-center gap-2 text-lg md:text-xl">
                        <IndianRupee className="h-5 w-5 text-orange-400" /> COD Queue
                    </CardTitle>
                    <p className="text-xs md:text-sm text-slate-400">
                        Confirm orders before approving.
                    </p>
                </CardHeader>
                <CardContent className="p-0 md:p-6 pt-0">
                    <OrderTable 
                        data={codPendingOrders} 
                        loading={loading} 
                        onApprove={handleApproveCOD} 
                        onDelete={handleDeleteOrder}
                        type="cod"
                    />
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>

      {/* MANUAL FULFILLMENT MODAL */}
      <Dialog open={!!selectedOrder} onOpenChange={(open) => !open && setSelectedOrder(null)}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white w-[95vw] max-w-md mx-auto rounded-xl">
            <DialogHeader>
                <DialogTitle className="truncate">Manual Override: {selectedOrder?.orderId}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
                <div className="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-md text-sm text-yellow-200">
                    <p className="font-bold flex items-center gap-2"><AlertCircle className="h-4 w-4"/> Warning</p>
                    Use only if Bot failed.
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
            <DialogFooter className="flex-col gap-2 sm:flex-row">
                <Button variant="ghost" onClick={() => setSelectedOrder(null)} className="w-full sm:w-auto">Cancel</Button>
                <Button 
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" 
                    onClick={handleManualFulfill}
                    disabled={manualLoading}
                >
                    {manualLoading ? <Loader2 className="animate-spin mr-2"/> : <Truck className="mr-2 h-4 w-4"/>}
                    Mark Shipped
                </Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// --- SUB-COMPONENT: REUSABLE RESPONSIVE TABLE ---
function OrderTable({ data, loading, type, onRetry, onEdit, onApprove, onDelete }: any) {
    if (loading) return <div className="p-8 text-center"><Loader2 className="h-8 w-8 animate-spin mx-auto text-orange-500" /></div>;
    if (data.length === 0) return <div className="p-8 text-center text-slate-500">No orders found.</div>;

    return (
        // RESPONSIVE FIX: overflow-x-auto allows horizontal scrolling on mobile
        <div className="overflow-x-auto w-full">
            {/* min-w-[800px] ensures the table doesn't squish columns on small screens */}
            <Table className="min-w-[800px] text-sm">
                <TableHeader>
                    <TableRow className="border-slate-800 hover:bg-slate-900">
                        <TableHead className="text-slate-400 w-[120px]">Order ID</TableHead>
                        <TableHead className="text-slate-400 w-[180px]">Customer</TableHead>
                        <TableHead className="text-slate-400 w-[100px]">Amount</TableHead>
                        <TableHead className="text-slate-400 w-[140px]">Status</TableHead>
                        {type === 'live' && <TableHead className="text-slate-400 w-[140px]">Provider</TableHead>}
                        <TableHead className="text-right text-slate-400 w-[200px]">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((order: any) => (
                        <TableRow key={order.id} className="border-slate-800 hover:bg-slate-800/50">
                            {/* ID */}
                            <TableCell className="font-mono text-slate-300">
                                <div>{order.orderId || order.id.slice(0,6)}</div>
                                <div className="text-xs text-slate-500">
                                    {order.createdAt?.toDate ? order.createdAt.toDate().toLocaleDateString() : 'N/A'}
                                </div>
                            </TableCell>

                            {/* CUSTOMER */}
                            <TableCell>
                                <div className="text-white font-medium truncate max-w-[160px]">{order.shippingAddress?.fullName || "Guest"}</div>
                                <div className="text-xs text-slate-500 truncate max-w-[160px]">{order.shippingAddress?.phone || order.shippingAddress?.city}</div>
                            </TableCell>

                            {/* AMOUNT */}
                            <TableCell className="text-white font-bold">
                                ₹{order.payment?.total || 0}
                            </TableCell>

                            {/* STATUS */}
                            <TableCell>
                                {type === 'cod' ? (
                                    <Badge className="bg-orange-500/10 text-orange-400 border-orange-500/20 whitespace-nowrap">Pending Verify</Badge>
                                ) : (
                                    <StatusBadge status={order.providerStatus} error={order.botError} globalStatus={order.status} />
                                )}
                            </TableCell>

                            {/* PROVIDER (Live Only) */}
                            {type === 'live' && (
                                <TableCell className="text-slate-300 text-sm">
                                    {order.provider ? (
                                        <div className="flex items-center gap-1 uppercase font-bold text-xs tracking-wider">
                                            <CheckCircle className="h-3 w-3 text-green-500" /> {order.provider}
                                        </div>
                                    ) : (
                                        <span className="text-slate-600">-</span>
                                    )}
                                </TableCell>
                            )}

                            {/* ACTIONS */}
                            <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                    {/* COD APPROVE BUTTON */}
                                    {type === 'cod' && (
                                        <Button 
                                            size="sm" 
                                            className="h-8 bg-green-600 hover:bg-green-700 text-white whitespace-nowrap"
                                            onClick={() => onApprove(order.id)}
                                        >
                                            <CheckCircle className="h-3 w-3 mr-1" /> Approve
                                        </Button>
                                    )}

                                    {/* RETRY BOT BUTTON */}
                                    {type === 'live' && (order.providerStatus === 'error' || order.providerStatus === 'processing') && (
                                        <Button 
                                            size="sm" variant="outline" 
                                            className="h-8 border-yellow-600/50 text-yellow-500 hover:bg-yellow-600/10 whitespace-nowrap"
                                            onClick={() => onRetry(order.id)}
                                        >
                                            <RefreshCw className="h-3 w-3 mr-1" /> Retry
                                        </Button>
                                    )}

                                    {/* EDIT / MANUAL */}
                                    {type === 'live' && (
                                        <Button 
                                            size="sm" variant="secondary" 
                                            className="h-8 bg-slate-800 text-slate-300 hover:text-white"
                                            onClick={() => onEdit(order)}
                                        >
                                            Edit
                                        </Button>
                                    )}
                                    
                                    {/* DELETE BUTTON */}
                                    <Button size="icon" variant="ghost" className="h-8 w-8 text-red-900 hover:bg-red-900/20 hover:text-red-500" onClick={() => onDelete(order.id)}>
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}

// --- HELPER COMPONENTS ---

function StatCard({ label, value, icon: Icon, color }: any) {
    return (
        <Card className="bg-slate-900 border-slate-800">
            <CardContent className="p-4 md:p-6 flex items-center justify-between">
                <div>
                    <p className="text-slate-500 text-xs md:text-sm font-medium">{label}</p>
                    <h3 className="text-2xl md:text-3xl font-bold text-white mt-1">{value}</h3>
                </div>
                <div className={`p-3 rounded-full bg-slate-800 ${color}`}>
                    <Icon className="h-5 w-5 md:h-6 md:w-6" />
                </div>
            </CardContent>
        </Card>
    );
}

function StatusBadge({ status, error, globalStatus }: { status: string, error?: string, globalStatus?: string }) {
    if (globalStatus === 'shipped') return <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20">Shipped</Badge>;
    if (status === 'synced') return <Badge className="bg-green-500/10 text-green-400 border-green-500/20">Synced</Badge>;
    if (status === 'manual') return <Badge className="bg-indigo-500/10 text-indigo-400 border-indigo-500/20">Manual</Badge>;
    if (status === 'error') {
        return (
            <div className="flex flex-col items-start gap-1">
                <Badge variant="destructive" className="bg-red-500/10 text-red-400 border-red-500/20 whitespace-nowrap">Bot Error</Badge>
            </div>
        );
    }
    if (status === 'processing') return <Badge variant="outline" className="text-yellow-400 border-yellow-500/20 animate-pulse whitespace-nowrap">Processing...</Badge>;
    return <Badge variant="secondary" className="bg-slate-800 text-slate-400">Pending</Badge>;
}