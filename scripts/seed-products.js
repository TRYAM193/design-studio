import admin from "firebase-admin";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const serviceAccount = require("./service-account.json");

// --- CONFIGURATION ---
// We don't even need the Printify API token for images anymore.
// We are using curated, high-quality lifestyle shots.

// --- 1. THE CURATED IMAGE VAULT (High Quality & Correct Gender) ---
const PRODUCT_IMAGES = {
  // Men's Tee: A clean shot of a man in a white/black tee
  "mens_cotton_tee": "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=80",
  
  // Hoodie: A cool unisex hoodie shot
  "unisex_hoodie": "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=800&q=80",
  
  // Crop Top: A woman in a crop top
  "womens_crop_top": "https://images.unsplash.com/photo-1503342217505-b0a15ec3261c?auto=format&fit=crop&w=800&q=80",
  
  // Oversized Tee: Streetwear vibe
  "oversized_tee": "https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=800&q=80",
  
  // Sweatshirt: Cozy vibe
  "unisex_sweatshirt": "https://images.unsplash.com/photo-1620799140408-ed5341cd2431?auto=format&fit=crop&w=800&q=80",
  
  // Mug: Clean product shot
  "ceramic_mug": "https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?auto=format&fit=crop&w=800&q=80",
  
  // Kids: A happy kid in a tee
  "kids_classic_tee": "https://images.unsplash.com/photo-1519238263496-4143a5695b58?auto=format&fit=crop&w=800&q=80"
};

// --- 2. QIKINK CATALOG (India Pricing) ---
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

  console.log("🚀 Starting Manual Image Seeder...");
  console.log("💾 Updating Firestore with Curated Images...");

  try {
    for (const item of QIKINK_CATALOG) {
      const docRef = db.collection("base_products").doc(item.id);
      
      // Get the correct image from our manual map
      const correctImage = PRODUCT_IMAGES[item.id] || "https://placehold.co/600x600/png?text=No+Image";

      const productData = {
        id: item.id,
        title: item.title,
        active: true,
        category: item.category,
        image: correctImage, // <--- Guaranteed Correct Image
        options: item.options,
        
        providers: {
          india_qikink: {
            active: true,
            provider_id: "qikink",
            base_cost: item.price_inr,
            currency: "INR"
          },
          // We keep the structure ready for Printify later
          global_printify: {
            active: true,
            provider_id: "printify",
            image: correctImage
          }
        },
        updatedAt: admin.firestore.FieldValue.serverTimestamp()
      };

      batch.set(docRef, productData, { merge: true });
      count++;
      console.log(`   ✅ Updated: ${item.title}`);
    }

    await batch.commit();
    console.log(`🎉 Successfully updated ${count} products with CORRECT images!`);

  } catch (error) {
    console.error("❌ Error:", error.message);
  }
}

seedProducts();