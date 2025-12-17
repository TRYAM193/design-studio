import admin from "firebase-admin";
import axios from "axios";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./service-account.json");

// --- CONFIGURATION ---
// 🛑 PASTE YOUR PRINTIFY TOKEN HERE
const PRINTIFY_API_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImUxY2EzOGEzMmM2NGM5M2YxNGQ3MTM3MmI1ZmQwZWY1N2ZlOWMzZTVkMDI0YmRlMWE3ODBkNDM4NmZlNDQyOTVmODIzZDA2NmE5YWQxMjE4IiwiaWF0IjoxNzY1OTA3NjA4LjM5MTAxNSwibmJmIjoxNzY1OTA3NjA4LjM5MTAxNywiZXhwIjoxNzk3NDQzNjA4LjM4MjYyMSwic3ViIjoiMjU3MDI3MjEiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.cwmW9eDrWz6Urfizuz-u7JYfYLEH_Q8_oAUsK4fINEfwlVRLaXX-HuNvygiuFBkCPOkK6cQ2nlunOMHzdWVVNdYTHnuo5DRuO0Va5GC3MH9zBwiiMnaYQjtB9upRbKvAF8PkdWfLLzCuqasoVhJswDX3KPpcmESEki7wA0Q-J3AQjyY2OZplGgQzDwJq3ck4AyWgeLrr5Ntd3Pb5OtXQfJoJ5n1W0TfAwYyhVrOnfhjcQd7rZsD29gBHRUNrCJYhoCF44Kv9p9vzfu_fc7AwkKPfl0XTId4x3wYa0GM-cSZ3ATt5Ndc2VSeQkx5FfzJqwkLDWlrnG58dMVNbWuG9EF4NpfJj9wsiWFXzLjLDcBNcD1JbTQMGQDNDbogdNhULVFHBHhX8LEj7F3aF3JjsqO5e3Ivf3hfL68culz4XGkp9LKLypZ1o5c5Csq-9KNOxV08KBYBa76ewenMdCQMXbiMjcZTvTK9cn2twp6cC3Av7mifkFWfy-e1XfJ7x6wjIr5wxzGDYrdQ6SOBPHtiK_J_Az2hwiIaNN7cfnmXt02WFZL8Mvkd58YxPtlwrr9eVJQdc3nSz0sqXv6Zg1_si3gr3JH_MxFZYj7yEO39CPuv-2_6foI6EpGoio6C5JIOqt9rxL9AraAhcdIPRdn6OAw79YIsIbmUQZs7NHYowQEQ"; 
const PRINTIFY_API_TOKEN = "YOUR_PRINTIFY_ACCESS_TOKEN"; 

// --- THE MAPPING (The "Brain") ---
// We map our Qikink IDs (Keys) to Printify Blueprint IDs (Values)
// This tells the script: "For 'mens_cotton_tee', steal the image from Printify ID 12"
const IMAGE_SOURCE_MAP = {
  "mens_cotton_tee": 12,      // Bella+Canvas 3001 (The standard premium tee)
  "unisex_hoodie": 77,        // Gildan 18500 (The standard hoodie)
  "womens_crop_top": 1058,    // Women's Crop Tee
  "oversized_tee": 49,        // Comfort Colors 1717 (The popular oversized tee)
  "ceramic_mug": 68,          // Standard 11oz White Mug
  "unisex_sweatshirt": 78,    // Gildan 18000 (Crewneck Sweatshirt)
  "kids_classic_tee": 10      // Gildan 5000B (Kids)
};

// --- QIKINK CATALOG (India Pricing & Details) ---
const QIKINK_CATALOG = [
  {
    id: "mens_cotton_tee",
    title: "Men's Classic Cotton T-Shirt",
    price_inr: 200,
    category: "Apparel",
    options: { colors: ["White", "Black", "Navy", "Red", "Grey"], sizes: ["S", "M", "L", "XL", "XXL"] }
  },
  {
    id: "unisex_hoodie",
    title: "Unisex Premium Hoodie",
    price_inr: 450,
    category: "Apparel",
    options: { colors: ["Black", "Navy", "Maroon", "Grey"], sizes: ["S", "M", "L", "XL", "XXL"] }
  },
  {
    id: "womens_crop_top",
    title: "Women's Crop Top",
    price_inr: 240,
    category: "Apparel",
    options: { colors: ["White", "Black", "Pink", "Lavender"], sizes: ["XS", "S", "M", "L", "XL"] }
  },
  {
    id: "oversized_tee",
    title: "Streetwear Oversized T-Shirt",
    price_inr: 350,
    category: "Apparel",
    options: { colors: ["Black", "White", "Beige", "Olive"], sizes: ["S", "M", "L", "XL"] }
  },
  {
    id: "unisex_sweatshirt",
    title: "Classic Crew Neck Sweatshirt",
    price_inr: 500,
    category: "Apparel",
    options: { colors: ["Black", "Navy", "Grey"], sizes: ["S", "M", "L", "XL"] }
  },
  {
    id: "ceramic_mug",
    title: "Glossy Ceramic Mug (11oz)",
    price_inr: 120,
    category: "Home & Living",
    options: { colors: ["White"], sizes: ["11oz"] }
  },
  {
    id: "kids_classic_tee",
    title: "Kids Soft Cotton Tee",
    price_inr: 180,
    category: "Kids",
    options: { colors: ["White", "Black", "Yellow", "Blue"], sizes: ["2T", "3T", "4T", "5T"] }
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

  console.log("🚀 Starting Smart Image Seeder...");

  try {
    // 1. Fetch Printify Catalog to get the Real Images
    console.log("📸 Fetching High-Quality Images from Printify...");
    const pRes = await axios.get("https://api.printify.com/v1/catalog/blueprints.json", {
      headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` }
    });
    
    // Build a map: ID -> Image URL
    const imageMap = {};
    pRes.data.forEach(bp => {
      // Printify provides multiple images, we take the first valid model shot
      if (bp.images && bp.images.length > 0) {
        imageMap[bp.id] = bp.images[0];
      }
    });

    // 2. Merge Data and Update Firestore
    console.log("💾 Updating Firestore with Real Images...");

    for (const item of QIKINK_CATALOG) {
      const docRef = db.collection("base_products").doc(item.id);
      
      // Look up the image using our map
      const printifyBlueprintId = IMAGE_SOURCE_MAP[item.id];
      const realImageUrl = imageMap[printifyBlueprintId];

      if (realImageUrl) {
        console.log(`   ✅ Found Model Image for: ${item.title}`);
      } else {
        console.log(`   ⚠️ Image NOT Found for: ${item.title} (Using placeholder)`);
      }

      // Use the real image if found, otherwise a placeholder
      const finalImage = realImageUrl || "https://placehold.co/600x600/png?text=No+Image";

      const productData = {
        id: item.id,
        title: item.title,
        active: true,
        category: item.category,
        image: finalImage, // <--- THIS IS THE FIX
        options: item.options,
        
        providers: {
          india_qikink: {
            active: true,
            provider_id: "qikink",
            base_cost: item.price_inr,
            currency: "INR"
          },
          global_printify: {
            active: true,
            provider_id: "printify",
            blueprint_id: printifyBlueprintId,
            image: finalImage
          }
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      batch.set(docRef, productData, { merge: true });
      count++;
    }

    await batch.commit();
    console.log(`🎉 Successfully updated ${count} products with Printify images!`);

  } catch (error) {
    console.error("❌ Error:", error.message);
    console.log("👉 Tip: Check your PRINTIFY_API_TOKEN in the script.");
  }
}

seedProducts();