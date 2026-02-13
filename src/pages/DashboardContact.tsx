import { useState } from "react";
import { Mail, MapPin, Phone, Send, Loader2, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

export default function DashboardContact() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);

  // Pre-fill form if user is logged in
  const [formData, setFormData] = useState({
    name: user?.displayName || "",
    email: user?.email || "",
    subject: "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    setLoading(false);
    toast.success("Message sent!", {
      description: "Our support team will respond shortly."
    });
    setFormData(prev => ({ ...prev, subject: "", message: "" }));
  };

  return (
    <div className="space-y-8 pb-20 p-6 md:p-10 min-h-screen relative">
       {/* Background */}
       <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <MessageSquare className="h-8 w-8 text-blue-500" />
          Contact Support
        </h1>
        <p className="text-slate-400">
          Got a technical issue or feedback? We're here to help.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        
        {/* Contact Info Sidebar */}
        <div className="space-y-6">
          <Card className="bg-slate-800/40 border-white/10 h-full">
            <CardHeader>
              <CardTitle className="text-white">Get in touch</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Email</h4>
                  <p className="text-sm text-slate-400 mb-1">For general inquiries</p>
                  <a href="mailto:support@tryam.com" className="text-sm text-blue-400 hover:text-blue-300">support@tryam.com</a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0">
                  <Phone className="h-5 w-5 text-orange-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Phone</h4>
                  <p className="text-sm text-slate-400 mb-1">Mon-Fri from 8am to 5pm</p>
                  <a href="tel:+919876543210" className="text-sm text-orange-400 hover:text-orange-300">+91 98765 43210</a>
                </div>
              </div>

              <div className="flex gap-4">
                <div className="h-10 w-10 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <h4 className="font-bold text-slate-200">Office</h4>
                  <p className="text-sm text-slate-400">
                    123 Innovation Hub,<br />
                    Bengaluru, Karnataka 560001
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contact Form */}
        <div className="md:col-span-2">
          <Card className="bg-slate-900 border-white/10">
            <CardContent className="p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-slate-300">Name</Label>
                    <Input 
                        id="name" 
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        className="bg-slate-950 border-white/10 text-white" 
                        required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-slate-300">Email</Label>
                    <Input 
                        id="email" 
                        type="email" 
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        className="bg-slate-950 border-white/10 text-white" 
                        required 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject" className="text-slate-300">Subject</Label>
                  <Input 
                    id="subject" 
                    placeholder="How can we help?" 
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                    className="bg-slate-950 border-white/10 text-white" 
                    required 
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message" className="text-slate-300">Message</Label>
                  <Textarea 
                    id="message" 
                    placeholder="Tell us more about your issue..." 
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                    className="min-h-[150px] bg-slate-950 border-white/10 text-white resize-none" 
                    required 
                  />
                </div>

                <Button type="submit" className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-medium h-12" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" /> Send Message
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}