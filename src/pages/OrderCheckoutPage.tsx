import { motion } from "framer-motion";
import { CreditCard, MapPin, Truck, ShieldCheck, Lock, ShoppingBag, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate } from "react-router";
import { useState } from "react";
import { useTranslation } from "@/hooks/use-translation";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";

export default function OrderCheckoutPage() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isProcessing, setIsProcessing] = useState(false);

  // Mock Cart Data (In a real app, this would come from a useCart hook)
  const cartItems = [
    {
      id: 1,
      name: "Custom Heavyweight Tee",
      variant: "Black / L",
      price: 35.00,
      image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=100&auto=format&fit=crop&q=60"
    },
    {
      id: 2,
      name: "Urban Hoodie",
      variant: "Charcoal / M",
      price: 65.00,
      image: "https://images.unsplash.com/photo-1556906781-9a412961d28c?w=100&auto=format&fit=crop&q=60"
    }
  ];

  const subtotal = cartItems.reduce((acc, item) => acc + item.price, 0);
  const shipping = 12.00;
  const total = subtotal + shipping;

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
      toast.success("Order placed successfully!");
      navigate('/dashboard/orders');
    }, 2000);
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center relative">
        <div className="absolute inset-0 bg-[#0f172a] -z-20" />
        <div className="h-24 w-24 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/10 shadow-xl shadow-blue-900/20">
          <Lock className="h-10 w-10 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">{t("auth.signInRequired")}</h2>
          <p className="text-slate-400 max-w-md mx-auto">Please sign in to complete your purchase.</p>
        </div>
        <Link to="/auth">
          <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold border-0">
            {t("nav.signin")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative pb-20">
      
      {/* ✅ BACKGROUND: COSMIC SHIVA THEME */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <div className="space-y-8 max-w-7xl mx-auto pt-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
             <motion.h1 
               initial={{ opacity: 0, x: -20 }}
               animate={{ opacity: 1, x: 0 }}
               className="text-3xl font-bold tracking-tight text-white flex items-center gap-2"
             >
               <ShieldCheck className="h-8 w-8 text-green-400" />
               Secure Checkout
             </motion.h1>
             <p className="text-slate-400 mt-1">Complete your order to start production.</p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-slate-500">
             <span className="text-slate-400">Cart</span>
             <ChevronRight className="h-4 w-4" />
             <span className="text-white font-medium">Checkout</span>
             <ChevronRight className="h-4 w-4" />
             <span>Confirmation</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* LEFT COLUMN: FORMS */}
          <div className="lg:col-span-2 space-y-6">
            <form id="checkout-form" onSubmit={handlePlaceOrder}>
              
              {/* Shipping Details Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-white/5 bg-slate-900/30">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <MapPin className="h-5 w-5 text-blue-400" /> Shipping Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="firstName" className="text-slate-300">First Name</Label>
                        <Input id="firstName" placeholder="Arjuna" className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="lastName" className="text-slate-300">Last Name</Label>
                        <Input id="lastName" placeholder="Pandava" className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50" required />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-slate-300">Address</Label>
                      <Input id="address" placeholder="123 Cosmic Way" className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="city" className="text-slate-300">City</Label>
                        <Input id="city" placeholder="Bengaluru" className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50" required />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="zip" className="text-slate-300">ZIP / Postal Code</Label>
                        <Input id="zip" placeholder="560001" className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50" required />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment Method Card */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-6">
                <Card className="bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-lg overflow-hidden">
                  <CardHeader className="border-b border-white/5 bg-slate-900/30">
                    <CardTitle className="flex items-center gap-2 text-white">
                      <CreditCard className="h-5 w-5 text-orange-400" /> Payment Method
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <RadioGroup defaultValue="card" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative">
                        <RadioGroupItem value="card" id="card" className="peer sr-only" />
                        <Label htmlFor="card" className="flex flex-col items-center justify-between rounded-xl border-2 border-white/10 bg-slate-900/50 p-4 hover:bg-slate-800 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:text-orange-500 cursor-pointer transition-all">
                          <CreditCard className="mb-3 h-6 w-6 text-slate-300" />
                          <span className="text-slate-300 font-semibold">Credit Card</span>
                        </Label>
                      </div>
                      <div className="relative">
                        <RadioGroupItem value="upi" id="upi" className="peer sr-only" />
                        <Label htmlFor="upi" className="flex flex-col items-center justify-between rounded-xl border-2 border-white/10 bg-slate-900/50 p-4 hover:bg-slate-800 peer-data-[state=checked]:border-orange-500 peer-data-[state=checked]:text-orange-500 cursor-pointer transition-all">
                          <Smartphone className="mb-3 h-6 w-6 text-slate-300" />
                          <span className="text-slate-300 font-semibold">UPI / Netbanking</span>
                        </Label>
                      </div>
                    </RadioGroup>

                    <div className="space-y-4 pt-4 border-t border-white/5">
                      <div className="space-y-2">
                        <Label htmlFor="cardNumber" className="text-slate-300">Card Number</Label>
                        <Input id="cardNumber" placeholder="0000 0000 0000 0000" className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="expiry" className="text-slate-300">Expiry</Label>
                          <Input id="expiry" placeholder="MM/YY" className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50" />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="cvc" className="text-slate-300">CVC</Label>
                          <Input id="cvc" placeholder="123" className="bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            </form>
          </div>

          {/* RIGHT COLUMN: ORDER SUMMARY */}
          <div className="lg:col-span-1">
             <motion.div 
               initial={{ opacity: 0, x: 20 }} 
               animate={{ opacity: 1, x: 0 }}
               className="sticky top-24" // Makes it sticky on scroll
             >
               <Card className="bg-slate-800/60 backdrop-blur-xl border border-white/10 shadow-2xl">
                 <CardHeader className="bg-slate-900/50 border-b border-white/5">
                   <CardTitle className="text-white flex items-center gap-2">
                      <ShoppingBag className="h-5 w-5 text-orange-400" /> Order Summary
                   </CardTitle>
                 </CardHeader>
                 <CardContent className="p-6 space-y-6">
                    {/* Cart Items List */}
                    <div className="space-y-4">
                      {cartItems.map((item) => (
                        <div key={item.id} className="flex gap-4 items-start">
                          <div className="h-16 w-16 rounded-md bg-white overflow-hidden flex-shrink-0 border border-white/10">
                             <img src={item.image} alt={item.name} className="h-full w-full object-contain p-1" />
                          </div>
                          <div className="flex-1 min-w-0">
                             <h4 className="text-sm font-medium text-slate-200 truncate">{item.name}</h4>
                             <p className="text-xs text-slate-500">{item.variant}</p>
                             <p className="text-sm font-semibold text-slate-300 mt-1">${item.price.toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="bg-white/10" />

                    {/* Cost Breakdown */}
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-slate-400">
                        <span>Subtotal</span>
                        <span>${subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-slate-400">
                         <span className="flex items-center gap-1"><Truck className="h-3 w-3" /> Shipping</span>
                         <span>${shipping.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center text-lg font-bold text-white pt-2 border-t border-white/10 mt-2">
                        <span>Total</span>
                        <span className="text-orange-400">${total.toFixed(2)}</span>
                      </div>
                    </div>
                 </CardContent>
                 <CardFooter className="p-6 pt-0">
                   <Button 
                     size="lg" 
                     className="w-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold shadow-lg shadow-orange-900/40 border-0 h-12"
                     onClick={handlePlaceOrder}
                     disabled={isProcessing}
                   >
                     {isProcessing ? (
                        <>Processing...</>
                     ) : (
                        <>Place Order <ChevronRight className="ml-1 h-4 w-4" /></>
                     )}
                   </Button>
                   <div className="text-center w-full mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                      <Lock className="h-3 w-3" /> SSL Encrypted Payment
                   </div>
                 </CardFooter>
               </Card>
             </motion.div>
          </div>

        </div>
      </div>
    </div>
  );
}

// Helper icon component for UPI
function Smartphone(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect width="14" height="20" x="5" y="2" rx="2" ry="2" />
      <path d="M12 18h.01" />
    </svg>
  )
}