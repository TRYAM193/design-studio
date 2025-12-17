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
const PRINTIFY_API_KEY = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImUxY2EzOGEzMmM2NGM5M2YxNGQ3MTM3MmI1ZmQwZWY1N2ZlOWMzZTVkMDI0YmRlMWE3ODBkNDM4NmZlNDQyOTVmODIzZDA2NmE5YWQxMjE4IiwiaWF0IjoxNzY1OTA3NjA4LjM5MTAxNSwibmJmIjoxNzY1OTA3NjA4LjM5MTAxNywiZXhwIjoxNzk3NDQzNjA4LjM4MjYyMSwic3ViIjoiMjU3MDI3MjEiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.cwmW9eDrWz6Urfizuz-u7JYfYLEH_Q8_oAUsK4fINEfwlVRLaXX-HuNvygiuFBkCPOkK6cQ2nlunOMHzdWVVNdYTHnuo5DRuO0Va5GC3MH9zBwiiMnaYQjtB9upRbKvAF8PkdWfLLzCuqasoVhJswDX3KPpcmESEki7wA0Q-J3AQjyY2OZplGgQzDwJq3ck4AyWgeLrr5Ntd3Pb5OtXQfJoJ5n1W0TfAwYyhVrOnfhjcQd7rZsD29gBHRUNrCJYhoCF44Kv9p9vzfu_fc7AwkKPfl0XTId4x3wYa0GM-cSZ3ATt5Ndc2VSeQkx5FfzJqwkLDWlrnG58dMVNbWuG9EF4NpfJj9wsiWFXzLjLDcBNcD1JbTQMGQDNDbogdNhULVFHBHhX8LEj7F3aF3JjsqO5e3Ivf3hfL68culz4XGkp9LKLypZ1o5c5Csq-9KNOxV08KBYBa76ewenMdCQMXbiMjcZTvTK9cn2twp6cC3Av7mifkFWfy-e1XfJ7x6wjIr5wxzGDYrdQ6SOBPHtiK_J_Az2hwiIaNN7cfnmXt02WFZL8Mvkd58YxPtlwrr9eVJQdc3nSz0sqXv6Zg1_si3gr3JH_MxFZYj7yEO39CPuv-2_6foI6EpGoio6C5JIOqt9rxL9AraAhcdIPRdn6OAw79YIsIbmUQZs7NHYowQEQ"; 

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