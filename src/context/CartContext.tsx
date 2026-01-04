import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc } from "firebase/firestore";

export interface CartItem {
  id: string;
  title: string;
  productId: string;
  variant: {
    color: string;
    size: string;
  };
  thumbnail: string;
  price: number;
  currency: string;
  quantity: number;
  region: string;
  vendor: string;
  designData?: any;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, delta: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // ✅ 1. STRICT DATABASE SYNC (Only for Logged In Users)
  useEffect(() => {
    if (!user?.uid) {
      setItems([]); // Guests see nothing
      return;
    }

    setIsLoading(true);
    const cartRef = collection(db, `users/${user.uid}/cart`);
    
    // Real-time Listener
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as CartItem[];
      
      setItems(fetchedItems);
      setIsLoading(false);
    }, (error) => {
      console.error("Cart sync error:", error);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  // ✅ 2. Actions (Only work if User exists)
  const addItem = async (newItem: Omit<CartItem, "id">) => {
    if (!user?.uid) {
      toast.error("Please sign in to add items to your cart.");
      return;
    }

    try {
      // Check if item exists to increment quantity (Optional optimization)
      const existing = items.find(i => 
        i.productId === newItem.productId && 
        i.variant.color === newItem.variant.color && 
        i.variant.size === newItem.variant.size
      );

      if (existing) {
        await updateQuantity(existing.id, newItem.quantity);
      } else {
        // Create new doc reference with auto-ID
        const newDocRef = doc(collection(db, `users/${user.uid}/cart`));
        await setDoc(newDocRef, newItem);
        toast.success("Saved to your cart");
      }
    } catch (error) {
      console.error("Add to cart error", error);
      toast.error("Failed to save to cart");
    }
  };

  const removeItem = async (id: string) => {
    if (!user?.uid) return;
    try {
      await deleteDoc(doc(db, `users/${user.uid}/cart`, id));
    } catch (error) {
      console.error("Remove error", error);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    if (!user?.uid) return;
    const item = items.find(i => i.id === id);
    if (!item) return;

    const newQty = item.quantity + delta;
    if (newQty < 1) return;

    try {
      await setDoc(doc(db, `users/${user.uid}/cart`, id), { quantity: newQty }, { merge: true });
    } catch (error) {
      console.error("Update qty error", error);
    }
  };

  const clearCart = async () => {
    // Note: Deleting a collection is tricky in client SDK. 
    // Usually handled by iterating or a Cloud Function.
    // For now, we rely on individual removes or assumes batch delete.
    if (!user?.uid) return;
    // Implementation for clearing all docs would go here
  };

  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, cartTotal, cartCount, isLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}