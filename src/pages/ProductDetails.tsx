import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Check, Paintbrush, ArrowLeft, Truck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// Define the shape of our product data
interface ProductData {
  id: string;
  title: string;
  description: string;
  image: string;
  gallery?: string[];
  options: {
    colors: string[];
    sizes: string[];
  };
  providers?: {
    india_qikink?: { base_cost: number };
    global_printify?: { base_cost: number };
  };
  stock_status: string;
}

export default function ProductDetails() {
  const { productId } = useParams();
  const navigate = useNavigate();
  
  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Selection States
  const [selectedColor, setSelectedColor] = useState<string>("");
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [mainImage, setMainImage] = useState<string>("");

  useEffect(() => {
    async function fetchProduct() {
      if (!productId) return;
      try {
        const docRef = doc(db, "base_products", productId);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          const data = docSnap.data() as ProductData;
          setProduct(data);
          setMainImage(data.image);
          // Auto-select first options
          if (data.options?.colors?.length > 0) setSelectedColor(data.options.colors[0]);
          if (data.options?.sizes?.length > 0) setSelectedSize(data.options.sizes[0]);
        }
      } catch (error) {
        console.error("Error loading product", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProduct();
  }, [productId]);

  const handleStartDesigning = () => {
    if (!product) return;
    if (!selectedColor || !selectedSize) {
      toast.error("Please select a color and size first.");
      return;
    }
    
    // Navigate to Editor with pre-selected options
    navigate(`/design/new?product=${product.id}&color=${selectedColor}&size=${selectedSize}`);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Product not found</div>;

  // Calculate Price (Base + Margin)
  const basePrice = product.providers?.india_qikink?.base_cost || 200;
  const sellingPrice = basePrice + 299; // Your profit margin

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar Placeholder / Back Button */}
      <div className="p-4 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => navigate("/store")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Store
          </Button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* LEFT: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative">
               <img src={mainImage} alt={product.title} className="w-full h-full object-cover" />
            </div>
            {/* Thumbnail Grid */}
            {product.gallery && product.gallery.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {product.gallery.map((img, idx) => (
                  <button 
                    key={idx}
                    onClick={() => setMainImage(img)}
                    className={cn(
                      "w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
                      mainImage === img ? "border-indigo-600 ring-2 ring-indigo-100" : "border-transparent hover:border-slate-300"
                    )}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* RIGHT: Product Details */}
          <div className="space-y-8">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{product.title}</h1>
              <p className="text-slate-500 mt-2 text-lg leading-relaxed">{product.description}</p>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-slate-900">₹{sellingPrice}</span>
              <span className="text-sm text-slate-500 line-through">₹{sellingPrice + 200}</span>
              <Badge variant="secondary" className="bg-green-100 text-green-700">In Stock</Badge>
            </div>

            <Separator />

            {/* COLOR SELECTOR */}
            <div className="space-y-3">
              <span className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Select Color: <span className="text-indigo-600">{selectedColor}</span></span>
              <div className="flex flex-wrap gap-3">
                {product.options.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                      selectedColor === color 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600" 
                        : "border-slate-200 text-slate-600 hover:border-slate-300"
                    )}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* SIZE SELECTOR */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Select Size</span>
                <span className="text-xs text-indigo-600 cursor-pointer hover:underline">Size Chart</span>
              </div>
              <div className="grid grid-cols-5 gap-3">
                {product.options.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={cn(
                      "h-12 rounded-lg border text-sm font-bold flex items-center justify-center transition-all",
                      selectedSize === size 
                        ? "border-black bg-black text-white shadow-lg scale-105" 
                        : "border-slate-200 text-slate-900 hover:border-slate-400"
                    )}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* ACTION BUTTON */}
            <div className="pt-6">
              <Button 
                size="lg" 
                className="w-full h-14 text-lg font-bold shadow-xl bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.02]"
                onClick={handleStartDesigning}
              >
                <Paintbrush className="w-5 h-5 mr-2" />
                Start Designing Now
              </Button>
              <p className="text-center text-xs text-slate-400 mt-3">
                Customize with text, images, and AI art.
              </p>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <Truck className="w-5 h-5 text-slate-400" />
                <span>Fast Delivery across India</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <ShieldCheck className="w-5 h-5 text-slate-400" />
                <span>Premium Quality Guarantee</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}