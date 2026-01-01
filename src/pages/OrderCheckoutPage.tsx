import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { FiMapPin, FiCreditCard, FiChevronLeft, FiLoader, FiCheckCircle, FiShield, FiShoppingBag, FiTruck } from 'react-icons/fi';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { motion } from "framer-motion";

export default function OrderCheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { orderData } = location.state || {};
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online'); // 'online' or 'cod'

  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    address: '',
    city: '',
    zip: '',
  });

  // Redirect if no data
  useEffect(() => {
    if (!orderData) {
       // navigate('/store'); 
    }
  }, [orderData, navigate]);

  // Load Razorpay Script for India
  useEffect(() => {
    if (orderData?.region === 'IN') {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.async = true;
        document.body.appendChild(script);
    }
  }, [orderData]);

  if (!orderData) return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">
        No order found.
    </div>
  );

  // 1. REGION & CURRENCY LOGIC
  const region = orderData.region || 'IN';
  const currencySymbols: Record<string, string> = { IN: "₹", US: "$", GB: "£", EU: "€", CA: "C$" };
  const symbol = currencySymbols[region] || "₹";

  // 2. PRICING STRATEGY
  const payAmount = orderData.price * orderData.quantity;
  const fakeShippingCost = region === 'IN' ? 100 : 10;
  const markupMultiplier = 1.25; 
  const originalPrice = (payAmount * markupMultiplier) + fakeShippingCost;
  const savings = originalPrice - payAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  // --- PAYMENT HANDLERS ---

  const handlePlaceOrder = async () => {
    setIsProcessing(true);

    try {
      // 1. Create Initial "Pending" Order in Firebase
      const orderId = `ORD-${Date.now()}`;
      const orderRef = doc(db, 'orders', orderId);
      
      const newOrder = {
        userId: user?.uid || 'guest',
        items: [orderData],
        shippingAddress: shippingInfo,
        payment: { 
          method: paymentMethod, 
          total: payAmount, 
          currency: region,
          symbol: symbol,
          status: 'pending' // Initially pending
        },
        status: 'pending_payment',
        createdAt: serverTimestamp(),
        orderId
      };

      await setDoc(orderRef, newOrder);

      // 2. ROUTING LOGIC
      if (paymentMethod === 'cod') {
          // --- COD FLOW (India Only) ---
          await updateDoc(orderRef, { 
              status: 'placed',
              'payment.status': 'pending_cod'
          });
          finalizeAndRedirect(orderId);
      } 
      else if (region === 'IN') {
          // --- RAZORPAY FLOW (India) ---
          launchRazorpay(orderId, payAmount, orderRef);
      } 
      else {
          // --- STRIPE FLOW (Global) ---
          launchStripe(orderId);
      }

    } catch (error) {
      console.error("Order initialization failed:", error);
      setIsProcessing(false);
    }
  };

  const launchRazorpay = (orderId: string, amount: number, orderRef: any) => {
    const options = {
        key: "YOUR_RAZORPAY_KEY_ID", // Replace with your Test Key
        amount: amount * 100, // Amount in paise
        currency: "INR",
        name: "TRYAM Store",
        description: "Custom Apparel Order",
        image: "/assets/LOGO.png", // Your logo
        order_id: "", // In production, generate this from your backend
        handler: async function (response: any) {
            // Payment Success!
            await updateDoc(orderRef, { 
                status: 'placed',
                'payment.status': 'paid',
                'payment.transactionId': response.razorpay_payment_id
            });
            finalizeAndRedirect(orderId);
        },
        prefill: {
            name: shippingInfo.fullName,
            email: shippingInfo.email,
        },
        theme: {
            color: "#ea580c" // Orange-600 (Saffron)
        }
    };

    // @ts-ignore
    const rzp1 = new window.Razorpay(options);
    rzp1.open();
    
    // If user closes modal manually, stop processing
    rzp1.on('payment.failed', function (response: any){
        alert("Payment Failed: " + response.error.description);
        setIsProcessing(false);
    });
  };

  const launchStripe = async (orderId: string) => {
      // NOTE: In a real app, you call your backend to create a Stripe Session here.
      // Since we are frontend-only for now, we simulate the redirection.
      
      console.log("Redirecting to Stripe...");
      
      // Simulate a redirect delay
      setTimeout(async () => {
          // Mock Success for prototype
          const orderRef = doc(db, 'orders', orderId);
          await updateDoc(orderRef, { 
              status: 'placed', 
              'payment.status': 'paid' 
          });
          finalizeAndRedirect(orderId);
      }, 2000);
  };

  const finalizeAndRedirect = (orderId: string) => {
      setIsProcessing(false);
      // Navigate to your new Order Details Page
      navigate(`/dashboard/orders/${orderId}`);
  };

  return (
    <div className="min-h-screen relative pb-20 font-sans selection:bg-orange-500 selection:text-white">
      
      {/* ✅ BACKGROUND: COSMIC SHIVA THEME */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 pt-6">
        
        {/* Navigation */}
        <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:bg-transparent text-slate-400 hover:text-white transition-colors">
            <FiChevronLeft /> Back to Design
            </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
            {/* LEFT COLUMN: DETAILS */}
            <div className="lg:col-span-2 space-y-6">
            
            {/* Shipping Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-900/30 border-b border-white/5">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <FiMapPin className="text-blue-400"/> Shipping Details
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6">
                        <div className="space-y-2">
                            <Label className="text-slate-300">Full Name</Label>
                            <Input 
                                name="fullName" 
                                value={shippingInfo.fullName} 
                                onChange={handleInputChange} 
                                placeholder="Arjuna" 
                                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50 transition-all h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Email</Label>
                            <Input 
                                name="email" 
                                value={shippingInfo.email} 
                                onChange={handleInputChange} 
                                placeholder="arjuna@example.com" 
                                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50 transition-all h-11"
                            />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                            <Label className="text-slate-300">Address</Label>
                            <Input 
                                name="address" 
                                value={shippingInfo.address} 
                                onChange={handleInputChange} 
                                placeholder="123 Cosmic Way" 
                                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50 transition-all h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">City</Label>
                            <Input 
                                name="city" 
                                value={shippingInfo.city} 
                                onChange={handleInputChange} 
                                placeholder="Bengaluru" 
                                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50 transition-all h-11"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label className="text-slate-300">Zip Code</Label>
                            <Input 
                                name="zip" 
                                value={shippingInfo.zip} 
                                onChange={handleInputChange} 
                                placeholder="560001" 
                                className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50 transition-all h-11"
                            />
                        </div>
                    </CardContent>
                </Card>
            </motion.div>

            {/* Payment Method Card */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                <Card className="bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-900/30 border-b border-white/5">
                        <CardTitle className="flex items-center gap-2 text-white">
                            <FiCreditCard className="text-orange-400"/> Payment Method
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                    
                    {/* OPTION 1: ONLINE PAYMENT */}
                    <div 
                        onClick={() => setPaymentMethod('online')}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300
                            ${paymentMethod === 'online' 
                                ? 'border-orange-500/50 bg-orange-500/10 shadow-[0_0_15px_rgba(234,88,12,0.1)]' 
                                : 'border-white/5 bg-slate-900/30 hover:bg-slate-800/50 hover:border-white/10'
                            }`}
                    >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'online' ? 'border-orange-500' : 'border-slate-500'}`}>
                        {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                        </div>
                        
                        {region === 'IN' ? (
                            <div>
                                <div className="font-medium text-white">UPI / Cards / Netbanking</div>
                                <p className="text-xs text-slate-400 mt-1">Secured by Razorpay</p>
                            </div>
                        ) : (
                            <div>
                                <div className="font-medium text-white">Credit / Debit Card</div>
                                <p className="text-xs text-slate-400 mt-1">Secured by Stripe</p>
                            </div>
                        )}
                        
                        <div className="ml-auto">
                            <FiShield className="text-slate-500" />
                        </div>
                    </div>

                    {/* OPTION 2: COD */}
                    {region === 'IN' && (
                        <div 
                        onClick={() => setPaymentMethod('cod')}
                        className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-300
                            ${paymentMethod === 'cod' 
                                ? 'border-orange-500/50 bg-orange-500/10 shadow-[0_0_15px_rgba(234,88,12,0.1)]' 
                                : 'border-white/5 bg-slate-900/30 hover:bg-slate-800/50 hover:border-white/10'
                            }`}
                        >
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors ${paymentMethod === 'cod' ? 'border-orange-500' : 'border-slate-500'}`}>
                            {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="font-medium text-white">Cash on Delivery</span>
                                <Badge variant="outline" className="text-[10px] font-normal border-green-500/30 text-green-400 bg-green-500/10">Available</Badge>
                            </div>
                            <p className="text-xs text-slate-400 mt-1">Pay with cash upon delivery.</p>
                        </div>
                        </div>
                    )}

                    </CardContent>
                </Card>
            </motion.div>
            </div>

            {/* RIGHT COLUMN: SUMMARY */}
            <div className="lg:col-span-1">
                <Card className="sticky top-6 shadow-2xl border-white/10 bg-slate-800/60 backdrop-blur-xl">
                    <CardHeader className="bg-slate-900/50 border-b border-white/5 pb-4">
                        <CardTitle className="text-white flex items-center gap-2">
                            <FiShoppingBag className="text-orange-400"/> Order Summary
                        </CardTitle>
                        <CardDescription className="text-slate-400">Review your design details</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <div className="flex gap-4 mb-6">
                            <div className="w-20 h-24 bg-white rounded-lg border border-white/10 overflow-hidden p-2 shadow-inner">
                                <img src={orderData.thumbnail} alt="Preview" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1">
                                <h4 className="font-bold text-white text-sm line-clamp-2">{orderData.productTitle}</h4>
                                <p className="text-xs text-slate-400 mt-1 capitalize">{orderData.variant.color} / {orderData.variant.size}</p>
                                <p className="text-sm font-medium mt-2 text-slate-300">Qty: {orderData.quantity}</p>
                            </div>
                        </div>

                        <Separator className="bg-white/10 my-4" />

                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between items-center text-slate-400">
                                <span>Retail Price</span>
                                <span className="line-through decoration-slate-500">{symbol}{originalPrice.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-green-400 font-medium bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                                <span>Your Savings</span>
                                <span>- {symbol}{savings.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mt-2 text-slate-300">
                                <span>Shipping</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-500 line-through text-xs">{symbol}{fakeShippingCost}</span>
                                    <Badge variant="secondary" className="bg-blue-500/10 text-blue-300 border-blue-500/20 px-2 py-0.5 text-[10px]">FREE</Badge>
                                </div>
                            </div>
                            
                            <Separator className="bg-white/10 my-2" />
                            
                            <div className="flex justify-between items-start pt-2">
                                <span className="font-bold text-lg text-white">Total</span>
                                <div className="text-right">
                                    <div className="font-bold text-2xl text-orange-400 leading-none">
                                        {symbol}{payAmount.toFixed(2)}
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-medium mt-1">
                                        Inclusive of all taxes
                                    </p>
                                </div>
                            </div>
                        </div>

                        <Button 
                            onClick={handlePlaceOrder} 
                            disabled={isProcessing}
                            className="w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white h-14 text-lg font-bold shadow-lg shadow-orange-900/40 border-0 transition-all hover:scale-[1.02] disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {isProcessing ? (
                                <><FiLoader className="animate-spin mr-2" /> Processing...</>
                            ) : (
                                `Pay ${symbol}${payAmount.toFixed(2)}`
                            )}
                        </Button>
                        
                        <p className="text-xs text-center text-slate-500 mt-4 leading-relaxed">
                            By placing this order, you agree to our <Link to="/terms" target="_blank" className="underline hover:text-orange-400 font-medium transition-colors">Terms & Conditions</Link>.
                        </p>

                        <div className="flex justify-center items-center gap-2 mt-4 text-xs text-slate-500">
                            <FiCheckCircle className="text-green-500" />
                            <span>Secured by {region === 'IN' ? 'Razorpay' : 'Stripe'}</span>
                        </div>

                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}