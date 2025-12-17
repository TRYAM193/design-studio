import admin from "firebase-admin";
import axios from "axios";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./service-account.json");

// --- CONFIGURATION ---
// 🛑 PASTE YOUR TOKENS DIRECTLY HERE
const QIKINK_ACCESS_TOKEN = "PASTE_YOUR_LONG_QIKINK_TOKEN_HERE"; 
const PRINTIFY_API_TOKEN = "YOUR_PRINTIFY_ACCESS_TOKEN"; 

// 🛑 PRE-DEFINED MAPPINGS
const UNIVERSAL_MAP = {
  "Men's T-Shirt": "mens_cotton_tee",
  "Unisex Jersey Short Sleeve Tee": "mens_cotton_tee",
  "Unisex Hoodie": "unisex_hoodie",
  "Unisex Heavy Blend™ Hooded Sweatshirt": "unisex_hoodie",
  "Crop Top": "womens_crop_top",
  "Women’s Crop Tee": "womens_crop_top"
};

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- MAIN SEED FUNCTION ---
async function seedProducts() {
  const batch = db.batch();
  let count = 0;

  // 1. Process Qikink (India)
  console.log("🇮🇳 Fetching Qikink Catalog...");
  try {
    const qikRes = await axios.get("https://api.qik.dev/v1/products", { // Try this endpoint first
      headers: { "Authorization": `Bearer ${QIKINK_ACCESS_TOKEN}` }
    });
    // Fallback if the first URL fails, try /api/v1/items or similar
    // Note: If you get a 401 Unauthorized, your Token is wrong.
    
    const qProducts = qikRes.data.products || qikRes.data.data || [];
    console.log(`   Found ${qProducts.length} Qikink items.`);

    for (const item of qProducts) {
      const universalId = UNIVERSAL_MAP[item.name];
      if (!universalId) continue;

      const docRef = db.collection("base_products").doc(universalId);
      
      batch.set(docRef, {
        id: universalId,
        title: item.name,
        active: true,
        options: { colors: ["White", "Black", "Navy"], sizes: ["S", "M", "L", "XL"] },
        providers: {
          india_qikink: {
            active: true,
            provider_id: "qikink",
            external_id: item.id,
            base_cost: item.price || 200,
            currency: "INR"
          }
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      count++;
      console.log(`   MATCH (IN): ${item.name} -> ${universalId}`);
    }
  } catch (error) {
    console.error("❌ Qikink Error:", error.response?.status, error.response?.statusText);
    if (error.response?.status === 404) console.log("   -> Try changing URL to 'https://api.qik.dev/api/v1/items'");
  }

  // 2. Process Printify (Global)
  console.log("🇺🇸 Fetching Printify Catalog...");
  try {
    const pRes = await axios.get("https://api.printify.com/v1/catalog/blueprints.json", {
      headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` }
    });
    
    for (const item of pRes.data) {
      const universalId = UNIVERSAL_MAP[item.title];
      if (!universalId) continue;

      const docRef = db.collection("base_products").doc(universalId);
      
      // Fetch Variants for Monster Digital (ID: 29)
      const vRes = await axios.get(
        `https://api.printify.com/v1/catalog/blueprints/${item.id}/print_providers/29/variants.json`,
        { headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` } }
      ).catch(() => ({ data: { variants: [] } }));

      const variantMap = {};
      vRes.data.variants.forEach(v => variantMap[v.id] = v.options);

      batch.set(docRef, {
        providers: {
          global_printify: {
            active: true,
            provider_id: "printify",
            blueprint_id: item.id,
            print_provider_id: 29,
            base_cost: 800,
            currency: "USD",
            variant_map: variantMap
          }
        }
      }, { merge: true });

      count++;
      console.log(`   MATCH (US): ${item.title} -> ${universalId}`);
    }
  } catch (error) {
    console.error("❌ Printify Error:", error.message);
  }

  // 3. Commit
  if (count > 0) {
    await batch.commit();
    console.log(`✅ Database Updated! ${count} products merged.`);
  }
}

seedProducts();