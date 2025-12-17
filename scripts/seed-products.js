const admin = require("firebase-admin");
const axios = require("axios");
const serviceAccount = require("./service-account.json");

// --- CONFIGURATION ---
// 🛑 REPLACE THESE WITH YOUR REAL KEYS
const QIKINK_CLIENT_ID = "YOUR_QIKINK_CLIENT_ID";
const QIKINK_CLIENT_SECRET = "YOUR_QIKINK_CLIENT_SECRET";
const PRINTIFY_API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImUxY2EzOGEzMmM2NGM5M2YxNGQ3MTM3MmI1ZmQwZWY1N2ZlOWMzZTVkMDI0YmRlMWE3ODBkNDM4NmZlNDQyOTVmODIzZDA2NmE5YWQxMjE4IiwiaWF0IjoxNzY1OTA3NjA4LjM5MTAxNSwibmJmIjoxNzY1OTA3NjA4LjM5MTAxNywiZXhwIjoxNzk3NDQzNjA4LjM4MjYyMSwic3ViIjoiMjU3MDI3MjEiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.cwmW9eDrWz6Urfizuz-u7JYfYLEH_Q8_oAUsK4fINEfwlVRLaXX-HuNvygiuFBkCPOkK6cQ2nlunOMHzdWVVNdYTHnuo5DRuO0Va5GC3MH9zBwiiMnaYQjtB9upRbKvAF8PkdWfLLzCuqasoVhJswDX3KPpcmESEki7wA0Q-J3AQjyY2OZplGgQzDwJq3ck4AyWgeLrr5Ntd3Pb5OtXQfJoJ5n1W0TfAwYyhVrOnfhjcQd7rZsD29gBHRUNrCJYhoCF44Kv9p9vzfu_fc7AwkKPfl0XTId4x3wYa0GM-cSZ3ATt5Ndc2VSeQkx5FfzJqwkLDWlrnG58dMVNbWuG9EF4NpfJj9wsiWFXzLjLDcBNcD1JbTQMGQDNDbogdNhULVFHBHhX8LEj7F3aF3JjsqO5e3Ivf3hfL68culz4XGkp9LKLypZ1o5c5Csq-9KNOxV08KBYBa76ewenMdCQMXbiMjcZTvTK9cn2twp6cC3Av7mifkFWfy-e1XfJ7x6wjIr5wxzGDYrdQ6SOBPHtiK_J_Az2hwiIaNN7cfnmXt02WFZL8Mvkd58YxPtlwrr9eVJQdc3nSz0sqXv6Zg1_si3gr3JH_MxFZYj7yEO39CPuv-2_6foI6EpGoio6C5JIOqt9rxL9AraAhcdIPRdn6OAw79YIsIbmUQZs7NHYowQEQ"; 

// 🛑 PRE-DEFINED MAPPINGS (The "Brain" of the operation)
// We map Provider specific IDs to our "Universal IDs"
const UNIVERSAL_MAP = {
  // T-SHIRTS
  "Men's T-Shirt": "mens_cotton_tee",       // Qikink Name
  "Unisex Jersey Short Sleeve Tee": "mens_cotton_tee", // Printify Name (Bella+Canvas 3001)
  
  // HOODIES
  "Unisex Hoodie": "unisex_hoodie",         // Qikink Name
  "Unisex Heavy Blend™ Hooded Sweatshirt": "unisex_hoodie", // Printify Name (Gildan 18500)

  // CROP TOPS
  "Crop Top": "womens_crop_top",            // Qikink Name
  "Women’s Crop Tee": "womens_crop_top"     // Printify Name
};

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

// --- HELPERS ---

async function getQikinkToken() {
  console.log("🔐 Authenticating with Qikink...");
  try {
    const res = await axios.post("https://api.qik.dev/api/oauth/token", {
      grant_type: "client_credentials",
      client_id: QIKINK_CLIENT_ID,
      client_secret: QIKINK_CLIENT_SECRET,
      scope: "items" 
    });
    return res.data.access_token;
  } catch (error) {
    console.error("❌ Qikink Auth Failed:", error.response?.data || error.message);
    return null;
  }
}

