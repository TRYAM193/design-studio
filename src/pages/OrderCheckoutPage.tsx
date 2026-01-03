// src/pages/OrderCheckoutPage.tsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams, Link } from 'react-router';
import { FiMapPin, FiCreditCard, FiChevronLeft, FiLoader, FiCheckCircle, FiShield, FiShoppingBag, FiTruck } from 'react-icons/fi';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc, serverTimestamp, updateDoc, collection, getDocs, deleteDoc } from 'firebase/firestore';
import { db } from '@/firebase';

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
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  // ✅ Check Mode: 'direct' or 'cart'
  const mode = searchParams.get('mode') || 'cart';
  const legacyOrderData = location.state?.orderData;

  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('online');

  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    address: '',
    city: '',
    zip: '',
  });

  // ✅ LOAD ITEMS BASED ON MODE
  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      
      // CASE 1: BUY NOW (Load from Local Storage)
      if (mode === 'direct') {
        const directItem = localStorage.getItem('directBuyItem');
        if (directItem) {
          setItems([JSON.parse(directItem)]);
        } else if (legacyOrderData) {
          setItems([legacyOrderData]); // Fallback
        }
      } 
      // CASE 2: CART (Load from Firestore DB)
      else if (mode === 'cart') {
        if (user?.uid) {
          try {
            const cartRef = collection(db, `users/${user.uid}/cart`);
            const snapshot = await getDocs(cartRef);
            const cartItems = snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id }));
            setItems(cartItems);
          } catch (error) {
            console.error("Error loading cart:", error);
          }
        }
      }
      setLoadingItems(false);
    };

    fetchItems();
  }, [mode, user, legacyOrderData]);

  // ✅ CALCULATE TOTALS FOR ALL ITEMS
  const region = items[0]?.region || 'IN';
  const currencySymbols: Record<string, string> = { IN: "₹", US: "$", GB: "£", EU: "€", CA: "C$" };
  const symbol = currencySymbols[region] || "₹";

  const totalPayAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const fakeShippingCost = totalPayAmount > 0 ? (region === 'IN' ? 0 : 0) : 0; // Free shipping logic
  const originalPrice = totalPayAmount * 1.25; // Fake MSRP for savings display
  const savings = originalPrice - totalPayAmount;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    setIsProcessing(true);

    try {
      // 1. Create Order
      const orderId = `ORD-${Date.now()}`;
      const orderRef = doc(db, 'orders', orderId);

      const newOrder = {
        userId: user?.uid || 'guest',
        items: items, // Save all items
        shippingAddress: shippingInfo,
        payment: {
          method: paymentMethod,
          total: totalPayAmount,
          currency: region,
          symbol: symbol,
          status: 'pending'
        },
        status: 'pending_payment',
        createdAt: serverTimestamp(),
        orderId
      };

      await setDoc(orderRef, newOrder);

      // 2. Clear Cart if mode was 'cart'
      if (mode === 'cart' && user?.uid) {
        // Optional: Delete items from DB cart after successful order initialization
        // for (const item of items) {
        //    if (item.firestoreId) await deleteDoc(doc(db, `users/${user.uid}/cart`, item.firestoreId));
        // }
      }

      // 3. Payment Routing (Simplified for brevity)
      if (paymentMethod === 'cod') {
         await updateDoc(orderRef, { status: 'placed', 'payment.status': 'pending_cod' });
         navigate(`/dashboard/orders/${orderId}`);
      } else {
         // Simulate Online Success
         setTimeout(async () => {
            await updateDoc(orderRef, { status: 'placed', 'payment.status': 'paid' });
            navigate(`/dashboard/orders/${orderId}`);
         }, 2000);
      }

    } catch (error) {
      console.error("Order failed:", error);
      setIsProcessing(false);
    }
  };

  if (loadingItems) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">Loading Checkout...</div>;
  if (items.length === 0) return <div className="min-h-screen flex items-center justify-center bg-[#0f172a] text-white">Your Cart is Empty.</div>;

  return (
    <div className="min-h-screen relative pb-20 font-sans selection:bg-orange-500 selection:text-white">
      {/* Background */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 pt-6">
        <div className="mb-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:bg-transparent text-slate-400 hover:text-white transition-colors">
            <FiChevronLeft /> Back
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* LEFT: FORM & PAYMENT */}
          <div className="lg:col-span-2 space-y-6">
             {/* Shipping Form (Same as before) */}
             <Card className="bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-xl">
                <CardHeader className="bg-slate-900/30 border-b border-white/5"><CardTitle className="text-white">Shipping Details</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-5 p-6">
                   <Input name="fullName" onChange={handleInputChange} placeholder="Full Name" className="bg-slate-900/50 border-white/10 text-white" />
                   <Input name="email" onChange={handleInputChange} placeholder="Email" className="bg-slate-900/50 border-white/10 text-white" />
                   <Input name="address" onChange={handleInputChange} placeholder="Address" className="md:col-span-2 bg-slate-900/50 border-white/10 text-white" />
                   <Input name="city" onChange={handleInputChange} placeholder="City" className="bg-slate-900/50 border-white/10 text-white" />
                   <Input name="zip" onChange={handleInputChange} placeholder="Zip Code" className="bg-slate-900/50 border-white/10 text-white" />
                </CardContent>
             </Card>

             {/* Payment Method Selector (Same as before) */}
             <Card className="bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-xl">
                <CardHeader className="bg-slate-900/30 border-b border-white/5"><CardTitle className="text-white">Payment</CardTitle></CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div onClick={() => setPaymentMethod('online')} className={`p-4 border rounded-xl cursor-pointer ${paymentMethod==='online' ? 'border-orange-500 bg-orange-500/10' : 'border-white/10'}`}>
                        <span className="text-white font-bold">Online Payment</span>
                    </div>
                    <div onClick={() => setPaymentMethod('cod')} className={`p-4 border rounded-xl cursor-pointer ${paymentMethod==='cod' ? 'border-orange-500 bg-orange-500/10' : 'border-white/10'}`}>
                        <span className="text-white font-bold">Cash on Delivery</span>
                    </div>
                </CardContent>
             </Card>
          </div>

          {/* RIGHT: ORDER SUMMARY (Loop through items) */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 shadow-2xl border-white/10 bg-slate-800/60 backdrop-blur-xl">
              <CardHeader className="bg-slate-900/50 border-b border-white/5 pb-4">
                <CardTitle className="text-white flex items-center gap-2">
                  <FiShoppingBag className="text-orange-400" /> Order Summary ({items.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                
                {/* ✅ ITEM LIST */}
                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto custom-scrollbar">
                    {items.map((item, idx) => (
                        <div key={idx} className="flex gap-4 border-b border-white/5 pb-4 last:border-0">
                            <div className="w-16 h-16 bg-white rounded-lg border border-white/10 overflow-hidden p-1 shadow-inner shrink-0">
                                <img src={item.thumbnail} alt="Preview" className="w-full h-full object-contain" />
                            </div>
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-white text-sm truncate">{item.productTitle}</h4>
                                <p className="text-xs text-slate-400 mt-1 capitalize">{item.variant.color} / {item.variant.size}</p>
                                <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-slate-300">Qty: {item.quantity}</span>
                                    <span className="text-sm font-bold text-orange-400">{symbol}{(item.price * item.quantity).toFixed(2)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <Separator className="bg-white/10 my-4" />

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center text-slate-400">
                    <span>Subtotal</span>
                    <span>{symbol}{totalPayAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-green-400 font-medium bg-green-500/10 p-2 rounded-lg border border-green-500/20">
                    <span>Savings</span>
                    <span>- {symbol}{savings.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-lg font-bold text-white pt-2">
                    <span>Total</span>
                    <span>{symbol}{totalPayAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button
                  onClick={handlePlaceOrder}
                  disabled={isProcessing}
                  className="w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 text-white h-14 text-lg font-bold hover:scale-[1.02] transition-transform"
                >
                  {isProcessing ? <><FiLoader className="animate-spin mr-2" /> Processing...</> : `Pay ${symbol}${totalPayAmount.toFixed(2)}`}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}