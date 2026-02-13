import { useState } from "react";
import { 
  Search, Package, Truck, PenTool, RefreshCcw, 
  HelpCircle, MessageCircle 
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Link } from "react-router";

const FAQ_CATEGORIES = [
  {
    id: "orders",
    icon: Package,
    title: "Orders & Billing",
    questions: [
      { q: "Can I change my order after placing it?", a: "Orders are sent to production immediately. You have a 1-hour window to cancel or edit via the 'Orders' page." },
      { q: "Where can I find my invoice?", a: "Invoices are emailed to you upon purchase and are also available in the Order Details page." },
      { q: "What payment methods do you accept?", a: "We accept Visa, Mastercard, American Express, UPI (India), and PayPal." }
    ]
  },
  {
    id: "shipping",
    icon: Truck,
    title: "Shipping & Delivery",
    questions: [
      { q: "How long does shipping take?", a: "Standard shipping takes 5-7 business days. Express shipping (2-3 days) is available for select locations." },
      { q: "How do I track my package?", a: "Go to 'Orders', select your order, and click the 'Track Package' button." }
    ]
  },
  {
    id: "design",
    icon: PenTool,
    title: "Design Tool",
    questions: [
      { q: "What file formats do you support?", a: "We support PNG and JPG. For best results, use transparent PNGs at 300 DPI." },
      { q: "Can I use copyrighted images?", a: "No. You must own the rights to any image you upload. We reserve the right to cancel orders violating IP laws." }
    ]
  },
  {
    id: "returns",
    icon: RefreshCcw,
    title: "Returns & Refunds",
    questions: [
      { q: "What is your return policy?", a: "Since items are custom printed, we only offer refunds for defective or damaged goods reported within 14 days." },
      { q: "My item arrived damaged.", a: "Please contact support immediately with photos of the damage. We will send a replacement free of charge." }
    ]
  }
];

export default function DashboardHelp() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredCategories = FAQ_CATEGORIES.map(cat => ({
    ...cat,
    questions: cat.questions.filter(q => 
      q.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
      q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0);

  return (
    <div className="space-y-8 pb-20 p-6 md:p-10 min-h-screen relative">
       {/* Background */}
       <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]"> 
         <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
         <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {/* Header */}
      <div className="flex flex-col gap-4">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <HelpCircle className="h-8 w-8 text-orange-500" />
          Help Center
        </h1>
        <p className="text-slate-400 max-w-2xl">
          Find answers to common questions or contact our support team for assistance.
        </p>
      </div>

      {/* Search Hero */}
      <div className="bg-slate-900/50 border border-white/10 rounded-2xl p-8 text-center space-y-6">
        <h2 className="text-2xl font-bold text-white">How can we help you today?</h2>
        <div className="max-w-xl mx-auto relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <Input 
            placeholder="Search for answers (e.g. 'shipping', 'refund')..." 
            className="pl-10 h-12 bg-slate-950 border-white/10 text-white placeholder:text-slate-500 rounded-full focus:ring-orange-500/50"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Categories Grid (Only show if not searching) */}
      {!searchQuery && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {FAQ_CATEGORIES.map((cat) => (
            <Card key={cat.id} className="bg-slate-800/40 border-white/5 hover:border-orange-500/30 transition-all cursor-pointer group">
              <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                <div className="h-12 w-12 rounded-full bg-slate-900 flex items-center justify-center border border-white/10 group-hover:bg-orange-500/10 group-hover:text-orange-500 transition-colors">
                  <cat.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-slate-200">{cat.title}</h3>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* FAQs */}
      <div className="space-y-6">
        <h2 className="text-xl font-bold text-white">Frequently Asked Questions</h2>
        <div className="grid gap-6">
          {filteredCategories.map((cat) => (
            <Card key={cat.id} className="bg-slate-800/20 border-white/5">
              <CardHeader>
                <CardTitle className="text-lg text-slate-200 flex items-center gap-2">
                  <cat.icon className="h-5 w-5 text-slate-500" />
                  {cat.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Accordion type="single" collapsible className="w-full">
                  {cat.questions.map((faq, i) => (
                    <AccordionItem key={i} value={`${cat.id}-${i}`} className="border-white/5">
                      <AccordionTrigger className="text-slate-300 hover:text-white hover:no-underline text-left">
                        {faq.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-slate-400 leading-relaxed">
                        {faq.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
          {filteredCategories.length === 0 && (
             <div className="text-center py-10 text-slate-500">
                No results found for "{searchQuery}"
             </div>
          )}
        </div>
      </div>

      {/* Still need help? */}
      <div className="bg-slate-900 border border-white/10 rounded-xl p-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2">
          <h3 className="text-xl font-bold text-white">Still need help?</h3>
          <p className="text-slate-400">Our support team is available Mon-Fri, 9am - 6pm EST.</p>
        </div>
        <div className="flex gap-4">
          <Link to="/dashboard/contact">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                Contact Support
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}