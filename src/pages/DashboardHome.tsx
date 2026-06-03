import { motion } from "framer-motion";
import {
  ArrowRight, Clock, Store, Sparkles, Crown, Zap, Flame, Copy, Check, Share2, Loader2,
  Image as ImageIcon, Plus, Gift, Package, Palette, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { Link, useNavigate } from "react-router"; 
import { useTranslation } from "@/hooks/use-translation";
import { useUserDesigns } from "@/hooks/use-user-designs"; 
import { useEffect, useState } from "react";
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, where } from "firebase/firestore";
import { db } from "@/firebase";
import { toast } from "sonner";
import { FaWhatsapp, FaTelegramPlane } from 'react-icons/fa';

export default function DashboardHome() {
  const { isAuthenticated, user, userProfile } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // 1. DATA: Recent Designs
  const { designs: userDesigns, loading: designsLoading } = useUserDesigns(user?.uid);

  // 2. DATA: Recommended Templates
  const [templates, setTemplates] = useState<any[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(true);

  // 3. DATA: Recent Orders
  const [orders, setOrders] = useState<any[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Referral states
  const referralCount = userProfile?.referralCount || 0;
  const hasActiveReward = userProfile?.hasActiveReward || false;
  const progressPercent = Math.min((referralCount / 3) * 100, 100);
  const [copied, setCopied] = useState(false);
  const [isClaiming, setIsClaiming] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  useEffect(() => {
    // Fetch top 10 newest templates
    const q = query(
      collection(db, 'templates'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTemplates(results);
      setTemplatesLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user?.uid) return;
    const q = query(
      collection(db, 'orders'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc'),
      limit(5)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const results = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setOrders(results);
      setOrdersLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // HANDLERS
  const handleOpenDesign = (id: string) => window.open(`/design?designId=${id}`, '_blank');
  const handleUseTemplate = (id: string) => window.open(`/design?templateId=${id}`, '_blank');
  const handleCreateNew = () => window.open('/design', '_blank');
  
  const handleClaimReward = async () => {
    if (!user?.uid) return;
    setIsClaiming(true);
    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, { hasActiveReward: true });
      toast.success("₹100 credited! Apply it at checkout.");
    } catch (error) {
      toast.error("Failed to claim reward.");
      console.error(error);
    } finally {
      setIsClaiming(false);
    }
  };

  const shareMessage = `Get ₹100 off your first custom T-shirt on TRYAM 🔥\nUse my link: `;
  
  const getReferralUrl = () => {
    if (!userProfile?.referralCode) return '';
    return `${window.location.origin}?ref=${userProfile.referralCode}`;
  };

  const notifyShare = () => {
    if (referralCount < 3) {
      setTimeout(() => setIsShareModalOpen(true), 800);
    }
  };

  const handleCopy = () => {
    const link = getReferralUrl();
    if (!link) return;
    navigator.clipboard.writeText(shareMessage + link);
    toast.success("Referral link copied!");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    notifyShare();
  };

  const handleNativeShare = async () => {
    const link = getReferralUrl();
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'TRYAM - Custom T-Shirts',
          text: shareMessage,
          url: link,
        });
        notifyShare();
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      handleCopy();
    }
  };
  
  const handleWhatsAppShare = () => {
    const link = getReferralUrl();
    window.open(`https://wa.me/?text=${encodeURIComponent(shareMessage + link)}`, '_blank');
    notifyShare();
  };
  
  const handleTelegramShare = () => {
    const link = getReferralUrl();
    window.open(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent(shareMessage)}`, '_blank');
    notifyShare();
  };

  return (
    <div className="space-y-8 md:space-y-12 pb-20 relative px-4 sm:px-6 md:px-10">

      {/* ✅ BACKGROUND: COSMIC SHIVA THEME */}
      <div className="fixed inset-0 -z-10 w-full h-full bg-[#0f172a]">
        <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-blue-600/10 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-orange-600/10 blur-[100px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay"></div>
      </div>

      {isAuthenticated ? (
        <div className="space-y-8 pt-6">
          
          {/* HEADER ROW: Welcome & Badges */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-1"
            >
              <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-white flex items-center flex-wrap gap-3">
                {t("dashboard.welcome")},  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-orange-400">
                  {(user?.displayName?.split(" ")[0]?.charAt(0).toUpperCase() || "") + (user?.displayName?.split(" ")[0]?.slice(1) || "") || "Creator"}
                </span>
              </h1>
              <div className="flex items-center gap-3 mt-2">
                {/* 👑 FOUNDING CREATOR BADGE */}
                {userProfile?.isFoundingCreator && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]">
                    <Crown className="w-4 h-4 text-yellow-400 fill-yellow-400/20" />
                    <span className="text-xs font-bold bg-clip-text text-transparent bg-gradient-to-r from-yellow-300 to-orange-300 uppercase tracking-wider">
                      Founding Creator
                    </span>
                  </div>
                )}
                {/* 🏆 REFERRAL TIER BADGE */}
                <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                  referralCount >= 3 ? "bg-orange-500/15 border-orange-500/30 text-orange-400" : referralCount >= 1 ? "bg-blue-500/10 border-blue-500/20 text-blue-400" : "bg-slate-800/80 border-white/10 text-slate-500"
                }`}>
                  {referralCount >= 3 ? "🚀 Influencer" : referralCount >= 1 ? "🔗 Connector" : "🌱 Starter"}
                </div>
              </div>
            </motion.div>
            
            <Link to="/design">
              <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-full shadow-lg shadow-blue-900/30">
                <Plus className="w-4 h-4 mr-2" /> New Design
              </Button>
            </Link>
          </div>

          {/* QUICK STATS ROW */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Total Designs</p>
                <p className="text-3xl font-black text-white mt-1">{designsLoading ? "-" : userDesigns.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                <Palette className="w-6 h-6 text-blue-400" />
              </div>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Total Orders</p>
                <p className="text-3xl font-black text-white mt-1">{ordersLoading ? "-" : orders.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                <Package className="w-6 h-6 text-purple-400" />
              </div>
            </motion.div>

            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-slate-800/40 backdrop-blur-md border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-400 font-medium">Reward Balance</p>
                <p className="text-3xl font-black text-green-400 mt-1">{hasActiveReward ? "₹100" : "₹0"}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                <Gift className="w-6 h-6 text-green-400" />
              </div>
            </motion.div>
          </div>

          {/* ROW 2: Recent Orders & Compact Referral Banner */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Recent Orders List */}
            <div className="lg:col-span-2 space-y-4 bg-slate-900/60 backdrop-blur-sm border border-white/5 rounded-2xl p-6">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Package className="h-5 w-5 text-purple-400" /> Recent Orders
                </h2>
                <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => navigate('/dashboard/orders')}>
                  View All <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
              
              <div className="space-y-3">
                {ordersLoading ? (
                  [...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full rounded-xl bg-slate-800/50" />)
                ) : orders.length > 0 ? (
                  orders.map(order => (
                    <div key={order.id} className="flex items-center justify-between bg-slate-800/30 p-3 rounded-xl border border-white/5 hover:border-white/10 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-slate-700/50 rounded-lg flex items-center justify-center">
                          <Package className="w-5 h-5 text-slate-400" />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">#{order.id.substring(0,8).toUpperCase()}</p>
                          <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-white">₹{order.totalAmount}</p>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                          order.status === 'placed' ? 'bg-orange-500/20 text-orange-400' : 'bg-green-500/20 text-green-400'
                        }`}>
                          {order.status}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6">
                    <p className="text-sm text-slate-400">No orders yet.</p>
                    <Link to="/store">
                      <Button variant="link" className="text-orange-400 px-0">Browse Store →</Button>
                    </Link>
                  </div>
                )}
              </div>
            </div>

            {/* Compact Referral Banner */}
            <div className="lg:col-span-1 bg-gradient-to-br from-slate-800/80 to-slate-900 border border-orange-500/20 rounded-2xl p-6 relative overflow-hidden flex flex-col justify-between">
              <div className="absolute -top-10 -right-10 w-32 h-32 bg-orange-500/20 rounded-full blur-[40px]" />
              
              <div className="space-y-4 relative z-10">
                <div className="flex items-center gap-2">
                  <Gift className="w-5 h-5 text-orange-400" />
                  <h3 className="text-base font-bold text-white">Invite & Earn ₹100</h3>
                </div>
                
                {hasActiveReward ? (
                   <div className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 text-sm font-bold w-full">
                     <Check className="w-4 h-4" /> Reward Active at Checkout!
                   </div>
                ) : referralCount >= 3 ? (
                  <Button onClick={handleClaimReward} disabled={isClaiming} className="w-full bg-green-500 hover:bg-green-400 text-white font-bold">
                    {isClaiming ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    Claim ₹100 Reward
                  </Button>
                ) : (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-400">
                      <span>Progress</span>
                      <span className="text-orange-400">{referralCount} / 3 Friends</span>
                    </div>
                    <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden border border-white/5">
                      <motion.div className="h-full bg-orange-500" initial={{ width: 0 }} animate={{ width: `${Math.max(progressPercent, 5)}%` }} />
                    </div>
                  </div>
                )}

                <div className="pt-2 space-y-2">
                  <p className="text-xs text-slate-400 text-center font-medium">Share your unique link</p>
                  <div className="flex gap-2">
                    <Button onClick={handleCopy} disabled={!userProfile?.referralCode} variant="outline" className="flex-1 bg-slate-900 border-white/10 text-slate-300 hover:text-white h-9 text-xs">
                      {copied ? <Check className="w-3.5 h-3.5 mr-1 text-green-400" /> : <Copy className="w-3.5 h-3.5 mr-1" />} 
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                    <Button onClick={handleWhatsAppShare} disabled={!userProfile?.referralCode} className="flex-1 bg-[#25D366]/20 hover:bg-[#25D366]/30 text-[#25D366] border-0 h-9 text-xs">
                      <FaWhatsapp className="w-4 h-4 mr-1" /> Share
                    </Button>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* ROW 3: Recent Designs Grid */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Palette className="h-5 w-5 text-blue-400" /> Recent Projects
              </h2>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => navigate('/dashboard/projects')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {designsLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-slate-800/50" />
                    <Skeleton className="h-4 w-3/4 bg-slate-800/50" />
                  </div>
                ))
              ) : userDesigns && userDesigns.length > 0 ? (
                [...userDesigns]
                  .sort((a, b) => new Date(b.updatedAt || 0).getTime() - new Date(a.updatedAt || 0).getTime())
                  .slice(0, 5)
                  .map((design) => (
                    <motion.div key={design.id} whileHover={{ y: -5 }} className="group cursor-pointer" onClick={() => handleOpenDesign(design.id)}>
                      <div className="aspect-[3/4] rounded-xl bg-slate-800/20 overflow-hidden relative border border-white/5 group-hover:border-blue-500/30 transition-all duration-300 p-2">
                        {design.imageData ? (
                          <img src={design.imageData} alt={design.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                            <Zap className="text-slate-700 w-8 h-8" />
                          </div>
                        )}
                      </div>
                      <div className="mt-3 px-1">
                        <h3 className="font-semibold text-slate-200 truncate text-sm group-hover:text-blue-400 transition-colors">
                          {design.name || t("dashboard.untitled")}
                        </h3>
                      </div>
                    </motion.div>
                  ))
              ) : (
                <div className="col-span-full py-10 text-center border border-dashed border-white/10 rounded-xl bg-white/5">
                  <p className="text-slate-400 text-sm mb-4">No recent designs found.</p>
                  <Button onClick={handleCreateNew} variant="secondary" size="sm" className="bg-slate-800 text-white hover:bg-slate-700">
                    <Plus className="mr-2 h-4 w-4" /> Start Creating
                  </Button>
                </div>
              )}
            </div>
          </section>

          {/* ROW 4: Featured Templates */}
          <section className="space-y-4 pt-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Flame className="h-5 w-5 text-orange-400" /> Featured Templates
              </h2>
              <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white" onClick={() => navigate('/dashboard/designs')}>
                View All <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
              {templatesLoading ? (
                [...Array(5)].map((_, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-slate-800/50" />
                    <Skeleton className="h-4 w-3/4 bg-slate-800/50" />
                  </div>
                ))
              ) : (
                templates.slice(0, 5).map((template, i) => (
                  <motion.div key={template.id} initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }} className="group cursor-pointer" onClick={() => handleUseTemplate(template.id)}>
                    <div className="aspect-[3/4] rounded-xl bg-slate-800/20 overflow-hidden relative border border-white/5 group-hover:border-orange-500/30 transition-all duration-300 p-2">
                      {template.thumbnailUrl || template.image ? (
                        <img src={template.thumbnailUrl || template.image} alt={template.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900/50">
                          <ImageIcon className="text-slate-700 w-8 h-8" />
                        </div>
                      )}
                      {(template.tier === "Pro" || template.isPro) && (
                        <div className="absolute top-2 right-2 bg-orange-500/90 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm flex items-center gap-1 shadow-sm">
                          <Crown className="h-3 w-3" /> PRO
                        </div>
                      )}
                    </div>
                    <div className="mt-3 px-1">
                      <h3 className="font-semibold text-slate-200 truncate text-sm group-hover:text-orange-400 transition-colors">
                        {template.name || "Untitled"}
                      </h3>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </section>

        </div>
      ) : (
        // NON-AUTH STATE
        <section className="bg-slate-800/30 border border-white/5 rounded-2xl p-10 text-center space-y-6 mt-10">
          <h2 className="text-2xl font-bold text-white">{t("dashboard.startFree")}</h2>
          <p className="text-slate-400 max-w-md mx-auto">{t("dashboard.startDesc")}</p>
          <Link to="/store">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white rounded-full px-8">Go to Catalog</Button>
          </Link>
        </section>
      )}
      
      {/* Post-Share Viral Loop Modal (Kept for functionality) */}
      <Dialog open={isShareModalOpen} onOpenChange={setIsShareModalOpen}>
        <DialogContent className="bg-slate-900 border border-orange-500/20 text-white max-w-sm rounded-2xl shadow-2xl shadow-black/60">
          <DialogHeader>
            <DialogTitle className="text-2xl font-black text-center">🔥 You're closer to <span className="text-orange-400">₹100!</span></DialogTitle>
            <DialogDescription className="text-center text-slate-400">Invite {Math.max(3 - referralCount, 0)} more friend{Math.max(3 - referralCount, 0) !== 1 ? 's' : ''} to unlock your reward.</DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col gap-2 sm:flex-col">
            <Button onClick={() => { setIsShareModalOpen(false); handleWhatsAppShare(); }} disabled={!userProfile?.referralCode} className="w-full bg-[#25D366] hover:bg-[#1ebe5a] text-white font-bold rounded-xl border-0">
              <FaWhatsapp className="w-4 h-4 mr-2" /> Share on WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}