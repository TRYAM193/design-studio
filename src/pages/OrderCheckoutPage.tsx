import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router';
import { FiMapPin, FiCreditCard, FiChevronLeft, FiLoader, FiCheckCircle, FiShield } from 'react-icons/fi';
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

export default function OrderCheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const { orderData } = location.state || {};
  
  const [isProcessing, setIsProcessing] = useState(false);
  // We removed "isSuccess" animation state because the gateway handles the UI now
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

  if (!orderData) return <div className="p-10 text-center">No order found.</div>;

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
            color: "#4f46e5" // Indigo-600
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
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      
      <div className="max-w-5xl mx-auto mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:bg-transparent hover:text-indigo-600">
          <FiChevronLeft /> Back to Design
        </Button>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: DETAILS */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FiMapPin className="text-indigo-600"/> Shipping Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Full Name</Label><Input name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} placeholder="John Doe" /></div>
              <div className="space-y-2"><Label>Email</Label><Input name="email" value={shippingInfo.email} onChange={handleInputChange} placeholder="john@example.com" /></div>
              <div className="space-y-2 md:col-span-2"><Label>Address</Label><Input name="address" value={shippingInfo.address} onChange={handleInputChange} placeholder="123 Main St" /></div>
              <div className="space-y-2"><Label>City</Label><Input name="city" value={shippingInfo.city} onChange={handleInputChange} placeholder="New York" /></div>
              <div className="space-y-2"><Label>Zip Code</Label><Input name="zip" value={shippingInfo.zip} onChange={handleInputChange} placeholder="10001" /></div>
            </CardContent>
          </Card>

          <Card>
             <CardHeader>
              <CardTitle className="flex items-center gap-2"><FiCreditCard className="text-green-600"/> Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              
              {/* OPTION 1: ONLINE PAYMENT (Razorpay OR Stripe) */}
              <div 
                onClick={() => setPaymentMethod('online')}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'online' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'online' ? 'border-indigo-600' : 'border-slate-300'}`}>
                  {paymentMethod === 'online' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                </div>
                
                {region === 'IN' ? (
                    // India View: Show Razorpay Context
                    <div>
                        <div className="font-medium">UPI / Cards / Netbanking</div>
                        <p className="text-xs text-slate-500 mt-1">Secured by Razorpay</p>
                    </div>
                ) : (
                    // Global View: Show Stripe Context
                    <div>
                        <div className="font-medium">Credit / Debit Card</div>
                        <p className="text-xs text-slate-500 mt-1">Secured by Stripe</p>
                    </div>
                )}
                
                {/* Secure Badge */}
                <div className="ml-auto">
                    <FiShield className="text-slate-400" />
                </div>
              </div>

              {/* OPTION 2: COD (India Only) */}
              {region === 'IN' && (
                <div 
                  onClick={() => setPaymentMethod('cod')}
                  className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}
                >
                  <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'cod' ? 'border-indigo-600' : 'border-slate-300'}`}>
                    {paymentMethod === 'cod' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                        <span className="font-medium">Cash on Delivery</span>
                        <Badge variant="outline" className="text-xs font-normal border-green-200 text-green-700 bg-green-50">Available</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">Pay with cash upon delivery.</p>
                  </div>
                </div>
              )}

            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="md:col-span-1">
          <Card className="sticky top-6 shadow-md border-indigo-100">
            <CardHeader className="bg-slate-50/50 pb-4">
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your design order</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex gap-4 mb-6">
                 <div className="w-20 h-24 bg-white rounded-md border border-slate-200 overflow-hidden p-2">
                    <img src={orderData.thumbnail} alt="Preview" className="w-full h-full object-contain" />
                 </div>
                 <div>
                   <h4 className="font-bold text-slate-800 text-sm">{orderData.productTitle}</h4>
                   <p className="text-xs text-slate-500 mt-1 capitalize">{orderData.variant.color} / {orderData.variant.size}</p>
                   <p className="text-sm font-medium mt-2">Qty: {orderData.quantity}</p>
                 </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-3 text-sm">
                <div className="flex justify-between items-center text-slate-400">
                    <span>Retail Price</span>
                    <span className="line-through decoration-slate-400">{symbol}{originalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-green-600 font-medium bg-green-50 p-2 rounded">
                    <span>Your Savings</span>
                    <span>- {symbol}{savings.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center mt-2">
                    <span>Shipping</span>
                    <div className="flex items-center gap-2">
                        <span className="text-slate-400 line-through text-xs">{symbol}{fakeShippingCost}</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-700 hover:bg-green-100 border-none px-2 py-0.5">FREE</Badge>
                    </div>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between items-start pt-2">
                    <span className="font-bold text-lg text-slate-800">Total</span>
                    <div className="text-right">
                        <div className="font-bold text-2xl text-indigo-600 leading-none">
                            {symbol}{payAmount.toFixed(2)}
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium mt-1">
                            Inclusive of all taxes
                        </p>
                    </div>
                </div>
              </div>

              <Button 
                onClick={handlePlaceOrder} 
                disabled={isProcessing}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 h-14 text-lg font-bold shadow-lg shadow-indigo-200 transition-all hover:scale-[1.02]"
              >
                {isProcessing ? (
                     <><FiLoader className="animate-spin mr-2" /> Processing...</>
                ) : (
                     `Pay ${symbol}${payAmount.toFixed(2)}`
                )}
              </Button>
              
              <p className="text-xs text-center text-slate-500 mt-4 leading-relaxed">
                By placing this order, you agree to our <Link to="/terms" target="_blank" className="underline hover:text-indigo-600 font-medium">Terms & Conditions</Link>.
              </p>

              <div className="flex justify-center items-center gap-2 mt-4 text-xs text-slate-400">
                <FiCheckCircle className="text-green-500" />
                <span>Secured by {region === 'IN' ? 'Razorpay' : 'Stripe'}</span>
              </div>

            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}