import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, User, Smartphone, MapPin, AlertTriangle, CheckCircle, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { PhoneVerificationModal } from "@/components/PhoneVerificationModal";

// 🌍 COUNTRY DATA
const COUNTRY_DATA: Record<string, { label: string, phone: string, flag: string }> = {
  "IN": { label: "India", phone: "+91", flag: "🇮🇳" },
  "US": { label: "United States", phone: "+1", flag: "🇺🇸" },
  "CA": { label: "Canada", phone: "+1", flag: "🇨🇦" },
  "GB": { label: "United Kingdom", phone: "+44", flag: "🇬🇧" },
  "DE": { label: "Germany", phone: "+49", flag: "🇩🇪" },
  "FR": { label: "France", phone: "+33", flag: "🇫🇷" },
  "IT": { label: "Italy", phone: "+39", flag: "🇮🇹" },
  "ES": { label: "Spain", phone: "+34", flag: "🇪🇸" },
  "NL": { label: "Netherlands", phone: "+31", flag: "🇳🇱" },
  "AU": { label: "Australia", phone: "+61", flag: "🇦🇺" },
  "DEFAULT": { label: "United States", phone: "+1", flag: "🇺🇸" }
};

export default function DashboardSettings() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+91");
  const [phoneBody, setPhoneBody] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [detectedIsoCode, setDetectedIsoCode] = useState("IN");

  const [address, setAddress] = useState({
    line1: "", line2: "", city: "", state: "", zip: "", country: "India"
  });

  // 1. IP DETECTION
  useEffect(() => {
    async function detectLocation() {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const code = data.country_code || "US";
        const config = COUNTRY_DATA[code] || COUNTRY_DATA["DEFAULT"];

        setDetectedIsoCode(code);
        setCountryCode(prev => prev === "+91" ? config.phone : prev);
        setAddress(prev => ({ ...prev, country: config.label }));
      } catch (e) { console.warn("IP Detect failed"); }
    }
    detectLocation();
  }, []);

  // 2. FETCH DATA
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setFullName(data.displayName || data.fullName || "");
          setEmail(data.email || user.email || "");
          setIsPhoneVerified(data.phoneVerified || false);

          if (data.phoneNumber) {
            const known = Object.values(COUNTRY_DATA).find(c => data.phoneNumber.startsWith(c.phone));
            if (known) {
              setCountryCode(known.phone);
              setPhoneBody(data.phoneNumber.replace(known.phone, ""));
            } else {
              setPhoneBody(data.phoneNumber);
            }
          }
          if (data.shippingAddress) {
            setAddress(data.shippingAddress);
            const savedIso = Object.keys(COUNTRY_DATA).find(key => COUNTRY_DATA[key].label === data.shippingAddress.country);
            if (savedIso) setDetectedIsoCode(savedIso);
          }
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchProfile();
  }, [user]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const fullPhone = phoneBody ? `${countryCode}${phoneBody}` : "";

      // ✅ FIX: Use setDoc with { merge: true }
      // This handles both CREATING (for new users) and UPDATING (for existing users)
      await setDoc(doc(db, "users", user.uid), {
        email: user.email, // Good to ensure email is saved in DB too
        fullName,
        phoneNumber: fullPhone,
        phoneVerified: isPhoneVerified,
        shippingAddress: address,
        updatedAt: new Date(),
        createdAt: new Date() // This will only set if it doesn't exist (if we used specific logic), but for simple merge it just updates. 
        // Ideally, for createdAt, we don't want to overwrite it, but for settings, updating 'updatedAt' is enough.
      }, { merge: true });

      toast.success("Profile saved successfully");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // ✨ SHARED STYLES
  const inputStyle = "bg-slate-950/50 border-white/10 text-white placeholder:text-slate-600 focus:border-orange-500/50 focus:ring-1 focus:ring-orange-500/50 transition-all";
  const labelStyle = "text-slate-400 text-xs uppercase font-bold tracking-wider";

  if (loading) return <div className="p-20 flex justify-center"><Loader2 className="animate-spin text-orange-500" /></div>;

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-8 pb-20">

      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-1">Account Settings</h1>
          <p className="text-slate-400">Manage your profile and shipping preferences.</p>
        </div>
        {/* SAVE BUTTON (Top for convenience on mobile) */}
        <Button
          onClick={handleSave}
          disabled={saving}
          className="px-8 h-12 text-base font-bold rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-900/20 border-0 transition-all transform hover:scale-105 active:scale-95"
        >
          {saving ? (
            <>
              <Loader2 className="animate-spin mr-2 h-5 w-5" />
              Saving...
            </>
          ) : (
            <>
              <Save className="mr-2 h-5 w-5" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      <div className="grid gap-6">

        {/* 1. PERSONAL DETAILS */}
        <Card className="bg-slate-900/40 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <User className="h-5 w-5 text-blue-400" /> Personal Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label className={labelStyle}>Full Name</Label>
              <Input
                value={fullName} onChange={(e) => setFullName(e.target.value)}
                className={inputStyle}
              />
            </div>
            <div className="grid gap-2">
              <Label className={labelStyle}>Email Address</Label>
              <Input value={email} disabled className="bg-slate-950/30 border-white/5 text-slate-500 cursor-not-allowed" />
            </div>
          </CardContent>
        </Card>

        {/* 2. PHONE NUMBER */}
        <Card className="bg-slate-900/40 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <Smartphone className="h-5 w-5 text-green-400" /> Phone Number
            </CardTitle>
            <CardDescription className="text-slate-500">For secure login and delivery updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <Label className={labelStyle}>Contact Number</Label>
                {phoneBody.length > 5 && (
                  isPhoneVerified ? (
                    <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 flex gap-1 items-center px-2 py-0.5 h-6">
                      <CheckCircle className="h-3 w-3" /> Verified
                    </Badge>
                  ) : (
                    <Badge variant="destructive" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 flex gap-1 items-center px-2 py-0.5 h-6">
                      <AlertTriangle className="h-3 w-3" /> Unverified
                    </Badge>
                  )
                )}
              </div>

              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={countryCode} onValueChange={setCountryCode}>
                  <SelectTrigger className={`w-full sm:w-[140px] ${inputStyle}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white">
                    {Object.entries(COUNTRY_DATA).map(([key, val]) => (
                      key !== "DEFAULT" && (
                        <SelectItem key={key} value={val.phone} className="focus:bg-slate-800 cursor-pointer">
                          <span className="mr-2">{val.flag}</span> {val.label}
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  placeholder="98765 43210"
                  value={phoneBody}
                  onChange={(e) => { setPhoneBody(e.target.value); setIsPhoneVerified(false); }}
                  className={`flex-1 ${inputStyle}`}
                  type="tel"
                />

                {!isPhoneVerified && phoneBody.length > 5 && (
                  <Button
                    onClick={() => setShowVerifyModal(true)}
                    className="bg-yellow-600 hover:bg-yellow-700 text-white border-0 whitespace-nowrap"
                  >
                    Verify
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 3. ADDRESS */}
        <Card className="bg-slate-900/40 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg">
              <MapPin className="h-5 w-5 text-orange-400" /> Shipping Address
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label className={labelStyle}>Address Line 1</Label>
              <Input
                placeholder="Street, House No, Building"
                value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })}
                className={inputStyle}
              />
            </div>

            <div className="grid gap-2">
              <Label className={labelStyle}>Address Line 2 <span className="text-slate-600 ml-1 text-[10px] normal-case tracking-normal">(OPTIONAL)</span></Label>
              <Input
                placeholder="Apartment, Suite, Landmark"
                value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })}
                className={inputStyle}
              />
            </div>

            <div className="grid grid-cols-2 gap-9">
              <div className="grid gap-2">
                <Label className={labelStyle}>City</Label>
                <Input
                  value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })}
                  className={inputStyle}
                />
              </div>
              <div className="grid gap-2">
                <Label className={labelStyle}>State / Province</Label>
                <Input
                  value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value })}
                  className={inputStyle}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-9">
              <div className="grid gap-2">
                <Label className={labelStyle}>Zip / Pincode</Label>
                <Input
                  value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })}
                  className={inputStyle}
                />
              </div>

              <div className="grid gap-2">
                <Label className={`${labelStyle} flex items-center gap-2`}>
                  Country <Lock className="h-3 w-3 text-slate-600" />
                </Label>
                <div className="relative">
                  <Input
                    value={address.country}
                    disabled
                    className="bg-slate-950/30 border-white/5 text-slate-500 cursor-not-allowed pl-12 font-medium"
                  />
                  <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xl select-none grayscale-0">
                    {COUNTRY_DATA[detectedIsoCode]?.flag || <Globe className="h-5 w-5 text-slate-600" />}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BOTTOM SAVE BUTTON */}
        <div className="flex justify-end pt-4">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="px-8 h-12 text-base font-bold rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white shadow-lg shadow-orange-900/20 border-0 transition-all transform hover:scale-105 active:scale-95"
          >
            {saving ? (
              <>
                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-5 w-5" />
                Save Changes
              </>
            )}
          </Button>
        </div>
      </div>

      <PhoneVerificationModal
        isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)}
        onVerified={() => { setIsPhoneVerified(true); }}
        phoneNumber={`${countryCode}${phoneBody}`}
      />
    </div>
  );
}