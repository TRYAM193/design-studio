import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { Loader2, ArrowLeft, MapPin, Calendar, Package, CreditCard, Truck, CheckCircle } from "lucide-react";

export default function OrderDetailsPage() {
    const { orderId } = useParams();
    const navigate = useNavigate();
    const [order, setOrder] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchOrder() {
            if (!orderId) return;
            try {
                const docRef = doc(db, 'orders', orderId);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setOrder(docSnap.data());
                }
            } catch (error) {
                console.error("Error fetching order:", error);
            } finally {
                setLoading(false);
            }
        }
        fetchOrder();
    }, [orderId]);

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600 w-8 h-8" /></div>;
    if (!order) return <div className="p-10 text-center">Order not found</div>;

    // Calculate Estimated Delivery (Mock: 7 days from creation)
    const orderDate = order.createdAt?.toDate ? order.createdAt.toDate() : new Date();
    const deliveryDate = new Date(orderDate);
    deliveryDate.setDate(deliveryDate.getDate() + 7);

    return (
        <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
            <div className="max-w-4xl mx-auto space-y-6">
                
                {/* Header */}
                <div className="flex items-center justify-between">
                    <Button variant="ghost" onClick={() => navigate('/dashboard/orders')} className="gap-2 pl-0 hover:bg-transparent hover:text-indigo-600">
                        <ArrowLeft size={16} /> Back to My Orders
                    </Button>
                    <div className="text-sm text-slate-500">Order ID: <span className="font-mono text-slate-900">{order.orderId}</span></div>
                </div>

                {/* Status Banner */}
                <div className="bg-green-50 border border-green-200 p-6 rounded-xl flex items-center gap-4">
                    <div className="bg-green-100 p-3 rounded-full">
                        <CheckCircle className="text-green-600 w-8 h-8" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-green-800">Order Placed Successfully!</h1>
                        <p className="text-green-700">Thank you for shopping with TRYAM. We have sent a confirmation to {order.shippingAddress.email}.</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* LEFT: Order Items & Delivery */}
                    <div className="md:col-span-2 space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Package className="text-indigo-600" /> Items Ordered
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {order.items.map((item: any, index: number) => (
                                    <div key={index} className="flex gap-4">
                                        <div className="w-24 h-28 bg-slate-100 rounded-lg border overflow-hidden flex-shrink-0">
                                            <img src={item.thumbnail} alt={item.productTitle} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-900">{item.productTitle}</h3>
                                            <p className="text-sm text-slate-500 capitalize">{item.variant.color} • {item.variant.size}</p>
                                            <div className="flex justify-between items-center mt-4">
                                                <Badge variant="secondary" className="bg-slate-100 text-slate-600">Qty: {item.quantity}</Badge>
                                                <span className="font-bold text-slate-900">{order.payment.symbol}{item.price}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Truck className="text-indigo-600" /> Delivery Status
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between mb-4">
                                    <div className="space-y-1">
                                        <p className="text-sm text-slate-500">Estimated Delivery</p>
                                        <p className="font-bold text-lg text-slate-900 flex items-center gap-2">
                                            <Calendar size={18} className="text-indigo-600"/> 
                                            {deliveryDate.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                                        </p>
                                    </div>
                                    <Badge className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-indigo-200">Processing</Badge>
                                </div>
                                {/* Simple Progress Bar */}
                                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                                    <div className="bg-indigo-600 h-full w-[5%]"></div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400 mt-2">
                                    <span>Ordered</span>
                                    <span>Shipped</span>
                                    <span>Out for Delivery</span>
                                    <span>Delivered</span>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* RIGHT: Summary & Address */}
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <MapPin className="text-indigo-600" /> Shipping To
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="text-sm text-slate-600 space-y-1">
                                <p className="font-bold text-slate-900 text-base">{order.shippingAddress.fullName}</p>
                                <p>{order.shippingAddress.address}</p>
                                <p>{order.shippingAddress.city}, {order.shippingAddress.zip}</p>
                                <p className="pt-2 text-slate-400">{order.shippingAddress.email}</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <CreditCard className="text-indigo-600" /> Payment Info
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Method</span>
                                        <span className="font-medium capitalize">{order.payment.method === 'upi' ? 'UPI / Netbanking' : order.payment.method}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-slate-500">Payment Status</span>
                                        <span className="text-green-600 font-bold flex items-center gap-1"><CheckCircle size={12}/> Paid</span>
                                    </div>
                                    <Separator className="my-2" />
                                    <div className="flex justify-between text-lg font-bold text-slate-900">
                                        <span>Total Paid</span>
                                        <span>{order.payment.symbol}{order.payment.total.toFixed(2)}</span>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
}