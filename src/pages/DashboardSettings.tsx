import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Loader2, Lock } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "react-router";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTranslation } from "@/hooks/use-translation";

export default function DashboardSettings() {
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const user = useQuery(api.users.currentUser);
  const updateUser = useMutation(api.users.update);
  
  const [formData, setFormData] = useState({
    name: "",
    dob: "",
    address: "",
    phoneNumber: "",
    language: "en",
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        dob: user.dob || "",
        address: user.address || "",
        phoneNumber: user.phoneNumber || "",
        language: user.language || "en",
      });
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateUser(formData);
      toast.success(t("settings.success"));
    } catch (error) {
      console.error(error);
      toast.error(t("settings.error"));
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

  if (!user) return null;

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
            <CardDescription>{t("settings.profileDesc")}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">{t("settings.label.name")}</Label>
                <Input 
                  id="name" 
                  value={formData.name} 
                  onChange={(e) => setFormData({...formData, name: e.target.value})} 
                  placeholder="John Doe"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dob">{t("settings.label.dob")}</Label>
                <Input 
                  id="dob" 
                  type="date"
                  value={formData.dob} 
                  onChange={(e) => setFormData({...formData, dob: e.target.value})} 
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">{t("settings.label.phone")}</Label>
                <Input 
                  id="phone" 
                  type="tel"
                  value={formData.phoneNumber} 
                  onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})} 
                  placeholder="+1 (555) 000-0000"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">{t("settings.label.address")}</Label>
                <Input 
                  id="address" 
                  value={formData.address} 
                  onChange={(e) => setFormData({...formData, address: e.target.value})} 
                  placeholder="123 Design St, Creative City"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="language">{t("settings.label.language")}</Label>
                <Select 
                  value={formData.language} 
                  onValueChange={(value) => setFormData({...formData, language: value})}
                >
                  <SelectTrigger id="language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="zh">Chinese</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  {t("settings.languageDesc")}
                </p>
              </div>

              <div className="pt-4">
                <Button type="submit" disabled={isSaving}>
                  {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {isSaving ? t("settings.saving") : t("settings.save")}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}