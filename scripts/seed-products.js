const admin = require("firebase-admin");
const axios = require("axios");
const serviceAccount = require("./service-account.json"); // The file you downloaded

// 1. Initialize Firebase Admin (The Master Key)
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// 🛑 REPLACE THESE WITH YOUR REAL KEYS
const QIKINK_API_KEY = "YOUR_QIKINK_API_KEY"; 
const PRINTIFY_API_KEY = "YOUR_PRINTIFY_API_KEY"; 

// The Mapping Logic (The "Brain" of the operation)
// We map Qikink's messy categories to clean IDs
const CATEGORY_MAP = {
  "Men's T-Shirt": "mens_cotton_tee",
  "Unisex Hoodie": "unisex_hoodie",
  "Crop Top": "womens_crop_top"
};

async function seedProducts() {
  try {
    console.log("🚀 Starting Product Seeder...");

    // --- STEP 1: Fetch from Qikink ---
    console.log("📦 Fetching catalog from Qikink...");
    // Note: Verify the exact endpoint in Qikink docs. Usually /products or /catalog
    const qikinkRes = await axios.get("https://api.qik.dev/v1/products", {
      headers: { "Authorization": `Bearer ${QIKINK_API_KEY}` }
    });
    
    const qikinkProducts = qikinkRes.data.products || []; // Adjust based on actual response structure
    console.log(`✅ Found ${qikinkProducts.length} products from Qikink.`);

    // --- STEP 2: Process & Merge ---
    const batch = db.batch();
    let count = 0;

    for (const qItem of qikinkProducts) {
      // Only import products we have mapped
      const universalId = CATEGORY_MAP[qItem.name] || `misc_${qItem.id}`;
      
      const docRef = db.collection("base_products").doc(universalId);

      // Create the "Universal Blank" Structure
      const productData = {
        id: universalId,
        title: qItem.name, // e.g. "Men's Classic Tee"
        description: qItem.description || "Premium quality cotton.",
        active: true,
        
        // Universal Options (We merge sizes/colors here)
        options: {
          colors: qItem.colors || ["White", "Black"], 
          sizes: qItem.sizes || ["S", "M", "L", "XL"]
        },

        // THE SMART ROUTER LOGIC
        providers: {
          // 1. India Route (Qikink)
          india_qikink: {
            active: true,
            provider_id: "qikink",
            external_id: qItem.id, // Qikink's Product ID
            base_cost: qItem.price || 200, // Cost in INR
            sku_prefix: qItem.sku_prefix || "QK-TEE"
          },
          
          // 2. Global Route (Printify - Placeholder for now)
          // We will write a separate script to "enrich" this later
          global_printify: {
            active: false, // Inactive until we map it
            provider_id: "printify",
            blueprint_id: null,
            base_cost: 0
          }
        },
        
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      batch.set(docRef, productData, { merge: true });
      count++;
    }

    // --- STEP 3: Save to Firestore ---
    await batch.commit();
    console.log(`🎉 Successfully seeded ${count} base products to Firestore!`);

  } catch (error) {
    console.error("❌ Error seeding products:", error.response ? error.response.data : error.message);
  }
}

seedProducts();