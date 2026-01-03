import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";

// ✅ Enhanced Cart Item to support your Multi-Vendor setup
export interface CartItem {
  id: string;          // Unique Cart ID
  productId: string;   // Base Product ID
  title: string;
  variant: {
    color: string;
    size: string;
  };
  thumbnail: string;   // The generated design preview
  price: number;
  currency: string;    // 'IN', 'US', 'EU', etc.
  quantity: number;
  
  // 🚀 CRITICAL: Store routing info for Firebase Cloud Functions
  region: string;      
  vendor: "qikink" | "printify" | "gelato"; 
  
  designData?: any;    // The JSON fabric state (for future editing)
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, delta: number) => void;
  clearCart: () => void;
  cartTotal: number;
  cartCount: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  // 1. Load from LocalStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("vly-cart");
    if (saved) {
      try {
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse cart", e);
      }
    }
  }, []);

  // 2. Save to LocalStorage whenever items change
  useEffect(() => {
    localStorage.setItem("vly-cart", JSON.stringify(items));
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "id">) => {
    // Generate a unique ID
    const id = `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    setItems((prev) => [...prev, { ...newItem, id }]);
    toast.success("Added to cart");
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
    toast.info("Item removed");
  };

  const updateQuantity = (id: string, delta: number) => {
    setItems((prev) =>
      prev.map((item) => {
        if (item.id === id) {
          const newQty = Math.max(1, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      })
    );
  };

  const clearCart = () => {
    setItems([]);
    localStorage.removeItem("vly-cart");
  };

  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, cartTotal, cartCount }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}