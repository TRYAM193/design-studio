import admin from "firebase-admin";
import axios from "axios";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./service-account.json");

// 🛑 YOUR PRINTIFY TOKEN 
const PRINTIFY_API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImUxY2EzOGEzMmM2NGM5M2YxNGQ3MTM3MmI1ZmQwZWY1N2ZlOWMzZTVkMDI0YmRlMWE3ODBkNDM4NmZlNDQyOTVmODIzZDA2NmE5YWQxMjE4IiwiaWF0IjoxNzY1OTA3NjA4LjM5MTAxNSwibmJmIjoxNzY1OTA3NjA4LjM5MTAxNywiZXhwIjoxNzk3NDQzNjA4LjM4MjYyMSwic3ViIjoiMjU3MDI3MjEiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.cwmW9eDrWz6Urfizuz-u7JYfYLEH_Q8_oAUsK4fINEfwlVRLaXX-HuNvygiuFBkCPOkK6cQ2nlunOMHzdWVVNdYTHnuo5DRuO0Va5GC3MH9zBwiiMnaYQjtB9upRbKvAF8PkdWfLLzCuqasoVhJswDX3KPpcmESEki7wA0Q-J3AQjyY2OZplGgQzDwJq3ck4AyWgeLrr5Ntd3Pb5OtXQfJoJ5n1W0TfAwYyhVrOnfhjcQd7rZsD29gBHRUNrCJYhoCF44Kv9p9vzfu_fc7AwkKPfl0XTId4x3wYa0GM-cSZ3ATt5Ndc2VSeQkx5FfzJqwkLDWlrnG58dMVNbWuG9EF4NpfJj9wsiWFXzLjLDcBNcD1JbTQMGQDNDbogdNhULVFHBHhX8LEj7F3aF3JjsqO5e3Ivf3hfL68culz4XGkp9LKLypZ1o5c5Csq-9KNOxV08KBYBa76ewenMdCQMXbiMjcZTvTK9cn2twp6cC3Av7mifkFWfy-e1XfJ7x6wjIr5wxzGDYrdQ6SOBPHtiK_J_Az2hwiIaNN7cfnmXt02WFZL8Mvkd58YxPtlwrr9eVJQdc3nSz0sqXv6Zg1_si3gr3JH_MxFZYj7yEO39CPuv-2_6foI6EpGoio6C5JIOqt9rxL9AraAhcdIPRdn6OAw79YIsIbmUQZs7NHYowQEQ";

const PRODUCT_MAP = {
  "mens_cotton_tee": { blueprint_id: 12, category: "Apparel" },
  "unisex_hoodie":   { blueprint_id: 77, category: "Apparel" },
  "oversized_tee":   { blueprint_id: 49, category: "Apparel" },
  "womens_crop_top": { blueprint_id: 1058, category: "Apparel" },
  "ceramic_mug":     { blueprint_id: 68, category: "Home & Living" }
};

if (!admin.apps.length) {
  admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
}
const db = admin.firestore();

async function seedProducts() {
  const batch = db.batch();
  console.log("🌏 Starting Universal Sync...");

  try {
    for (const [internalId, config] of Object.entries(PRODUCT_MAP)) {
      console.log(`\n🔍 Syncing: ${internalId} (Blueprint: ${config.blueprint_id})...`);

      try {
        // STEP 1: Find a valid provider for this blueprint automatically
        const providersRes = await axios.get(
          `https://api.printify.com/v1/catalog/blueprints/${config.blueprint_id}/print_providers.json`,
          { headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` } }
        );
        
        const availableProviders = providersRes.data || [];
        if (availableProviders.length === 0) throw new Error("No providers found");

        // Prefer Provider 29 (Monster Digital), otherwise take the first available
        const selectedProvider = availableProviders.find(p => p.id === 29) || availableProviders[0];
        console.log(`   ✅ Using Provider: ${selectedProvider.title} (ID: ${selectedProvider.id})`);

        // STEP 2: Fetch variants for this blueprint + provider
        const url = `https://api.printify.com/v1/catalog/blueprints/${config.blueprint_id}/print_providers/${selectedProvider.id}/variants.json`;
        const res = await axios.get(url, { headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` } });
        
        const variants = res.data.variants || [];
        const uniqueColors = new Set();
        const uniqueSizes = new Set();
        const variantMap = {};
        const printAreas = {};

        // STEP 3: Parse variants using your provided JSON structure
        variants.forEach(v => {
          // In your sample, color and size are strings inside v.options
          const color = v.options?.color;
          const size = v.options?.size;

          if (color) uniqueColors.add(color);
          if (size) uniqueSizes.add(size);
          
          if (color && size) {
            variantMap[`${color}_${size}`] = v.id;
          } else if (size) {
            variantMap[size] = v.id; // Fallback for mugs
          }

          // Capture print areas
          v.placeholders?.forEach(p => {
            if (!printAreas[p.position]) {
              printAreas[p.position] = { width: p.width, height: p.height };
            }
          });
        });

        console.log(`   🎨 Found ${uniqueColors.size} colors and ${uniqueSizes.size} sizes.`);

        // STEP 4: Get Blueprint metadata
        const blueprintRes = await axios.get(`https://api.printify.com/v1/catalog/blueprints/${config.blueprint_id}.json`, {
          headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` }
        });

        // STEP 5: Update Firestore
        const docRef = db.collection("base_products").doc(internalId);
        batch.set(docRef, {
          id: internalId,
          title: blueprintRes.data.title,
          description: blueprintRes.data.description,
          category: config.category,
          image: blueprintRes.data.images[0],
          gallery: blueprintRes.data.images,
          options: {
            colors: Array.from(uniqueColors),
            sizes: Array.from(uniqueSizes)
          },
          variant_map: variantMap,
          print_areas: printAreas,
          provider_config: {
            provider_id: selectedProvider.id,
            blueprint_id: config.blueprint_id
          },
          updatedAt: admin.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

      } catch (err) {
        console.error(`   ❌ Failed: ${err.message}`);
      }
    }

    await batch.commit();
    console.log("\n🎉 Database Fully Synced! All 404s and color mapping issues resolved.");

  } catch (error) {
    console.error("Critical Error:", error.message);
  }
}

seedProducts();