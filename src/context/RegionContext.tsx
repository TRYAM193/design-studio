import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useSearchParams } from 'react-router';

// ------------------------------------------------------------------
// 🔐 OBFUSCATION CODES (The "Secret" Codes)
// ------------------------------------------------------------------
const REGION_CODES: Record<string, string> = {
  '2491': 'IN', // India
  '8402': 'US', // USA
  '8263': 'GB', // United Kingdom
  '1244': 'CA', // Canada
  '0000': 'US'  // Default fallback (Global users see US $)
};

// Reverse lookup for URL generation
const REVERSE_CODES: Record<string, string> = Object.entries(REGION_CODES).reduce(
  (acc, [code, region]) => ({ ...acc, [region]: code }), 
  {}
);

// ------------------------------------------------------------------
// 💰 SAFE EXCHANGE RATES MATRIX
// ------------------------------------------------------------------
// Format: BASE_CURRENCY_TO_TARGET_CURRENCY
// We use a buffer to cover FX fees and ensure profit.
const RATES: Record<string, number> = {
  // 1. From USD Base (US Fulfillment)
  'USD_TO_INR': 92.00,  // Real ~84
  'USD_TO_GBP': 0.85,   // Real ~0.79
  'USD_TO_CAD': 1.45,   // Real ~1.35
  
  // 2. From GBP Base (UK Fulfillment)
  'GBP_TO_INR': 120.00, // Real ~108
  'GBP_TO_USD': 1.35,   // Real ~1.26
  'GBP_TO_CAD': 1.85,   // Real ~1.75

  // 3. From CAD Base (Canada Fulfillment)
  'CAD_TO_INR': 70.00,  // Real ~62
  'CAD_TO_USD': 0.80,   // Real ~0.74
  'CAD_TO_GBP': 0.65,   // Real ~0.57

  // 4. From INR Base (India Fulfillment)
  // We mark these up slightly higher to avoid "too cheap" exports
  'INR_TO_USD': 0.025,  // ~₹449 -> $11.22 (Profit boost)
  'INR_TO_GBP': 0.020,  // ~₹449 -> £8.98
  'INR_TO_CAD': 0.035,  // ~₹449 -> C$15.71
};

interface RegionContextType {
  shopperRegion: string;      // Determines CURRENCY (IP Based)
  fulfillmentRegion: string;  // Determines STOCK & BASE PRICE (User Select)
  setFulfillmentRegion: (region: string) => void;
  currencySymbol: string;
  convertPrice: (basePrices: any) => number;
  formatPrice: (basePrices: any) => string;
  isLoading: boolean;
}

const RegionContext = createContext<RegionContextType | undefined>(undefined);

