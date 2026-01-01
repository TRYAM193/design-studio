import { motion } from "framer-motion";
import { Save, User, Lock, MapPin, Phone, Calendar } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "react-router";
import { useTranslation } from "@/hooks/use-translation";
// Added Firebase imports
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "@/firebase";

export default function DashboardSettings() {
  const { user, isAuthenticated } = useAuth();
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    phoneNumber: "",
    address: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  // Load user profile from Firestore when user logs in
  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          const defaultName = user.displayName || "";
          const userDocRef = doc(db, "users", user.uid);
          const userSnap = await getDoc(userDocRef);

          if (userSnap.exists()) {
            const data = userSnap.data();
            setFormData({
              name: data.name || defaultName,
              dob: data.dob || "",
              phoneNumber: data.phoneNumber || "",
              address: data.address || "",
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), formData, { merge: true });
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
        {/* Background Overlay for Unauth State */}
        <div className="absolute inset-0 bg-[#0f172a] -z-20" />
        
        <div className="h-24 w-24 bg-slate-800/50 rounded-full flex items-center justify-center border border-white/10 shadow-xl shadow-blue-900/20">
          <Lock className="h-10 w-10 text-slate-400" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight text-white">{t("settings.signInTitle")}</h2>
          <p className="text-slate-400 max-w-md mx-auto">
            {t("settings.signInDesc")}
          </p>
        </div>
        <Link to="/auth">
          <Button size="lg" className="rounded-full px-8 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold border-0 shadow-lg shadow-orange-900/40">
            {t("nav.signin")} / {t("auth.getStarted")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8 relative pb-20">
      
      {/* ✅ BACKGROUND: COSMIC SHIVA THEME */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-6 text-white">{t("settings.title")}</h1>
        
        <Card className="bg-slate-800/40 backdrop-blur-md border border-white/10 shadow-xl">
          <CardHeader>
            <CardTitle className="text-white">{t("settings.profileTitle")}</CardTitle>
            <CardDescription className="text-slate-400">
              {t("settings.profileDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Name Field */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">{t("settings.label.name")}</Label>
                <div className="relative group">
                  <User className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all h-11" 
                    placeholder={t("settings.placeholder.name")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* DOB Field */}
                <div className="space-y-2">
                  <Label htmlFor="dob" className="text-slate-300">{t("settings.label.dob")}</Label>
                  <div className="relative group">
                    <Calendar className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                    <Input 
                      id="dob" 
                      name="dob" 
                      type="date"
                      value={formData.dob} 
                      onChange={handleChange} 
                      className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all h-11 [color-scheme:dark]" 
                    />
                  </div>
                </div>
                
                {/* Phone Field */}
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber" className="text-slate-300">{t("settings.label.phone")}</Label>
                  <div className="relative group">
                    <Phone className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                    <Input 
                      id="phoneNumber" 
                      name="phoneNumber" 
                      type="tel"
                      value={formData.phoneNumber} 
                      onChange={handleChange} 
                      placeholder={t("settings.placeholder.phone")}
                      className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all h-11" 
                    />
                  </div>
                </div>
              </div>

              {/* Address Field */}
              <div className="space-y-2">
                <Label htmlFor="address" className="text-slate-300">{t("settings.label.address")}</Label>
                <div className="relative group">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-500 group-focus-within:text-orange-400 transition-colors" />
                  <Input 
                    id="address" 
                    name="address" 
                    value={formData.address} 
                    onChange={handleChange} 
                    placeholder={t("settings.placeholder.address")}
                    className="pl-10 bg-slate-900/50 border-white/10 text-white placeholder:text-slate-600 focus:ring-orange-500/50 focus:border-orange-500/50 transition-all h-11" 
                  />
                </div>
              </div>

              {/* Save Button */}
              <div className="flex justify-end pt-4">
                <Button 
                  type="submit" 
                  disabled={isSaving}
                  className="bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border-0 shadow-lg shadow-orange-900/30 min-w-[120px]"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span> {t("settings.saving")}
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" /> {t("settings.save")}
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}