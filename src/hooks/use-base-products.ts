// src/hooks/use-base-products.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

export interface BaseProduct {
  id: string;
  title: string;
  description: string;
  image: string | null;     // The main catalog image (uploaded via Admin)
  category: string;
  price: number;            // Direct price from DB
  
  // New fields from our schema
  mockups?: {
    front?: string;
    back?: string;
    [key: string]: string | undefined;
  };
  options?: {
    colors: string[];
    sizes: string[];
  };
}

export function useBaseProducts() {
  const [products, setProducts] = useState<BaseProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        // Fetch ALL products (removed 'active' filter to ensure seeded items appear)
        const querySnapshot = await getDocs(collection(db, "base_products"));
        
        const fetched: BaseProduct[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          fetched.push({
            id: doc.id,
            title: data.title || "Untitled Product",
            description: data.description || "",
            // Use the uploaded image, fallback to the front mockup, then to placeholder
            image: data.image || data.mockups?.front || null, 
            category: data.category || "Uncategorized",
            price: data.price || 0,
            
            mockups: data.mockups || {},
            options: {
              colors: data.options?.colors || [],
              sizes: data.options?.sizes || []
            }
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