import { useEffect, useState } from "react";
import { collection, onSnapshot, query } from "firebase/firestore";
import { db } from "@/firebase";

export interface Design {
  updatedAt: any;
  id: string;
  name: string;
  imageData: string;
  createdAt?: any;
}

export function useUserDesigns(userId: string | undefined) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setDesigns([]);
      setLoading(false);
      return;
    }

    const designsRef = collection(db, `users/${userId}/designs`);
    // You can add orderBy("createdAt", "desc") here if you add timestamps later
    const q = query(designsRef);

    const unsub = onSnapshot(q, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Design[];
      
      setDesigns(list);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { designs, loading };
}