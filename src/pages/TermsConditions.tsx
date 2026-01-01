import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { FiChevronLeft } from "react-icons/fi";

export default function TermsConditions() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white font-sans text-slate-800">
      <div className="max-w-4xl mx-auto p-6 md:p-12">
        
        {/* Header */}
        <div className="mb-8">
            <Button variant="ghost" onClick={() => navigate(-1)} className="pl-0 gap-2 mb-4 text-slate-500 hover:text-indigo-600 hover:bg-transparent">
                <FiChevronLeft /> Back
            </Button>
            <h1 className="text-3xl md:text-4xl font-bold mb-2">Terms & Conditions</h1>
            <p className="text-slate-500">Last updated: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Content Area */}
        <div className="prose prose-slate max-w-none space-y-8">
            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">1. Introduction</h2>
                <p className="text-slate-600 leading-relaxed">
                    Welcome to TRYAM. By using our website and placing an order, you agree to the following terms and conditions. Please read them carefully before making a purchase.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">2. Products & Printing</h2>
                <p className="text-slate-600 leading-relaxed">
                    Since all our products are printed on demand specifically for you, slight variations in color or print placement may occur. We utilize high-quality DTG (Direct-to-Garment) printing to ensure longevity.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">3. Returns & Refunds</h2>
                <p className="text-slate-600 leading-relaxed">
                    <strong>Made-to-Order Policy:</strong> We do not accept returns for "Change of Mind" or "Wrong Size" issues as every item is custom made.
                    <br/><br/>
                    <strong>Defects:</strong> If you receive a damaged product or a printing error, please contact us within 48 hours of delivery with photos, and we will send a free replacement.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">4. Shipping & Delivery</h2>
                <p className="text-slate-600 leading-relaxed">
                    Estimated delivery times are 5-7 business days for India and 7-14 days for International orders. Delays due to couriers or customs are outside our control, but we will assist in tracking your package.
                </p>
            </section>
        </div>

      </div>
    </div>
  );
}