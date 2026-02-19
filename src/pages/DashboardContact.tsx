import React, { useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { functions } from '@/firebase';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, Send, Mail, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';

export default function DashboardContact() {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    subject: '',
    message: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.message) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    try {
      // Call the Firebase Function we just created
      const sendContactEmail = httpsCallable(functions, 'sendContactEmail');
      await sendContactEmail(formData);

      toast.success("Message Sent!", {
        description: "We've received your message and will reply shortly."
      });

      // Clear the form (but keep name/email)
      setFormData(prev => ({ ...prev, subject: '', message: '' }));
      
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-in fade-in zoom-in-95 duration-300">
      
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Contact Support</h1>
        <p className="text-slate-400">Have a question about your order, design, or account? Send us a message and we'll get back to you within 24 hours.</p>
      </div>

      <div className="bg-slate-800/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 sm:p-8 shadow-xl">
        <form onSubmit={handleSubmit} className="space-y-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <User size={14} className="text-orange-500" /> Name
              </Label>
              <Input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="John Doe"
                className="bg-slate-900/50 border-white/10 text-white focus:border-orange-500"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Mail size={14} className="text-orange-500" /> Email Address
              </Label>
              <Input 
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="john@example.com"
                className="bg-slate-900/50 border-white/10 text-white focus:border-orange-500"
                required
              />
            </div>
          </div>

          {/* Subject */}
          <div className="space-y-2">
            <Label className="text-slate-300 flex items-center gap-2">
              <MessageSquare size={14} className="text-orange-500" /> Subject
            </Label>
            <Input 
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="e.g. Question about Order #ORD123"
              className="bg-slate-900/50 border-white/10 text-white focus:border-orange-500"
            />
          </div>

          {/* Message */}
          <div className="space-y-2">
            <Label className="text-slate-300">Your Message</Label>
            <Textarea 
              name="message"
              value={formData.message}
              onChange={handleChange}
              placeholder="How can we help you today?"
              className="bg-slate-900/50 border-white/10 text-white focus:border-orange-500 min-h-[150px] resize-y"
              required
            />
          </div>

          {/* Submit Button */}
          <Button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full sm:w-auto px-8 py-6 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold rounded-xl shadow-lg shadow-orange-900/20 transition-all hover:scale-[1.02]"
          >
            {isSubmitting ? (
              <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Sending...</>
            ) : (
              <><Send className="mr-2 h-5 w-5" /> Send Message</>
            )}
          </Button>

        </form>
      </div>
    </div>
  );
}