import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { FiMapPin, FiCreditCard, FiCheckCircle, FiChevronLeft, FiLoader } from 'react-icons/fi';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

// UI Components
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';

const SHIPPING_COST = 50; 

export default function OrderCheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Retrieve Data passed from Editor
  const { orderData } = location.state || {};
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false); // Triggers Animation
  const [paymentMethod, setPaymentMethod] = useState('card');

  // Form State
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
       // navigate('/design'); // Uncomment to force redirect if accessed directly
    }
  }, [orderData, navigate]);

  if (!orderData) return <div className="p-10 text-center">No order found.</div>;

  const subtotal = orderData.price * orderData.quantity;
  const tax = subtotal * 0.05;
  const total = subtotal + tax + SHIPPING_COST;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    
    // Simulate API delay for realism
    await new Promise(resolve => setTimeout(resolve, 1500));

    try {
      const orderId = `ORD-${Date.now()}`;
      await setDoc(doc(db, 'orders', orderId), {
        userId: user?.uid || 'guest',
        items: [orderData],
        shippingAddress: shippingInfo,
        payment: { method: paymentMethod, total, currency: 'INR' },
        status: 'processing',
        createdAt: serverTimestamp(),
        orderId
      });
      
      setIsProcessing(false);
      setIsSuccess(true); // ✅ TRIGGER ANIMATION
      
      // Navigate away after animation finishes (3 seconds)
      setTimeout(() => {
        navigate('/dashboard/orders');
      }, 3000);

    } catch (error) {
      console.error("Order failed:", error);
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50/50 p-4 md:p-8 font-sans">
      
      {/* SUCCESS OVERLAY ANIMATION */}
      {isSuccess && <SuccessAnimation />}

      <div className="max-w-5xl mx-auto mb-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="gap-2 pl-0 hover:bg-transparent hover:text-indigo-600">
          <FiChevronLeft /> Back to Design
        </Button>
      </div>

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* LEFT COLUMN: DETAILS */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Shipping Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FiMapPin className="text-indigo-600"/> Shipping Details</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input name="email" value={shippingInfo.email} onChange={handleInputChange} placeholder="john@example.com" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Address</Label>
                <Input name="address" value={shippingInfo.address} onChange={handleInputChange} placeholder="123 Main St" />
              </div>
              <div className="space-y-2">
                <Label>City</Label>
                <Input name="city" value={shippingInfo.city} onChange={handleInputChange} placeholder="New York" />
              </div>
              <div className="space-y-2">
                <Label>Zip Code</Label>
                <Input name="zip" value={shippingInfo.zip} onChange={handleInputChange} placeholder="10001" />
              </div>
            </CardContent>
          </Card>

          {/* Payment Card */}
          <Card>
             <CardHeader>
              <CardTitle className="flex items-center gap-2"><FiCreditCard className="text-green-600"/> Payment Method</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div 
                onClick={() => setPaymentMethod('card')}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-indigo-600' : 'border-slate-300'}`}>
                  {paymentMethod === 'card' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                </div>
                <div className="font-medium">Credit / Debit Card</div>
              </div>

              <div 
                onClick={() => setPaymentMethod('upi')}
                className={`flex items-center gap-4 p-4 rounded-lg border-2 cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-50/50' : 'border-slate-100 hover:border-slate-200'}`}
              >
                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'upi' ? 'border-indigo-600' : 'border-slate-300'}`}>
                  {paymentMethod === 'upi' && <div className="w-2.5 h-2.5 rounded-full bg-indigo-600" />}
                </div>
                <div className="font-medium">UPI / Netbanking</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: SUMMARY */}
        <div className="md:col-span-1">
          <Card className="sticky top-6">
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
              <CardDescription>Review your design order</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Product Preview */}
              <div className="flex gap-4 mb-6">
                 <div className="w-20 h-24 bg-slate-100 rounded-md border overflow-hidden">
                    <img src={orderData.thumbnail} alt="Preview" className="w-full h-full object-contain" />
                 </div>
                 <div>
                   <h4 className="font-semibold text-sm">{orderData.productTitle}</h4>
                   <p className="text-xs text-slate-500 mt-1">{orderData.variant.color} / {orderData.variant.size}</p>
                   <p className="text-sm font-medium mt-2">Qty: {orderData.quantity}</p>
                 </div>
              </div>

              <Separator className="my-4" />

              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Shipping</span><span>₹{SHIPPING_COST.toFixed(2)}</span></div>
                <div className="flex justify-between"><span>Tax (5%)</span><span>₹{tax.toFixed(2)}</span></div>
                <div className="flex justify-between pt-4 font-bold text-lg"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
              </div>

              <Button 
                onClick={handlePlaceOrder} 
                disabled={isProcessing}
                className="w-full mt-6 bg-indigo-600 hover:bg-indigo-700 h-12 text-lg"
              >
                {isProcessing ? <FiLoader className="animate-spin mr-2" /> : "Place Order"}
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

// ✅ SUCCESS ANIMATION COMPONENT
function SuccessAnimation() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white p-8 rounded-2xl shadow-2xl flex flex-col items-center animate-in zoom-in-95 duration-300">
        
        {/* Animated Check Circle */}
        <div className="relative w-24 h-24 mb-4">
          <svg className="w-full h-full text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth="2" 
              d="M5 13l4 4L19 7" 
              className="animate-[draw_0.6s_ease-in-out_forwards] stroke-[3]"
              style={{ strokeDasharray: 60, strokeDashoffset: 60 }}
            />
          </svg>
          <div className="absolute inset-0 border-4 border-green-500 rounded-full animate-[ping_0.8s_ease-out_forwards]" />
          <div className="absolute inset-0 border-4 border-green-500 rounded-full" />
        </div>

        <h2 className="text-2xl font-bold text-slate-800 mb-2">Order Placed!</h2>
        <p className="text-slate-500 text-center">Thank you for your purchase.<br/>Redirecting to your orders...</p>
        
        {/* Simple inline style for the path animation */}
        <style>{`
          @keyframes draw {
            to { stroke-dashoffset: 0; }
          }
        `}</style>
      </div>
    </div>
  );
}