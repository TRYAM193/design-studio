import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, Save, User, Smartphone, MapPin, 
  AlertTriangle, CheckCircle, Lock, LogIn 
} from "lucide-react";
import { toast } from "sonner";
import { PhoneVerificationModal } from "@/components/PhoneVerificationModal";
import { Country, State, City } from 'country-state-city';
import { useNavigate } from "react-router";

// 🔒 STRICT CONFIGURATION: ALLOWED COUNTRIES ONLY
const ALLOWED_ISO_CODES = ["IN", "US", "GB", "CA"];

// 🌍 PHONE CODES (Keys match ISO Codes for easy lookup)
const PHONE_CODES: Record<string, { label: string, phone: string, flag: string }> = {
  "IN": { label: "India", phone: "+91", flag: "🇮🇳" },
  "US": { label: "United States", phone: "+1", flag: "🇺🇸" },
  "GB": { label: "United Kingdom", phone: "+44", flag: "🇬🇧" },
  "CA": { label: "Canada", phone: "+1", flag: "🇨🇦" },
  "DEFAULT": { label: "United States", phone: "+1", flag: "🇺🇸" }
};

export default function DashboardSettings() {
  const { user } = useAuth();
  const navigate = useNavigate(); // ✅ Added for redirecting guests
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Form State
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneCode, setPhoneCode] = useState("+91"); 
  const [phoneBody, setPhoneBody] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showVerifyModal, setShowVerifyModal] = useState(false);

  // Address State
  const [address, setAddress] = useState({
    line1: "", line2: "", city: "", state: "", zip: "", country: "India"
  });

  // Helper State for Dropdowns
  const [selectedCountryIso, setSelectedCountryIso] = useState("IN");
  const [selectedStateIso, setSelectedStateIso] = useState("");

  // 1. DATA INITIALIZATION
  useEffect(() => {
    async function fetchProfile() {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        
        // IP DETECTION
        let detectedIso = "US"; 
        try {
          const res = await fetch("https://ipapi.co/json/");
          const data = await res.json();
          if (ALLOWED_ISO_CODES.includes(data.country_code)) {
            detectedIso = data.country_code;
          }
        } catch (e) { console.warn("IP Detect failed, using fallback"); }

        if (snap.exists()) {
          const data = snap.data();
          setFullName(data.displayName || data.fullName || "");
          setEmail(data.email || user.email || "");
          setIsPhoneVerified(data.phoneVerified || false);

          // Handle Phone
          if (data.phoneNumber) {
            const known = Object.values(PHONE_CODES).find(c => data.phoneNumber.startsWith(c.phone));
            if (known) {
              setPhoneCode(known.phone);
              setPhoneBody(data.phoneNumber.replace(known.phone, ""));
            } else {
              setPhoneBody(data.phoneNumber);
            }
          } else {
             const phoneConfig = PHONE_CODES[detectedIso] || PHONE_CODES["DEFAULT"];
             setPhoneCode(phoneConfig.phone);
          }

          // Handle Address
          if (data.shippingAddress && data.shippingAddress.country) {
            setAddress(data.shippingAddress);
            
            const countries = Country.getAllCountries();
            const foundCountry = countries.find(c => c.name === data.shippingAddress.country);
            
            if (foundCountry && ALLOWED_ISO_CODES.includes(foundCountry.isoCode)) {
               setSelectedCountryIso(foundCountry.isoCode);
               
               const states = State.getStatesOfCountry(foundCountry.isoCode);
               const foundState = states.find(s => s.name === data.shippingAddress.state);
               if (foundState) setSelectedStateIso(foundState.isoCode);
            } else {
               applyCountryFromIso(detectedIso);
            }
          } else {
            applyCountryFromIso(detectedIso);
          }
        } else {
          // New User
          applyCountryFromIso(detectedIso);
          const phoneConfig = PHONE_CODES[detectedIso] || PHONE_CODES["DEFAULT"];
          setPhoneCode(phoneConfig.phone);
        }
      } catch (e) { console.error(e); } finally { setLoading(false); }
    }
    fetchProfile();
  }, [user]);

  const applyCountryFromIso = (isoCode: string) => {
    const country = Country.getCountryByCode(isoCode);
    if (country) {
      setSelectedCountryIso(isoCode);
      setAddress(prev => ({ ...prev, country: country.name, state: "", city: "" }));
    }
  };

  // Handlers
  const handleStateChange = (isoCode: string) => {
    const state = State.getStateByCodeAndCountry(isoCode, selectedCountryIso);
    setSelectedStateIso(isoCode);
    setAddress(prev => ({ ...prev, state: state?.name || "", city: "" }));
  };

  const handleCityChange = (cityName: string) => {
    setAddress(prev => ({ ...prev, city: cityName }));
  };

  const handleSave = async () => {
    if (!user) return;

    // 🛑 1. ANONYMOUS USER BLOCK
    if (user.isAnonymous) {
      toast.error("Guest Account Detected", {
        description: "You must sign in to save your profile details.",
        action: {
          label: "Sign In",
          onClick: () => navigate("/auth?mode=signup") // Direct to auth page
        },
        duration: 5000, // Keep visible longer
      });
      return;
    }

    setSaving(true);
    try {
      const fullPhone = phoneBody ? `${phoneCode}${phoneBody}` : "";
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        fullName,
        phoneNumber: fullPhone,
        phoneVerified: isPhoneVerified,
        shippingAddress: address,
        updatedAt: new Date(),
      }, { merge: true });
      toast.success("Profile saved successfully");
    } catch (error) {
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  // MEMOIZED DATA
  const allowedCountries = useMemo(() => {
    return Country.getAllCountries().filter(c => ALLOWED_ISO_CODES.includes(c.isoCode));
  }, []);
  
  const states = useMemo(() => selectedCountryIso ? State.getStatesOfCountry(selectedCountryIso) : [], [selectedCountryIso]);
  
  const cities = useMemo(() => {
    if (!selectedCountryIso || !selectedStateIso) return [];
    return City.getCitiesOfState(selectedCountryIso, selectedStateIso);
  }, [selectedCountryIso, selectedStateIso]);

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
        <Button 
          onClick={handleSave} 
          disabled={saving} 
          className="px-8 h-12 rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border-0 shadow-lg shadow-orange-900/20"
        >
          {saving ? (
            <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Saving...</>
          ) : user?.isAnonymous ? (
            <><LogIn className="mr-2 h-5 w-5" /> Sign In to Save</>
          ) : (
            <><Save className="mr-2 h-5 w-5" /> Save Changes</>
          )}
        </Button>
      </div>

      {/* ⚠️ GUEST WARNING BANNER */}
      {user?.isAnonymous && (
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-4 flex items-start gap-4">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
          </div>
          <div>
            <h4 className="text-orange-400 font-bold">You are browsing as a Guest</h4>
            <p className="text-sm text-orange-300/80 mt-1">
              Your details will not be saved permanently. Please <button onClick={() => navigate("/auth")} className="underline hover:text-white font-bold">create an account</button> to secure your data.
            </p>
          </div>
        </div>
      )}

      <div className={`grid gap-6 ${user?.isAnonymous ? 'opacity-75' : ''}`}>

        {/* PERSONAL DETAILS */}
        <Card className="bg-slate-900/40 border-white/5 backdrop-blur-sm">
          <CardHeader><CardTitle className="text-white flex items-center gap-2 text-lg"><User className="h-5 w-5 text-blue-400" /> Personal Details</CardTitle></CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label className={labelStyle}>Full Name</Label>
              <Input value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputStyle} />
            </div>
            <div className="grid gap-2">
              <Label className={labelStyle}>Email Address</Label>
              <Input value={email} disabled className="bg-slate-950/30 border-white/5 text-slate-500 cursor-not-allowed" />
            </div>
          </CardContent>
        </Card>

        {/* PHONE NUMBER */}
        <Card className="bg-slate-900/40 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg"><Smartphone className="h-5 w-5 text-green-400" /> Phone Number</CardTitle>
            <CardDescription className="text-slate-500">For secure login and delivery updates.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between items-center mb-2">
                <Label className={labelStyle}>Contact Number</Label>
                {phoneBody.length > 5 && (
                  isPhoneVerified ? 
                  <Badge variant="outline" className="bg-green-500/10 text-green-400 border-green-500/20 px-2 py-0.5 h-6"><CheckCircle className="h-3 w-3 mr-1" /> Verified</Badge> : 
                  <Badge variant="destructive" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 px-2 py-0.5 h-6"><AlertTriangle className="h-3 w-3 mr-1" /> Unverified</Badge>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Select value={phoneCode} onValueChange={setPhoneCode}>
                  <SelectTrigger className={`w-full sm:w-[120px] ${inputStyle}`}>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-[300px]">
                    {Object.entries(PHONE_CODES).map(([key, val]) => (
                      key !== "DEFAULT" && (
                        <SelectItem key={key} value={val.phone} className="focus:bg-slate-800 cursor-pointer">
                          <span className="mr-2">{val.flag}</span> <span className="font-mono">{val.phone}</span>
                        </SelectItem>
                      )
                    ))}
                  </SelectContent>
                </Select>

                <Input placeholder="98765 43210" value={phoneBody} onChange={(e) => { setPhoneBody(e.target.value); setIsPhoneVerified(false); }} className={`flex-1 ${inputStyle}`} type="tel" />
                {!isPhoneVerified && phoneBody.length > 5 && <Button onClick={() => setShowVerifyModal(true)} className="bg-yellow-600 hover:bg-yellow-700 text-white">Verify</Button>}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SHIPPING ADDRESS */}
        <Card className="bg-slate-900/40 border-white/5 backdrop-blur-sm">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2 text-lg"><MapPin className="h-5 w-5 text-orange-400" /> Shipping Address</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-2">
              <Label className={labelStyle}>Address Line 1</Label>
              <Input placeholder="Street, House No" value={address.line1} onChange={(e) => setAddress({ ...address, line1: e.target.value })} className={inputStyle} />
            </div>
            <div className="grid gap-2">
              <Label className={labelStyle}>Address Line 2 <span className="text-slate-600 ml-1 text-[10px] normal-case">(OPTIONAL)</span></Label>
              <Input placeholder="Apartment, Suite" value={address.line2} onChange={(e) => setAddress({ ...address, line2: e.target.value })} className={inputStyle} />
            </div>

            {/* LOCKED COUNTRY & STATE */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label className={`${labelStyle} flex items-center gap-2`}>
                   Country <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-slate-800 text-slate-400 ml-auto border-white/10"><Lock className="w-2 h-2 mr-1"/> Auto-Detected</Badge>
                </Label>
                <Select value={selectedCountryIso} disabled>
                  <SelectTrigger className={`${inputStyle} opacity-100 bg-slate-900/50 cursor-not-allowed`}>
                    <SelectValue placeholder="Select Country" />
                  </SelectTrigger>
                  <SelectContent>
                    {allowedCountries.map((country) => (
                      <SelectItem key={country.isoCode} value={country.isoCode}>
                        <span className="mr-2">{country.flag}</span> {country.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label className={labelStyle}>State / Province</Label>
                <Select value={selectedStateIso} onValueChange={handleStateChange} disabled={!selectedCountryIso}>
                  <SelectTrigger className={inputStyle}><SelectValue placeholder="Select State" /></SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-[300px]">
                    {states.map((state) => (
                      <SelectItem key={state.isoCode} value={state.isoCode} className="focus:bg-slate-800 cursor-pointer">{state.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* CITY & ZIP */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="grid gap-2">
                <Label className={labelStyle}>City</Label>
                <Select 
                  value={address.city} 
                  onValueChange={handleCityChange} 
                  disabled={!selectedStateIso || cities.length === 0}
                >
                  <SelectTrigger className={inputStyle}>
                    <SelectValue placeholder={!selectedStateIso ? "Select State First" : cities.length === 0 ? "No cities found" : "Select City"} />
                  </SelectTrigger>
                  <SelectContent className="bg-slate-900 border-slate-700 text-white max-h-[300px]">
                    {cities.map((city) => (
                      <SelectItem key={city.name} value={city.name} className="focus:bg-slate-800 cursor-pointer">
                        {city.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label className={labelStyle}>Zip / Pincode</Label>
                <Input value={address.zip} onChange={(e) => setAddress({ ...address, zip: e.target.value })} className={inputStyle} />
              </div>
            </div>

          </CardContent>
        </Card>

        <div className="flex justify-end pt-4">
          <Button 
            onClick={handleSave} 
            disabled={saving} 
            className="px-8 h-12 rounded-full bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white border-0 shadow-lg shadow-orange-900/20"
          >
            {saving ? (
              <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Saving...</>
            ) : user?.isAnonymous ? (
              <><LogIn className="mr-2 h-5 w-5" /> Sign In to Save</>
            ) : (
              <><Save className="mr-2 h-5 w-5" /> Save Changes</>
            )}
          </Button>
        </div>
      </div>

      <PhoneVerificationModal isOpen={showVerifyModal} onClose={() => setShowVerifyModal(false)} onVerified={() => { setIsPhoneVerified(true); }} phoneNumber={`${phoneCode}${phoneBody}`} />
    </div>
  );
}