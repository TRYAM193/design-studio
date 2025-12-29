import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { FiMapPin, FiCreditCard, FiCheckCircle, FiTruck, FiShield, FiChevronLeft } from 'react-icons/fi';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/firebase';

// Mock Shipping Cost
const SHIPPING_COST = 50; 

export default function OrderCheckoutPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // 1. Retrieve Data passed from Editor
  const { orderData } = location.state || {};
  
  const [step, setStep] = useState(1); // 1 = Details, 2 = Payment
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('card'); // 'card', 'upi', 'cod'

  // Form State
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    address: '',
    city: '',
    state: '',
    zip: '',
    phone: ''
  });

  // Redirect if no data (e.g. user refreshed page)
  useEffect(() => {
    if (!orderData) {
      // navigate('/dashboard'); // Uncomment to enforce redirect
    }
  }, [orderData, navigate]);

  if (!orderData) return <div className="p-10 text-center">No order found. Please start from the design tool.</div>;

  // --- CALCULATIONS ---
  const subtotal = orderData.price * orderData.quantity;
  const tax = subtotal * 0.05; // 5% Tax example
  const total = subtotal + tax + SHIPPING_COST;

  // --- HANDLERS ---
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setShippingInfo(prev => ({ ...prev, [name]: value }));
  };

  const handlePlaceOrder = async () => {
    setIsProcessing(true);
    try {
      // 1. Create Order Object
      const orderPayload = {
        userId: user?.uid || 'guest',
        items: [orderData], // Array in case we add multi-item support later
        shippingAddress: shippingInfo,
        payment: {
            method: paymentMethod,
            status: paymentMethod === 'cod' ? 'pending' : 'paid', // Simplify for demo
            total: total,
            currency: 'INR'
        },
        status: 'processing',
        createdAt: serverTimestamp(),
        orderId: `ORD-${Date.now()}` // Simple ID generation
      };

      // 2. Save to Firebase
      await setDoc(doc(db, 'orders', orderPayload.orderId), orderPayload);
      
      // 3. Success Feedback
      alert(`Order ${orderPayload.orderId} placed successfully!`);
      navigate('/dashboard/orders'); // Or to a "Thank You" page

    } catch (error) {
      console.error("Order failed:", error);
      alert("Failed to place order. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 font-sans text-slate-800">
      
      {/* HEADER */}
      <div className="max-w-6xl mx-auto mb-8 flex items-center gap-4">
        <button onClick={() => navigate(-1)} className="p-2 hover:bg-white rounded-full transition-all">
          <FiChevronLeft size={24} />
        </button>
        <h1 className="text-2xl font-bold">Checkout</h1>
      </div>

      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        
        {/* === LEFT COLUMN: FORMS === */}
        <div className="md:col-span-2 space-y-6">
          
          {/* 1. SHIPPING ADDRESS */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
            <div className="flex items-center gap-3 mb-4 text-slate-700">
              <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><FiMapPin size={20}/></div>
              <h2 className="text-lg font-bold">Shipping Details</h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
               <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase">Full Name</label>
                 <input type="text" name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="John Doe" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase">Email</label>
                 <input type="email" name="email" value={shippingInfo.email} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="john@example.com" />
               </div>
               <div className="space-y-1 md:col-span-2">
                 <label className="text-xs font-semibold text-slate-500 uppercase">Address</label>
                 <input type="text" name="address" value={shippingInfo.address} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="Street Address, Apt, Suite" />
               </div>
               <div className="space-y-1">
                 <label className="text-xs font-semibold text-slate-500 uppercase">City</label>
                 <input type="text" name="city" value={shippingInfo.city} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
               </div>
               <div className="space-y-1 grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">State</label>
                    <input type="text" name="state" value={shippingInfo.state} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-slate-500 uppercase">Zip Code</label>
                    <input type="text" name="zip" value={shippingInfo.zip} onChange={handleInputChange} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
                  </div>
               </div>
            </div>
          </div>

          {/* 2. PAYMENT METHOD */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100">
             <div className="flex items-center gap-3 mb-4 text-slate-700">
              <div className="p-2 bg-green-50 text-green-600 rounded-lg"><FiCreditCard size={20}/></div>
              <h2 className="text-lg font-bold">Payment Method</h2>
            </div>

            <div className="space-y-3">
              {/* Option: Card */}
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                <input type="radio" name="payment" className="w-5 h-5 text-indigo-600" checked={paymentMethod === 'card'} onChange={() => setPaymentMethod('card')} />
                <div className="flex-1">
                  <span className="font-semibold block text-slate-800">Credit / Debit Card</span>
                  <span className="text-xs text-slate-500">Secure payment via Stripe/Razorpay</span>
                </div>
                <div className="flex gap-1 opacity-70">
                   {/* Icons for cards can go here */}
                   <div className="w-8 h-5 bg-slate-200 rounded"></div>
                   <div className="w-8 h-5 bg-slate-200 rounded"></div>
                </div>
              </label>

              {/* Option: UPI */}
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'upi' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                <input type="radio" name="payment" className="w-5 h-5 text-indigo-600" checked={paymentMethod === 'upi'} onChange={() => setPaymentMethod('upi')} />
                <div className="flex-1">
                  <span className="font-semibold block text-slate-800">UPI / Netbanking</span>
                  <span className="text-xs text-slate-500">Google Pay, PhonePe, Paytm</span>
                </div>
              </label>

              {/* Option: COD */}
              <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all ${paymentMethod === 'cod' ? 'border-indigo-600 bg-indigo-50/30' : 'border-slate-100 hover:border-slate-200'}`}>
                <input type="radio" name="payment" className="w-5 h-5 text-indigo-600" checked={paymentMethod === 'cod'} onChange={() => setPaymentMethod('cod')} />
                <div className="flex-1">
                  <span className="font-semibold block text-slate-800">Cash on Delivery</span>
                  <span className="text-xs text-slate-500">Pay when your order arrives</span>
                </div>
              </label>
            </div>
          </div>

        </div>

        {/* === RIGHT COLUMN: SUMMARY === */}
        <div className="md:col-span-1">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 sticky top-6">
            <h3 className="text-lg font-bold mb-4 text-slate-800">Order Summary</h3>
            
            {/* PRODUCT CARD */}
            <div className="flex gap-4 mb-6 pb-6 border-b border-slate-100">
               <div className="w-20 h-24 bg-slate-100 rounded-md overflow-hidden flex-shrink-0 border border-slate-200">
                  {orderData.thumbnail ? (
                    <img src={orderData.thumbnail} alt="Design" className="w-full h-full object-contain" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No Img</div>
                  )}
               </div>
               <div>
                 <h4 className="font-semibold text-sm text-slate-900">{orderData.productTitle}</h4>
                 <p className="text-xs text-slate-500 mt-1">{orderData.variant.color} • {orderData.variant.size}</p>
                 <p className="text-sm font-medium text-slate-800 mt-2">Qty: {orderData.quantity}</p>
               </div>
               <div className="ml-auto">
                 <span className="font-bold text-sm">₹{orderData.price}</span>
               </div>
            </div>

            {/* TOTALS */}
            <div className="space-y-3 text-sm text-slate-600 mb-6">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping</span>
                <span>₹{SHIPPING_COST.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (5%)</span>
                <span>₹{tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-4 border-t border-slate-100 text-base font-bold text-slate-900">
                <span>Total</span>
                <span>₹{total.toFixed(2)}</span>
              </div>
            </div>

            {/* PAY BUTTON */}
            <button 
              onClick={handlePlaceOrder} 
              disabled={isProcessing}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-lg shadow-lg shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <> <Loader2 className="animate-spin" /> Processing... </>
              ) : (
                <> <FiCheckCircle /> Confirm Order </>
              )}
            </button>

            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-400">
              <FiShield /> Secure SSL Encryption
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}