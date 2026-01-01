import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, CheckCircle2, Zap, Palette, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function Landing() {
  const navigate = useNavigate();

  return (
    // ✅ NEW GRADIENT BACKGROUND CONTAINER
    <div className="min-h-screen relative overflow-hidden bg-slate-50 selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* 1. BACKGROUND GRADIENT BLOBS (The "Attractive" Part) */}
      <div className="fixed inset-0 -z-10 w-full h-full">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-indigo-400/20 blur-[120px] animate-pulse" />
         <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-purple-400/20 blur-[120px] animate-pulse delay-1000" />
         <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-pink-400/20 blur-[120px] animate-pulse delay-2000" />
         {/* Subtle Grid Overlay for Texture */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* 2. NAVBAR */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">T</div>
          <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
            TRYAM
          </span>
        </div>
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate("/auth")}>Login</Button>
          <Button 
            onClick={() => navigate("/store")} 
            className="bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200"
          >
            Start Shopping
          </Button>
        </div>
      </nav>

      {/* 3. HERO SECTION */}
      <main className="max-w-7xl mx-auto px-6 pt-20 pb-32 text-center relative z-10">
        
        {/* Badge */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-indigo-100 shadow-sm mb-8"
        >
          <span className="flex h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></span>
          <span className="text-xs font-semibold text-slate-600">New Collection Live</span>
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-5xl md:text-7xl font-extrabold tracking-tight text-slate-900 mb-6"
        >
          Wear Your <br className="hidden md:block"/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600">
            Imagination
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Design custom apparel in minutes with our AI-powered studio. 
          Premium quality prints, delivered to your doorstep.
        </motion.p>

        {/* CTA Buttons */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          <Button 
            size="lg" 
            onClick={() => navigate("/design")} 
            className="h-14 px-8 text-lg rounded-full bg-slate-900 hover:bg-slate-800 shadow-xl hover:scale-105 transition-all"
          >
            <Sparkles className="w-5 h-5 mr-2 text-yellow-400" />
            Create Design
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            onClick={() => navigate("/store")} 
            className="h-14 px-8 text-lg rounded-full border-2 hover:bg-white/50 backdrop-blur-sm transition-all"
          >
            <ShoppingBag className="w-5 h-5 mr-2" />
            Browse Store
          </Button>
        </motion.div>

        {/* 4. FEATURE GRID */}
        <div className="grid md:grid-cols-3 gap-8 mt-24 text-left">
          {[
            { 
              icon: <Zap className="w-6 h-6 text-yellow-500" />, 
              title: "Instant Design", 
              desc: "Drag, drop, and edit with our powerful browser-based tools." 
            },
            { 
              icon: <Palette className="w-6 h-6 text-pink-500" />, 
              title: "Premium Quality", 
              desc: "Printed on 100% cotton, 240GSM heavy-weight fabric." 
            },
            { 
              icon: <CheckCircle2 className="w-6 h-6 text-green-500" />, 
              title: "Fast Delivery", 
              desc: "Ships within 48 hours. Free shipping on prepaid orders." 
            }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 + 0.5 }}
              className="p-6 rounded-2xl bg-white/60 backdrop-blur-sm border border-white/20 shadow-lg hover:shadow-xl transition-all"
            >
              <div className="w-12 h-12 rounded-xl bg-white shadow-sm flex items-center justify-center mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{feature.title}</h3>
              <p className="text-slate-500">{feature.desc}</p>
            </motion.div>
          ))}
        </div>

      </main>
    </div>
  );
}