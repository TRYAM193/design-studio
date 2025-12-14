import { motion } from "framer-motion";
import { Save, User, Lock } from "lucide-react";
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
          // 1. Set default name from Auth if available
          const defaultName = user.displayName || "";
          
          // 2. Fetch extra details from Firestore
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
            // If no profile exists yet, just set the name from Auth
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
      // Save profile data to "users" collection with the User ID
      await setDoc(doc(db, "users", user.uid, 'Profile-Info'), formData, { merge: true });
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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6 text-center">
        <div className="h-20 w-20 bg-secondary/50 rounded-full flex items-center justify-center">
          <Lock className="h-10 w-10 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">{t("settings.signInTitle")}</h2>
          <p className="text-muted-foreground max-w-md mx-auto">
            {t("settings.signInDesc")}
          </p>
        </div>
        <Link to="/auth">
          <Button size="lg" className="rounded-full px-8">
            {t("nav.signin")} / {t("auth.getStarted")}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-bold tracking-tight mb-6">{t("settings.title")}</h1>
        
        <Card>
          <CardHeader>
            <CardTitle>{t("settings.profileTitle")}</CardTitle>
            <CardDescription>
              {t("settings.profileDesc")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name">{t("settings.label.name")}</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    id="name" 
                    name="name" 
                    value={formData.name} 
                    onChange={handleChange} 
                    className="pl-10" 
                    placeholder={t("settings.placeholder.name")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="dob">{t("settings.label.dob")}</Label>
                  <Input 
                    id="dob" 
                    name="dob" 
                    type="date"
                    value={formData.dob} 
                    onChange={handleChange} 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">{t("settings.label.phone")}</Label>
                  <Input 
                    id="phoneNumber" 
                    name="phoneNumber" 
                    type="tel"
                    value={formData.phoneNumber} 
                    onChange={handleChange} 
                    placeholder={t("settings.placeholder.phone")}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">{t("settings.label.address")}</Label>
                <Input 
                  id="address" 
                  name="address" 
                  value={formData.address} 
                  onChange={handleChange} 
                  placeholder={t("settings.placeholder.address")}
                />
              </div>

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSaving}>
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