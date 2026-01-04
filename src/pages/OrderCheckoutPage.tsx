import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '@/hooks/use-auth';
import { doc, setDoc, serverTimestamp, updateDoc, collection, getDocs, getDoc } from 'firebase/firestore';
import { db } from '@/firebase';

// Data Library
import { Country, State, City } from 'country-state-city';

// UI Imports
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

// Icons
import {
  ChevronLeft,
  Loader2,
  ShoppingBag,
  CreditCard,
  Truck,
  Globe,
  ShieldCheck,
  Smartphone,
  CheckCircle2,
  MapPin,
  Lock
} from "lucide-react";

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

  // 🔒 Location Lock State
  const [isLocationLocked, setIsLocationLocked] = useState(false);

  // Shipping State
  const [shippingInfo, setShippingInfo] = useState({
    fullName: user?.displayName || '',
    email: user?.email || '',
    line1: '',
    countryCode: 'IN', // Default
    stateCode: '',
    city: '',
    zip: '',
  });

  // 1. Fetch Items & User Profile
  useEffect(() => {
    const initData = async () => {
      setLoadingItems(true);

      // Load Cart/Items
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

      // Load Saved Address
      if (user?.uid) {
        try {
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const addr = data.addressObject || {};
            setShippingInfo(prev => ({
              ...prev,
              fullName: data.name || prev.fullName,
              line1: addr.line1 || '',
              // We will override this below if IP check passes
              countryCode: addr.countryCode || 'IN',
              stateCode: addr.stateCode || '',
              city: addr.city || '',
              zip: addr.zip || '',
            }));
          }
        } catch (err) { console.error(err); }
      }

      setLoadingItems(false);
    };
    initData();
  }, [mode, user, legacyOrderData]);

  // 2. 🌍 IP Geolocation & Restriction Logic
  useEffect(() => {
    // Only fetch if we haven't locked it yet
    const fetchLocation = async () => {
      try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();

        // Logic: If user is in India, Force India.
        // You can add 'OR data.country_code === "US"' if you want to lock US users too.
        if (data.country_code === 'IN') {
          setShippingInfo(prev => ({
            ...prev,
            countryCode: 'IN',
            // If the saved state/city isn't Indian, clear them to prevent mismatches
            stateCode: prev.countryCode !== 'IN' ? '' : prev.stateCode,
            city: prev.countryCode !== 'IN' ? '' : prev.city
          }));
          setIsLocationLocked(true); // 🔒 Lock the dropdown
        }
      } catch (error) {
        console.warn("Could not fetch IP location, defaulting to open selection.");
      }
    };

    fetchLocation();
  }, []);

  // --- LOCATION LIBRARIES ---
  const countries = useMemo(() => {
    const allowedCodes = ['IN', 'US', 'GB', 'CA', 'DE', 'FR', 'IT', 'ES', 'NL', 'BE', 'AU'];
    return Country.getAllCountries().filter(c => allowedCodes.includes(c.isoCode));
  }, []);

  const states = useMemo(() => {
    return shippingInfo.countryCode ? State.getStatesOfCountry(shippingInfo.countryCode) : [];
  }, [shippingInfo.countryCode]);

  const cities = useMemo(() => {
    return shippingInfo.stateCode ? City.getCitiesOfState(shippingInfo.countryCode, shippingInfo.stateCode) : [];
  }, [shippingInfo.countryCode, shippingInfo.stateCode]);

  // Currency Logic
  const currencySymbol = shippingInfo.countryCode === 'US' ? "$" : (shippingInfo.countryCode === 'GB' ? "£" : (['DE', 'FR', 'IT', 'ES', 'NL'].includes(shippingInfo.countryCode) ? "€" : "₹"));
  const totalPayAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // Handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setShippingInfo({ ...shippingInfo, [e.target.name]: e.target.value });
  };
  const handleCountryChange = (value: string) => setShippingInfo({ ...shippingInfo, countryCode: value, stateCode: '', city: '' });
  const handleStateChange = (value: string) => setShippingInfo({ ...shippingInfo, stateCode: value, city: '' });
  const handleCityChange = (value: string) => setShippingInfo({ ...shippingInfo, city: value });

  const handlePlaceOrder = async () => {
    if (items.length === 0) return;
    if (!shippingInfo.line1 || !shippingInfo.stateCode || !shippingInfo.city || !shippingInfo.zip) {
      alert("Please complete your full shipping address.");
      return;
    }

    let provider;
    if (shippingInfo.countryCode === 'IN') provider = 'qikink';
    else if (shippingInfo.countryCode === 'US') provider = 'printify';
    else provider = 'gelato';

    setIsProcessing(true);
    try {
      const orderId = `ORD-${Date.now()}`;
      const orderRef = doc(db, 'orders', orderId);
      const countryName = Country.getCountryByCode(shippingInfo.countryCode)?.name || shippingInfo.countryCode;
      const stateName = State.getStateByCodeAndCountry(shippingInfo.stateCode, shippingInfo.countryCode)?.name || shippingInfo.stateCode;

      const newOrder = {
        userId: user?.uid || 'guest',
        items,
        shippingAddress: { ...shippingInfo, country: countryName, state: stateName },
        payment: { method: paymentMethod, total: totalPayAmount, currency: currencySymbol, status: 'pending' },
        status: 'pending_payment',
        createdAt: serverTimestamp(),
        orderId,
        provider
      };

      await setDoc(orderRef, newOrder);

      // Simulate Payment
      setTimeout(async () => {
        await updateDoc(orderRef, { status: 'placed', 'payment.status': paymentMethod === 'online' ? 'paid' : 'pending_cod' });
        navigate(`/dashboard/orders`);
      }, 2000);

    } catch (error) {
      console.error("Order failed:", error);
      setIsProcessing(false);
    }
  };

  if (loadingItems) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0f172a] text-white gap-4">
      <Loader2 className="animate-spin h-8 w-8 text-orange-500" />
      <p className="text-slate-400">Loading checkout...</p>
    </div>
  );

  return (
    <div className="min-h-screen relative pb-20 font-sans bg-[#0f172a] text-slate-100 selection:bg-orange-500/30">

      {/* Background */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] rounded-full bg-blue-600/5 blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] rounded-full bg-orange-600/5 blur-[100px]" />
      </div>

      <div className="max-w-6xl mx-auto p-4 md:p-8 pt-6">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 pl-0 text-slate-400 hover:text-white hover:bg-transparent group">
          <ChevronLeft className="mr-1 h-4 w-4 group-hover:-translate-x-1 transition-transform" /> Back
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          <div className="lg:col-span-2 space-y-6">
            {/* SHIPPING DETAILS */}
            <Card className="bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-lg">
              <CardHeader className="border-b border-white/5 pb-4">
                <CardTitle className="text-white text-lg flex items-center gap-2">
                  <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">1</span>
                  Shipping Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Full Name</Label>
                    {/* ✅ Added text-white to all Inputs */}
                    <Input name="fullName" value={shippingInfo.fullName} onChange={handleInputChange} className="bg-slate-900/50 border-white/10 text-white focus:border-orange-500/50" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Email</Label>
                    <Input name="email" value={shippingInfo.email} onChange={handleInputChange} className="bg-slate-900/50 border-white/10 text-white focus:border-orange-500/50" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-slate-300">Street Address</Label>
                  <Input name="line1" value={shippingInfo.line1} onChange={handleInputChange} placeholder="House No, Street, Landmark" className="bg-slate-900/50 border-white/10 text-white focus:border-orange-500/50" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300 flex items-center justify-between">
                      Country
                    </Label>
                    {/* {isLocationLocked && <span className="text-[10px] text-orange-400 flex items-center gap-1"><Lock className="w-3 h-3" /> {shippingInfo.countryCode === 'IN' ? "India" : "Region"} Detected</span>} */}

                    {/* 🔒 Locked Select if isLocationLocked is true */}
                    <Select
                      value={shippingInfo.countryCode}
                      onValueChange={handleCountryChange}
                      disabled={isLocationLocked}
                    >
                      <SelectTrigger className={`bg-slate-900/50 border-white/10 text-white ${isLocationLocked ? "opacity-50 cursor-not-allowed" : ""}`}>
                        <SelectValue placeholder="Select Country" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-800 text-white border-white/10 max-h-64">
                        {countries.map((country) => (
                          <SelectItem key={country.isoCode} value={country.isoCode}>{country.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-slate-300">State / Province</Label>
                    <Select value={shippingInfo.stateCode} onValueChange={handleStateChange} disabled={!shippingInfo.countryCode}>
                      <SelectTrigger className="bg-slate-900/50 border-white/10 text-white"><SelectValue placeholder="Select State" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 text-white border-white/10 max-h-64">
                        {states.length > 0 ? (
                          states.map((state) => (
                            <SelectItem key={state.isoCode} value={state.isoCode}>{state.name}</SelectItem>
                          ))
                        ) : <div className="p-2 text-xs text-slate-500">No states found</div>}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">City</Label>
                    <Select value={shippingInfo.city} onValueChange={handleCityChange} disabled={!shippingInfo.stateCode}>
                      <SelectTrigger className="bg-slate-900/50 border-white/10 text-white"><SelectValue placeholder="Select City" /></SelectTrigger>
                      <SelectContent className="bg-slate-800 text-white border-white/10 max-h-64">
                        {cities.length > 0 ? (
                          cities.map((city) => (
                            <SelectItem key={city.name} value={city.name}>{city.name}</SelectItem>
                          ))
                        ) : <div className="p-2 text-xs text-slate-500">Select State First</div>}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-slate-300">Zip Code</Label>
                    <Input name="zip" value={shippingInfo.zip} onChange={handleInputChange} className="bg-slate-900/50 border-white/10 text-white focus:border-orange-500/50" />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* PAYMENT METHOD */}
            <Card className="bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden">
              <CardHeader className="border-b border-white/5 pb-4 bg-slate-900/20">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white text-lg flex items-center gap-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500/10 text-blue-400 text-xs border border-blue-500/20">2</span>
                    Payment Method
                  </CardTitle>
                  <div className="flex items-center gap-1 text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full border border-green-500/20">
                    <ShieldCheck className="h-3 w-3" /> Secure SSL
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                {/* Pay Online */}
                <div onClick={() => setPaymentMethod('online')} className={`relative p-5 border rounded-xl cursor-pointer transition-all duration-200 group ${paymentMethod === 'online' ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-transparent ring-1 ring-orange-500/50' : 'border-white/10 hover:bg-white/5 hover:border-white/20'}`}>
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${paymentMethod === 'online' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-400'}`}>
                      <CreditCard className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold text-lg ${paymentMethod === 'online' ? 'text-white' : 'text-slate-300'}`}>Pay Online</h3>
                        {paymentMethod === 'online' && <CheckCircle2 className="text-orange-500 h-5 w-5" />}
                      </div>
                      <p className="text-slate-400 text-sm mb-3">Instant & Secure. Support for all major methods.</p>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="outline" className="bg-slate-900/50 border-white/10 text-slate-300 text-[10px] font-medium py-1 px-2 gap-1"><Globe className="w-3 h-3 text-blue-400" /> International</Badge>
                        <Badge variant="outline" className="bg-slate-900/50 border-white/10 text-slate-300 text-[10px] font-medium py-1 px-2 gap-1"><CreditCard className="w-3 h-3 text-purple-400" /> Visa / Master</Badge>
                        <Badge variant="outline" className="bg-slate-900/50 border-white/10 text-slate-300 text-[10px] font-medium py-1 px-2 gap-1"><Smartphone className="w-3 h-3 text-green-400" /> UPI / GPay</Badge>
                      </div>
                    </div>
                  </div>
                </div>
                {/* COD */}
                <div onClick={() => setPaymentMethod('cod')} className={`relative p-5 border rounded-xl cursor-pointer transition-all duration-200 ${paymentMethod === 'cod' ? 'border-orange-500 bg-gradient-to-br from-orange-500/10 to-transparent ring-1 ring-orange-500/50' : 'border-white/10 hover:bg-white/5 hover:border-white/20'}`}>
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-xl transition-colors ${paymentMethod === 'cod' ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-slate-800 text-slate-400'}`}>
                      <Truck className="h-6 w-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className={`font-bold text-lg ${paymentMethod === 'cod' ? 'text-white' : 'text-slate-300'}`}>Cash on Delivery</h3>
                        {paymentMethod === 'cod' && <CheckCircle2 className="text-orange-500 h-5 w-5" />}
                      </div>
                      <p className="text-slate-400 text-sm">Pay in cash when your order arrives.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* SUMMARY */}
          <div className="lg:col-span-1">
            <Card className="sticky top-6 border-white/10 bg-slate-800/60 backdrop-blur-xl shadow-2xl">
              <CardHeader className="border-b border-white/5 pb-4 bg-slate-900/30">
                <CardTitle className="text-white flex items-center gap-2 text-lg">
                  <ShoppingBag className="text-orange-400 h-5 w-5" /> Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                  {items.map((item, idx) => (
                    <div key={idx} className="flex gap-4 border-b border-white/5 pb-4 last:border-0 last:pb-0">
                      <div className="h-14 w-14 rounded-lg bg-white p-1 overflow-hidden border border-white/10 shrink-0">
                        <img src={item.thumbnail} alt="Preview" className="w-full h-full object-contain" />
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-center">
                        <h4 className="font-medium text-slate-200 text-sm truncate">{item.productTitle}</h4>
                        <div className="flex justify-between mt-1 text-xs text-slate-400">
                          <span>Qty: {item.quantity}</span>
                          <span className="text-slate-200 font-medium">{currencySymbol}{(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <Separator className="bg-white/10 my-4" />

                <div className="space-y-2">
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Subtotal</span>
                    <span>{currencySymbol}{totalPayAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-slate-400">
                    <span>Shipping</span>
                    <span className="text-green-400">Free</span>
                  </div>
                  <div className="flex justify-between text-xl font-bold text-white pt-2 border-t border-white/10 mt-2">
                    <span>Total</span>
                    <span>{currencySymbol}{totalPayAmount.toFixed(2)}</span>
                  </div>
                </div>

                <Button onClick={handlePlaceOrder} disabled={isProcessing} className="w-full mt-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 h-12 text-lg font-bold shadow-lg shadow-orange-900/20 transition-all hover:scale-[1.02]">
                  {isProcessing ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Processing...</> : (paymentMethod === 'cod' ? 'Place Order' : `Pay ${currencySymbol}${totalPayAmount.toFixed(2)}`)}
                </Button>

                {shippingInfo.city && shippingInfo.stateCode && (
                  <div className="mt-4 flex items-center justify-center gap-2 text-xs text-green-400 bg-green-900/20 py-2 rounded border border-green-500/20">
                    <MapPin className="h-3 w-3" /> Delivering to: {shippingInfo.city}, {shippingInfo.countryCode}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}