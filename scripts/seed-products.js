import admin from "firebase-admin";
import axios from "axios";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./service-account.json");

// 🛑 PASTE YOUR PRINTIFY TOKEN HERE
const PRINTIFY_API_TOKEN = "YOUR_PRINTIFY_ACCESS_TOKEN"; 

// --- PRODUCT MAPPING ---
const PRODUCT_MAP = {
  "mens_cotton_tee": 12,      // Bella+Canvas 3001
  "unisex_hoodie": 77,        // Gildan 18500
  "womens_crop_top": 1058,    // Women's Crop
  "oversized_tee": 49,        // Comfort Colors 1717
  "ceramic_mug": 68           // 11oz Mug
};

// --- CONFIGURATION ---
// 1. We remove manual titles (we will get them from API)
// 2. We add 'main_image_index' to pick the best photo (0 = first, 1 = second, etc.)
const PRODUCT_CONFIG = {
  "mens_cotton_tee": {
    main_image_index: 2, // <--- Change this to pick a different specific image
    category: "Apparel",
    qikink_cost: 200, 
    printify_cost: 900
  },
  "unisex_hoodie": {
    main_image_index: 0, // Default to first
    category: "Apparel",
    qikink_cost: 450,
    printify_cost: 1600
  },
  "womens_crop_top": {
    main_image_index: 1, // Maybe the 2nd image is a better model shot?
    category: "Apparel",
    qikink_cost: 240,
    printify_cost: 1200
  },
  "oversized_tee": {
    main_image_index: 0,
    category: "Apparel",
    qikink_cost: 320,
    printify_cost: 1400
  },
  "ceramic_mug": {
    main_image_index: 0,
    category: "Home & Living",
    qikink_cost: 120,
    printify_cost: 500
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
  console.log("🌏 Starting Fully Dynamic Sync...");

  try {
    for (const [internalId, blueprintId] of Object.entries(PRODUCT_MAP)) {
      const config = PRODUCT_CONFIG[internalId];
      console.log(`\n🔍 Fetching details for ID: ${blueprintId}...`);

      let title = "Unknown Product";
      let description = "";
      let imageUrls = [];
      let dynamicColors = ["White", "Black"]; 
      let dynamicSizes = ["S", "M", "L"];

      try {
        const res = await axios.get(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}.json`, {
          headers: { "Authorization": `Bearer ${PRINTIFY_API_TOKEN}` }
        });
        
        const data = res.data;

        // 1. GET TITLE & DESC FROM API
        title = data.title;
        description = data.description;
        console.log(`   📝 Title: "${title}"`);

        // 2. GET IMAGES
        imageUrls = data.images || [];
        console.log(`   📸 Found ${imageUrls.length} images.`);

        // 3. GET COLORS & SIZES
        if (data.options) {
          const colorOption = data.options.find(opt => opt.type === 'color' || opt.name === 'Colors');
          const sizeOption = data.options.find(opt => opt.type === 'size' || opt.name === 'Sizes');

          if (colorOption && colorOption.values) {
            dynamicColors = colorOption.values.map(v => v.title).slice(0, 15);
          }
          if (sizeOption && sizeOption.values) {
            dynamicSizes = sizeOption.values.map(v => v.title);
          }
        }

      } catch (err) {
        console.error(`   ❌ API Error: ${err.message}`);
        imageUrls = ["https://placehold.co/600x600?text=No+Image"]; 
      }

      // 4. SELECT SPECIFIC IMAGE
      // Use the index from config, or fallback to 0 if that index doesn't exist
      const safeIndex = (config.main_image_index < imageUrls.length) ? config.main_image_index : 0;
      const mainImage = imageUrls[safeIndex];
      console.log(`   🖼️ Selected Image Index: ${safeIndex}`);

      // 5. UPDATE FIRESTORE
      const docRef = db.collection("base_products").doc(internalId);
      
      batch.set(docRef, {
        id: internalId,
        title: title,       // ✅ From API
        description: description, // ✅ From API
        active: true,
        stock_status: "in_stock",
        category: config.category,
        
        image: mainImage,   // ✅ Specific Selected Image
        gallery: imageUrls, 

        options: { 
          colors: dynamicColors, // ✅ Real Colors
          sizes: dynamicSizes    // ✅ Real Sizes
        },
        
        providers: {
          india_qikink: {
            active: true,
            provider_id: "qikink",
            base_cost: config.qikink_cost,
            currency: "INR"
          },
          global_printify: {
            active: true,
            provider_id: "printify",
            blueprint_id: blueprintId,
            base_cost: config.printify_cost,
            currency: "INR"
          }
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    await batch.commit();
    console.log("\n🎉 Database Updated! Titles, Colors, and Specific Images are live.");

  } catch (error) {
    console.error("Critical Error:", error);
  }
}

seedProducts();