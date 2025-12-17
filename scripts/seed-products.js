const PRINTIFY_API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImUxY2EzOGEzMmM2NGM5M2YxNGQ3MTM3MmI1ZmQwZWY1N2ZlOWMzZTVkMDI0YmRlMWE3ODBkNDM4NmZlNDQyOTVmODIzZDA2NmE5YWQxMjE4IiwiaWF0IjoxNzY1OTA3NjA4LjM5MTAxNSwibmJmIjoxNzY1OTA3NjA4LjM5MTAxNywiZXhwIjoxNzk3NDQzNjA4LjM4MjYyMSwic3ViIjoiMjU3MDI3MjEiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.cwmW9eDrWz6Urfizuz-u7JYfYLEH_Q8_oAUsK4fINEfwlVRLaXX-HuNvygiuFBkCPOkK6cQ2nlunOMHzdWVVNdYTHnuo5DRuO0Va5GC3MH9zBwiiMnaYQjtB9upRbKvAF8PkdWfLLzCuqasoVhJswDX3KPpcmESEki7wA0Q-J3AQjyY2OZplGgQzDwJq3ck4AyWgeLrr5Ntd3Pb5OtXQfJoJ5n1W0TfAwYyhVrOnfhjcQd7rZsD29gBHRUNrCJYhoCF44Kv9p9vzfu_fc7AwkKPfl0XTId4x3wYa0GM-cSZ3ATt5Ndc2VSeQkx5FfzJqwkLDWlrnG58dMVNbWuG9EF4NpfJj9wsiWFXzLjLDcBNcD1JbTQMGQDNDbogdNhULVFHBHhX8LEj7F3aF3JjsqO5e3Ivf3hfL68culz4XGkp9LKLypZ1o5c5Csq-9KNOxV08KBYBa76ewenMdCQMXbiMjcZTvTK9cn2twp6cC3Av7mifkFWfy-e1XfJ7x6wjIr5wxzGDYrdQ6SOBPHtiK_J_Az2hwiIaNN7cfnmXt02WFZL8Mvkd58YxPtlwrr9eVJQdc3nSz0sqXv6Zg1_si3gr3JH_MxFZYj7yEO39CPuv-2_6foI6EpGoio6C5JIOqt9rxL9AraAhcdIPRdn6OAw79YIsIbmUQZs7NHYowQEQ"; 
import admin from "firebase-admin";
import axios from "axios";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./service-account.json");

// --- CONFIGURATION ---

// --- QIKINK STATIC DATA (Since they don't have a Catalog API) ---
// I have manually mapped their most popular products here for you.
const QIKINK_CATALOG = [
  {
    id: "mens_cotton_tee",
    title: "Men's Classic Cotton T-Shirt",
    qikink_ref: "Men's Round Neck", // This is for your reference
    options: {
      colors: ["White", "Black", "Navy Blue", "Red", "Melange Grey", "Yellow"],
      sizes: ["S", "M", "L", "XL", "XXL"]
    },
    price_inr: 200 // Approximate base cost
  },
  {
    id: "unisex_hoodie",
    title: "Unisex Premium Hoodie",
    qikink_ref: "Unisex Hoodie",
    options: {
      colors: ["Black", "Navy Blue", "Melange Grey", "Red"],
      sizes: ["S", "M", "L", "XL", "XXL"]
    },
    price_inr: 450
  },
  {
    id: "womens_crop_top",
    title: "Women's Crop Top",
    qikink_ref: "Crop Top",
    options: {
      colors: ["White", "Black", "Pink", "Lavender"],
      sizes: ["XS", "S", "M", "L", "XL"]
    },
    price_inr: 240
  },
  {
    id: "oversized_tee",
    title: "Unisex Oversized T-Shirt",
    qikink_ref: "Oversized Tee",
    options: {
      colors: ["Black", "White", "Beige", "Olive Green"],
      sizes: ["S", "M", "L", "XL"]
    },
    price_inr: 320
  }
];

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

  console.log("🚀 Starting Super Seeder...");

  // 1. Process Qikink (From Static List)
  console.log("🇮🇳 Seeding Qikink Products (Static)...");
  for (const item of QIKINK_CATALOG) {
    const docRef = db.collection("base_products").doc(item.id);
    
    batch.set(docRef, {
      id: item.id,
      title: item.title,
      active: true,
      options: item.options,
      providers: {
        india_qikink: {
          active: true,
          provider_id: "qikink",
          external_ref: item.qikink_ref, // Just a label, since we can't link via API yet
          base_cost: item.price_inr,
          currency: "INR"
        }
      },
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    
    count++;
    console.log(`   MATCH (IN): ${item.title} -> ${item.id}`);
  }

  // 2. Process Printify (From Live API)
  console.log("🇺🇸 Fetching Printify Catalog...");
  try {
    const pRes = await axios.get("https://api.printify.com/v1/catalog/blueprints.json", {
      headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` }
    });
    
    // Map Printify names to our Universal IDs
    const PRINTIFY_MAP = {
      "Unisex Jersey Short Sleeve Tee": "mens_cotton_tee",
      "Unisex Heavy Blend™ Hooded Sweatshirt": "unisex_hoodie",
      "Women’s Crop Tee": "womens_crop_top",
      "Unisex Heavy Cotton™ Tee": "oversized_tee" // Approximate match
    };

    for (const item of pRes.data) {
      const universalId = PRINTIFY_MAP[item.title];
      if (!universalId) continue;

      const docRef = db.collection("base_products").doc(universalId);
      
      // We use Monster Digital (ID 29) as the default US provider
      const PREFERRED_PROVIDER_ID = 29; 

      batch.set(docRef, {
        providers: {
          global_printify: {
            active: true,
            provider_id: "printify",
            blueprint_id: item.id,
            print_provider_id: PREFERRED_PROVIDER_ID,
            title: item.title,
            image: item.images[0],
            base_cost: 800, // Placeholder $8.00 (Printify API doesn't give price in this list)
            currency: "USD"
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