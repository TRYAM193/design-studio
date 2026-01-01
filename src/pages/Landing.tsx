import { motion } from "framer-motion";
import { ArrowRight, Layers, Sparkles, Wand2, ArrowUpRight } from "lucide-react"; // Added ArrowUpRight
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { useTranslation } from "@/hooks/use-translation";

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col font-sans selection:bg-slate-200 selection:text-black">
      
      {/* BACKGROUND: Smoke & Onyx Mesh */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-slate-50">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-zinc-900/5 blur-[120px] animate-pulse" />
         <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] rounded-full bg-slate-400/10 blur-[120px] animate-pulse delay-1000" />
         <div className="absolute bottom-[-10%] left-[20%] w-[50%] h-[50%] rounded-full bg-gray-300/20 blur-[120px] animate-pulse delay-2000" />
         <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-overlay"></div>
      </div>

      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
        <div className="container mx-auto px-6 h-20 flex items-center justify-between">
           {/* Logo */}
           <div className="flex items-center gap-3">
              <div className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-slate-200 to-slate-300 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-200"></div>
                <img 
                  src="https://harmless-tapir-303.convex.cloud/api/storage/1a8853ff-ebac-480a-b68b-ffe2343bbf07" 
                  alt="TRYAM Logo" 
                  className="relative h-10 w-10 object-cover rounded-full shadow-sm grayscale ring-2 ring-white"
                />
              </div>
              <span className="font-bold text-xl tracking-tight text-slate-900">TRYAM</span>
           </div>

           {/* Desktop Navigation */}
           <nav className="hidden md:flex items-center gap-8">
             {["Catalog", "Templates", "Products", "Pricing"].map((item) => (
                <Link key={item} to={item === "Catalog" ? "/store" : `/dashboard/${item.toLowerCase()}`} className="text-sm font-medium text-slate-500 hover:text-black transition-colors relative group">
                  {item}
                  <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-black transition-all group-hover:w-full"></span>
                </Link>
             ))}
           </nav>

           {/* Nav Actions */}
           <div className="flex items-center gap-4">
             <Link to="/auth">
               <Button variant="ghost" className="text-slate-600 font-medium hover:text-black hover:bg-slate-100 rounded-full px-6 transition-all">
                 {t("nav.signin")}
               </Button>
             </Link>
             <Link to="/dashboard">
               {/* 🎨 DESIGNED NAV BUTTON */}
               <Button className="rounded-full px-6 h-10 bg-black text-white shadow-lg shadow-zinc-900/10 hover:shadow-zinc-900/20 hover:scale-105 active:scale-95 transition-all duration-300 group border border-zinc-800 relative overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">
                    {t("auth.getStarted")} <ArrowUpRight className="w-4 h-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
                  </span>
                  {/* Subtle shine effect */}
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 ease-in-out" />
               </Button>
             </Link>
           </div>
        </div>
      </header>

      <main className="flex-1 relative z-10">
        {/* Hero Section */}
        <section className="pt-24 pb-32 px-4">
          <div className="container mx-auto max-w-6xl text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-slate-200 bg-white/50 backdrop-blur-md text-sm font-medium text-slate-600 shadow-sm hover:shadow-md transition-shadow cursor-default"
            >
              <Sparkles className="h-3.5 w-3.5 text-black animate-pulse" />
              <span>{t("landing.hero.badge")}</span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-6xl md:text-8xl font-bold tracking-tighter leading-[1.1] text-slate-900"
            >
              {t("landing.hero.titleStart")} <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-br from-black via-zinc-700 to-slate-500">
                {t("landing.hero.titleEnd")}
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl md:text-2xl text-slate-500 max-w-2xl mx-auto font-light leading-relaxed"
            >
              {t("landing.hero.desc")}
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-6 pt-8"
            >
              <Link to="/dashboard">
                {/* 🎨 HERO CTA BUTTON - The "Stand Out" Button */}
                <Button size="lg" className="h-16 px-10 text-lg rounded-full bg-black hover:bg-zinc-900 text-white shadow-[0_10px_40px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-10px_rgba(0,0,0,0.4)] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                  <span className="relative z-10 font-bold tracking-wide flex items-center gap-3">
                    {t("landing.hero.cta")} 
                    <div className="bg-white/20 p-1 rounded-full group-hover:bg-white text-black transition-colors">
                        <ArrowRight className="w-4 h-4 text-white group-hover:text-black transition-colors" />
                    </div>
                  </span>
                  {/* Background Gradient Animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-black via-zinc-800 to-black opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                </Button>
              </Link>
              
              {/* Secondary CTA */}
              <Link to="/store">
                 <Button variant="ghost" size="lg" className="h-16 px-8 text-lg rounded-full text-slate-600 hover:text-black hover:bg-white/50 backdrop-blur-sm border border-transparent hover:border-slate-200 transition-all">
                    View Catalog
                 </Button>
              </Link>
            </motion.div>

            {/* Hero Visual (Floating Card) */}
             <motion.div 
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="mt-20 relative mx-auto max-w-5xl"
            >
               <div className="absolute inset-0 bg-gradient-to-t from-slate-200 to-transparent blur-3xl -z-10 opacity-40"></div>
               <div className="rounded-3xl border border-white/60 bg-white/40 backdrop-blur-md p-3 shadow-2xl shadow-slate-200/50 ring-1 ring-white/60">
                   <div className="rounded-2xl overflow-hidden aspect-[21/9] relative">
                       <img 
                         src="https://images.unsplash.com/photo-1558769132-cb1aea458c5e?q=80&w=2400&auto=format&fit=crop" 
                         alt="Fashion Design Studio" 
                         className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all duration-1000 transform hover:scale-105"
                       />
                       {/* Overlay Gradient */}
                       <div className="absolute inset-0 bg-gradient-to-t from-white/20 via-transparent to-transparent" />
                       
                       {/* Floating UI Elements for "App Look" */}
                       <div className="absolute bottom-6 left-6 flex gap-3">
                          <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl text-xs font-bold shadow-lg flex items-center gap-2">
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" /> AI Generator Active
                          </div>
                       </div>
                   </div>
               </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-32 relative">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-20 space-y-4">
              <h2 className="text-4xl md:text-5xl font-bold text-slate-900 tracking-tight">{t("landing.features.title")}</h2>
              <p className="text-xl text-slate-500 max-w-2xl mx-auto font-light">
                {t("landing.features.desc")}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-white/60 backdrop-blur-md rounded-[2rem] p-10 border border-white/60 shadow-xl hover:shadow-2xl hover:shadow-slate-200/50 transition-all hover:-translate-y-2 group"
              >
                <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-8 text-slate-900 shadow-sm group-hover:bg-black group-hover:text-white transition-colors duration-300">
                  <Wand2 className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-slate-900">{t("landing.feature.ai.title")}</h3>
                <p className="text-slate-500 text-lg leading-relaxed">
                  {t("landing.feature.ai.desc")}
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-white/60 backdrop-blur-md rounded-[2rem] p-10 border border-white/60 shadow-xl hover:shadow-2xl hover:shadow-slate-200/50 transition-all hover:-translate-y-2 group"
              >
                <div className="h-14 w-14 bg-slate-100 rounded-2xl flex items-center justify-center mb-8 text-slate-900 shadow-sm group-hover:bg-black group-hover:text-white transition-colors duration-300">
                  <Layers className="h-7 w-7" />
                </div>
                <h3 className="text-3xl font-bold mb-4 text-slate-900">{t("landing.feature.editor.title")}</h3>
                <p className="text-slate-500 text-lg leading-relaxed">
                  {t("landing.feature.editor.desc")}
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="group relative overflow-hidden rounded-[3rem] bg-black px-6 py-24 text-center shadow-2xl shadow-zinc-900/30 sm:px-16">
              {/* Animated Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-800 via-black to-zinc-900 transition-all duration-500 group-hover:scale-105" />
              
              {/* Decorative Glows */}
              <div className="absolute -top-24 -right-24 h-96 w-96 rounded-full bg-zinc-800/50 blur-3xl" />
              <div className="absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-zinc-800/50 blur-3xl" />

              <div className="relative z-10 max-w-3xl mx-auto space-y-8">
                <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white">{t("landing.cta.title")}</h2>
                <p className="text-zinc-400 text-xl font-light">
                  {t("landing.cta.desc")}
                </p>
                <Link to="/dashboard">
                  <Button size="lg" className="h-16 px-12 text-lg rounded-full font-bold bg-white text-black hover:bg-slate-200 hover:scale-105 transition-all shadow-[0_0_40px_rgba(255,255,255,0.1)]">
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
        <div className="container mx-auto px-6">
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
              <p className="text-slate-500 max-w-xs text-sm leading-relaxed">
                {t("footer.description")}
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-slate-900 text-sm uppercase tracking-wider">{t("footer.platform")}</h4>
              <ul className="space-y-3 text-sm text-slate-500">
                <li><a href="#" className="hover:text-black transition-colors">{t("footer.designStudio")}</a></li>
                <li><a href="#" className="hover:text-black transition-colors">{t("footer.aiGenerator")}</a></li>
                <li><a href="#" className="hover:text-black transition-colors">{t("nav.pricing")}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-6 text-slate-900 text-sm uppercase tracking-wider">{t("footer.company")}</h4>
              <ul className="space-y-3 text-sm text-slate-500">
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