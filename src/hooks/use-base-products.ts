import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export interface BaseProduct {
  id: string;
  title: string;
  description: string;
  image: string;
  gallery: string[]; // Array of images from Printify
  category: string;
  price_inr: number; // The display selling price
  stock_status: 'in_stock' | 'out_of_stock';
  options: {
    colors: string[];
    sizes: string[];
  };
  // We keep the raw provider info accessible for advanced logic
  providers: {
    india_qikink?: { base_cost: number; active: boolean };
    global_printify?: { base_cost: number; active: boolean };
  };
}

export function useBaseProducts() {
  const [products, setProducts] = useState<BaseProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const q = query(collection(db, "base_products"), where("active", "==", true));
        const querySnapshot = await getDocs(q);
        
        const fetched: BaseProduct[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // 1. Determine Base Cost (Prioritize India/Qikink)
          const qikinkCost = data.providers?.india_qikink?.base_cost;
          const printifyCost = data.providers?.global_printify?.base_cost;
          
          // Default to Qikink cost, fallback to Printify, or 0
          const baseCost = qikinkCost || printifyCost || 0;
          
          // 2. Calculate Display Price (Base + Profit Margin)
          // Example: ₹200 cost + ₹299 margin = ₹499
          const displayPrice = baseCost + 299;

          fetched.push({
            id: doc.id,
            title: data.title || "Untitled Product",
            description: data.description || "No description available.",
            image: data.image || "/assets/t_shirt.glb", // Main image
            gallery: data.gallery || [data.image], // Fallback to main image if gallery missing
            category: data.category || "Apparel",
            
            price_inr: displayPrice,
            stock_status: data.stock_status || 'in_stock',
            
            options: {
              colors: data.options?.colors || [],
              sizes: data.options?.sizes || []
            },

            providers: data.providers || {}
          });
        });
        
        setProducts(fetched);
      } catch (error) {
        console.error("Error fetching catalog:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);

  return { products, loading };
}