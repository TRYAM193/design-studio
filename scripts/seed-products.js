import admin from "firebase-admin";
import axios from "axios";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./service-account.json");

// 🛑 PASTE YOUR PRINTIFY TOKEN HERE
const PRINTIFY_API_TOKEN = "YOUR_PRINTIFY_ACCESS_TOKEN"; 

// --- THE HYBRID MAP ---
// We map our Internal IDs to Printify Blueprint IDs.
const PRODUCT_MAP = {
  "mens_cotton_tee": 12,      // Bella+Canvas 3001
  "unisex_hoodie": 77,        // Gildan 18500
  "womens_crop_top": 1058,    // Women's Crop
  "oversized_tee": 49,        // Comfort Colors 1717
  "ceramic_mug": 68           // 11oz Mug
};

// --- MANUAL DETAILS (To keep pricing/titles clean) ---
const PRODUCT_DETAILS = {
  "mens_cotton_tee": {
    title: "Men's Classic Cotton T-Shirt",
    description: "A staple of any wardrobe. 100% Ring-Spun Cotton.",
    qikink_cost: 200,
    category: "Apparel"
  },
  "unisex_hoodie": {
    title: "Premium Unisex Hoodie",
    description: "Warm, cozy and perfect for printing.",
    qikink_cost: 450,
    category: "Apparel"
  },
  "womens_crop_top": {
    title: "Women's Crop Top",
    description: "Trendy, relaxed fit crop top.",
    qikink_cost: 240,
    category: "Apparel"
  },
  "oversized_tee": {
    title: "Streetwear Oversized T-Shirt",
    description: "Drop shoulder, loose fit. The ultimate streetwear essential.",
    qikink_cost: 320,
    category: "Apparel"
  },
  "ceramic_mug": {
    title: "Glossy Ceramic Mug (11oz)",
    description: "Durable white ceramic mug. Microwave safe.",
    qikink_cost: 120,
    category: "Home & Living"
  }
};

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function seedProducts() {
  const batch = db.batch();
  console.log("🌏 Starting Printify Image Sync...");

  try {
    for (const [internalId, blueprintId] of Object.entries(PRODUCT_MAP)) {
      const details = PRODUCT_DETAILS[internalId];
      console.log(`\n📸 Fetching images for: ${details.title} (ID: ${blueprintId})...`);

      // 1. CALL PRINTIFY API
      let imageUrls = [];
      try {
        const res = await axios.get(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}`, {
          headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` }
        });
        
        // Printify returns strictly URLs in the 'images' array
        imageUrls = res.data.images || [];
        console.log(`   ✅ Found ${imageUrls.length} images.`);
      } catch (err) {
        console.error(`   ❌ Failed to fetch from Printify: ${err.message}`);
        // Fallback if API fails
        imageUrls = ["https://placehold.co/600x600?text=No+Image"]; 
      }

      // 2. PREPARE DATA
      const docRef = db.collection("base_products").doc(internalId);
      
      batch.set(docRef, {
        id: internalId,
        title: details.title,
        description: details.description,
        active: true,
        stock_status: "in_stock",
        category: details.category,
        
        // MAIN IMAGE (Use the first one found)
        image: imageUrls[0], 
        
        // FULL GALLERY (We save ALL images here)
        gallery: imageUrls, 

        options: { 
          colors: ["White", "Black", "Navy", "Red", "Grey"], 
          sizes: ["S", "M", "L", "XL", "XXL"] 
        },
        
        providers: {
          india_qikink: {
            active: true,
            provider_id: "qikink",
            base_cost: details.qikink_cost,
            currency: "INR"
          },
          global_printify: {
            active: true,
            provider_id: "printify",
            blueprint_id: blueprintId,
            base_cost: details.qikink_cost * 4, // Rough conversion for comparison
            currency: "INR"
          }
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    await batch.commit();
    console.log("\n🎉 Database updated! You now have REAL Printify images.");

  } catch (error) {
    console.error("Critical Error:", error);
  }
}

seedProducts();