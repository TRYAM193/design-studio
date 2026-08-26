// src/lib/analytics.ts
import { db } from "@/firebase";
import { doc, setDoc, serverTimestamp, collection, addDoc, arrayUnion } from "firebase/firestore";

// Extend Window interface for TypeScript
declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
    clarity?: (...args: any[]) => void;
  }
}

// ─── Session Management ──────────────────────────────────────────────────
const SESSION_KEY = "tryam_analytics_session_id";
const SESSION_START_KEY = "tryam_analytics_session_start";

function getOrCreateSessionId(): string {
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    sessionStorage.setItem(SESSION_KEY, sessionId);
    sessionStorage.setItem(SESSION_START_KEY, Date.now().toString());
  }
  return sessionId;
}

function getSessionDurationSeconds(): number {
  const start = sessionStorage.getItem(SESSION_START_KEY);
  if (!start) return 0;
  return Math.round((Date.now() - parseInt(start, 10)) / 1000);
}

function getDeviceInfo() {
  const ua = navigator.userAgent;
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua) || window.innerWidth < 768;
  return {
    isMobile,
    deviceType: isMobile ? "mobile" : "desktop",
    screenSize: `${window.innerWidth}x${window.innerHeight}`,
    referrer: document.referrer || "direct",
    language: navigator.language || "en",
  };
}

// ─── Debounced Firestore Session Sync ────────────────────────────────────
let pendingSessionUpdates: Record<string, any> = {};
let syncTimeout: any = null;

function queueSessionSync(updates: Record<string, any>) {
  pendingSessionUpdates = { ...pendingSessionUpdates, ...updates };

  if (syncTimeout) clearTimeout(syncTimeout);

  syncTimeout = setTimeout(async () => {
    try {
      const sessionId = getOrCreateSessionId();
      const sessionRef = doc(db, "analytics_sessions", sessionId);
      const payload = {
        ...pendingSessionUpdates,
        lastActiveAt: serverTimestamp(),
        durationSeconds: getSessionDurationSeconds(),
      };
      
      await setDoc(sessionRef, payload, { merge: true });
      pendingSessionUpdates = {};
    } catch (err) {
      // Non-blocking telemetry error
      console.debug("[Analytics] Session sync skipped:", err);
    }
  }, 1000);
}

// ─── Core Telemetry Dispatchers ──────────────────────────────────────────

/**
 * Send an event to Google Analytics 4, Microsoft Clarity, and In-House Telemetry
 */
export function trackEvent(eventName: string, properties: Record<string, any> = {}) {
  const sessionId = getOrCreateSessionId();
  const duration = getSessionDurationSeconds();
  const eventPayload = {
    ...properties,
    session_id: sessionId,
    duration_seconds: duration,
    timestamp: new Date().toISOString(),
  };

  // 1. Google Analytics 4
  if (typeof window.gtag === "function") {
    try {
      window.gtag("event", eventName, eventPayload);
    } catch (e) {
      console.debug("[GA4] Event dispatch error:", e);
    }
  }

  // 2. Microsoft Clarity
  if (typeof window.clarity === "function") {
    try {
      window.clarity("event", eventName);
      // Set key tags in Clarity for easy session filtering
      if (properties.page) window.clarity("set", "current_page", String(properties.page));
      if (properties.action) window.clarity("set", "last_action", String(properties.action));
      if (properties.productId) window.clarity("set", "product_id", String(properties.productId));
    } catch (e) {
      console.debug("[Clarity] Event dispatch error:", e);
    }
  }

  // 3. In-House Session Trail Logging
  const trailItem = {
    event: eventName,
    path: window.location.pathname,
    timeOffsetSeconds: duration,
    meta: properties,
  };

  const sessionUpdate: Record<string, any> = {
    lastEvent: eventName,
    lastPath: window.location.pathname,
    eventTrail: arrayUnion(trailItem),
  };

  // Mark milestone flags on the session doc for high-level funnel filtering
  if (eventName === "magic_prompt_generated") sessionUpdate.usedMagicPrompt = true;
  if (eventName === "editor_opened") sessionUpdate.openedEditor = true;
  if (eventName === "editor_add_to_cart" || eventName === "add_to_cart") sessionUpdate.addedToCart = true;
  if (eventName === "checkout_started") sessionUpdate.reachedCheckout = true;
  if (eventName === "checkout_payment_success" || eventName === "order_completed") sessionUpdate.completedOrder = true;

  queueSessionSync(sessionUpdate);
}

// ─── Specialized Journey Trackers ────────────────────────────────────────

/**
 * Track route changes and page views
 */
export function trackPageView(pathname: string, title?: string) {
  const sessionId = getOrCreateSessionId();
  const device = getDeviceInfo();

  // Initial session setup if new
  queueSessionSync({
    sessionId,
    deviceType: device.deviceType,
    isMobile: device.isMobile,
    screenSize: device.screenSize,
    referrer: device.referrer,
    landingPage: sessionStorage.getItem("tryam_landing_page") || pathname,
    currentPath: pathname,
    pathHistory: arrayUnion({
      path: pathname,
      title: title || document.title,
      timestamp: new Date().toISOString(),
      timeOffsetSeconds: getSessionDurationSeconds(),
    }),
  });

  if (!sessionStorage.getItem("tryam_landing_page")) {
    sessionStorage.setItem("tryam_landing_page", pathname);
  }

  trackEvent("page_view", {
    page_path: pathname,
    page_title: title || document.title,
  });
}

/**
 * Track Magic Prompt interactions on the landing page
 */
export function trackMagicPrompt(action: "prompt_typed" | "generated" | "error" | "editor_clicked", meta: Record<string, any> = {}) {
  trackEvent(`magic_prompt_${action}`, {
    feature: "magic_prompt",
    ...meta,
  });
}

/**
 * Track Editor actions (design creation, tools used, 3d previews)
 */
export function trackEditorAction(action: "opened" | "ai_generate" | "add_text" | "add_image" | "preview_3d" | "save_design" | "add_to_cart" | "buy_now", meta: Record<string, any> = {}) {
  trackEvent(`editor_${action}`, {
    feature: "design_editor",
    ...meta,
  });
}

/**
 * Track Cart actions
 */
export function trackCartAction(action: "view" | "quantity_change" | "item_removed" | "proceed_checkout", meta: Record<string, any> = {}) {
  trackEvent(`cart_${action}`, {
    feature: "cart",
    ...meta,
  });
}

/**
 * Track Checkout & Payment funnels
 */
export function trackCheckoutStep(step: "started" | "shipping_entered" | "payment_selected" | "payment_success" | "payment_failed", meta: Record<string, any> = {}) {
  trackEvent(`checkout_${step}`, {
    feature: "checkout",
    ...meta,
  });
}

/**
 * Track exit intent or abandonment reason
 */
export async function trackExitFeedback(reason: string, details?: string) {
  const sessionId = getOrCreateSessionId();
  trackEvent("exit_intent_feedback", { reason, details });

  try {
    await addDoc(collection(db, "exit_feedback"), {
      sessionId,
      reason,
      details: details || "",
      path: window.location.pathname,
      durationSeconds: getSessionDurationSeconds(),
      device: getDeviceInfo(),
      createdAt: serverTimestamp(),
    });
  } catch (err) {
    console.debug("[Analytics] Failed to save exit feedback:", err);
  }
}
