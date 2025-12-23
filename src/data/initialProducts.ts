// src/data/initialProducts.ts

export const INITIAL_PRODUCTS = [
  // =========================================
  // 👕 MEN'S COLLECTION
  // =========================================
  {
    id: "men-classic-tee",
    title: "Men's Classic Premium Tee",
    category: "Men",
    price: 24.99,
    image: null,
    model3d: "/assets/t-shirt.glb",
    description: "A timeless classic. Soft cotton, reliable fit.",
    
    // ✅ SAFE COLORS (Available in US, India, & EU)
    options: {
      colors: ["White", "Black", "Navy", "Red", "Royal", "Sport Grey"], 
      sizes: ["S", "M", "L", "XL", "2XL"]
    },

    mockups: {
      front: "/assets/mockups/men-classic-tee-front.jpg",
      back: "/assets/mockups/men-classic-tee-back.jpg"
    },

    vendor_maps: {
      printify: { 
        blueprint_id: "12", 
        print_provider_id: "29",
        // Map: Display Name -> Printify Color ID
        color_map: { 
          "White": 101, "Black": 102, "Navy": 103, "Red": 104, "Royal": 105, "Sport Grey": 110 
        } 
      },
      qikink: { 
        product_id: "men_round_neck",
        // Map: Display Name -> Qikink Color Name
        color_map: { 
          "White": "White", "Black": "Black", "Navy": "Navy Blue", "Red": "Red", "Royal": "Royal Blue", "Sport Grey": "Grey Melange" 
        }
      },
      gelato: { 
        product_uid: "apparel_classic_tee_unisex",
        // Map: Display Name -> Gelato Color UID
        color_map: { 
          "White": "white", "Black": "black", "Navy": "navy_blue", "Red": "red", "Royal": "royal_blue", "Sport Grey": "grey_melange" 
        }
      }
    }
  },

  {
    id: "men-oversized-tee",
    title: "Men's Streetwear Oversized Tee",
    category: "Men",
    price: 32.00,
    image: null,
    model3d: "/assets/oversized.glb", 
    description: "Heavyweight cotton with a boxy, dropped-shoulder fit.",
    
    options: {
      colors: ["White", "Black", "Beige"], 
      sizes: ["S", "M", "L", "XL"]
    },

   mockups: {
      front: "/assets/mockups/men-oversized-front.jpg",
      back: "/assets/mockups/men-oversized-back.jpg"
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
    image: null,
    model3d: "/assets/hoodie.glb",
    description: "Cozy, durable, and perfect for layering.",
    
    options: {
      colors: ["Black", "Sport Grey", "Navy"], 
      sizes: ["S", "M", "L", "XL", "2XL"]
    },

    mockups: {
      front: "/assets/mockups/men-hoodie-front.jpg",
      back: "/assets/mockups/men-hoodie-back.jpg"
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
    image: null,
    model3d: "/assets/t-shirt.glb",
    description: "A feminine cut with shorter sleeves and a subtle waist curve.",
    
    options: {
      colors: ["White", "Black", "Pink", "Heather Mauve"], 
      sizes: ["S", "M", "L", "XL"]
    },

    mockups: {
      front: "/assets/mockups/women-classic-tee-front.jpg",
      back: "/assets/mockups/women-classic-tee-back.jpg"
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
    image: null,
    model3d: "/assets/oversized.glb",
    description: "Relaxed boyfriend fit. Style it tucked in or loose.",
    
    options: {
      colors: ["White", "Black", "Sand"], 
      sizes: ["S", "M", "L", "XL"]
    },

    mockups: {
      front: "/assets/mockups/women-oversized-front.jpg",
      back: "/assets/mockups/women-oversized-back.jpg"
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
    image: null,
    model3d: "/assets/hoodie.glb",
    description: "Soft fleece fabric, kangaroo pocket, standard fit.",
    
    options: {
      colors: ["White", "Black", "Pink", "Dark Heather"], 
      sizes: ["S", "M", "L", "XL"]
    },

    mockups: {
      front: "/assets/mockups/men-hoodie-front.jpg",
      back: "/assets/mockups/men-hoodie-back.jpg"
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
    image: null,
    model3d: "/assets/mug.glb",
    description: "Durable ceramic mug with high-quality printing.",
    
    options: {
      colors: ["White", "Black Handle"], 
      sizes: ["11oz"]
    },

     mockups: {
      front: "/assets/mockups/mug-front.jpg",
      left: "/assets/mockups/mug-left.jpg",
      right: "/assets/mockups/mug-right.jpg"
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
    image: null,
    model3d: "/assets/tote.glb",
    description: "Heavy duty canvas tote for daily use.",
    
    options: {
      colors: ["Natural", "Black"], 
      sizes: ["One Size"]
    },

    mockups: {
      front: "/assets/mockups/tote-bag-front.jpg",
      back: "/assets/mockups/tote-bag-back.jpg"
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