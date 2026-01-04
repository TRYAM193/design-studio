import { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { db } from "@/firebase";
import { collection, doc, setDoc, deleteDoc, onSnapshot, getDocs, writeBatch } from "firebase/firestore";
import { toast } from "sonner";

export type CartItem = {
  id: string; // Product ID
  variantId?: string; // If you have sizes/colors
  productTitle: string;
  price: number;
  thumbnail: string;
  quantity: number;
  // Metadata for custom prints
  customDesignId?: string; 
};

type CartContextType = {
  items: CartItem[];
  addItem: (item: CartItem) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  cartCount: number;
  cartTotal: number;
  isLoading: boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 1. Load Initial Cart (Local or Firestore)
  useEffect(() => {
    let unsubscribe: () => void;

    if (user?.uid) {
      // === LOGGED IN: REALTIME FIRESTORE LISTENER ===
      setIsLoading(true);
      const cartRef = collection(db, `users/${user.uid}/cart`);
      unsubscribe = onSnapshot(cartRef, (snapshot) => {
        const fetchedItems: CartItem[] = [];
        snapshot.forEach((doc) => {
          fetchedItems.push({ ...doc.data(), id: doc.id } as CartItem);
        });
        setItems(fetchedItems);
        setIsLoading(false);
      });
    } else {
      // === GUEST: LOCAL STORAGE ===
      const localCart = localStorage.getItem("guest_cart");
      if (localCart) {
        setItems(JSON.parse(localCart));
      }
      setIsLoading(false);
    }

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [user?.uid]);

  // 2. Sync Local Storage whenever items change (ONLY FOR GUESTS)
  useEffect(() => {
    if (!user?.uid) {
      localStorage.setItem("guest_cart", JSON.stringify(items));
    }
  }, [items, user?.uid]);

  // 3. MERGE LOGIC: When user logs in, move guest items to Cloud
  useEffect(() => {
    const mergeGuestCart = async () => {
      if (user?.uid) {
        const localCart = localStorage.getItem("guest_cart");
        if (localCart) {
          const guestItems: CartItem[] = JSON.parse(localCart);
          if (guestItems.length > 0) {
             const batch = writeBatch(db);
             guestItems.forEach(item => {
                const docRef = doc(db, `users/${user.uid}/cart`, item.id);
                batch.set(docRef, item);
             });
             await batch.commit();
             localStorage.removeItem("guest_cart");
             toast.success("Cart synced to your account!");
          }
        }
      }
    };
    mergeGuestCart();
  }, [user?.uid]);

  // --- ACTIONS ---

  const addItem = async (newItem: CartItem) => {
    // Check if item exists to increment quantity instead
    const existing = items.find(i => i.id === newItem.id);
    const newQuantity = existing ? existing.quantity + 1 : newItem.quantity;

    if (user?.uid) {
      // Cloud Save
      const docRef = doc(db, `users/${user.uid}/cart`, newItem.id);
      await setDoc(docRef, { ...newItem, quantity: newQuantity }, { merge: true });
    } else {
      // Local Save
      setItems(prev => {
        const exists = prev.find(i => i.id === newItem.id);
        if (exists) {
          return prev.map(i => i.id === newItem.id ? { ...i, quantity: i.quantity + 1 } : i);
        }
        return [...prev, newItem];
      });
    }
    toast.success("Added to cart");
  };

  const removeItem = async (itemId: string) => {
    if (user?.uid) {
      await deleteDoc(doc(db, `users/${user.uid}/cart`, itemId));
    } else {
      setItems(prev => prev.filter(i => i.id !== itemId));
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) return;
    if (user?.uid) {
      await setDoc(doc(db, `users/${user.uid}/cart`, itemId), { quantity }, { merge: true });
    } else {
      setItems(prev => prev.map(i => i.id === itemId ? { ...i, quantity } : i));
    }
  };

  const clearCart = async () => {
    if (user?.uid) {
       const cartRef = collection(db, `users/${user.uid}/cart`);
       const snapshot = await getDocs(cartRef);
       const batch = writeBatch(db);
       snapshot.forEach(doc => batch.delete(doc.ref));
       await batch.commit();
    } else {
      setItems([]);
    }
  };

  const cartCount = items.reduce((acc, item) => acc + item.quantity, 0);
  const cartTotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <CartContext.Provider value={{ 
      items, addItem, removeItem, updateQuantity, clearCart, cartCount, cartTotal, isLoading 
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
};