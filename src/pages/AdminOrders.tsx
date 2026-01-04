import { useEffect, useState, useRef } from "react";
import { db } from "@/firebase";
import { collection, query, orderBy, onSnapshot, doc, updateDoc } from "firebase/firestore";
import { getStorage, ref, uploadString, getDownloadURL } from "firebase/storage";
import * as fabric from 'fabric'; // ✅ Requires 'fabric' installed in frontend

import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Loader2, MapPin, ExternalLink, AlertCircle, CheckCircle2, Zap 
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
  printFiles?: Record<string, string>; // To store generated URLs
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Track which order is currently generating images
  const [processingId, setProcessingId] = useState<string | null>(null);

  // 🎨 HIDDEN CANVAS REFS
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<fabric.Canvas | null>(null);

  // 1. Initialize Hidden Fabric Canvas (Once)
  useEffect(() => {
    if (canvasRef.current && !fabricRef.current) {
        // Create a large canvas for High-Res output
        fabricRef.current = new fabric.Canvas(canvasRef.current, {
            width: 2400, // Print Quality Width (e.g. 8 inches @ 300dpi)
            height: 3200 
        });
    }
    // Cleanup
    return () => {
        fabricRef.current?.dispose();
        fabricRef.current = null;
    };
  }, []);

  // 2. Live Listen to Orders
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

  // 3. Logic to Suggest Correct Provider
  const getRecommendedProvider = (countryCode: string) => {
    if (countryCode === 'IN') return 'qikink';
    if (countryCode === 'US' || code === 'CA') return 'printify';
    return 'gelato'; 
  };

  // 🚀 4. THE MANUAL GENERATOR FUNCTION
  const handleManualProcess = async (order: Order) => {
    if (!fabricRef.current) return;
    setProcessingId(order.id);
    toast.info("Starting High-Res Generation...");

    try {
        const storage = getStorage();
        const designData = order.items[0]?.designData; // Assuming single item for now
        
        if (!designData) throw new Error("No design data found in order");

        const generatedFiles: Record<string, string> = {};
        const views = ['front', 'back'];

        // A. LOOP THROUGH VIEWS (Front/Back)
        for (const view of views) {
            const viewState = designData.viewStates?.[view];
            
            // Skip empty sides
            if (!viewState || viewState.length === 0) continue;

            // B. LOAD JSON TO HIDDEN CANVAS
            await new Promise<void>((resolve) => {
                fabricRef.current!.loadFromJSON({ version: "5.3.0", objects: viewState }, () => {
                    // Optional: You can resize objects here if needed
                    fabricRef.current!.renderAll();
                    resolve();
                });
            });

            // C. GENERATE PNG (High Res)
            const dataUrl = fabricRef.current.toDataURL({
                format: 'png',
                multiplier: 1, // Already set canvas to 2400px
                quality: 1
            });

            // D. UPLOAD TO FIREBASE
            const filename = `orders/${order.id}/print_${view}_${Date.now()}.png`;
            const storageRef = ref(storage, filename);
            await uploadString(storageRef, dataUrl, 'data_url');
            const downloadUrl = await getDownloadURL(storageRef);

            generatedFiles[view] = downloadUrl;
            console.log(`✅ Generated ${view}:`, downloadUrl);
        }

        // E. UPDATE FIRESTORE WITH PRINT FILES
        await updateDoc(doc(db, "orders", order.id), {
            printFiles: generatedFiles
        });

        // F. MOCK PUSH TO PROVIDER (Replace with real API call later)
        const targetProvider = order.provider || getRecommendedProvider(order.shippingAddress.countryCode);
        
        // Simulate API latency
        await new Promise(r => setTimeout(r, 1500));

        // G. MARK AS SYNCED
        await updateDoc(doc(db, "orders", order.id), {
            provider: targetProvider,
            providerStatus: 'synced',
            providerOrderId: `${targetProvider.toUpperCase()}-${Math.floor(Math.random() * 100000)}`,
            status: 'processing'
        });

        toast.success(`Order processed & sent to ${targetProvider.toUpperCase()}`);

    } catch (error) {
        console.error("Manual Process Error:", error);
        toast.error("Failed to process order");
    } finally {
        setProcessingId(null);
        // Clear canvas
        fabricRef.current.clear();
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><Loader2 className="h-8 w-8 text-orange-500 animate-spin" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#0f172a] text-white p-8 font-sans selection:bg-orange-500/30">
      
      {/* 🕵️ HIDDEN CANVAS (Off-Screen) */}
      <div style={{ position: 'absolute', left: '-9999px', visibility: 'hidden' }}>
        <canvas ref={canvasRef} />
      </div>

      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <div>
           <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-red-600">
             Order Command Center
           </h1>
           <p className="text-slate-400 mt-1">Manage global fulfillment & routing</p>
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
                  const isProcessingThis = processingId === order.id;

                  return (
                    <TableRow key={order.id} className="border-white/5 hover:bg-white/5 transition-colors">
                      <TableCell className="font-medium font-mono text-slate-300">
                          #{order.orderId ? order.orderId.slice(-6) : order.id.slice(0,6)}
                      </TableCell>

                      <TableCell>
                          <div className="text-slate-200 font-medium">{order.shippingAddress?.fullName}</div>
                      </TableCell>

                      <TableCell>
                          <div className="flex items-center gap-2 text-sm text-slate-300">
                              <MapPin className="h-3 w-3 text-slate-500" />
                              {order.shippingAddress?.countryCode}
                          </div>
                      </TableCell>

                      <TableCell>
                          <span className="font-bold text-white">₹{order.payment?.total}</span>
                      </TableCell>

                      <TableCell>
                          <Badge className="bg-slate-800 text-slate-300">
                                {order.provider?.toUpperCase() || 'AUTO'}
                          </Badge>
                      </TableCell>

                      {/* Sync Status */}
                      <TableCell>
                          {order.providerStatus === 'synced' ? (
                              <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-900/20 px-2 py-1 rounded-full w-fit">
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Fulfilled</span>
                              </div>
                          ) : (
                              <div className="flex items-center gap-1.5 text-xs text-yellow-500">
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  <span>Action Needed</span>
                              </div>
                          )}
                      </TableCell>

                      {/* Actions */}
                      <TableCell className="text-right">
                          <Button 
                              size="sm" 
                              onClick={() => handleManualProcess(order)}
                              disabled={order.providerStatus === 'synced' || isProcessingThis}
                              className={`h-8 text-xs ${
                                order.providerStatus === 'synced' 
                                ? 'bg-transparent text-slate-500 border border-slate-700' 
                                : 'bg-orange-600 hover:bg-orange-500 text-white shadow-lg shadow-orange-900/20'
                              }`}
                          >
                              {isProcessingThis ? (
                                  <><Loader2 className="mr-2 h-3 w-3 animate-spin" /> Generating...</>
                              ) : order.providerStatus === 'synced' ? (
                                  "Done"
                              ) : (
                                  <><Zap className="mr-1 h-3 w-3" /> Process Order</>
                              )}
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