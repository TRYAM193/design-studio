// src/hooks/useDailyLimits.js
import { useState, useEffect } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase';
import { useAuth } from '@/hooks/use-auth';

export function useDailyLimits() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ cheap_count: 0, gen_count: 0 });
  
  const GEN_LIMIT = 5;   // Visible
  const CHEAP_LIMIT = 50; // Invisible (Safety)

  useEffect(() => {
    if (!user) return;

    const today = new Date().toISOString().split('T')[0];
    const docRef = doc(db, `users/${user.uid}/daily_stats/${today}`);

    const unsubscribe = onSnapshot(docRef, (doc) => {
      if (doc.exists()) {
        setStats(doc.data());
      } else {
        setStats({ cheap_count: 0, gen_count: 0 });
      }
    });

    return () => unsubscribe();
  }, [user]);

  return { 
    genUsed: stats.gen_count || 0,
    genRemaining: Math.max(0, GEN_LIMIT - (stats.gen_count || 0)),
    genLimit: GEN_LIMIT,
    
    // We strictly use this for internal logic, not to show the user
    cheapUsed: stats.cheap_count || 0,
    isCheapLimitReached: (stats.cheap_count || 0) >= CHEAP_LIMIT
  };
}