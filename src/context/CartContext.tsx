import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/firebase";
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

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
  designData?: any; // The JSON fabric state
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, delta: number) => Promise<void>;
  updateItemContent: (id: string, updates: Partial<CartItem>) => Promise<void>; // <--- NEW FUNCTION
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

  // 1. Sync Logic (Same as before)
  useEffect(() => {
    if (!user?.uid) {
      setItems([]); 
      return;
    }
    setIsLoading(true);
    const cartRef = collection(db, `users/${user.uid}/cart`);
    const unsubscribe = onSnapshot(cartRef, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id })) as CartItem[];
      setItems(fetchedItems);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, [user?.uid]);

  // 2. Add Item (Same as before)
  const addItem = async (newItem: Omit<CartItem, "id">) => {
    if (!user?.uid) {
      toast.error("Please sign in to save items.");
      return;
    }
    try {
      const newDocRef = doc(collection(db, `users/${user.uid}/cart`));
      await setDoc(newDocRef, newItem);
      toast.success("Saved to your cart");
    } catch (error) {
      console.error(error);
      toast.error("Failed to save");
    }
  };

  // 3. Remove Item
  const removeItem = async (id: string) => {
    if (!user?.uid) return;
    await deleteDoc(doc(db, `users/${user.uid}/cart`, id));
  };

  // 4. Update Quantity
  const updateQuantity = async (id: string, delta: number) => {
    if (!user?.uid) return;
    const item = items.find(i => i.id === id);
    if (!item || (item.quantity + delta) < 1) return;
    await updateDoc(doc(db, `users/${user.uid}/cart`, id), { quantity: item.quantity + delta });
  };

  // 5. ✅ NEW: Update Full Content (For Editing Design)
  const updateItemContent = async (id: string, updates: Partial<CartItem>) => {
     if (!user?.uid) return;
     try {
        await updateDoc(doc(db, `users/${user.uid}/cart`, id), updates);
        toast.success("Cart updated successfully");
     } catch (error) {
        console.error("Update error:", error);
        toast.error("Failed to update cart item");
     }
  };

  const clearCart = async () => {}; // Implementation pending

  const cartTotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, updateItemContent, clearCart, cartTotal, cartCount, isLoading }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}