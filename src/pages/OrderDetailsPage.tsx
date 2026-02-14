import { useEffect, useState } from "react";
import { useParams, Link, useLocation } from "react-router";
import { 
  Truck, Calendar, MapPin, ExternalLink, 
  ArrowLeft, RefreshCw, Loader2, Check, Circle, 
  Printer, Shirt, CreditCard, ShieldCheck, HelpCircle, AlertCircle,
  Sparkles, Archive, FileImage, Download
} from "lucide-react"; 

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

import { db, functions } from "@/firebase";
import { doc, getDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import JSZip from "jszip";
import { saveAs } from "file-saver";

// ------------------------------------------------------------------
// 📦 HELPER: Download Zip Logic
// ------------------------------------------------------------------
const downloadMockupsZip = async (itemTitle: string, urls: string[]) => {
  if (!urls.length) return;
  const zip = new JSZip();
  const folder = zip.folder("mockups");

  try {
    toast.info("Preparing ZIP file...");
    const promises = urls.map(async (url, i) => {
      const response = await fetch(url);
      const blob = await response.blob();
      const ext = url.split('.').pop()?.split('?')[0] || "png";
      folder?.file(`mockup_${i + 1}.${ext}`, blob);
    });

    await Promise.all(promises);
    const content = await zip.generateAsync({ type: "blob" });
    saveAs(content, `${itemTitle.replace(/\s+/g, '_')}_mockups.zip`);
    toast.success("Download started!");
  } catch (err) {
    console.error("Failed to zip files:", err);
    toast.error("Could not generate ZIP. Try downloading images individually.");
  }
};

// ------------------------------------------------------------------
// 🖼️ COMPONENT: Print File Card
// ------------------------------------------------------------------
const PrintFileCard = ({ label, url }: { label: string, url?: string }) => {
  if (!url) return null;

  return (
    <div className="group relative bg-slate-950 border border-white/10 rounded-lg p-3 flex items-center gap-3 transition-all hover:border-blue-500/50">
      <div className="h-12 w-12 rounded bg-slate-900 flex items-center justify-center border border-white/5 overflow-hidden">
        <img src={url} alt={label} className="h-full w-full object-contain opacity-80 group-hover:opacity-100" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">{label}</p>
        <p className="text-[10px] text-slate-500 truncate">High-Res PNG • 300 DPI</p>
      </div>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button 
              size="icon" 
              variant="ghost" 
              className="h-8 w-8 text-slate-400 hover:text-white hover:bg-blue-500/20"
              onClick={() => saveAs(url, `${label.toLowerCase().replace(" ", "_")}.png`)}
            >
              <Download className="w-4 h-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent><p>Download Source File</p></TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

// ------------------------------------------------------------------
// 🎨 COMPONENT: Mockup Gallery
// ------------------------------------------------------------------
const MockupGallerySection = ({ item }: { item: any }) => {
  const gallery = item.mockupFiles?.gallery || [];
  
  // Fallback to legacy structure
  if (gallery.length === 0) {
    if (item.mockupFiles?.front) gallery.push(item.mockupFiles.front);
    if (item.mockupFiles?.back) gallery.push(item.mockupFiles.back);
    if (gallery.length === 0 && (item.preview || item.image || item.designData?.previewImage)) {
        gallery.push(item.preview || item.image || item.designData?.previewImage);
    }
  }

  const [selectedImage, setSelectedImage] = useState(gallery[0]);
  const isReady = gallery.length > 0;

  useEffect(() => {
    if (gallery.length > 0 && !gallery.includes(selectedImage)) {
      setSelectedImage(gallery[0]);
    }
  }, [gallery]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
         <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
           <Sparkles className="w-3 h-3 text-orange-400" /> 
           3D Mockups
         </h4>
         {isReady && gallery.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-[10px] text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 gap-1 px-2"
              onClick={() => downloadMockupsZip(item.title, gallery)}
            >
              <Archive className="w-3 h-3" /> Download ZIP
            </Button>
         )}
      </div>

      <div className="flex gap-4">
        {/* Main Preview */}
        <Dialog>
          <DialogTrigger asChild>
            <div className="relative w-32 h-32 bg-slate-800/50 rounded-xl border border-white/10 overflow-hidden flex-shrink-0 cursor-zoom-in group">
              <img 
                src={selectedImage} 
                alt="Mockup" 
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              {!isReady && (
                <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center text-center p-2">
                   <Loader2 className="w-6 h-6 text-blue-400 animate-spin mb-1" />
                   <span className="text-[9px] text-slate-300">Generating...</span>
                </div>
              )}
            </div>
          </DialogTrigger>
          <DialogContent className="bg-slate-950 border-white/10 max-w-4xl w-full p-1 overflow-hidden">
             <div className="relative w-full aspect-video bg-black/50 rounded-lg flex items-center justify-center">
                <img src={selectedImage} className="max-h-full max-w-full object-contain" alt="Full Preview" />
             </div>
             {gallery.length > 1 && (
                <div className="flex gap-2 p-4 overflow-x-auto justify-center bg-slate-900/50">
                   {gallery.map((img: string, i: number) => (
                      <button 
                        key={i} 
                        onClick={() => setSelectedImage(img)}
                        className={`w-16 h-16 rounded border-2 overflow-hidden flex-shrink-0 ${selectedImage === img ? 'border-blue-500' : 'border-transparent opacity-60 hover:opacity-100'}`}
                      >
                         <img src={img} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                      </button>
                   ))}
                </div>
             )}
          </DialogContent>
        </Dialog>

        {/* Thumbnails Grid */}
        {isReady && (
          <ScrollArea className="flex-1 h-32">
             <div className="grid grid-cols-3 gap-2 pr-3">
                {gallery.map((img: string, i: number) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(img)}
                    className={`aspect-square rounded-lg border overflow-hidden bg-slate-800/30 transition-all ${
                      selectedImage === img 
                        ? "border-blue-500 ring-1 ring-blue-500/20" 
                        : "border-white/5 hover:border-white/20"
                    }`}
                  >
                    <img src={img} className="w-full h-full object-cover" alt={`Thumb ${i}`} />
                  </button>
                ))}
             </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
};

// ------------------------------------------------------------------
// 統 CONSTANTS
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
// 圜 VERTICAL TIMELINE TRACKER
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
// 塘 MAIN PAGE
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

  // --------------------------------------------------------------
  // 💰 CALCULATION: Get Total for JUST this specific order/shipment
  // --------------------------------------------------------------
  const specificOrderTotal = order?.items?.reduce((acc: number, item: any) => {
    return acc + (Number(item.price) * Number(item.quantity));
  }, 0) || 0;


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
               {/* 💰 UPDATED: Shows specific total for this split order */}
               <span className="flex text-bold items-center gap-2">
                 <CreditCard className="h-4 w-4" /> 
                 Total : {order.payment?.currency || order.currency}{specificOrderTotal.toFixed(2)}
               </span>
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
          
          {/* 逃 LEFT COLUMN - PRODUCT DETAILS */}
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
                        {/* Name */}
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

                        {/* Blank spacer */}
                        <div className="hidden sm:block"></div>

                        {/* Quantity */}
                        <div className="space-y-1">
                            <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Quantity</span>
                            <p className="text-white font-medium text-lg">{item.quantity}</p>
                        </div>
                        
                        {/* Price */}
                        <div className="space-y-1">
                            <span className="text-xs uppercase text-slate-500 font-bold tracking-wider">Price</span>
                            <p className="text-green-400 font-bold text-lg">{order.payment?.currency} {item.price}</p>
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

                  {/* -------------------------------------------------------- */}
                  {/* MOCKUPS & FILES SECTION */}
                  {/* -------------------------------------------------------- */}
                  <div className="grid md:grid-cols-2 gap-8">
                    
                    {/* LEFT: 3D Mockup Gallery */}
                    <MockupGallerySection item={item} />

                    {/* RIGHT: Production Files */}
                    <div className="space-y-3">
                       <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                          <FileImage className="w-3 h-3 text-purple-400" />
                          Production Files
                       </h4>
                       <div className="space-y-2">
                          {item.printFiles?.front && (
                             <PrintFileCard label="Front Print" url={item.printFiles.front} />
                          )}
                          {item.printFiles?.back && (
                             <PrintFileCard label="Back Print" url={item.printFiles.back} />
                          )}
                          {!item.printFiles?.front && !item.printFiles?.back && (
                             <div className="p-4 border border-dashed border-white/10 rounded-lg text-center text-xs text-slate-500">
                                <Printer className="w-4 h-4 mx-auto mb-1 opacity-50" />
                                Processing print files...
                             </div>
                          )}
                       </div>
                    </div>
                  </div>
                  {/* -------------------------------------------------------- */}

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

          {/* 囹 RIGHT COLUMN - TRACKING */}
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