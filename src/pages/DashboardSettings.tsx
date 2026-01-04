import { motion } from "framer-motion";
import { Save, User, Lock, MapPin, Phone, Building, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "react-router";
import { useTranslation } from "@/hooks/use-translation";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

export default function DashboardSettings() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    // Address Fields
    line1: "",
    line2: "",
    city: "",
    state: "",
    zip: "",
    country: "IN", // Default to India or US as needed
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          const defaultName = user.displayName || "";
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            const address = data.addressObject || {}; // Check for new structure first

            setFormData({
              name: data.name || defaultName,
              phoneNumber: data.phoneNumber || "",
              line1: address.line1 || data.address || "", // Fallback to old field
              line2: address.line2 || "",
              city: address.city || "",
              state: address.state || "",
              zip: address.zip || "",
              country: address.country || "IN",
            });
          } else {
            setFormData(prev => ({ ...prev, name: defaultName }));
          }
        } catch (error) {
          console.error("Error fetching profile:", error);
        }
      }
    }

    fetchProfile();
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      // Save structured address for checkout reuse
      const addressObject = {
        line1: formData.line1,
        line2: formData.line2,
        city: formData.city,
        state: formData.state,
        zip: formData.zip,
        country: formData.country,
      };

      await setDoc(doc(db, "users", user.uid), {
        name: formData.name,
        phoneNumber: formData.phoneNumber,
        addressObject, 
        // Keep flat address for legacy support if needed, or construct it
        address: `${formData.line1}, ${formData.city}, ${formData.state} ${formData.zip}`
      }, { merge: true });

      toast.success(t("settings.success"));
    } catch (error) {
      toast.error(t("settings.error"));
      console.error("Error saving profile:", error);
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center relative">
        <div className="absolute inset-0 bg-[#0f172a] -z-20" />
        <div className="h-24 w-24 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/10 shadow-xl shadow-blue-900/20">
          <Lock className="h-10 w-10 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">{t("settings.signInTitle")}</h2>
          <p className="text-slate-400 max-w-md mx-auto">{t("settings.signInDesc")}</p>
        </div>
        <Link to="/auth">
          <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold">
            {t("nav.signin")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 relative pb-20">
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold tracking-tight mb-6 text-white">{t("settings.title")}</h1>
        
        <Card className="bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">Personal & Shipping Info</CardTitle>
            <CardDescription className="text-slate-400">
              Manage your default shipping address for faster checkout.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name & Phone */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                  <div className="relative group">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input id="name" name="name" value={formData.name} onChange={handleChange} className="pl-10 bg-slate-900/50 border-white/10 text-white" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-slate-300">Phone Number</Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                    <Input id="phoneNumber" name="phoneNumber" type="tel" value={formData.phoneNumber} onChange={handleChange} className="pl-10 bg-slate-900/50 border-white/10 text-white" />
                  </div>
                </div>
              </div>

              <div className="border-t border-white/10 my-4"></div>
              <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Shipping Address</h3>

              {/* Street Address */}
              <div className="space-y-2">
                <Label htmlFor="line1" className="text-slate-300">Street Address</Label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input id="line1" name="line1" value={formData.line1} onChange={handleChange} placeholder="123 Main St" className="pl-10 bg-slate-900/50 border-white/10 text-white" />
                </div>
              </div>

               <div className="space-y-2">
                <Label htmlFor="line2" className="text-slate-300">Apartment, Suite, etc. (Optional)</Label>
                <div className="relative group">
                  <Building className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
                  <Input id="line2" name="line2" value={formData.line2} onChange={handleChange} placeholder="Apt 4B" className="pl-10 bg-slate-900/50 border-white/10 text-white" />
                </div>
              </div>

              {/* City, State, Zip */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="city" className="text-slate-300">City</Label>
                  <Input id="city" name="city" value={formData.city} onChange={handleChange} className="bg-slate-900/50 border-white/10 text-white" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="state" className="text-slate-300">State / Province</Label>
                  <Input id="state" name="state" value={formData.state} onChange={handleChange} className="bg-slate-900/50 border-white/10 text-white" />
                </div>
                <div className="space-y-2 col-span-2 md:col-span-1">
                  <Label htmlFor="zip" className="text-slate-300">Zip / Postal Code</Label>
                  <Input id="zip" name="zip" value={formData.zip} onChange={handleChange} className="bg-slate-900/50 border-white/10 text-white" />
                </div>
              </div>

              {/* Country */}
              <div className="space-y-2">
                 <Label className="text-slate-300">Country</Label>
                 <div className="relative">
                   <Globe className="absolute left-3 top-3 h-4 w-4 text-slate-500 z-10" />
                   <Select value={formData.country} onValueChange={(val) => handleSelectChange("country", val)}>
                    <SelectTrigger className="w-full pl-10 bg-slate-900/50 border-white/10 text-white">
                      <SelectValue placeholder="Select Country" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-white/10 text-white">
                      <SelectItem value="IN">India</SelectItem>
                      <SelectItem value="US">United States</SelectItem>
                      <SelectItem value="CA">Canada</SelectItem>
                      <SelectItem value="UK">United Kingdom</SelectItem>
                      <SelectItem value="AU">Australia</SelectItem>
                    </SelectContent>
                  </Select>
                 </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border-0 shadow-lg shadow-orange-900/30 min-w-[120px]"
                >
                  {isSaving ? <span className="animate-spin mr-2">⏳</span> : <Save className="mr-2 h-4 w-4" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}