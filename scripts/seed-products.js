import admin from "firebase-admin";
import axios from "axios";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./service-account.json");

// --- CONFIGURATION ---
// 🛑 PASTE YOUR PRINTIFY TOKEN HERE
const PRINTIFY_API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImUxY2EzOGEzMmM2NGM5M2YxNGQ3MTM3MmI1ZmQwZWY1N2ZlOWMzZTVkMDI0YmRlMWE3ODBkNDM4NmZlNDQyOTVmODIzZDA2NmE5YWQxMjE4IiwiaWF0IjoxNzY1OTA3NjA4LjM5MTAxNSwibmJmIjoxNzY1OTA3NjA4LjM5MTAxNywiZXhwIjoxNzk3NDQzNjA4LjM4MjYyMSwic3ViIjoiMjU3MDI3MjEiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.cwmW9eDrWz6Urfizuz-u7JYfYLEH_Q8_oAUsK4fINEfwlVRLaXX-HuNvygiuFBkCPOkK6cQ2nlunOMHzdWVVNdYTHnuo5DRuO0Va5GC3MH9zBwiiMnaYQjtB9upRbKvAF8PkdWfLLzCuqasoVhJswDX3KPpcmESEki7wA0Q-J3AQjyY2OZplGgQzDwJq3ck4AyWgeLrr5Ntd3Pb5OtXQfJoJ5n1W0TfAwYyhVrOnfhjcQd7rZsD29gBHRUNrCJYhoCF44Kv9p9vzfu_fc7AwkKPfl0XTId4x3wYa0GM-cSZ3ATt5Ndc2VSeQkx5FfzJqwkLDWlrnG58dMVNbWuG9EF4NpfJj9wsiWFXzLjLDcBNcD1JbTQMGQDNDbogdNhULVFHBHhX8LEj7F3aF3JjsqO5e3Ivf3hfL68culz4XGkp9LKLypZ1o5c5Csq-9KNOxV08KBYBa76ewenMdCQMXbiMjcZTvTK9cn2twp6cC3Av7mifkFWfy-e1XfJ7x6wjIr5wxzGDYrdQ6SOBPHtiK_J_Az2hwiIaNN7cfnmXt02WFZL8Mvkd58YxPtlwrr9eVJQdc3nSz0sqXv6Zg1_si3gr3JH_MxFZYj7yEO39CPuv-2_6foI6EpGoio6C5JIOqt9rxL9AraAhcdIPRdn6OAw79YIsIbmUQZs7NHYowQEQ"; 

// --- MAPPING LOGIC ---
// We map our "Universal IDs" to the specific Printify Blueprint IDs 
// so we can steal their images.
const IMAGE_SOURCE_MAP = {
  "mens_cotton_tee": 12,      // Bella+Canvas 3001 (Men's Tee)
  "unisex_hoodie": 77,        // Gildan 18500 (Hoodie)
  "womens_crop_top": 1058,    // Example Crop Top ID (Check Printify for exact ID)
  "oversized_tee": 12         // Using Tee as placeholder if Oversized not found
};

const QIKINK_CATALOG = [
  {
    id: "mens_cotton_tee",
    title: "Men's Classic Cotton T-Shirt",
    price_inr: 200
  },
  {
    id: "unisex_hoodie",
    title: "Unisex Premium Hoodie",
    price_inr: 450
  },
  {
    id: "womens_crop_top",
    title: "Women's Crop Top",
    price_inr: 240
  }
];

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function seedProducts() {
  const batch = db.batch();
  let count = 0;

  console.log("🚀 Starting Smart Seeder...");

  try {
    // 1. Fetch Printify Catalog to get the Images
    console.log("📸 Fetching High-Quality Images from Printify...");
    const pRes = await axios.get("https://api.printify.com/v1/catalog/blueprints.json", {
      headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` }
    });
    
    // Create a lookup map: Blueprint ID -> Image URL
    const imageMap = {};
    pRes.data.forEach(bp => {
      // Printify gives images in an array, we take the first one
      if (bp.images && bp.images.length > 0) {
        imageMap[bp.id] = bp.images[0];
      }
    });

    // 2. Update Database with Merged Data
    console.log("💾 Updating Firestore...");

    for (const item of QIKINK_CATALOG) {
      const docRef = db.collection("base_products").doc(item.id);
      
      // Find the matching image
      const printifyBlueprintId = IMAGE_SOURCE_MAP[item.id];
      const realImageUrl = imageMap[printifyBlueprintId] || "";

      if (realImageUrl) {
        console.log(`   ✅ Found Image for ${item.title}`);
      } else {
        console.log(`   ⚠️ No Image found for ${item.title} (Using placeholder)`);
      }

      batch.set(docRef, {
        id: item.id,
        title: item.title,
        active: true,
        // HERE IS THE MAGIC: We save the Printify Image URL as the main image
        image: realImageUrl || "https://placehold.co/600x600?text=No+Image",
        
        options: { 
          colors: ["White", "Black", "Navy", "Red"], 
          sizes: ["S", "M", "L", "XL", "XXL"] 
        },
        
        providers: {
          india_qikink: {
            active: true,
            provider_id: "qikink",
            base_cost: item.price_inr,
            currency: "INR"
          },
          // We keep Printify data ready for global expansion
          global_printify: {
            active: true,
            provider_id: "printify",
            blueprint_id: printifyBlueprintId,
            image: realImageUrl
          }
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      count++;
    }

    await batch.commit();
    console.log(`🎉 Success! Updated ${count} products with Real Images.`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

seedProducts();