import { motion } from "framer-motion";
import { ArrowRight, Layers, Sparkles, Wand2 } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

export default function Landing() {
  const { t } = useTranslation();

  return (
    // 1. Remove 'bg-background' so the gradient shows through
    // 2. Add 'relative' and 'overflow-hidden' to contain the background elements
    <div className="min-h-screen relative overflow-hidden flex flex-col font-sans selection:bg-slate-200 selection:text-black">
      
      {/* ✅ NEW: BLACK & GREY GRADIENT BACKGROUND LAYERS */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-slate-50">
         {/* Blob 1: Deep Charcoal (Top Left) */}
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-900/10 blur-[120px] animate-pulse" />
         {/* Blob 2: Silver/Light Grey (Top Right) */}
         <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-400/20 blur-[120px] animate-pulse delay-1000" />
         {/* Blob 3: Soft Grey (Bottom Left) */}
         <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-gray-300/30 blur-[120px] animate-pulse delay-2000" />
         
         {/* Texture Overlay for Premium Feel */}
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/70 backdrop-blur-xl">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
           {/* Logo */}
           <div className="flex items-center gap-2">
              <img 
                src="https://harmless-tapir-303.convex.cloud/api/storage/1a8853ff-ebac-480a-b68b-ffe2343bbf07" 
                alt="TRYAM Logo" 
                className="h-10 w-10 object-cover rounded-full shadow-sm grayscale hover:grayscale-0 transition-all"
              />
              <span className="font-bold text-xl tracking-tight text-slate-900">TRYAM</span>
           </div>

           {/* Desktop Navigation */}
           <nav className="hidden md:flex items-center gap-8">
            <Link to='/store' className="text-sm font-medium text-slate-500 hover:text-black transition-colors">Catalog</Link>
             <Link to="/dashboard/templates" className="text-sm font-medium text-slate-500 hover:text-black transition-colors">
               {t("nav.templates")}
             </Link>
             <Link to="/dashboard/products" className="text-sm font-medium text-slate-500 hover:text-black transition-colors">
               {t("nav.products")}
             </Link>
             <Link to="/dashboard/pricing" className="text-sm font-medium text-slate-500 hover:text-black transition-colors">
               {t("nav.pricing")}
             </Link>
           </nav>

           {/* Nav/Actions */}
           <div className="flex items-center gap-4">
             <Link to="/auth">
               <Button variant="ghost" className="text-slate-600 hover:text-black hover:bg-slate-100">{t("nav.signin")}</Button>
             </Link>
             <Link to="/dashboard">
               {/* Updated Button Style: Black & White */}
               <Button className="bg-black hover:bg-zinc-800 text-white shadow-lg shadow-zinc-500/20 border-0">
                  {t("auth.getStarted")}
               </Button>
             </Link>
           </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="pt-20 pb-32 px-4">
          <div className="container mx-auto max-w-6xl text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-slate-200 bg-white/60 backdrop-blur-md text-sm font-medium text-slate-600 shadow-sm"
            >
              <Sparkles className="h-3.5 w-3.5 text-black" />
              {t("landing.hero.badge")}
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-tight text-slate-900"
            >
              {t("landing.hero.titleStart")} <br />
              {/* Highlight text is now a dark charcoal gradient */}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-black to-slate-600">
                {t("landing.hero.titleEnd")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-slate-500 max-w-2xl mx-auto"
            >
              {t("landing.hero.desc")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center pt-4"
            >
              <Link to="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full bg-black hover:bg-zinc-800 text-white shadow-xl shadow-zinc-900/20 hover:scale-105 transition-transform">
                  {t("landing.hero.cta")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </motion.div>

            {/* Hero Visual */}
             <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-16 rounded-2xl border border-white/60 bg-white/40 backdrop-blur-sm aspect-[16/9] max-w-5xl mx-auto shadow-2xl shadow-slate-200 overflow-hidden relative ring-1 ring-white/60"
            >
               <img 
                 src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop" 
                 alt="T-Shirt Mockup" 
                 className="w-full h-full object-cover grayscale-[20%] hover:grayscale-0 transition-all duration-1000"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-white/30 to-transparent" />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900">{t("landing.features.title")}</h2>
              <p className="text-lg text-slate-500 max-w-2xl mx-auto">
                {t("landing.features.desc")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/60 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6 text-slate-900 shadow-sm">
                  <Wand2 className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">{t("landing.feature.ai.title")}</h3>
                <p className="text-slate-500 text-lg">
                  {t("landing.feature.ai.desc")}
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white/70 backdrop-blur-md rounded-2xl p-8 border border-white/60 shadow-lg hover:shadow-xl transition-all hover:-translate-y-1"
              >
                <div className="h-12 w-12 bg-slate-100 rounded-xl flex items-center justify-center mb-6 text-slate-900 shadow-sm">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3 text-slate-900">{t("landing.feature.editor.title")}</h3>
                <p className="text-slate-500 text-lg">
                  {t("landing.feature.editor.desc")}
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white rounded-3xl p-12 md:p-24 text-center relative overflow-hidden shadow-2xl shadow-zinc-900/30">
              <div className="relative z-10 space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{t("landing.cta.title")}</h2>
                <p className="text-slate-300 text-lg max-w-xl mx-auto">
                  {t("landing.cta.desc")}
                </p>
                <Link to="/dashboard">
                  <Button size="lg" className="h-14 px-8 text-lg rounded-full font-semibold bg-white text-black hover:bg-slate-100 shadow-lg transition-all">
                    {t("landing.cta.button")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 py-12 bg-white/60 backdrop-blur-lg">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <img 
                  src="https://harmless-tapir-303.convex.cloud/api/storage/1a8853ff-ebac-480a-b68b-ffe2343bbf07" 
                  alt="TRYAM Logo" 
                  className="h-8 w-8 object-cover rounded-full grayscale"
                />
                <span className="font-bold text-lg text-slate-900">TRYAM</span>
              </div>
              <p className="text-slate-500 max-w-xs">
                {t("footer.description")}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-slate-900">{t("footer.platform")}</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-black transition-colors">{t("footer.designStudio")}</a></li>
                <li><a href="#" className="hover:text-black transition-colors">{t("footer.aiGenerator")}</a></li>
                <li><a href="#" className="hover:text-black transition-colors">{t("nav.pricing")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4 text-slate-900">{t("footer.company")}</h4>
              <ul className="space-y-2 text-sm text-slate-500">
                <li><a href="#" className="hover:text-black transition-colors">{t("footer.about")}</a></li>
                <li><a href="#" className="hover:text-black transition-colors">{t("footer.blog")}</a></li>
                <li><a href="#" className="hover:text-black transition-colors">{t("footer.contact")}</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-500">
            <p>© 2025 TRYAM. {t("footer.rights")}</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-black transition-colors">{t("footer.privacy")}</a>
              <a href="#" className="hover:text-black transition-colors">{t("footer.terms")}</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}