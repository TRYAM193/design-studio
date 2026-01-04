import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc, serverTimestamp, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { db, functions } from '@/firebase'; // Import functions
import { httpsCallable } from 'firebase/functions'; // Import Callable
import { Country, State, City } from 'country-state-city';

// Stripe Imports
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"; // For Stripe Modal

import { ChevronLeft, Loader2, ShoppingBag, CreditCard, Truck, ShieldCheck, CheckCircle2, MapPin } from "lucide-react";

// --- STRIPE MODAL COMPONENT ---
const StripeCheckoutForm = ({ clientSecret, onSuccess, onClose }: any) => {
  const stripe = useStripe();
  const elements = useElements();
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event: any) => {
    event.preventDefault();
    if (!stripe || !elements) return;
    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required"
    });

    if (error) {
      setError(error.message || "Payment failed");
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent.id);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-4">
      <PaymentElement />
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <Button type="submit" disabled={!stripe || processing} className="w-full bg-orange-600 hover:bg-orange-500 text-white">
        {processing ? <Loader2 className="animate-spin" /> : "Pay Now"}
      </Button>
    </form>
  );
};

export default function OrderCheckoutPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  
  const mode = searchParams.get('mode') || 'cart';
  const legacyOrderData = location.state?.orderData;

  const [items, setItems] = useState<any[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'online' | 'cod'>('online');
  const [isLocationLocked, setIsLocationLocked] = useState(false);

  // Payment States
  const [stripePromise, setStripePromise] = useState<any>(null);
  const [stripeClientSecret, setStripeClientSecret] = useState('');
  const [showStripeModal, setShowStripeModal] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState(''); // Store ID before payment

  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    line1: '',
    countryCode: 'IN',
    stateCode: '',
    city: '',
    zip: '',
  });

  // 1. Data Loading (Same as before)
  useEffect(() => {
    const initData = async () => {
      setLoadingItems(true);
      if (mode === 'direct') {
        const directItem = localStorage.getItem('directBuyItem');
        if (directItem) setItems([JSON.parse(directItem)]);
        else if (legacyOrderData) setItems([legacyOrderData]);
      } else if (mode === 'cart' && user?.uid) {
        try {
          const cartRef = collection(db, `users/${user.uid}/cart`);
          const snapshot = await getDocs(cartRef);
          setItems(snapshot.docs.map(doc => ({ ...doc.data(), firestoreId: doc.id })));
        } catch (err) { console.error(err); }
      }
      if (user?.uid) {
        // Load User Address Logic...
        // (Keep your existing address loading logic here)
      }
      setLoadingItems(false);
    };
    initData();
  }, [mode, user]);

  // 2. IP Geo Location (Same as before)
  useEffect(() => {
    const fetchLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        if (data.country_code === 'IN') {
          setShippingInfo(prev => ({ ...prev, countryCode: 'IN' }));
          setIsLocationLocked(true);
        }
      } catch (e) {}
    };
    fetchLocation();
  }, []);

  // Helpers
  const countries = useMemo(() => Country.getAllCountries().filter(c => ['IN', 'US', 'GB', 'CA', 'DE'].includes(c.isoCode)), []);
  const states = useMemo(() => shippingInfo.countryCode ? State.getStatesOfCountry(shippingInfo.countryCode) : [], [shippingInfo.countryCode]);
  const cities = useMemo(() => shippingInfo.stateCode ? City.getCitiesOfState(shippingInfo.countryCode, shippingInfo.stateCode) : [], [shippingInfo.countryCode, shippingInfo.stateCode]);
  const currencySymbol = shippingInfo.countryCode === 'US' ? "$" : (shippingInfo.countryCode === 'IN' ? "₹" : "€");
  const totalPayAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // --- PAYMENT LOGIC ---

  // A. Razorpay Loader
  const loadRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // B. Handle Final Place Order
  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (!shippingInfo.line1 || !shippingInfo.city) { alert("Address incomplete."); return; }

    setIsProcessing(true);

    // 1. Create Order in Firestore (Pending)
    const orderId = `ORD-${Date.now()}`;
    const orderRef = doc(db, 'orders', orderId);
    
    // Determine Provider Logic
    let provider = shippingInfo.countryCode === 'IN' ? 'qikink' : 'printify';

    const newOrder = {
      userId: user?.uid || 'guest',
      items,
      shippingAddress: shippingInfo,
      payment: { method: paymentMethod, total: totalPayAmount, currency: currencySymbol, status: 'pending' },
      status: 'pending_payment',
      createdAt: serverTimestamp(),
      orderId,
      provider
    };

    try {
      await setDoc(orderRef, newOrder);
      setPendingOrderId(orderId);

      // 2. Handle Payment Flow
      if (paymentMethod === 'cod') {
         // Direct Success
         await updateDoc(orderRef, { status: 'placed', 'payment.status': 'pending_cod' });
         navigate('/dashboard/orders');
      
      } else if (shippingInfo.countryCode === 'IN') {
         // --- RAZORPAY FLOW ---
         const loaded = await loadRazorpay();
         if (!loaded) { alert('Razorpay SDK failed to load'); setIsProcessing(false); return; }

         const createRzpOrder = httpsCallable(functions, 'createRazorpayOrder');
         const { data }: any = await createRzpOrder({ amount: totalPayAmount, currency: 'INR' });

         const options = {
            key: data.keyId,
            amount: data.amount,
            currency: data.currency,
            order_id: data.orderId,
            name: "TRYAM Store",
            description: "Custom T-Shirt Order",
            handler: async function (response: any) {
                // Success
                await updateDoc(orderRef, { 
                    status: 'placed', 
                    'payment.status': 'paid', 
                    'payment.txnId': response.razorpay_payment_id 
                });
                navigate('/dashboard/orders');
            },
            prefill: { name: shippingInfo.fullName, email: shippingInfo.email }
         };
         const rzp = new (window as any).Razorpay(options);
         rzp.open();
         setIsProcessing(false);

      } else {
         // --- STRIPE FLOW ---
         const createStripe = httpsCallable(functions, 'createStripeIntent');
         const { data }: any = await createStripe({ amount: totalPayAmount, currency: 'usd' }); // Convert currency if needed

         setStripePromise(loadStripe(data.publishableKey));
         setStripeClientSecret(data.clientSecret);
         setShowStripeModal(true); // Open Modal
         setIsProcessing(false);
      }

    } catch (error) {
      console.error("Order Error:", error);
      alert("Failed to initiate order.");
      setIsProcessing(false);
    }
  };

  // C. Stripe Success Handler
  const handleStripeSuccess = async (txnId: string) => {
    setShowStripeModal(false);
    const orderRef = doc(db, 'orders', pendingOrderId);
    await updateDoc(orderRef, { 
        status: 'placed', 
        'payment.status': 'paid', 
        'payment.txnId': txnId 
    });
    navigate('/dashboard/orders');
  };

  // ... (Keep existing Render Logic for Address/Summary cards) ...
  // Ensure inputs use onChange={(e) => setShippingInfo({...shippingInfo, [e.target.name]: e.target.value})}
  
  if (loadingItems) return <div className="min-h-screen bg-[#0f172a] text-white flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen pb-20 bg-[#0f172a] text-white">
      {/* ... (Your Existing Layout Code) ... */}

      <div className="max-w-6xl mx-auto p-8">
        {/* ... (Address Card & Payment Selection Card code from previous version) ... */}
        
        {/* The Action Button */}
        <div className="fixed bottom-0 left-0 w-full p-4 bg-slate-900 border-t border-white/10 flex justify-center z-40">
           <Button onClick={handlePlaceOrder} disabled={isProcessing} className="w-full max-w-md bg-orange-600 h-12 text-lg">
             {isProcessing ? "Processing..." : `Pay ${currencySymbol}${totalPayAmount}`}
           </Button>
        </div>
      </div>

      {/* STRIPE MODAL */}
      <Dialog open={showStripeModal} onOpenChange={setShowStripeModal}>
        <DialogContent className="bg-slate-900 text-white border-white/10">
          <DialogHeader><DialogTitle>Secure Payment</DialogTitle></DialogHeader>
          {stripeClientSecret && stripePromise && (
            <Elements stripe={stripePromise} options={{ clientSecret: stripeClientSecret, appearance: { theme: 'night' } }}>
              <StripeCheckoutForm onSuccess={handleStripeSuccess} />
            </Elements>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}