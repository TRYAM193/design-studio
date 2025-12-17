import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export interface BaseProduct {
  id: string;
  title: string;
  image: string; // We will use a placeholder if missing
  base_cost_inr: number;
  colors: string[];
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
          // Logic: Grab the India price for display
          const inrPrice = data.providers?.india_qikink?.base_cost || 0;
          console.log(data)
          fetched.push({
            id: doc.id,
            title: data.title,
            // Fallback image if the seed script didn't save one
            image: data.image || "/assets/t_shirt.glb", 
            base_cost_inr: inrPrice,
            colors: data.options?.colors || [],
            stock_status: data.stock_status || 'in_stock'
          });
        });
        
        setProducts(fetched);
      } catch (error) {
        console.error("Error fetching base products:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchProducts();
  }, []);
  console.log(products)

  return { products, loading };
}