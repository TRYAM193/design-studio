import { motion } from "framer-motion";
import { ArrowRight, Layers, Sparkles, Wand2 } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
           {/* Logo */}
           <div className="flex items-center gap-2">
              <img 
                src="https://harmless-tapir-303.convex.cloud/api/storage/1a8853ff-ebac-480a-b68b-ffe2343bbf07" 
                alt="TRYAM Logo" 
                className="h-10 w-10 object-cover rounded-full"
              />
              <span className="font-bold text-xl tracking-tight">TRYAM</span>
           </div>
           {/* Nav/Actions */}
           <div className="flex items-center gap-4">
             <Link to="/auth">
               <Button variant="ghost">Sign In</Button>
             </Link>
             <Link to="/dashboard">
               <Button>Get Started</Button>
             </Link>
           </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="pt-20 pb-32 px-4">
          <div className="container mx-auto max-w-6xl text-center space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full border bg-secondary/50 text-sm font-medium text-muted-foreground"
            >
              <Sparkles className="h-3.5 w-3.5" />
              AI-Powered Design Studio
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
            >
              Wear Your <br />
              <span className="text-primary/80">Imagination.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Create custom t-shirts with professional tools and generative AI. 
              From concept to cotton in minutes.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
            >
              <Link to="/dashboard">
                <Button size="lg" className="h-12 px-8 text-lg rounded-full">
                  Start Designing <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Button variant="outline" size="lg" className="h-12 px-8 text-lg rounded-full">
                View Gallery
              </Button>
            </motion.div>

            {/* Hero Visual */}
             <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-16 rounded-2xl border bg-secondary/20 aspect-[16/9] max-w-5xl mx-auto shadow-sm overflow-hidden relative"
            >
               <img 
                 src="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?q=80&w=1000&auto=format&fit=crop" 
                 alt="T-Shirt Mockup" 
                 className="w-full h-full object-cover opacity-90 hover:scale-105 transition-transform duration-700"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="text-center mb-16 space-y-4">
              <h2 className="text-3xl md:text-4xl font-bold">Professional Tools for Everyone</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Whether you're a professional designer or just getting started, TRYAM gives you the power to create stunning apparel.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="bg-background rounded-2xl p-8 border shadow-sm hover:shadow-md transition-all"
              >
                <div className="h-12 w-12 bg-primary/5 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <Wand2 className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">AI Generation</h3>
                <p className="text-muted-foreground text-lg">
                  Describe your idea and watch as our AI generates unique, high-quality designs instantly.
                </p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, x: 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-background rounded-2xl p-8 border shadow-sm hover:shadow-md transition-all"
              >
                <div className="h-12 w-12 bg-primary/5 rounded-xl flex items-center justify-center mb-6 text-primary">
                  <Layers className="h-6 w-6" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Pro Editor</h3>
                <p className="text-muted-foreground text-lg">
                  Fine-tune every detail with our advanced layer-based editor and professional typography tools.
                </p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-5xl">
            <div className="bg-primary text-primary-foreground rounded-3xl p-12 md:p-24 text-center relative overflow-hidden">
              <div className="relative z-10 space-y-8">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready to start creating?</h2>
                <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
                  Join thousands of creators designing their own fashion with TRYAM. No minimum orders, worldwide shipping.
                </p>
                <Link to="/dashboard">
                  <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full font-semibold">
                    Create Your First Design
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-12 bg-secondary/10">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div className="col-span-2 space-y-4">
              <div className="flex items-center gap-2">
                <img 
                  src="https://harmless-tapir-303.convex.cloud/api/storage/1a8853ff-ebac-480a-b68b-ffe2343bbf07" 
                  alt="TRYAM Logo" 
                  className="h-8 w-8 object-cover rounded-full"
                />
                <span className="font-bold text-lg">TRYAM</span>
              </div>
              <p className="text-muted-foreground max-w-xs">
                The modern platform for custom apparel. Powered by AI, designed by you.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Platform</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">Design Studio</a></li>
                <li><a href="#" className="hover:text-foreground">AI Generator</a></li>
                <li><a href="#" className="hover:text-foreground">Pricing</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground">About Us</a></li>
                <li><a href="#" className="hover:text-foreground">Blog</a></li>
                <li><a href="#" className="hover:text-foreground">Contact</a></li>
              </ul>
            </div>
          </div>
          <div className="pt-8 border-t flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-muted-foreground">
            <p>© 2025 TRYAM. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#" className="hover:text-foreground">Privacy Policy</a>
              <a href="#" className="hover:text-foreground">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}