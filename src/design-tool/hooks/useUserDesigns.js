import { useEffect, useState } from "react";
import { collection, onSnapshot } from "firebase/firestore";
import { db as firestore } from "@/firebase";

export default function useUserDesigns(userId) {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    const designsRef = collection(firestore, `users/${userId}/designs`);

    const unsub = onSnapshot(designsRef, (snapshot) => {
      const list = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Fetched designs:", list);
      setDesigns(list);
      setLoading(false);
    });

    return () => unsub();
  }, [userId]);

  return { designs, loading };
}