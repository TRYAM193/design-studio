// src/data/initialProducts.ts

import { ca } from "date-fns/locale";

export const INITIAL_PRODUCTS = [
  // =========================================
  // 👕 MEN'S COLLECTION
  // =========================================
  {
    id: "men-classic-tee",
    title: "Men's Classic Premium Tee",
    category: "Men",
    price: 24.99,
    // ✅ RETAINED YOUR IMAGE URL
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fmen-classic-tee?alt=media&token=102baeb0-9b35-4d94-a3fd-8d77735915e4',
    model3d: "/assets/t-shirt.glb",
    description: "A timeless classic. Soft cotton, reliable fit.",
    
    // 🖨️ PRINT AREAS (Canvas Size in Pixels)
    print_areas: {
      front: { width: 4500, height: 5400 }, 
      back:  { width: 4500, height: 5400 }
    },

    canvas_size: {
      width: 420,
      height: 560
    },

    // 🖼️ MOCKUPS (Must be Transparent PNGs for color blending)
    mockups: {
      front: "/assets/mockups/men-classic-tee-front.png",
      back:  "/assets/mockups/men-classic-tee-back.png"
    },
    
    // 📐 2D POSITIONING (Top/Left/Width %)
    print_area_2d: {
      front: { top: 30, left: 30, width: 50 },
      back:  { top: 30, left: 30, width: 50 }
    },

    options: {
      colors: ["White", "Black", "Navy", "Red", "Royal", "Sport Grey"], 
      sizes: ["S", "M", "L", "XL", "2XL"]
    },

    vendor_maps: {
      printify: { 
        blueprint_id: "12", 
        print_provider_id: "29",
        color_map: { "White": 101, "Black": 102, "Navy": 103, "Red": 104, "Royal": 105, "Sport Grey": 110 } 
      },
      qikink: { 
        product_id: "men_round_neck",
        color_map: { "White": "White", "Black": "Black", "Navy": "Navy Blue", "Red": "Red", "Royal": "Royal Blue", "Sport Grey": "Grey Melange" }
      },
      gelato: { 
        product_uid: "apparel_classic_tee_unisex",
        color_map: { "White": "white", "Black": "black", "Navy": "navy_blue", "Red": "red", "Royal": "royal_blue", "Sport Grey": "grey_melange" } 
      }
    }
  },

  {
    id: "men-oversized-tee",
    title: "Men's Streetwear Oversized Tee",
    category: "Men",
    price: 32.00,
    // ✅ RETAINED YOUR IMAGE URL
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fmen-oversized-tee?alt=media&token=3dcae3b1-042e-417b-8557-90fd177123ae',
    model3d: null, 
    description: "Heavyweight cotton with a boxy, dropped-shoulder fit.",
    
    print_areas: {
      front: { width: 4500, height: 5400 },
      back:  { width: 4500, height: 5400 }
    },

    mockups: {
      front: "/assets/mockups/men-oversized-front.png",
      back:  "/assets/mockups/men-oversized-back.png"
    },

     canvas_size: {
      width: 420,
      height: 560
    },
    
    print_area_2d: {
      front: { top: 22, left: 28, width: 44 },
      back:  { top: 22, left: 28, width: 44 }
    },

    options: {
      colors: ["White", "Black", "Beige"], 
      sizes: ["S", "M", "L", "XL"]
    },

    vendor_maps: {
      printify: { 
        blueprint_id: "1096", 
        print_provider_id: "29",
        color_map: { "White": 101, "Black": 102, "Beige": 15 } 
      }, 
      qikink: { 
        product_id: "men_oversized",
        color_map: { "White": "White", "Black": "Black", "Beige": "Beige" }
      },
      gelato: { 
        product_uid: "apparel_heavyweight_tee",
        color_map: { "White": "white", "Black": "black", "Beige": "sand" }
      }
    }
  },

  {
    id: "men-hoodie",
    title: "Men's Essential Hoodie",
    category: "Men",
    price: 45.00,
    // ✅ RETAINED YOUR IMAGE URL
    image:'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fmen-hoodie?alt=media&token=eb24627e-f16e-4c09-b2a4-417c86fb2139',
    model3d: null,
    description: "Cozy, durable, and perfect for layering.",
    
    print_areas: {
      front: { width: 4000, height: 4000 },
      back:  { width: 4500, height: 5400 },
      leftSleeve: { width: 1100, height: 3500 },
      rightSleeve: { width: 1100, height: 3500 }
    },

    mockups: {
      front: "/assets/mockups/men-hoodie-front.png",
      back:  "/assets/mockups/men-hoodie-back.png"
    },
    
    print_area_2d: {
      front: { top: 25, left: 32, width: 36 },
      back:  { top: 20, left: 30, width: 40 }
    },

    options: {
      colors: ["Black", "Sport Grey", "Navy"], 
      sizes: ["S", "M", "L", "XL", "2XL"]
    },

    vendor_maps: {
      printify: { 
        blueprint_id: "77", 
        print_provider_id: "29", 
        color_map: { "Black": 102, "Sport Grey": 110, "Navy": 103 } 
      },
      qikink: { 
        product_id: "unisex_hoodie", 
        color_map: { "Black": "Black", "Sport Grey": "Grey Melange", "Navy": "Navy Blue" } 
      },
      gelato: { 
        product_uid: "apparel_hoodie_classic", 
        color_map: { "Black": "black", "Sport Grey": "grey_melange", "Navy": "navy" } 
      }
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
    // ✅ RETAINED YOUR IMAGE URL
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fwomen-classic-tee?alt=media&token=ec5f29b8-03fc-4879-80f9-608b99adf197',
    model3d: "/assets/t-shirt.glb",
    description: "A feminine cut with shorter sleeves and a subtle waist curve.",
    
    print_areas: {
      front: { width: 4000, height: 4800 },
      back:  { width: 4000, height: 4800 }
    },

    mockups: {
      front: "/assets/mockups/men-classic-tee-front.png",
      back:  "/assets/mockups/men-classic-tee-back.png"
    },

     canvas_size: {
      width: 420,
      height: 560
    },
    
    print_area_2d: {
      front: { top: 22, left: 32, width: 36 },
      back:  { top: 22, left: 32, width: 36 }
    },

    options: {
      colors: ["White", "Black", "Pink", "Heather Mauve"], 
      sizes: ["S", "M", "L", "XL"]
    },

    vendor_maps: {
      printify: { 
        blueprint_id: "36", 
        print_provider_id: "29", 
        variant_map: "ladies",
        color_map: { "White": 101, "Black": 102, "Pink": 106, "Heather Mauve": 107 }
      },
      qikink: { 
        product_id: "women_round_neck",
        color_map: { "White": "White", "Black": "Black", "Pink": "Baby Pink", "Heather Mauve": "Mauve" }
      },
      gelato: { 
        product_uid: "apparel_ladies_tee",
        color_map: { "White": "white", "Black": "black", "Pink": "pink", "Heather Mauve": "heather_mauve" }
      }
    }
  },

  {
    id: "women-oversized-tee",
    title: "Women's Boyfriend Oversized Tee",
    category: "Women",
    price: 32.00,
    // ✅ RETAINED YOUR IMAGE URL
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fwomen-oversized-tee?alt=media&token=05ed8b7a-fbab-4394-a704-9f59ed435801',
    model3d: null,
    description: "Relaxed boyfriend fit. Style it tucked in or loose.",
    
    print_areas: {
      front: { width: 4500, height: 5400 },
      back:  { width: 4500, height: 5400 }
    },

    mockups: {
      front: "/assets/mockups/men-oversized-front.png",
      back:  "/assets/mockups/men-oversized-back.png"
    },
    
    print_area_2d: {
      front: { top: 22, left: 28, width: 44 },
      back:  { top: 22, left: 28, width: 44 }
    },

     canvas_size: {
      width: 420,
      height: 560
    },

    options: {
      colors: ["White", "Black", "Sand"], 
      sizes: ["S", "M", "L", "XL"]
    },

    vendor_maps: {
      printify: { 
        blueprint_id: "1096", 
        print_provider_id: "29",
        color_map: { "White": 101, "Black": 102, "Sand": 15 }
      },
      qikink: { 
        product_id: "men_oversized", 
        color_map: { "White": "White", "Black": "Black", "Sand": "Beige" }
      }, 
      gelato: { 
        product_uid: "apparel_heavyweight_tee",
        color_map: { "White": "white", "Black": "black", "Sand": "sand" }
      }
    }
  },

  {
    id: "women-hoodie",
    title: "Women's Cozy Hoodie",
    category: "Women",
    price: 45.00,
    // ✅ RETAINED YOUR IMAGE URL
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fwomen-hoodie?alt=media&token=788e59c3-a0d8-489c-8603-c731023a2f10',
    model3d: null,
    description: "Soft fleece fabric, kangaroo pocket, standard fit.",
    
    print_areas: {
      front: { width: 4000, height: 4000 },
      back:  { width: 4500, height: 5400 },
      leftSleeve: { width: 1100, height: 3500 },
      rightSleeve: { width: 1100, height: 3500 }
    },
    

    mockups: {
      front: "/assets/mockups/men-hoodie-front.png",
      back:  "/assets/mockups/men-hoodie-back.png",
      leftSleeve: "/assets/mockups/men-hoodie-left.png",
      rightSleeve: "/assets/mockups/men-hoodie-right.png"
    },
    
    print_area_2d: {
      front: { top: 25, left: 32, width: 36 },
      back:  { top: 25, left: 32, width: 36 }
    },

    options: {
      colors: ["White", "Black", "Pink", "Dark Heather"], 
      sizes: ["S", "M", "L", "XL"]
    },

    vendor_maps: {
      printify: { 
        blueprint_id: "77", 
        print_provider_id: "29",
        color_map: { "White": 101, "Black": 102, "Pink": 106, "Dark Heather": 108 }
      },
      qikink: { 
        product_id: "unisex_hoodie",
        color_map: { "White": "White", "Black": "Black", "Pink": "Baby Pink", "Dark Heather": "Charcoal Melange" }
      },
      gelato: { 
        product_uid: "apparel_hoodie_classic",
        color_map: { "White": "white", "Black": "black", "Pink": "light_pink", "Dark Heather": "dark_grey_heather" }
      }
    }
  },

  // =========================================
  // 🎒 ACCESSORIES
  // =========================================
  {
    id: "mug-ceramic-11oz",
    title: "Classic Ceramic Mug (11oz)",
    category: "Accessories",
    price: 14.00,
    // ✅ RETAINED YOUR IMAGE URL
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fmug-ceramic-11oz?alt=media&token=7a07c2c7-78d6-4610-8e09-aee10ceb5bd1',
    model3d: "/assets/mug.glb",
    description: "Durable ceramic mug with high-quality printing.",

    print_areas: {
      front: { width: 2700, height: 1100 } // Approx 9" x 3.5" wrap
    },

    canvas_size: {
      width: 800,
      height: 300
    },

    mockups: {
      front: "/assets/mockups/mug-front.png",
      left:  "/assets/mockups/mug-left.png",
    },
    
    print_area_2d: {
      front: { top: 15, left: 25, width: 50 },
      left:  { top: 15, left: 25, width: 50 },
      right: { top: 15, left: 25, width: 50 }
    },
    
    options: {
      colors: ["White", "Black Handle"], 
      sizes: ["11oz"]
    },

    vendor_maps: {
      printify: { 
        blueprint_id: "68", 
        print_provider_id: "9",
        color_map: { "White": 101, "Black Handle": 115 }
      },
      qikink: { 
        product_id: "coffee_mug",
        color_map: { "White": "White", "Black Handle": "Black Handle" }
      },
      gelato: { 
        product_uid: "mug_11oz_ceramic",
        color_map: { "White": "white", "Black Handle": "black_handle" }
      }
    }
  },

  {
    id: "tote-bag-canvas",
    title: "Eco Canvas Tote Bag",
    category: "Accessories",
    price: 19.00,
    // ✅ RETAINED YOUR IMAGE URL
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Ftote-bag-canvas?alt=media&token=bd508609-096a-443c-a6a1-196390ceefdc',
    model3d: "/assets/tote.glb",
    description: "Heavy duty canvas tote for daily use.",
    
    print_areas: {
      front: { width: 3000, height: 3000 },
      back:  { width: 3000, height: 3000 }
    },

    canvas_size: {
      width: 380,
      height: 380
    },

    mockups: {
      front: "/assets/mockups/tote-bag.png",
      back:  "/assets/mockups/tote-bag.png"
    },
    
    print_area_2d: {
      front: { top: 30, left: 25, width: 50 },
      back:  { top: 30, left: 25, width: 50 }
    },

    options: {
      colors: ["Natural", "Black"], 
      sizes: ["One Size"]
    },

    vendor_maps: {
      printify: { 
        blueprint_id: "472", 
        print_provider_id: "2",
        color_map: { "Natural": 10, "Black": 102 }
      },
      qikink: { 
        product_id: "tote_bag",
        color_map: { "Natural": "Natural", "Black": "Black" }
      },
      gelato: { 
        product_uid: "tote_bag_canvas",
        color_map: { "Natural": "natural", "Black": "black" }
      }
    }
  }
];