export function RegionProvider({ children }: { children: ReactNode }) {
  const [searchParams] = useSearchParams();
  const [shopperRegion, setShopperRegion] = useState<string>('IN'); 
  const [fulfillmentRegion, setFulfillmentRegion] = useState<string>('IN');
  const [isLoading, setIsLoading] = useState(true);

  // ------------------------------------------------------------------
  // 1. INITIALIZATION LOGIC
  // ------------------------------------------------------------------
  useEffect(() => {
    const init = async () => {
      // A. Check URL for Shared Session (?sid=xxxx)
      const urlSid = searchParams.get('sid');
      const urlDid = searchParams.get('did');

      // B. Check Local Storage (Returning User)
      let detectedRegion = localStorage.getItem('shopper_region') || '';

      // C. Geo-Guard: If no local data, or URL conflict, verify IP
      if (!detectedRegion) {
        try {
          const res = await fetch('https://ipapi.co/json/');
          const data = await res.json();
          // Only allow our supported 4 regions, else default to US
          if (['IN', 'US', 'GB', 'CA'].includes(data.country_code)) {
            detectedRegion = data.country_code;
          } else {
            detectedRegion = 'US'; // Fallback for rest of world
          }
          localStorage.setItem('shopper_region', detectedRegion);
        } catch (e) {
          console.error("IP Check Failed", e);
          detectedRegion = 'US'; // Safety fallback
        }
      }

      // 🛡️ SECURITY: If URL 'sid' exists but conflicts with verified IP for a NEW session,
      // we prioritize IP to prevent price leakage. (Handled by defaulting to IP above).
      // However, if we trust the link (e.g. specifically shared), we could respect it.
      // For now, we trust IP for currency to ensure safety.
      setShopperRegion(detectedRegion);

      // Fulfillment defaults to Shopper's region UNLESS URL explicitly sets it (Shared Design)
      if (urlDid && REGION_CODES[urlDid]) {
        setFulfillmentRegion(REGION_CODES[urlDid]);
      } else {
        setFulfillmentRegion(detectedRegion);
      }

      setIsLoading(false);
      updateUrl(detectedRegion, urlDid ? REGION_CODES[urlDid] : detectedRegion);
    };

    init();
  }, []);

  // ------------------------------------------------------------------
  // 2. HELPER: Update URL Silently
  // ------------------------------------------------------------------
  const updateUrl = (shopper: string, fulfillment: string) => {
    const sCode = REVERSE_CODES[shopper] || '0000';
    const dCode = REVERSE_CODES[fulfillment] || '0000';
    
    const newParams = new URLSearchParams(window.location.search);
    newParams.set('sid', sCode);
    newParams.set('did', dCode);
    
    // Replace state without reload
    window.history.replaceState({}, '', `${window.location.pathname}?${newParams.toString()}`);
  };

  // ------------------------------------------------------------------
  // 3. ACTION: Change Shipping Destination
  // ------------------------------------------------------------------
  const handleFulfillmentChange = (region: string) => {
    if (!['IN', 'US', 'GB', 'CA'].includes(region)) return;
    setFulfillmentRegion(region);
    updateUrl(shopperRegion, region);
  };

  // ------------------------------------------------------------------
  // 4. ENGINE: Pricing Converter
  // ------------------------------------------------------------------
  const getCurrencyCode = (region: string) => {
    switch(region) {
      case 'IN': return 'INR';
      case 'US': return 'USD';
      case 'GB': return 'GBP';
      case 'CA': return 'CAD';
      default: return 'USD';
    }
  };

  const getSymbol = () => {
    switch(shopperRegion) {
      case 'IN': return '₹';
      case 'US': return '$';
      case 'GB': return '£';
      case 'CA': return 'C$';
      default: return '$';
    }
  };

  const convertPrice = (priceMap: any) => {
    if (!priceMap) return 0;

    // A. Determine BASE Price & Currency (From Fulfillment Region)
    const baseVal = priceMap[fulfillmentRegion] || priceMap['US'] || 0;
    const baseCur = getCurrencyCode(fulfillmentRegion);
    
    // B. Determine TARGET Currency (From Shopper Region)
    const targetCur = getCurrencyCode(shopperRegion);

    // C. If Currencies Match -> Return Base
    if (baseCur === targetCur) return baseVal;

    // D. Apply Conversion Rate
    const key = `${baseCur}_TO_${targetCur}`;
    const rate = RATES[key];

    if (rate) {
      return Math.ceil(baseVal * rate);
    }

    // Safety fallback
    return baseVal;
  };

  const formatPrice = (priceMap: any) => {
    const val = convertPrice(priceMap);
    return `${getSymbol()}${val.toFixed(2)}`;
  };

  return (
    <RegionContext.Provider value={{
      shopperRegion,
      fulfillmentRegion,
      setFulfillmentRegion: handleFulfillmentChange,
      currencySymbol: getSymbol(),
      convertPrice,
      formatPrice,
      isLoading
    }}>
      {children}
    </RegionContext.Provider>
  );
}

export const useRegion = () => {
  const context = useContext(RegionContext);
  if (!context) throw new Error("useRegion must be used within RegionProvider");
  return context;
};