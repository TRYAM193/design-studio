// src/data/initialProducts.ts

export const INITIAL_PRODUCTS = [
  // =========================================
  // 👕 MEN'S COLLECTION
  // =========================================
  {
    id: "men-classic-tee",
    title: "Men's Classic Premium Tee",
    category: "Men",
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fmen-classic-tee?alt=media&token=eaffe62d-ccfa-4ea0-a9a9-4fb20312d00e',
    model3d: "/assets/t-shirt.glb",
    description: "A timeless classic. Soft cotton, reliable fit.",

    print_areas: {
      front: { width: 4500, height: 5400 },
      back: { width: 4500, height: 5400 }
    },

    canvas_size: {
      width: 420,
      height: 560
    },

    price: {
      IN: 449,
      US: 24.99,
      GB: 19.99,
      EU: 20.99,
      CA: 34.99
    },

    mockups: {
      front: "/assets/mockups/men-classic-tee-front.png",
      back: "/assets/mockups/men-classic-tee-back.png"
    },

    print_area_2d: {
      front: { top: 29, left: 32.5, width: 35, height: 39 },
      back: { top: 29, left: 32.5, width: 35, height: 39 }
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
        // Base SKU for "Male Round Neck Half Sleeve"
        product_id: "MRnHs",
        // Qikink Color Codes (Bk=Black, Wh=White, Nb=Navy Blue, Rd=Red, Rb=Royal Blue, Gm=Grey Melange)
        color_map: { "White": "Wh", "Black": "Bk", "Navy": "Nb", "Red": "Rd", "Royal": "Rb", "Sport Grey": "Gm" }
      },
      gelato: {
        product_uid: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_{size}_gco_{color}_gpr_{printCode}_gildan_64000",
        color_map: { "White": "white", "Black": "black", "Navy": "navy_blue", "Red": "red", "Royal": "royal-blue", "Sport Grey": "grey-melange" }
      }
    }
  },

  {
    id: "men-oversized-tee",
    title: "Men's Streetwear Oversized Tee",
    category: "Men",
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fmen-oversized-tee?alt=media&token=3dcae3b1-042e-417b-8557-90fd177123ae',
    model3d: null,
    description: "Heavyweight cotton with a boxy, dropped-shoulder fit.",

    print_areas: {
      front: { width: 4500, height: 5400 },
      back: { width: 4500, height: 5400 }
    },

    mockups: {
      front: "/assets/mockups/men-oversized-front.png",
      back: "/assets/mockups/men-oversized-back.png"
    },

    canvas_size: {
      width: 420,
      height: 560
    },

    price: {
      IN: 699,
      US: 27.99,
      GB: 21.99,
      EU: 24.99,
      CA: 39.99
    },

    print_area_2d: {
      front: { top: 29, left: 32.5, width: 36, height: 39 },
      back: { top: 29, left: 32.5, width: 36, height: 39 }
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
        // Base SKU for "Unisex Classic Oversized Tee"
        product_id: "UOsMRnHs",
        color_map: { "White": "Wh", "Black": "Bk", "Beige": "Bg" }
      },
      gelato: {
        product_uid: "apparel_product_gca_t-shirt_gsc_oversized_gcu_unisex_gqa_organic_gsi_{size}_gco_{color}_gpr_{printCode}_sols_03996",
        color_map: { "White": "white", "Black": "black", "Beige": "sand" }
      }
    }
  },

  {
    id: "men-hoodie",
    title: "Men's Essential Hoodie",
    category: "Men",
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fmen-hoodie?alt=media&token=eb24627e-f16e-4c09-b2a4-417c86fb2139',
    model3d: null,
    description: "Cozy, durable, and perfect for layering.",

    print_areas: {
      front: { width: 4000, height: 4000 },
      back: { width: 4500, height: 5400 },
    },

    mockups: {
      front: "/assets/mockups/men-hoodie-front.png",
      back: "/assets/mockups/men-hoodie-back.png"
    },

    canvas_size: {
      width: 420,
      height: 500
    },

    price: {
      IN: 899,
      US: 39.99,
      GB: 29.99,
      EU: 34.99,
      CA: 49.99
    },

    print_area_2d: {
      front: { top: 32, left: 33.5, width: 33.5, height: 24.5 },
      back: { top: 40, left: 35, width: 32, height: 29 }
    },

    options: {
      colors: ["Black", "White", "Navy"],
      sizes: ["S", "M", "L", "XL", "2XL"]
    },

    vendor_maps: {
      printify: {
        blueprint_id: "77",
        print_provider_id: "29",
        color_map: { "Black": 102, "White": 101, "Navy": 103 }
      },
      qikink: {
        // Base SKU for "Unisex Hoodie"
        product_id: "UHd",
        color_map: { "Black": "Bk", "White": "Wh", "Navy": "Nb" }
      },
      gelato: {
        product_uid: "apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_{size}_gco_{color}_gpr_{printCode}_gildan_18500",
        color_map: { "Black": "black", "White": "white", "Navy": "navy" }
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
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fwomen-classic-tee?alt=media&token=ec5f29b8-03fc-4879-80f9-608b99adf197',
    model3d: "/assets/t-shirt.glb",
    description: "A feminine cut with shorter sleeves and a subtle waist curve.",

    print_areas: {
      front: { width: 4000, height: 4800 },
      back: { width: 4000, height: 4800 }
    },

    mockups: {
      front: "/assets/mockups/men-classic-tee-front.png",
      back: "/assets/mockups/men-classic-tee-back.png"
    },

    canvas_size: {
      width: 420,
      height: 560
    },

    price: {
      IN: 449,
      US: 24.99,
      GB: 19.99,
      EU: 20.99,
      CA: 34.99
    },

    print_area_2d: {
      front: { top: 29, left: 32.5, width: 35, height: 39 },
      back: { top: 29, left: 32.5, width: 35, height: 39 }
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
        // Base SKU for "Female Round Neck Half Sleeve"
        product_id: "FRnHs",
        color_map: { "White": "Wh", "Black": "Bk", "Pink": "Pk", "Heather Mauve": "Mv" }
      },
      gelato: {
        product_uid: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_{size}_gco_{color}_gpr_{printCode}_gildan_64000",
        color_map: { "White": "white", "Black": "black", "Pink": "pink", "Heather Mauve": "heather_mauve" }
      }
    }
  },

  {
    id: "women-oversized-tee",
    title: "Women's Boyfriend Oversized Tee",
    category: "Women",
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fwomen-oversized-tee?alt=media&token=05ed8b7a-fbab-4394-a704-9f59ed435801',
    model3d: null,
    description: "Relaxed boyfriend fit. Style it tucked in or loose.",

    print_areas: {
      front: { width: 4500, height: 5400 },
      back: { width: 4500, height: 5400 }
    },

    mockups: {
      front: "/assets/mockups/men-oversized-front.png",
      back: "/assets/mockups/men-oversized-back.png"
    },

    print_area_2d: {
      front: { top: 29, left: 32.5, width: 36, height: 39 },
      back: { top: 29, left: 32.5, width: 36, height: 39 }
    },

    canvas_size: {
      width: 420,
      height: 560
    },

    price: {
      IN: 699,
      US: 27.99,
      GB: 21.99,
      EU: 22.99,
      CA: 39.99
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
        // Same as Men's Oversized (Unisex)
        product_id: "UOsMRnHs",
        color_map: { "White": "Wh", "Black": "Bk", "Sand": "Sd" }
      },
      gelato: {
        product_uid: "apparel_product_gca_t-shirt_gsc_oversized_gcu_unisex_gqa_organic_gsi_{size}_gco_{color}_gpr_{printCode}_sols_03996",
        color_map: { "White": "white", "Black": "black", "Sand": "sand" }
      }
    }
  },

  {
    id: "women-hoodie",
    title: "Women's Cozy Hoodie",
    category: "Women",
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fwomen-hoodie?alt=media&token=788e59c3-a0d8-489c-8603-c731023a2f10',
    model3d: null,
    description: "Soft fleece fabric, kangaroo pocket, standard fit.",

    print_areas: {
      front: { width: 4000, height: 4000 },
      back: { width: 4500, height: 5400 },
    },

    canvas_size: {
      width: 420,
      height: 500
    },

    price: {
      IN: 899,
      US: 39.99,
      GB: 31.99,
      EU: 34.99,
      CA: 49.99
    },

    mockups: {
      front: "/assets/mockups/men-hoodie-front.png",
      back: "/assets/mockups/men-hoodie-back.png",
    },

    print_area_2d: {
      front: { top: 32, left: 33.5, width: 33.5, height: 24.5 },
      back: { top: 40, left: 35, width: 32, height: 29 }
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
        // Same as Men's (Unisex)
        product_id: "UHd",
        color_map: { "White": "Wh", "Black": "Bk", "Pink": "Pk", "Dark Heather": "Cm" }
      },
      gelato: {
        product_uid: "apparel_product_gca_hoodie_gsc_pullover_gcu_womens_gqa_prm_gsi_{size}_gco_{color}_gpr_{printCode}",
        color_map: { "White": "white", "Black": "black", "Pink": "light-pink", "Dark Heather": "dark-grey-heather" }
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
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fmug-ceramic-11oz?alt=media&token=7a07c2c7-78d6-4610-8e09-aee10ceb5bd1',
    model3d: "/assets/mug.glb",
    description: "Durable ceramic mug with high-quality printing.",

    print_areas: {
      front: { width: 2700, height: 1100 }
    },

    canvas_size: {
      width: 800,
      height: 300
    },

    price: {
      IN: 399,
      US: 19.99,
      GB: 14.99,
      EU: 16.99,
      CA: 24.99
    },

    mockups: {
      front: "/assets/mockups/mug-front.png",
      left: "/assets/mockups/mug-left.png",
      right: "/assets/mockups/mug-right.png"
    },

    print_area_2d: {
      front: { top: 13, left: 25, width: 50, height: 79 },
      left: { top: 13, left: 25, width: 50, height: 79 },
      right: { top: 13, left: 25, width: 50, height: 79 }
    },

    options: {
      colors: ["White"],
      sizes: ["11oz"]
    },

    vendor_maps: {
      printify: {
        blueprint_id: "68",
        print_provider_id: "9",
        color_map: { "White": 101, "Black Handle": 115 }
      },
      qikink: {
        // Mugs typically don't use the SKU pattern, using 'Mug' as base for ID construction
        product_id: "UWECM-Wh-11oz",
        color_map: { "White": "Wh" }
      },
      gelato: {
        product_uid: "mug_product_msz_11-oz_mmat_ceramic-white_cl_4-0",
        color_map: { "White": "white", "Black Handle": "black_handle" }
      }
    }
  },

  {
    id: "tote-bag-canvas",
    title: "Eco Canvas Tote Bag",
    category: "Accessories",
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Ftote-bag-canvas?alt=media&token=bd508609-096a-443c-a6a1-196390ceefdc',
    model3d: "/assets/tote.glb",
    description: "Heavy duty canvas tote for daily use.",

    print_areas: {
      front: { width: 3000, height: 3000 },
      back: { width: 3000, height: 3000 }
    },

    canvas_size: {
      width: 380,
      height: 380
    },

    price: {
      IN: 399,
      US: 14.99,
      GB: 20.99,
      EU: 14.99,
      CA: 20.99
    },

    mockups: {
      front: "/assets/mockups/tote-bag.png",
      back: "/assets/mockups/tote-bag.png"
    },

    print_area_2d: {
      front: { top: 43, left: 29, width: 40.5, height: 33.5 },
      back: { top: 43, left: 29, width: 40.5, height: 33.5 }
    },

    options: {
      colors: ["White"],
      sizes: ["One Size"]
    },

    vendor_maps: {
      printify: {
        blueprint_id: "472",
        print_provider_id: "2",
        color_map: { "Natural": 10, "Black": 102 }
      },
      qikink: {
        product_id: "UTbNz-Wh-NA",
        color_map: { "White": "Wh" }
      },
      gelato: {
        product_uid: "bag_product_bsc_tote-bag_bqa_clc_bsi_std-t_bco_white_bpr_{printCode}",
        color_map: { "Natural": "natural", "Black": "black" }
      }
    }
  }
];