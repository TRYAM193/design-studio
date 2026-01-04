import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth"; 
import { db } from "@/firebase";
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, query, getDocs, writeBatch } from "firebase/firestore";

export interface CartItem {
  id: string; 
  productId: string;
  title: string;
  variant: { color: string; size: string };
  thumbnail: string;
  price: number;
  currency: string;
  quantity: number;
  region: string;
  vendor: "qikink" | "printify" | "gelato";
  designData?: any;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "id">) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  updateQuantity: (id: string, change: number) => Promise<void>; // ✅ Added missing function type
  clearCart: () => Promise<void>;
  cartTotal: number;
  cartCount: number;
  isLoading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Sync Logic (Same as before)
  useEffect(() => {
    let unsubscribe: () => void;
    if (user) {
      const q = query(collection(db, `users/${user.uid}/cart`));
      unsubscribe = onSnapshot(q, (snapshot) => {
        const liveItems = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as CartItem[];
        setItems(liveItems);
        setIsLoading(false);
      });
    } else {
      const saved = localStorage.getItem("vly-cart");
      if (saved) setItems(JSON.parse(saved));
      setIsLoading(false);
    }
    return () => { if (unsubscribe) unsubscribe(); };
  }, [user]);

  // Local Storage Saver
  useEffect(() => {
    if (!user && !isLoading) {
      localStorage.setItem("vly-cart", JSON.stringify(items));
    }
  }, [items, user, isLoading]);

  const addItem = async (newItem: Omit<CartItem, "id">) => {
    if (user) {
      await addDoc(collection(db, `users/${user.uid}/cart`), newItem);
    } else {
      const id = `guest-${Date.now()}`;
      setItems((prev) => [...prev, { ...newItem, id }]);
    }
    toast.success("Added to cart");
  };

  const removeItem = async (id: string) => {
    if (user) {
      await deleteDoc(doc(db, `users/${user.uid}/cart`, id));
    } else {
      setItems((prev) => prev.filter((item) => item.id !== id));
    }
    toast.info("Item removed");
  };

  // ✅ ADDED: Update Quantity Logic
  const updateQuantity = async (id: string, change: number) => {
    const item = items.find((i) => i.id === id);
    if (!item) return;

    const newQuantity = item.quantity + change;
    if (newQuantity < 1) return; // Prevent going below 1

    if (user) {
      // Update Firestore
      await updateDoc(doc(db, `users/${user.uid}/cart`, id), { quantity: newQuantity });
    } else {
      // Update Local State
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, quantity: newQuantity } : i))
      );
    }
  };

  const clearCart = async () => {
    if (user) {
      const q = query(collection(db, `users/${user.uid}/cart`));
      const snapshot = await getDocs(q);
      const batch = writeBatch(db);
      snapshot.docs.forEach((doc) => batch.delete(doc.ref));
      await batch.commit();
    } else {
      setItems([]);
      localStorage.removeItem("vly-cart");
    }
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