import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loader2, Paintbrush, ChevronRight, Check, Truck, ShieldCheck, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ✅ Interface matches our 'initialProducts.ts' structure
interface ProductData {
    id: string;
    title: string;
    description: string;
    image: string | null;
    category: string;
    price: {
        IN: number;
        US: number; 
        GB: number;
        EU: number;
        CA: number;
    };
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
    
    // ✅ Region State (Default to US for global, overwritten by IP check)
    const [region, setRegion] = useState<"IN" | "US" | "GB" | "EU" | "CA">("US");
    const [checkingLocation, setCheckingLocation] = useState(true);

    const currencyConfig = {
        IN: { symbol: "₹", label: "INR" },
        US: { symbol: "$", label: "USD" },
        GB: { symbol: "£", label: "GBP" },
        EU: { symbol: "€", label: "EUR" },
        CA: { symbol: "C$", label: "CAD" },
    };

    // 1️⃣ Fetch Product Data
    useEffect(() => {
        async function fetchProduct() {
            if (!productId) return;
            try {
                const docRef = doc(db, "base_products", productId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data() as ProductData;
                    setProduct(data);
                    
                    const initialImg = data.mockups?.front || data.image || "";
                    setActiveImage(initialImg);

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

    // 2️⃣ Automatic IP-Based Region Detection
    useEffect(() => {
        async function detectRegion() {
            try {
                // Using a free IP API to get country code
                const response = await fetch("https://ipapi.co/json/");
                const data = await response.json();
                const country = data.country_code; // e.g., "IN", "US", "GB", "FR"
                const currency = data.currency;    // e.g., "INR", "USD", "EUR"

                if (country === "IN") {
                    setRegion("IN");
                } else if (country === "GB") {
                    setRegion("GB");
                } else if (country === "CA") {
                    setRegion("CA");
                } else if (currency === "EUR") {
                    setRegion("EU"); // Catch all Eurozone countries (FR, DE, IT, etc.)
                } else {
                    setRegion("US"); // Default to USD for everyone else (AU, JP, etc.)
                }
            } catch (error) {
                console.warn("Location detection failed, defaulting to US/Global", error);
                setRegion("US");
            } finally {
                setCheckingLocation(false);
            }
        }
        detectRegion();
    }, []);

    const handleStartDesigning = () => {
        if (!product) return;
        if (!selectedColor || !selectedSize) {
            toast.error("Please select a color and size first.");
            return;
        }

        // ✅ Navigate with auto-detected region
        window.open(`/design?product=${product.id}&color=${selectedColor}&size=${selectedSize}&region=${region}`);
    };

    if (loading) return <div className="h-screen flex items-center justify-center"><Loader2 className="animate-spin text-indigo-600" /></div>;
    if (!product) return <div className="h-screen flex items-center justify-center">Product not found</div>;

    const galleryImages = [
        product.mockups?.front,
        product.mockups?.back,
        product.mockups?.left,
        product.mockups?.right,
        product.image
    ].filter(Boolean) as string[];

    const uniqueGallery = [...new Set(galleryImages)];

    // ✅ Get Price & Symbol (Safe fallback to US if API fails)
    const currentPrice = product.price[region] || product.price.US;
    const currentSymbol = currencyConfig[region].symbol;

    return (
        <div className="min-h-screen bg-white">
            <div className="p-4 border-b sticky top-0 bg-white/80 backdrop-blur-md z-10 flex justify-between items-center px-4 md:px-10">
                <div className="flex items-center gap-2 text-sm text-slate-500">
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
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <Badge variant="outline" className="text-indigo-600 border-indigo-200 capitalize">
                                        {product.category}
                                    </Badge>
                                    <span className="text-xs font-bold text-green-600 flex items-center gap-1">
                                        <Check size={12} /> In Stock
                                    </span>
                                </div>
                                
                                {/* ✅ Auto-Detected Region Display (No Option to Change) */}
                                {!checkingLocation && (
                                    <div className="flex items-center gap-1 text-xs font-medium text-slate-400 bg-slate-50 px-2 py-1 rounded-full border">
                                        <Globe className="w-3 h-3" />
                                        <span>{currencyConfig[region].label}</span>
                                    </div>
                                )}
                            </div>
                            
                            <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">{product.title}</h1>

                            <p className="text-slate-600 text-lg leading-relaxed">
                                {product.description}
                            </p>
                        </div>

                        {/* ✅ Price Display */}
                        <div className="flex items-baseline gap-3">
                            {checkingLocation ? (
                                <span className="text-lg text-slate-400 animate-pulse">Loading price...</span>
                            ) : (
                                <span className="text-4xl font-bold text-slate-900">
                                    {currentSymbol}{currentPrice.toFixed(2)}
                                </span>
                            )}
                            <span className="text-sm font-bold text-green-600 bg-green-50 px-2 py-1 rounded">Premium Quality</span>
                        </div>

                        <Separator />

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

                        <div className="pt-6">
                            <Button
                                size="lg"
                                className="w-full h-14 text-lg font-bold shadow-xl bg-indigo-600 hover:bg-indigo-700 transition-all hover:scale-[1.01]"
                                onClick={handleStartDesigning}
                            >
                                <Paintbrush className="w-5 h-5 mr-2" /> Start Designing
                            </Button>
                            
                             <p className="text-xs text-center text-slate-500 mt-3">
                                *This item is printed specially for you. <span className="text-red-500 font-medium">No returns for wrong sizes.</span>
                            </p>
                        </div>

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