import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Paintbrush, ArrowLeft, Truck, ShieldCheck, ChevronRight, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ✅ FIX: Added 'category' to the interface
interface ProductData {
  id: string;
  title: string;
  description: string;
  image: string;
  category: string; // <--- Added this
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
          // Auto-select first options if available
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
    
    // Navigate to Editor
    navigate(`/design/new?product=${product.id}&color=${selectedColor}&size=${selectedSize}`);
  };

  if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!product) return <div className="h-screen flex items-center justify-center">Product not found</div>;

  // Pricing Logic (Base + Margin)
  const basePrice = product.providers?.india_qikink?.base_cost || 200;
  const sellingPrice = basePrice + 299; 

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar / Breadcrumb */}
      <div className="p-4 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10">
        <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-slate-500">
          <span className="cursor-pointer hover:text-slate-900" onClick={() => navigate("/store")}>Store</span>
          <ChevronRight className="w-4 h-4" />
          <span className="capitalize text-slate-900 font-medium">{product.category || "Product"}</span>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-6 md:p-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          
          {/* LEFT: Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative group">
               <img src={mainImage} alt={product.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
            </div>
            {/* Thumbnails */}
            {product.gallery && product.gallery.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
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
              <div className="flex items-center gap-2 mb-2">
                 <Badge variant="outline" className="text-indigo-600 border-indigo-200 capitalize">
                    {product.category || "Apparel"}
                 </Badge>
                 {product.stock_status === 'in_stock' ? (
                   <span className="text-xs font-bold text-green-600 flex items-center gap-1"><Check size={12} /> In Stock</span>
                 ) : (
                   <span className="text-xs font-bold text-red-600">Out of Stock</span>
                 )}
              </div>
              <h1 className="text-3xl md:text-4xl font-bold text-slate-900 tracking-tight">{product.title}</h1>
              <product.description/>
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-slate-900">₹{sellingPrice}</span>
              <span className="text-lg text-slate-400 line-through">₹{sellingPrice + 200}</span>
              <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">20% OFF</span>
            </div>

            <Separator />

            {/* COLOR SELECTOR */}
            <div className="space-y-3">
              <span className="text-sm font-semibold text-slate-900 uppercase tracking-wide">
                Color: <span className="text-indigo-600 ml-1">{selectedColor}</span>
              </span>
              <div className="flex flex-wrap gap-3">
                {product.options.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={cn(
                      "px-4 py-2 rounded-full border text-sm font-medium transition-all",
                      selectedColor === color 
                        ? "border-indigo-600 bg-indigo-50 text-indigo-700 ring-1 ring-indigo-600" 
                        : "border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
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
                <span className="text-sm font-semibold text-slate-900 uppercase tracking-wide">Size</span>
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
                        : "border-slate-200 text-slate-900 hover:border-slate-400 hover:bg-slate-50"
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
                className="w-full h-14 text-lg font-bold shadow-xl bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.01]"
                onClick={handleStartDesigning}
                disabled={product.stock_status !== 'in_stock'}
              >
                {product.stock_status === 'in_stock' ? (
                  <>
                    <Paintbrush className="w-5 h-5 mr-2" /> Start Designing
                  </>
                ) : (
                  "Currently Unavailable"
                )}
              </Button>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-4 pt-6 border-t">
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="p-2 bg-slate-100 rounded-full"><Truck className="w-4 h-4 text-slate-600" /></div>
                <span>Fast Delivery</span>
              </div>
              <div className="flex items-center gap-3 text-sm text-slate-600">
                <div className="p-2 bg-slate-100 rounded-full"><ShieldCheck className="w-4 h-4 text-slate-600" /></div>
                <span>Quality Guarantee</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}