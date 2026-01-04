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
                    Welcome to TRYAM. We exist to help you wear your imagination. By using our platform, you agree to these terms, which ensure we can deliver the best custom experience for you.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">2. Your Designs & Rights</h2>
                <p className="text-slate-600 leading-relaxed">
                    <strong>You own your art.</strong> When you upload a design to TRYAM, you retain full ownership and copyright. You grant us a non-exclusive license only to print your specific order. We will never sell your personal designs to others.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">3. Products & Printing</h2>
                <p className="text-slate-600 leading-relaxed">
                    We use premium Direct-to-Garment (DTG) printing technology for vibrant, long-lasting prints. Since every item is printed on demand, slight variations in color placement may occur compared to the digital mockup.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">4. Returns & Replacement Policy</h2>
                <p className="text-slate-600 leading-relaxed">
                    <strong>Custom Items:</strong> Because each item is made specifically for you, we cannot offer returns for size exchanges or buyer's remorse. Please check our Size Guide carefully before ordering.
                    <br/><br/>
                    <strong>Our Quality Promise:</strong> If your order arrives damaged, or if there is a printing error, we have your back. Please email us at <strong>support@tryam.com</strong> within <strong>7 days</strong> of delivery with a photo of the issue, and we will send a free replacement immediately.
                </p>
            </section>

            <section>
                <h2 className="text-xl font-bold text-slate-900 mb-3">5. Shipping & Cancellations</h2>
                <p className="text-slate-600 leading-relaxed">
                    <strong>Modifications:</strong> You can cancel or modify your order within <strong>2 hours</strong> of placement. After that, production begins.
                    <br/><br/>
                    <strong>Delivery:</strong> Estimated delivery is 5-7 business days (India) and 7-14 days (International). We will provide a tracking number as soon as your order ships.
                </p>
            </section>
        </div>
      </div>
    </div>
  );
}