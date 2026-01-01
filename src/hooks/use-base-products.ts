// src/hooks/use-base-products.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, getDocs } from 'firebase/firestore';

// ✅ Define the Multi-Currency Price Structure
export interface PriceObject {
  IN: number;
  US: number;
  GB: number;
  EU: number;
  CA: number;
}

export interface BaseProduct {
  id: string;
  title: string;
  description: string;
  image: string | null;     
  category: string;
  
  // ✅ Updated to support both old (number) and new (object) formats
  price: PriceObject; 
  
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
        const querySnapshot = await getDocs(collection(db, "base_products"));
        const fetched: BaseProduct[] = [];
        
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          
          // ✅ Intelligent Price Fallback
          // If DB has old data (number), convert it to a safe default object
          let processedPrice: PriceObject;
          if (typeof data.price === 'object') {
             processedPrice = data.price;
          } else {
             // Fallback for old products
             processedPrice = { 
               IN: data.price || 0, 
               US: 0, GB: 0, EU: 0, CA: 0 
             };
          }

          fetched.push({
            id: doc.id,
            title: data.title || "Untitled Product",
            description: data.description || "",
            image: data.image || data.mockups?.front || null, 
            category: data.category || "Uncategorized",
            price: processedPrice,
            
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