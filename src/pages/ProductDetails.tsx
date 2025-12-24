// src/pages/ProductDetails.tsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Paintbrush, ChevronRight, Check, Truck, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ✅ Interface matches our 'initialProducts.ts' structure
interface ProductData {
    id: string;
    title: string;
    description: string;
    image: string | null;
    category: string;
    price: number;
    mockups?: {
        front?: string;
        back?: string;
        left?: string;
        right?: string;
    };
    options: {
        colors: string[];
        sizes: string[];
    };
    // We don't need vendor_maps here, only in the backend/router
}

export default function ProductDetails() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState<ProductData | null>(null);
    const [loading, setLoading] = useState(true);

    // Selection States
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [activeImage, setActiveImage] = useState<string>("");

    useEffect(() => {
        async function fetchProduct() {
            if (!productId) return;
            try {
                const docRef = doc(db, "base_products", productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as ProductData;
                    setProduct(data);
                    
                    // Set initial image (prioritize front mockup, then uploaded image)
                    const initialImg = data.mockups?.front || data.image || "";
                    setActiveImage(initialImg);

                    // Auto-select first options
                    if (data.options?.colors?.length > 0) setSelectedColor(data.options.colors[0]);
                    if (data.options?.sizes?.length > 0) setSelectedSize(data.options.sizes[0]);
                }
            } catch (error) {
                console.error("Error loading product", error);
                toast.error("Failed to load product details.");
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

        // ✅ Navigate to Editor with selections
        navigate(`/design?product=${product.id}&color=${selectedColor}&size=${selectedSize}`);
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (!product) return <div className="h-screen flex items-center justify-center">Product not found</div>;

    // Create a gallery array from mockups
    const galleryImages = [
        product.mockups?.front,
        product.mockups?.back,
        product.mockups?.left,
        product.mockups?.right,
        product.image
    ].filter(Boolean) as string[];

    // Deduplicate images
    const uniqueGallery = [...new Set(galleryImages)];

    return (
        <div className="min-h-screen bg-white">
            {/* Navbar / Breadcrumb */}
            <div className="p-4 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10">
                <div className="max-w-6xl mx-auto flex items-center gap-2 text-sm text-slate-500">
                    <span className="cursor-pointer hover:text-slate-900" onClick={() => navigate("/store")}>Store</span>
                    <ChevronRight className="w-4 h-4" />
                    <span className="capitalize text-slate-900 font-medium">{product.category}</span>
                </div>
            </div>

            <div className="max-w-6xl mx-auto p-6 md:p-10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                    {/* LEFT: Image Gallery */}
                    <div className="space-y-4">
                        <div className="aspect-[3/4] bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative">
                            <img 
                                src={activeImage || "https://placehold.co/600x800?text=No+Image"} 
                                alt={product.title} 
                                className="w-full h-full object-contain" 
                            />
                        </div>
                        {/* Thumbnails */}
                        {uniqueGallery.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
                                {uniqueGallery.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={cn(
                                            "w-20 h-20 rounded-lg overflow-hidden border-2 flex-shrink-0 transition-all",
                                            activeImage === img ? "border-indigo-600 ring-2 ring-indigo-100" : "border-transparent hover:border-slate-300"
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
                                    {product.category}
                                </Badge>
                                <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                    <Check size={12} /> In Stock
                                </span>
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{product.title}</h1>

                            <p className="text-slate-600 text-lg leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl font-bold text-slate-900">${product.price.toFixed(2)}</span>
                            <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Premium Quality</span>
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
                            >
                                <Paintbrush className="w-5 h-5 mr-2" /> Start Designing
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
        </div >
    );
}