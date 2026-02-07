import { useParams, Link } from "react-router";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

// 📝 THE CONTENT DATABASE
const LEGAL_CONTENT: Record<string, { title: string; content: React.ReactNode }> = {
  "privacy": {
    title: "Privacy Policy",
    content: (
      <>
        <p>Last Updated: {new Date().toLocaleDateString()}</p>
        <h3>1. Information We Collect</h3>
        <p>We collect information you provide directly to us, such as when you create an account, make a purchase, or contact support. This includes your name, email, shipping address, and phone number.</p>
        <h3>2. How We Use Information</h3>
        <p>We use your information strictly to fulfill orders, send shipping notifications, and improve our services. We do not sell your personal data to advertisers.</p>
        <h3>3. Data Sharing</h3>
        <p>We share shipping data with our print partners (e.g., Qikink, Printify) solely for the purpose of delivering your order.</p>
      </>
    )
  },
  "terms": {
    title: "Terms of Service",
    content: (
      <>
        <h3>1. Acceptance of Terms</h3>
        <p>By accessing TryAm, you agree to these terms. If you do not agree, please do not use our services.</p>
        <h3>2. User Generated Content</h3>
        <p>You retain ownership of the designs you create. However, by saving a design, you grant us a license to print these designs for your specific orders.</p>
        <h3>3. Copyright Responsibility</h3>
        <p>You agree not to upload content that violates third-party copyrights (e.g., Disney, Nike logos) or hate speech. TryAm reserves the right to cancel orders containing illegal content.</p>
      </>
    )
  },
  "refunds": {
    title: "Refund & Return Policy",
    content: (
      <>
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg text-yellow-200 mb-6">
            <strong>Key Summary:</strong> Because every product is custom-printed just for you, we cannot offer returns for buyer's remorse or wrong size selection.
        </div>
        <h3>Damaged or Defective Items</h3>
        <p>If your order arrives damaged, misprinted, or with a manufacturing error, we will offer a <strong>free replacement or full refund</strong>.</p>
        <p>Please contact us at <a href="mailto:support@tryam.com" className="text-orange-500">support@tryam.com</a> within 30 days of delivery with a photo of the issue.</p>
        <h3>Cancellations</h3>
        <p>Orders are sent to production automatically. You may cancel within 1 hour of placing the order via your dashboard.</p>
      </>
    )
  },
  "shipping": {
    title: "Shipping Information",
    content: (
      <>
        <h3>Production Time</h3>
        <p>All items are printed on demand. Please allow <strong>2-5 business days</strong> for printing and quality checks.</p>
        <h3>Estimated Delivery</h3>
        <ul>
            <li><strong>India:</strong> 3-7 Business Days after production.</li>
            <li><strong>USA/Global:</strong> 5-10 Business Days after production.</li>
        </ul>
        <p><em>Note: Shipping times are estimates and not guarantees. Delays may occur during holidays.</em></p>
      </>
    )
  }
};

export default function LegalPage() {
  const { type } = useParams(); 
  const data = LEGAL_CONTENT[type || "privacy"] || LEGAL_CONTENT["privacy"];

  return (
    <div className="min-h-screen flex flex-col bg-slate-950">
      
      {/* HEADER */}
      <div className="border-b border-slate-900 bg-slate-950/50 backdrop-blur-md sticky top-0 z-10">
          <div className="max-w-4xl mx-auto px-6 h-16 flex items-center">
              <Link to="/">
                 <Button variant="ghost" className="text-slate-400 hover:text-white pl-0">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Store
                 </Button>
              </Link>
          </div>
      </div>

      {/* CONTENT */}
      <div className="flex-1 max-w-3xl mx-auto px-6 py-12 w-full">
        <h1 className="text-4xl font-bold text-white mb-8 pb-4 border-b border-slate-800">
          {data.title}
        </h1>
        
        {/* Tailwind Typography Plugin Class for clean text */}
        <div className="prose prose-invert prose-orange max-w-none prose-headings:text-slate-200 prose-p:text-slate-400 prose-li:text-slate-400">
          {data.content}
        </div>
      </div>

      <Footer />
    </div>
  );
}