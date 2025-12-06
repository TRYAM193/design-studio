import { motion } from "framer-motion";
import { Save, User, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Link } from "react-router";
import { useTranslation } from "@/hooks/use-translation";

export default function DashboardSettings() {
  const { user, isAuthenticated } = useAuth();
  const updateProfile = useMutation(api.users.updateProfile);
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    phoneNumber: "",
    address: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        dob: user.dob || "",
        phoneNumber: user.phoneNumber || "",
        address: user.address || "",
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile(formData);
      toast.success(t("settings.success"));
    } catch (error) {
      toast.error(t("settings.error"));
      console.error(error);
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
                    placeholder="John Doe"
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
                    placeholder="+1 (555) 000-0000"
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
                  placeholder="123 Design St, Creative City"
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
