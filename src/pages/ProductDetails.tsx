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
import { COLOR_MAP } from "@/lib/colorMaps";
import { FiCheckCircle } from "react-icons/fi";

// ✅ Interface matches our 'initialProducts.ts' structure
interface ProductVariants {
    colors: string[]
    sizes: string[]
    sizeChart?: Record<string, number[]>;
}

interface ProductData {
    id: string;
    title: string;
    description: string;
    image: string | null;
    image1: string | null
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
    variants: {
        qikink: ProductVariants,
        printify?: ProductVariants,
        gelato?: ProductVariants
    }
}

export default function ProductDetails() {
    const { productId } = useParams();
    const navigate = useNavigate();

    const [product, setProduct] = useState<ProductData | null>(null);
    const [loading, setLoading] = useState(true);
    const [colors, setColors] = useState<string[]>([])
    const [sizes, setSizes] = useState<string[]>([])

    // Selection States
    const [selectedColor, setSelectedColor] = useState<string>("");
    const [selectedSize, setSelectedSize] = useState<string>("");
    const [activeImage, setActiveImage] = useState<string>("");

    // Size Chart States
    const [activeSizeChart, setActiveSizeChart] = useState<Record<string, number[]> | null>(null);
    const [showSizeChart, setShowSizeChart] = useState(false);

    // ✅ Region State
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

                    if (region === 'IN') {
                        setColors(data.variants.qikink.colors)
                        setSizes(data.variants.qikink.sizes)
                        setActiveSizeChart(data.variants.qikink.sizeChart || null);
                    }
                    else if (region === 'US') {
                        setColors(data.variants.gelato?.colors || [])
                        setSizes(data.variants.gelato?.sizes || [])
                        setActiveSizeChart(data.variants.gelato?.sizeChart || null);
                    }
                    else {
                        setColors(data.variants.printify?.colors || [])
                        setSizes(data.variants.printify?.sizes || [])
                        setActiveSizeChart(data.variants.printify?.sizeChart || null);
                    }

                    if (colors.length > 0) setSelectedColor(colors[0]);
                    if (sizes.length > 0) setSelectedSize(sizes[0]);
                }
            } catch (error) {
                console.error("Error loading product", error);
                toast.error("Failed to load product details.");
            } finally {
                setLoading(false);
            }
        }
        fetchProduct();
    }, [productId, region]);

    // 2️⃣ Automatic IP-Based Region Detection
    useEffect(() => {
        async function detectRegion() {
            try {
                const response = await fetch("https://ipapi.co/json/");
                const data = await response.json();
                const country = data.country_code;
                const currency = data.currency;

                if (country === "IN") setRegion("IN");
                else if (country === "GB") setRegion("GB");
                else if (country === "CA") setRegion("CA");
                else if (currency === "EUR") setRegion("EU");
                else setRegion("US");
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
        window.open(`/design?product=${product.id}&color=${selectedColor}&size=${selectedSize}&region=${region}`);
    };

    if (loading) return <div className="h-screen flex items-center justify-center bg-[#090A0F]"><Loader2 className="animate-spin text-orange-500" /></div>;
    if (!product) return <div className="h-screen flex items-center justify-center bg-[#090A0F] text-slate-400">Product not found</div>;

    const galleryImages = [
        product.mockups?.front,
        product.mockups?.back,
        product.mockups?.left,
        product.mockups?.right,
        product.image,
        product.image1
    ].filter(Boolean) as string[];

    const uniqueGallery = [...new Set(galleryImages)];
    const currentPrice = product.price[region] || product.price.US;
    const currentSymbol = currencyConfig[region].symbol;

    return (
        // 🌌 COSMIC BACKGROUND
        <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#1B2735] via-[#090A0F] to-[#000000] text-slate-200">
            
            {/* GLASS HEADER */}
            <div className="p-4 border-b border-white/5 sticky top-0 bg-[#090A0F]/80 backdrop-blur-xl z-20 flex justify-between items-center px-4 md:px-10 shadow-lg shadow-black/50">
                <div className="flex items-center gap-2 text-sm text-slate-400">
                    <span className="cursor-pointer hover:text-orange-400 transition-colors" onClick={() => navigate("/store")}>Store</span>
                    <ChevronRight className="w-4 h-4 text-slate-600" />
                    <span className="capitalize text-slate-200 font-medium tracking-wide">{product.category}</span>
                </div>
            </div>

            <div className="max-w-7xl mx-auto p-6 md:p-12">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">

                    {/* 📸 LEFT: GALACTIC IMAGE DISPLAY */}
                    <div className="space-y-6">
                        <div className="aspect-[3/4] bg-white/5 rounded-2xl overflow-hidden border border-white/10 relative shadow-[0_0_60px_-15px_rgba(99,102,241,0.15)] group">
                            <img
                                src={activeImage || "https://placehold.co/600x800?text=No+Image"}
                                alt={product.title}
                                className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                            />
                        </div>
                        {uniqueGallery.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                                {uniqueGallery.map((img, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setActiveImage(img)}
                                        className={cn(
                                            "w-20 h-20 rounded-xl overflow-hidden border-2 flex-shrink-0 transition-all duration-300",
                                            activeImage === img 
                                            ? "border-orange-500 shadow-[0_0_15px_-3px_rgba(249,115,22,0.5)] scale-105" 
                                            : "border-white/5 hover:border-white/20 bg-white/5"
                                        )}
                                    >
                                        <img src={img} alt="" className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* 🔮 RIGHT: MYSTICAL DETAILS */}
                    <div className="space-y-8 lg:pt-4">
                        <div>
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="text-indigo-300 border-indigo-500/30 bg-indigo-500/10 capitalize px-3 py-1">
                                        {product.category}
                                    </Badge>
                                    <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-400/10 border border-emerald-400/20">
                                        <Check size={12} strokeWidth={3} /> In Stock
                                    </span>
                                </div>

                                {!checkingLocation && (
                                    <div className="flex items-center gap-2 text-xs font-medium text-slate-400 bg-white/5 px-3 py-1.5 rounded-full border border-white/5">
                                        <Globe className="w-3.5 h-3.5 text-indigo-400" />
                                        <span>{currencyConfig[region].label}</span>
                                    </div>
                                )}
                            </div>

                            {/* TITLE WITH MYSTICAL GRADIENT */}
                            <h1 className="text-4xl md:text-5xl font-black mb-6 tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-slate-100 via-indigo-200 to-slate-100 drop-shadow-sm">
                                {product.title}
                            </h1>

                            <p className="text-slate-400 text-lg leading-relaxed font-light border-l-2 border-indigo-500/30 pl-4">
                                {product.description}
                            </p>
                        </div>

                        {/* 💰 PRICE (GOLDEN GLOW) */}
                        <div className="flex items-baseline gap-4">
                            {checkingLocation ? (
                                <span className="text-lg text-slate-500 animate-pulse">Divining price...</span>
                            ) : (
                                <span className="text-5xl font-bold text-orange-400 drop-shadow-[0_0_15px_rgba(251,146,60,0.3)]">
                                    {currentSymbol}{currentPrice.toFixed(2)}
                                </span>
                            )}
                            <span className="text-xs font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2 py-1 rounded uppercase tracking-wider">
                                Premium Quality
                            </span>
                        </div>

                        <Separator className="bg-white/10" />

                        {/* 🎨 COLOR SELECTOR */}
                        <div className="space-y-4">
                            <span className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                Color: <span className="text-indigo-300 ml-1">{selectedColor}</span>
                            </span>
                            <div className="flex flex-wrap gap-3">
                                {colors.length > 0 ? colors.map((color) => {
                                    const hex = COLOR_MAP[color as keyof typeof COLOR_MAP] || "#000000"
                                    const isActive = selectedColor === color
                                    return (
                                        <button 
                                            key={color} 
                                            onClick={() => setSelectedColor(color)} 
                                            className={cn(
                                                "w-10 h-10 rounded-full transition-all relative flex items-center justify-center shadow-lg",
                                                isActive ? "ring-2 ring-orange-500 ring-offset-2 ring-offset-[#090A0F] scale-110" : "hover:scale-110 ring-1 ring-white/10 hover:ring-white/30"
                                            )} 
                                            style={{ backgroundColor: hex }}
                                        >
                                            {isActive && <FiCheckCircle className="text-orange-500 absolute -top-1.5 -right-1.5 bg-[#090A0F] rounded-full text-lg shadow-sm" />}
                                        </button>
                                    )
                                }) : <p className="text-sm text-slate-500">No colors available</p>}
                            </div>
                        </div>

                        {/* 📏 SIZE SELECTOR */}
                        <div className="space-y-4">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500"></span>
                                    Size
                                </span>
                                
                                {activeSizeChart && (
                                    <button 
                                        onClick={() => setShowSizeChart(true)}
                                        className="text-xs text-orange-400 hover:text-orange-300 transition-colors font-semibold flex items-center gap-1.5 group"
                                    >
                                        <Paintbrush className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" /> 
                                        Size Guide
                                    </button>
                                )}
                            </div>
                            <div className="grid grid-cols-5 gap-3">
                                {sizes.map((size) => (
                                    <button
                                        key={size}
                                        onClick={() => setSelectedSize(size)}
                                        className={cn(
                                            "h-12 rounded-xl text-sm font-bold flex items-center justify-center transition-all duration-300 border",
                                            selectedSize === size
                                                ? "border-orange-500 bg-orange-500/10 text-orange-400 shadow-[0_0_15px_-3px_rgba(249,115,22,0.3)]"
                                                : "border-white/10 bg-white/5 text-slate-400 hover:border-white/30 hover:bg-white/10"
                                        )}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* 🔥 ACTION BUTTON (RUDRA FIRE) */}
                        <div className="pt-8">
                            <Button
                                size="lg"
                                className="w-full h-16 text-lg font-bold tracking-wide shadow-2xl relative overflow-hidden group border-0"
                                onClick={handleStartDesigning}
                            >
                                <div className="absolute inset-0 bg-gradient-to-r from-orange-600 to-red-600 transition-all duration-300 group-hover:scale-105"></div>
                                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
                                <span className="relative z-10 flex items-center justify-center gap-2 text-white">
                                    <Paintbrush className="w-5 h-5" /> START DESIGNING
                                </span>
                            </Button>

                            <p className="text-xs text-center text-slate-500 mt-4 font-mono">
                                *Custom forged for you. <span className="text-red-400">No returns for wrong sizes.</span>
                            </p>
                        </div>

                        {/* ICONS FOOTER */}
                        <div className="grid grid-cols-2 gap-4 pt-8 border-t border-white/10">
                            <div className="flex items-center gap-3 text-sm text-slate-400 group">
                                <div className="p-2.5 bg-white/5 rounded-full border border-white/5 group-hover:border-indigo-500/30 transition-colors"><Truck className="w-4 h-4 text-indigo-400" /></div>
                                <span>Cosmic Speed Delivery</span>
                            </div>
                            <div className="flex items-center gap-3 text-sm text-slate-400 group">
                                <div className="p-2.5 bg-white/5 rounded-full border border-white/5 group-hover:border-emerald-500/30 transition-colors"><ShieldCheck className="w-4 h-4 text-emerald-400" /></div>
                                <span>Divine Quality Guarantee</span>
                            </div>
                        </div>

                    </div>
                </div>
            </div>

            {/* 🌌 SIZE CHART MODAL (DARK THEME) */}
            {showSizeChart && activeSizeChart && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="bg-[#0f111a] border border-white/10 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden relative">
                        
                        {/* Modal Header */}
                        <div className="p-5 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h3 className="font-bold text-lg text-slate-200 flex items-center gap-2">
                                <span className="w-1 h-6 bg-orange-500 rounded-full"></span>
                                Size Guide (Inches)
                            </h3>
                            <button 
                                onClick={() => setShowSizeChart(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
                            >
                                ✕
                            </button>
                        </div>

                        {/* Measurements Table */}
                        <div className="p-6">
                            <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/5">
                                        <tr>
                                            <th className="px-6 py-4 font-bold tracking-wider">Size</th>
                                            <th className="px-6 py-4 font-bold tracking-wider">Chest</th>
                                            <th className="px-6 py-4 font-bold tracking-wider">Length</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-white/5">
                                        {Object.entries(activeSizeChart)
                                            .sort(([sizeA], [sizeB]) => {
                                                const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL", "2XL", "3XL", "4XL"];
                                                const indexA = sizeOrder.indexOf(sizeA);
                                                const indexB = sizeOrder.indexOf(sizeB);
                                                if (indexA !== -1 && indexB !== -1) return indexA - indexB;
                                                if (indexA === -1) return 1;
                                                if (indexB === -1) return -1;
                                                return 0;
                                            })
                                            .map(([size, measurements]) => (
                                                <tr key={size} className="hover:bg-white/5 transition-colors text-slate-300">
                                                    <td className="px-6 py-4 font-bold text-white">{size}</td>
                                                    <td className="px-6 py-4">{measurements?.[0] || "-"}</td>
                                                    <td className="px-6 py-4">{measurements?.[1] || "-"}</td>
                                                </tr>
                                            ))
                                        }
                                    </tbody>
                                </table>
                            </div>
                            <p className="text-xs text-slate-500 mt-5 text-center font-mono">
                                *Measurements may vary by +/- 0.5 inches due to cosmic shifts.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div >
    );
}