async function fetchPrintifyBlueprints() {
  console.log("🌍 Fetching Printify Catalog...");
  try {
    const res = await axios.get("https://api.printify.com/v1/catalog/blueprints.json", {
      headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` }
    });
    return res.data;
  } catch (error) {
    console.error("❌ Printify Fetch Failed:", error.response?.data || error.message);
    return [];
  }
}

async function getPrintifyVariants(blueprintId, printProviderId) {
  try {
    // Fetch variants for a specific blueprint from a specific provider (e.g., Monster Digital = 29)
    const res = await axios.get(
      `https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${printProviderId}/variants.json`,
      { headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` } }
    );
    return res.data.variants;
  } catch (error) {
    console.log(`⚠️ Could not fetch variants for Blueprint ${blueprintId}`);
    return [];
  }
}

// --- MAIN SEED FUNCTION ---

async function seedProducts() {
  const batch = db.batch();
  let count = 0;

  // 1. Process Qikink (India)
  const qToken = await getQikinkToken();
  if (qToken) {
    console.log("🇮🇳 Processing Qikink Products...");
    const qikRes = await axios.get("https://api.qik.dev/api/v1/items", {
      headers: { "Authorization": `Bearer ${qToken}` }
    });
    const qProducts = qikRes.data.data || [];

    for (const item of qProducts) {
      const universalId = UNIVERSAL_MAP[item.name];
      if (!universalId) continue; // Skip items we haven't mapped

      const docRef = db.collection("base_products").doc(universalId);
      
      // Update ONLY the India section
      batch.set(docRef, {
        id: universalId,
        title: item.name, // Use Qikink name as fallback title
        active: true,
        options: {
            colors: ["White", "Black", "Navy", "Red"], // Simplified for example
            sizes: ["S", "M", "L", "XL", "2XL"]
        },
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
      console.log(`   MATCH: ${item.name} -> ${universalId}`);
    }
  }

  // 2. Process Printify (Global)
  const pProducts = await fetchPrintifyBlueprints();
  if (pProducts.length > 0) {
    console.log("🇺🇸 Processing Printify Products...");
    
    for (const item of pProducts) {
      const universalId = UNIVERSAL_MAP[item.title];
      if (!universalId) continue;

      const docRef = db.collection("base_products").doc(universalId);

      // We need to pick a Print Provider. ID 29 is "Monster Digital" (Popular US Provider)
      // In a real app, you might fetch the list of providers and pick the cheapest.
      const PREFERRED_PROVIDER_ID = 29; 
      
      // Fetch specific variant IDs (S, M, L) for this provider
      const variants = await getPrintifyVariants(item.id, PREFERRED_PROVIDER_ID);
      
      // Map variants to our simple structure (Size -> Variant ID)
      const variantMap = {};
      variants.forEach(v => {
          // Printify options are complex, we simplify:
          // v.options might be [123, 456] where 123=White, 456=Size S
          // For this seeder, we just store the raw array to process later
          variantMap[v.id] = v.options; 
      });

      // Update ONLY the Global section
      batch.set(docRef, {
        providers: {
          global_printify: {
            active: true,
            provider_id: "printify",
            blueprint_id: item.id,
            print_provider_id: PREFERRED_PROVIDER_ID,
            title: item.title,
            image: item.images[0],
            base_cost: 800, // Approx cents (e.g. $8.00)
            currency: "USD",
            variant_map: variantMap
          }
        }
      }, { merge: true });

      count++;
      console.log(`   MATCH: ${item.title} -> ${universalId}`);
    }
  }

  // 3. Commit
  if (count > 0) {
    await batch.commit();
    console.log(`✅ Database Updated! ${count} products merged.`);
  } else {
    console.log("⚠️ No matching products found. Check your UNIVERSAL_MAP.");
  }
}

seedProducts();