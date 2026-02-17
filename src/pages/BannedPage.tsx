import { ShieldAlert, Ban } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function BannedPage() {
  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4 text-center font-sans">
      
      {/* Red Pulse Animation */}
      <div className="relative">
        <div className="absolute inset-0 bg-red-600 rounded-full blur-[60px] opacity-20 animate-pulse"></div>
        <div className="bg-red-950/30 p-8 rounded-full border-2 border-red-600 mb-8 relative z-10">
          <Ban className="h-24 w-24 text-red-500" />
        </div>
      </div>

      <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight mb-4">
        ACCOUNT SUSPENDED
      </h1>
      
      <div className="max-w-md space-y-4">
        <div className="bg-red-900/20 border border-red-800/50 p-4 rounded-lg flex items-start gap-3 text-left">
           <ShieldAlert className="h-6 w-6 text-red-500 shrink-0 mt-1" />
           <div>
             <h3 className="text-red-400 font-bold text-sm uppercase mb-1">Security Alert</h3>
             <p className="text-red-200/80 text-sm">
               Our systems detected <strong>Payment Tampering</strong> activity associated with this account.
               Attempting to alter payment amounts is a violation of our Terms of Service.
             </p>
           </div>
        </div>

        <p className="text-slate-500 text-sm">
          Access to this platform has been permanently revoked. If you believe this is an error, you may contact support for a manual review.
        </p>

        <Button 
           variant="outline" 
           className="border-slate-700 text-slate-400 hover:bg-slate-800 hover:text-white mt-8"
           onClick={() => window.location.href = "mailto:support@tryam193.com"}
        >
          Contact Security Team
        </Button>
      </div>
    </div>
  );
}