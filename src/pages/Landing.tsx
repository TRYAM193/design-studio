import { motion } from "framer-motion";
import { ArrowRight, CheckCircle2, Layers, Palette, Zap } from "lucide-react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar */}
      <header className="border-b sticky top-0 bg-background/80 backdrop-blur-md z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center">
              <div className="h-3 w-3 bg-background rounded-full" />
            </div>
            <span className="font-bold text-xl tracking-tight">DesignApp</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="hover:text-primary/80 transition-colors">Features</a>
            <a href="#templates" className="hover:text-primary/80 transition-colors">Templates</a>
            <a href="#pricing" className="hover:text-primary/80 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Log in</Button>
            </Link>
            <Link to="/dashboard">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="py-24 md:py-32 px-4">
          <div className="container mx-auto max-w-6xl text-center space-y-8">
            <motion.h1 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-5xl md:text-7xl font-bold tracking-tight leading-tight"
            >
              Design made <br className="hidden md:block" />
              <span className="text-muted-foreground">beautifully simple.</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl text-muted-foreground max-w-2xl mx-auto"
            >
              Create stunning graphics, presentations, and social media posts in seconds. 
              No design skills required.
            </motion.p>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center justify-center gap-4 pt-4"
            >
              <Link to="/dashboard">
                <Button size="lg" className="h-14 px-8 text-lg rounded-full">
                  Start Designing Free <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </motion.div>
            
            {/* Hero Image Placeholder */}
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-16 rounded-xl border bg-secondary/20 aspect-[16/9] max-w-5xl mx-auto shadow-2xl overflow-hidden relative"
            >
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/20">
                <div className="grid grid-cols-3 gap-8 w-full p-12 opacity-50">
                   <div className="bg-background rounded-lg shadow-sm h-64 w-full"></div>
                   <div className="bg-background rounded-lg shadow-sm h-64 w-full mt-12"></div>
                   <div className="bg-background rounded-lg shadow-sm h-64 w-full"></div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="py-24 bg-secondary/30">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid md:grid-cols-3 gap-12">
              {[
                { icon: Palette, title: "Professional Templates", desc: "Start with thousands of professionally designed templates." },
                { icon: Layers, title: "Smart Layers", desc: "Organize your designs with intuitive layer management." },
                { icon: Zap, title: "Instant Export", desc: "Export your designs in any format in seconds." }
              ].map((feature, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="space-y-4"
                >
                  <div className="h-12 w-12 bg-background rounded-xl border flex items-center justify-center">
                    <feature.icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-24 px-4">
          <div className="container mx-auto max-w-4xl text-center space-y-8 bg-primary text-primary-foreground rounded-3xl p-12 md:p-24">
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight">Ready to start creating?</h2>
            <p className="text-primary-foreground/80 text-lg max-w-xl mx-auto">
              Join millions of designers creating stunning content every day.
            </p>
            <Link to="/dashboard">
              <Button size="lg" variant="secondary" className="h-14 px-8 text-lg rounded-full">
                Get Started Now
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-12 bg-secondary/20">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 bg-primary rounded-full flex items-center justify-center">
              <div className="h-2 w-2 bg-background rounded-full" />
            </div>
            <span className="font-bold text-foreground">DesignApp</span>
          </div>
          <div className="flex gap-8">
            <a href="#" className="hover:text-foreground">Privacy</a>
            <a href="#" className="hover:text-foreground">Terms</a>
            <a href="#" className="hover:text-foreground">Contact</a>
          </div>
          <p>© 2024 DesignApp Inc.</p>
        </div>
      </footer>
    </div>
  );
}