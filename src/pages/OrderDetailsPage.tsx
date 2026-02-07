import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router";
import { 
  Package, Truck, Calendar, MapPin, ExternalLink, 
  ArrowLeft, RefreshCw, Loader2, Check, Circle, 
  Printer, Shirt, CreditCard, ShieldCheck, HelpCircle, AlertCircle 
} from "lucide-react"; 

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { db, functions } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// ------------------------------------------------------------------
// 📝 CONSTANTS
// ------------------------------------------------------------------
const TRUST_LINES = [
  "Custom prints need 2-3 days to craft perfectly.",
  "Good things take time. Your unique item is being made.",
  "Quality checks ensure your custom order arrives flawless."
];

const QUALITY_LINES = [
  "We use premium materials for a lasting fit.",
  "Every item is hand-checked before shipping."
];

const HELP_OPTIONS = [
  "Track my package",
  "Report a problem", 
  "Change shipping address",
  "Request a refund",
  "Contact Support"
];

// ------------------------------------------------------------------
// 🚦 VERTICAL TIMELINE TRACKER
// ------------------------------------------------------------------
const OrderTrackerVertical = ({ status, providerStatus }: { status: string, providerStatus?: string }) => {
  const steps = [
    { label: "Order Placed", dateLabel: "Order Received", key: "placed" },
    { label: "Processing", dateLabel: "Sent to Production", key: "processing" },
    { label: "Printing", dateLabel: "In Production", key: "printing" },
    { label: "Shipped", dateLabel: "On the way", key: "shipped" },
    { label: "Delivered", dateLabel: "Arrived", key: "delivered" }
  ];

  const getCurrentStepIndex = () => {
    if (status === 'delivered') return 4;
    if (status === 'shipped') return 3;
    if (providerStatus === 'printing' || providerStatus === 'production') return 2;
    if (status === 'processing' || providerStatus === 'synced') return 1;
    return 0; 
  };

  const currentStep = getCurrentStepIndex();

  return (
    <div className="relative pl-4 py-2">
      <div className="absolute left-[35px] top-5 bottom-5 w-[2px] bg-slate-800" />
      <div 
        className="absolute left-[35px] top-5 w-[2px] bg-green-500 transition-all duration-700 ease-out"
        style={{ height: `${(currentStep / (steps.length - 1)) * 100}%` }}
      />
      <div className="space-y-8">
        {steps.map((step, index) => {
          const isCompleted = index <= currentStep;
          const isCurrent = index === currentStep;
          return (
            <div key={step.key} className="relative flex items-center gap-4 group">
              <div 
                className={cn(
                  "relative z-10 w-10 h-10 rounded-full flex items-center justify-center border-4 transition-all duration-300 shrink-0",
                  isCompleted ? "bg-[#0f172a] border-green-500 text-green-500" : "bg-[#0f172a] border-slate-700 text-slate-700",
                  isCurrent && "shadow-[0_0_15px_rgba(34,197,94,0.4)] scale-110 border-green-400"
                )}
              >
                {isCompleted ? <Check className="w-5 h-5" /> : <Circle className="w-4 h-4 fill-current" />}
              </div>
              <div className="flex flex-col">
                <span className={cn(
                  "font-bold text-sm uppercase tracking-wide transition-colors",
                  isCompleted ? "text-white" : "text-slate-500"
                )}>
                  {step.label}
                </span>
                <span className="text-xs text-slate-500 font-medium">{step.dateLabel}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 📄 MAIN PAGE
// ------------------------------------------------------------------
export default function OrderDetailsPage() {
  const { orderId } = useParams();
  const location = useLocation();

  const initialOrder = location.state?.orderData;
  const [order, setOrder] = useState<any>(initialOrder || null);
  const [loading, setLoading] = useState(!initialOrder);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      if (!initialOrder) setLoading(true);
      const docRef = doc(db, "orders", orderId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setOrder({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error("Order not found");
      }
    } catch (error) {
      console.error("Error fetching order:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrder(); }, [orderId]);

  const handleRefreshStatus = async () => {
    if (!order) return;
    setRefreshing(true);
    try {
      const refreshFn = httpsCallable(functions, 'refreshOrderStatus');
      const result: any = await refreshFn({ orderId: order.id });
      if (result.data.updated) {
        toast.success(`Status updated: ${result.data.newStatus}`);
        fetchOrder(); 
      } else {
        toast.info("No updates found from courier yet.");
      }
    } catch (error) {
      toast.error("Refresh failed.");
    } finally {
      setRefreshing(false);
    }
  };

  const getDeliveryConfidence = () => {
    if (order?.status === 'delivered') return "Delivered";
    if (order?.status === 'shipped') return "On track";
    return "Estimated";
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "Pending...";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString("en-US", { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) return <div className="min-h-screen bg-[#0f172a] flex items-center justify-center"><Loader2 className="animate-spin text-orange-500 h-8 w-8" /></div>;
  if (!order) return <div className="text-white text-center pt-20">Order not found</div>;

  return (
    <div className="min-h-screen bg-[#0f172a] pb-20 relative font-sans">
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none mix-blend-overlay"></div>
      
      <div className="container max-w-6xl mx-auto px-4 py-8 relative z-10">
        
        {/* HEADER */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 mb-6 lg:mb-8 border-b border-white/10 pb-4 lg:pb-6">
          <div className="space-y-2">
            <Link to="/dashboard/orders" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm transition-colors mb-1">
              <ArrowLeft className="h-4 w-4" /> Back to Orders
            </Link>
            <h1 className="text-3xl font-extrabold text-white flex items-center gap-3">
              Order #{order.id}
            </h1>
            <div className="flex items-center gap-4 text-sm text-slate-400">
               <span className="flex items-center gap-2"><Calendar className="h-4 w-4" /> {formatDate(order.createdAt)}</span>
               <span className="h-1 w-1 rounded-full bg-slate-600"></span>
               <span className="flex items-center gap-2"><CreditCard className="h-4 w-4" /> Total: {order.payment?.amount || order.total} {order.currency}</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
           <Button 
              variant="ghost" 
              className="w-full sm:w-auto text-slate-500 hover:text-white hover:bg-white/5 transition-all" 
              onClick={handleRefreshStatus} 
              disabled={refreshing}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
              {refreshing ? "Checking..." : "Refresh Status"}
            </Button>

            {order.providerData?.trackingUrl && (
              <Button className="w-full sm:w-auto bg-orange-600 hover:bg-orange-700 text-white shadow-lg shadow-orange-900/20" asChild>
                <a href={order.providerData.trackingUrl} target="_blank" rel="noreferrer">
                  Track Package <ExternalLink className="h-4 w-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </div>

       <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          
          {/* 📦 LEFT COLUMN - PRODUCT DETAILS */}
          <div className="lg:col-span-8 space-y-6">
            
            {order.items.map((item: any, index: number) => (
              <Card key={index} className="bg-slate-800/40 border-white/10 backdrop-blur-sm overflow-hidden">
                <CardHeader className="bg-slate-800/60 border-b border-white/5 pb-4">
                  <CardTitle className="text-white flex items-center gap-2 text-lg">
                    <Shirt className="h-5 w-5 text-orange-400" /> 
                    Product Details
                  </CardTitle>
                </CardHeader>
                
                <CardContent className="p-6 space-y-8">
                  <div className="flex flex-col sm:flex-row gap-6">
                     
                     {/* THUMBNAIL */}
                     <div className="w-28 h-28 sm:w-36 sm:h-36 md:w-40 md:h-40 bg-white rounded-xl overflow-hidden shrink-0 border-2 border-white/10 shadow-lg">
                        <img 
                          src={item.thumbnail || item.image || item.designData?.previewImage} 
                          alt="Product Thumbnail" 
                          className="w-full h-full object-contain"
                        />
                     </div>

                     {/* INFO GRID */}
                     <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-6">
                        {/* Name - Spans full width */}
                        <div className="col-span-2 space-y-1">
                            <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Product</span>
                            <p className="text-white font-medium text-lg leading-tight">{item.title}</p>
                            <p className="text-[10px] text-green-400 flex items-center gap-1 mt-1">
                               <ShieldCheck className="h-3 w-3" /> {QUALITY_LINES[0]}
                            </p>
                        </div>
                        
                        {/* Specs */}
                        <div className="space-y-1">
                            <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Variant</span>
                            <div className="flex items-center gap-2 mt-1">
                               <Badge variant="secondary" className="bg-slate-700 text-white">{item.variant?.size || "L"}</Badge>
                               <Badge variant="secondary" className="bg-slate-700 text-white capitalize">{item.variant?.color || "Black"}</Badge>
                            </div>
                        </div>

                        {/* Blank spacer or other info */}
                        <div className="hidden sm:block"></div>

                        {/* Quantity (Separate Line) */}
                        <div className="space-y-1">
                            <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Quantity</span>
                            <p className="text-white font-medium text-lg">{item.quantity}</p>
                        </div>
                        
                        {/* Price (Separate Line) */}
                        <div className="space-y-1">
                            <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Price</span>
                            <p className="text-green-400 font-bold text-lg">{item.price} {order.currency}</p>
                        </div>

                        {/* CTA */}
                        <div className="col-span-2 pt-2">
                           <Button size="sm" variant="secondary" className="bg-white/10 hover:bg-white/20 text-white border-0">
                               Buy Again
                           </Button>
                        </div>
                     </div>
                  </div>

                  <Separator className="bg-white/5" />

                  {/* PREVIEW IMAGES */}
                  <div>
                    <h3 className="text-sm uppercase text-slate-500 font-bold tracking-wider mb-2 flex items-center gap-2">
                       <Printer className="h-4 w-4" /> Printing Preview
                    </h3>
                    <p className="text-xs text-slate-400 mb-4 italic">
                        Note: This image shows exactly what we sent to print.
                    </p>
                    
                    <div className="flex flex-wrap gap-3 sm:gap-4">
                      {(order.printFiles?.front || item.designData?.previewImage) && (
                        <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-black/40 w-24 h-24 sm:w-32 sm:h-32">
                          <img src={order.printFiles?.front || item.designData?.previewImage} className="w-full h-full object-contain p-2" />
                          <Badge className="absolute top-1 left-1 bg-black/50 text-white text-[10px]">FRONT</Badge>
                        </div>
                      )}
                      {order.printFiles?.back && (
                        <div className="relative group rounded-lg overflow-hidden border border-white/10 bg-black/40 w-24 h-24 sm:w-32 sm:h-32">
                          <img src={order.printFiles?.back} className="w-full h-full object-contain p-2" />
                          <Badge className="absolute top-1 left-1 bg-black/50 text-white text-[10px]">BACK</Badge>
                        </div>
                      )}
                    </div>
                  </div>

                </CardContent>
              </Card>
            ))}

            {/* HELP OPTIONS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
               {HELP_OPTIONS.map((option, i) => (
                  <Button key={i} variant="outline" className="border-white/5 bg-slate-800/30 hover:bg-slate-800 text-slate-400 hover:text-white text-xs h-12 sm:h-10 justify-start">
                     <HelpCircle className="h-3 w-3 mr-2 opacity-50" /> {option}
                  </Button>
               ))}
            </div>
          </div>

          {/* 🚚 RIGHT COLUMN - TRACKING */}
          <div className="lg:col-span-4 space-y-6 sm:space-y-8 lg:space-y-8">
            <Card className="bg-slate-800/40 border-white/10 backdrop-blur-sm h-fit">
              <CardHeader className="bg-slate-800/60 border-b border-white/5 py-4">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-white flex items-center gap-2 text-base">
                        <Truck className="h-4 w-4 text-green-400" /> Delivery Status
                    </CardTitle>
                    <Badge className="bg-green-500/10 text-green-400 border-green-500/20 text-[10px]">
                        {getDeliveryConfidence()}
                    </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="mb-6 bg-blue-500/5 border border-blue-500/10 rounded-lg p-3">
                   <p className="text-xs text-blue-200 flex gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      {TRUST_LINES[0]}
                   </p>
                </div>
                <div className="mb-6">
                   <OrderTrackerVertical status={order.status} providerStatus={order.providerStatus} />
                </div>
                <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-3">
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Method</span>
                      <span className="text-white font-medium">Standard Shipping</span>
                   </div>
                   <div className="flex justify-between items-center text-sm">
                      <span className="text-slate-400">Est. Delivery</span>
                      <span className="text-green-400 font-medium">
                        {order.providerData?.estimatedDelivery ? formatDate(order.providerData.estimatedDelivery) : "Calculated after shipping"}
                      </span>
                   </div>
                   {order.providerData?.trackingCode && (
                     <div className="pt-2 mt-2 border-t border-white/10">
                        <p className="text-xs text-slate-500 uppercase font-bold mb-1">Tracking Number</p>
                        <p className="text-white font-mono bg-black/30 p-2 rounded text-center select-all">
                           {order.providerData.trackingCode}
                        </p>
                     </div>
                   )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/40 border-white/10 backdrop-blur-sm">
               <CardHeader className="bg-slate-800/60 border-b border-white/5 py-4">
                <CardTitle className="text-white flex items-center gap-2 text-base">
                  <MapPin className="h-4 w-4 text-red-400" /> Shipping To
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 text-sm text-slate-300 leading-relaxed">
                 <p className="font-bold text-white text-base mb-1">{order.shippingAddress.fullName}</p>
                 <p>{order.shippingAddress.line1}</p>
                 {order.shippingAddress.line2 && <p>{order.shippingAddress.line2}</p>}
                 <p>{order.shippingAddress.city}, {order.shippingAddress.state}</p>
                 <p>{order.shippingAddress.zip}, {order.shippingAddress.country}</p>
                 <div className="mt-4 pt-4 border-t border-white/5">
                    <p className="text-xs text-orange-400 flex items-center gap-1">
                       <AlertCircle className="h-3 w-3" /> Wrong address? Contact support immediately.
                    </p>
                 </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}