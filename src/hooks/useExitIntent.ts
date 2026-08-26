// src/hooks/useExitIntent.ts
import { useState, useEffect, useCallback } from "react";
import { useLocation } from "react-router";

interface UseExitIntentOptions {
  enabled?: boolean;
  idleTimeoutMs?: number;
}

export function useExitIntent({ enabled = true, idleTimeoutMs = 60000 }: UseExitIntentOptions = {}) {
  const [showExitModal, setShowExitModal] = useState(false);
  const location = useLocation();

  const triggerExitIntent = useCallback(() => {
    // Only show once per session
    if (sessionStorage.getItem("tryam_exit_intent_shown")) return;

    // Do not trigger on admin, render, or auth pages
    if (location.pathname.startsWith("/admin") || location.pathname.startsWith("/render") || location.pathname === "/auth") {
      return;
    }

    sessionStorage.setItem("tryam_exit_intent_shown", "true");
    setShowExitModal(true);
  }, [location.pathname]);

  const dismissModal = () => {
    setShowExitModal(false);
  };

  useEffect(() => {
    if (!enabled) return;

    // 1. Desktop: Mouse Leaving Top of Window
    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger when mouse moves within 15px of the top edge
      if (e.clientY <= 15) {
        triggerExitIntent();
      }
    };

    // 2. Idle Timer on high-intent pages (/design, /cart, /checkout)
    let idleTimer: any = null;
    const isHighIntentPage = ["/design", "/cart", "/checkout"].some(p => location.pathname.startsWith(p));

    const resetIdleTimer = () => {
      if (!isHighIntentPage) return;
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        triggerExitIntent();
      }, idleTimeoutMs);
    };

    window.addEventListener("mousemove", handleMouseLeave);
    window.addEventListener("scroll", resetIdleTimer, { passive: true });
    window.addEventListener("keydown", resetIdleTimer);
    window.addEventListener("click", resetIdleTimer);

    if (isHighIntentPage) {
      resetIdleTimer();
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseLeave);
      window.removeEventListener("scroll", resetIdleTimer);
      window.removeEventListener("keydown", resetIdleTimer);
      window.removeEventListener("click", resetIdleTimer);
      if (idleTimer) clearTimeout(idleTimer);
    };
  }, [enabled, location.pathname, idleTimeoutMs, triggerExitIntent]);

  return { showExitModal, dismissModal };
}
