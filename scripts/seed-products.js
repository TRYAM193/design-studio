import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./service-account.json");

// --- THE HYBRID CATALOG ---
// 1. We use specific "Universal IDs" (e.g., 'mens_cotton_tee')
// 2. We attach High-Quality Unsplash Images
// 3. We define TWO providers for every product:
//    - Qikink (Cheap for India)
//    - Printify (Reliable for Global)

const HYBRID_CATALOG = [
  {
    id: "mens_cotton_tee",
    title: "Men's Classic Cotton T-Shirt",
    description: "A staple of any wardrobe. 100% Ring-Spun Cotton, Bio-Washed.",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
    category: "Apparel",
    options: { 
      colors: ["White", "Black", "Navy", "Red", "Grey"], 
      sizes: ["S", "M", "L", "XL", "XXL"] 
    },
    // PROVIDER 1: QIKINK (India)
    qikink: {
      active: true,
      base_cost: 200, // INR
      model: "Men's Round Neck"
    },
    // PROVIDER 2: PRINTIFY (Global)
    printify: {
      active: true,
      blueprint_id: 12, // Bella+Canvas 3001
      print_provider_id: 29, // Monster Digital
      base_cost: 900 // ~ $10 USD (converted to INR approx)
    }
  },
  {
    id: "unisex_hoodie",
    title: "Premium Unisex Hoodie",
    description: "Warm, cozy and perfect for printing. 320 GSM Cotton Blend.",
    image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
    category: "Apparel",
    options: { 
      colors: ["Black", "Navy", "Maroon", "Grey"], 
      sizes: ["S", "M", "L", "XL", "XXL"] 
    },
    qikink: {
      active: true,
      base_cost: 450,
      model: "Unisex Hoodie"
    },
    printify: {
      active: true,
      blueprint_id: 77, // Gildan 18500
      print_provider_id: 29,
      base_cost: 1600 // ~ $19 USD
    }
  },
  {
    id: "womens_crop_top",
    title: "Women's Crop Top",
    description: "Trendy, relaxed fit crop top. 100% Cotton.",
    image: "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
    category: "Apparel",
    options: { 
      colors: ["White", "Black", "Pink", "Lavender"], 
      sizes: ["XS", "S", "M", "L", "XL"] 
    },
    qikink: {
      active: true,
      base_cost: 240,
      model: "Crop Top"
    },
    printify: {
      active: true,
      blueprint_id: 1058, // Women's Crop
      print_provider_id: 29,
      base_cost: 1200 // ~ $14 USD
    }
  },
  {
    id: "oversized_tee",
    title: "Streetwear Oversized T-Shirt",
    description: "Drop shoulder, loose fit. The ultimate streetwear essential.",
    image: "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80",
    category: "Apparel",
    options: { 
      colors: ["Black", "White", "Beige", "Olive"], 
      sizes: ["S", "M", "L", "XL"] 
    },
    qikink: {
      active: true,
      base_cost: 320,
      model: "Oversized Tee"
    },
    printify: {
      active: true,
      blueprint_id: 49, // Comfort Colors 1717
      print_provider_id: 29,
      base_cost: 1400 // ~ $16 USD
    }
  },
  {
    id: "ceramic_mug",
    title: "Glossy Ceramic Mug (11oz)",
    description: "Durable white ceramic mug. Microwave and dishwasher safe.",
    image: "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80",
    category: "Home & Living",
    options: { colors: ["White"], sizes: ["11oz"] },
    qikink: {
      active: true,
      base_cost: 120,
      model: "Mug"
    },
    printify: {
      active: true,
      blueprint_id: 68,
      print_provider_id: 29,
      base_cost: 500 // ~ $6 USD
    }
  }
];

// Initialize Firebase
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
}
const db = admin.firestore();

async function seedHybrid() {
  const batch = db.batch();
  let count = 0;

  console.log("🌏 Starting Hybrid Seeder (India + Global)...");

  try {
    for (const item of HYBRID_CATALOG) {
      const docRef = db.collection("base_products").doc(item.id);
      
      batch.set(docRef, {
        id: item.id,
        title: item.title,
        description: item.description,
        active: true,
        stock_status: "in_stock", // Default
        category: item.category,
        image: item.image, // High Quality Unsplash Image
        options: item.options,
        
        // THE HYBRID PROVIDER BLOCK
        providers: {
          // 1. India Strategy
          india_qikink: {
            active: item.qikink.active,
            provider_id: "qikink",
            model_name: item.qikink.model,
            base_cost: item.qikink.base_cost,
            currency: "INR"
          },
          // 2. Global Strategy
          global_printify: {
            active: item.printify.active,
            provider_id: "printify",
            blueprint_id: item.printify.blueprint_id,
            print_provider_id: item.printify.print_provider_id,
            base_cost: item.printify.base_cost,
            currency: "INR" // Stored in INR for easier comparison
          }
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
      
      count++;
      console.log(`   ✅ Synced: ${item.title}`);
    }

    await batch.commit();
    console.log(`🎉 Success! ${count} Hybrid products are live.`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

seedHybrid();