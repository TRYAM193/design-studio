// src/hooks/useGlobalTemplates.ts
import { useState, useEffect } from 'react';
import { db } from '@/firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export function useGlobalTemplates() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Query the root 'templates' collection
    const q = query(collection(db, 'templates'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, 
      (snapshot) => {
        const results = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setTemplates(results);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching templates:", err);
        setError("Failed to load templates.");
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  return { templates, loading, error };
}