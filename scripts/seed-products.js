// scripts/seed-products.js
import { db } from "../src/firebase"; // Ensure this points to your firebase config
import { doc, setDoc, writeBatch, collection } from "firebase/firestore";
import { INITIAL_PRODUCTS } from '../src/data/initialProducts'

// --- 1. THE MASTER CATALOG DATA ---
export const CATALOG_DATA = [
  {
    id: "men-classic-tee",
    title: "Men's Classic Premium Tee",
    category: "Men",
    price: 24.99,
    image: "/assets/catalog/men-tee-preview.jpg", // You need to add this image
    model3d: "/assets/t-shirt.glb", // Generic Unisex Model for 3D preview
    description: "A timeless classic. Soft cotton, reliable fit, perfect for everyday wear.",
    
    // 🎨 Print Areas (Canvas Size)
    print_areas: { 
      front: { width: 4500, height: 5400, offset: {x: 0, y: -200} },
      back: { width: 4500, height: 5400, offset: {x: 0, y: -200} }
    },
    
    options: {
      colors: ["White", "Black", "Navy", "Dark Heather", "Royal"],
      sizes: ["S", "M", "L", "XL", "2XL", "3XL"]
    },

    // 🔗 VENDOR MAPPING (The Brains)
    vendor_maps: {
      // US: Bella+Canvas 3001 (Unisex/Men's Standard)
      printify: { blueprint_id: 12, print_provider_id: 29, variant_map: "standard" },
      // India: Standard Men's Round Neck
      qikink: { product_id: "men_round_neck" },
      // Global: Gelato Standard Unisex
      gelato: { product_uid: "apparel_classic_tee_unisex" }
    }
  },

  {
    id: "men-oversized-tee",
    title: "Men's Streetwear Oversized Tee",
    category: "Men",
    price: 32.00,
    image: "/assets/catalog/men-oversized-preview.jpg",
    model3d: "/assets/oversized.glb", // If you have a boxy 3D model
    description: "Heavyweight cotton with a boxy, dropped-shoulder fit.",
    
    print_areas: { front: { width: 4500, height: 5400 } },
    options: { colors: ["White", "Black", "Beige"], sizes: ["S", "M", "L", "XL"] },

    vendor_maps: {
      // US: Shaka Wear or Lane Seven
      printify: { blueprint_id: 1096, print_provider_id: 29 }, 
      // India: Oversized Tee
      qikink: { product_id: "men_oversized" },
      gelato: { product_uid: "apparel_heavyweight_tee" }
    }
  },

  {
    id: "men-hoodie",
    title: "Men's Essential Hoodie",
    category: "Men",
    price: 45.00,
    image: "/assets/catalog/men-hoodie-preview.jpg",
    model3d: "/assets/hoodie.glb",
    description: "Cozy, durable, and perfect for layering.",
    
    print_areas: { front: { width: 4000, height: 4000 } },
    options: { colors: ["Black", "Sport Grey", "Navy"], sizes: ["S", "M", "L", "XL", "2XL"] },

    vendor_maps: {
      // US: Gildan 18500 (Industry Standard Unisex)
      printify: { blueprint_id: 77, print_provider_id: 29 },
      // India: Unisex Hoodie
      qikink: { product_id: "unisex_hoodie" },
      gelato: { product_uid: "apparel_hoodie_classic" }
    }
  },

  // =========================================
  // 👚 WOMEN'S COLLECTION
  // =========================================
  {
    id: "women-classic-tee",
    title: "Women's Fitted Premium Tee",
    category: "Women",
    price: 24.99,
    image: "/assets/catalog/women-tee-preview.jpg", 
    model3d: "/assets/t-shirt.glb", 
    description: "A feminine cut with shorter sleeves and a subtle waist curve.",
    
    print_areas: { front: { width: 4500, height: 5400 } },
    options: { colors: ["White", "Black", "Pink", "Heather Mauve"], sizes: ["S", "M", "L", "XL"] },

    vendor_maps: {
      // US: Bella+Canvas 6004 (Ladies Slim Fit) - DIFFERENT from Men's
      printify: { blueprint_id: 36, print_provider_id: 29, variant_map: "ladies" },
      // India: Women's Round Neck
      qikink: { product_id: "women_round_neck" },
      // Global: Gelato Ladies Tee
      gelato: { product_uid: "apparel_ladies_tee" }
    }
  },

  {
    id: "women-oversized-tee",
    title: "Women's Boyfriend Oversized Tee",
    category: "Women",
    price: 32.00,
    image: "/assets/catalog/women-oversized-preview.jpg",
    model3d: "/assets/oversized.glb", 
    description: "Relaxed boyfriend fit. Style it tucked in or loose.",
    
    print_areas: { front: { width: 4500, height: 5400 } },
    options: { colors: ["White", "Black", "Sand"], sizes: ["S", "M", "L", "XL"] },

    vendor_maps: {
      // US: Using the SAME Unisex ID as Men's, but sold as 'Boyfriend Fit'
      printify: { blueprint_id: 1096, print_provider_id: 29 },
      // India: Might use same Oversized ID
      qikink: { product_id: "men_oversized" }, 
      gelato: { product_uid: "apparel_heavyweight_tee" }
    }
  },

  {
    id: "women-hoodie",
    title: "Women's Cozy Hoodie",
    category: "Women",
    price: 45.00,
    image: "/assets/catalog/women-hoodie-preview.jpg",
    model3d: "/assets/hoodie.glb",
    description: "Soft fleece fabric, kangaroo pocket, standard fit.",
    
    print_areas: { front: { width: 4000, height: 4000 } },
    options: { colors: ["White", "Black", "Pink", "Dark Heather"], sizes: ["S", "M", "L", "XL"] },

    vendor_maps: {
      // US: Gildan 18500 (Same as Men's)
      printify: { blueprint_id: 77, print_provider_id: 29 },
      qikink: { product_id: "unisex_hoodie" },
      gelato: { product_uid: "apparel_hoodie_classic" }
    }
  },

  // =========================================
  // 🎒 ACCESSORIES (UNISEX)
  // =========================================
  {
    id: "mug-ceramic-11oz",
    title: "Classic Ceramic Mug (11oz)",
    category: "Accessories",
    price: 14.00,
    image: "/assets/catalog/mug-preview.jpg",
    model3d: "/assets/mug.glb",
    description: "Durable ceramic mug with high-quality printing.",
    
    print_areas: { front: { width: 2475, height: 1155 } }, // Specific wrap dimensions
    options: { colors: ["White", "Black Handle"], sizes: ["11oz"] },

    vendor_maps: {
      printify: { blueprint_id: 68, print_provider_id: 9 },
      qikink: { product_id: "coffee_mug" },
      gelato: { product_uid: "mug_11oz_ceramic" }
    }
  },

  {
    id: "tote-bag-canvas",
    title: "Eco Canvas Tote Bag",
    category: "Accessories",
    price: 19.00,
    image: "/assets/catalog/tote-preview.jpg",
    model3d: "/assets/tote.glb",
    description: "Heavy duty canvas tote for daily use.",
    
    print_areas: { front: { width: 3000, height: 3000 } },
    options: { colors: ["Natural", "Black"], sizes: ["One Size"] },

    vendor_maps: {
      printify: { blueprint_id: 472, print_provider_id: 2 },
      qikink: { product_id: "tote_bag" },
      gelato: { product_uid: "tote_bag_canvas" }
    }
  }
];

// --- 2. UPLOAD FUNCTION ---
export const seedProducts = async () => {
  console.log("🚀 Starting Product Seed...");
  const batch = writeBatch(db);

  CATALOG_DATA.forEach((product) => {
    const docRef = doc(db, "base_products", product.id);
    batch.set(docRef, product);
  });

  try {
    await batch.commit();
    console.log("✅ Successfully seeded 8 products with Vendor Maps!");
    alert("Database Updated Successfully!");
  } catch (error) {
    console.error("❌ Error seeding products:", error);
    alert("Error Updating Database");
  }
};

