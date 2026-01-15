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

    variants: {
      qikink: {
        colors: [
          'Black',
          'White',
          'Navy Blue',
          'Grey Melange',
          'Royal Blue',
          'Red',
          'Maroon',
          'Bottle Green',
          'Charcoal Melange'
        ],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        sizeChart: {
          XS: [36, 25],
          S: [38, 26],
          M: [40, 27],
          L: [42, 28],
          XL: [44, 29],
          XXL: [46, 30]          // (Chest, Length)
        }
      },
      printify: {
        colors: [
          'Black',
          'White',
          'Navy',
          'Athletic Heather',  // The standard Light Grey
          'Dark Grey Heather', // The standard Dark Grey
          'True Royal',
          'Red',
          'Maroon',
          'Military Green',    // Best "Army" color
          'Kelly',             // Standard Green
          'Team Purple',
          'Orange',
          'Gold',              // Standard Yellow/Gold
          'Pink',
          'Baby Blue',         // Standard Light Blue
          'Turquoise',
          'Aqua',
          'Natural',           // Very popular "Beige" alternative
          'Soft Pink',
          'Mustard',           // Often listed as "Yellow" or "Gold" - check your mapping
          'Cardinal',
          'Black Heather',     // Very popular
          'Heather Mauve',     // #1 Selling Heather in US
          'Heather Navy',
          'Deep Heather',      // A nice mid-grey
          'Heather True Royal',
          'Heather Red',
          'Heather Columbia Blue'
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        sizeChart: {
          S: [32, 27],
          M: [40, 29],
          L: [44, 30],
          XL: [48, 30]
        }
      },
      gelato: {
        colors: ['White', 'Black', 'Natural', 'Light Blue', 'Military Green', 'Irish Green', 'Royal', 'Red', 'Maroon', 'Navy'],
        sizes: ['S', 'M', 'L', 'XL'],
        sizeChart: {
          S: [36, 28],
          M: [40, 29],
          L: [44, 30],
          XL: [48, 31]
        }
      }
    },

    price: {
      IN: 549,
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
        color_map: {
          "Black": "Bk", "White": "Wh", "Navy Blue": "Nb", "Grey Melange": "Gm", "Royal Blue": "Rb",
          "Red": "Rd", "Maroon": "Mn", "Bottle Green": "Bt", "Charcoal Melange": "Ch"
        }
      },
      gelato: {
        product_uid: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_{size}_gco_{color}_gpr_{print_code}_gildan_64000",
        color_map: {
          "Black": "black", "White": "white", "Navy Blue": "navy", "Grey Melange": "sport-grey",
          "Royal Blue": "royal", "Red": "red", "Maroon": "maroon", "Bottle Green": "irish-green", "Charcoal Melange": "dark-heather"
        }
      }
    }
  },

  {
    id: "unisex-oversized-tee",
    title: "Unisex Streetwear Oversized Tee",
    category: "Unisex",
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fmen-oversized-tee?alt=media&token=3dcae3b1-042e-417b-8557-90fd177123ae',
    image1: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fwomen-oversized-tee?alt=media&token=05ed8b7a-fbab-4394-a704-9f59ed435801',
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
      US: 33.99,
      GB: 30.99,
      EU: 24.99,
      CA: 51.99
    },

    variants: {
      qikink: {
        colors: ['Black', 'White'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        sizeChart: {
          XS: [40, 27, 18],
          S: [42, 28, 19],
          M: [44, 29, 20],
          L: [46, 30, 21],
          XL: [48, 31, 22],
          XXL: [50, 32, 23]          // (Chest, Length, Shoulder)
        }
      },
      printify: {
        colors: [
          "Black",
          "White",
          "Navy",
          "Dark Grey",
          "Athletic Heather",
          "Natural"
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        sizeChart: {
          S: [40, 27.25],
          M: [42, 27.25],
          L: [46, 28.75],
          XL: [50, 29.75]
        }
      },
      gelato: {
        colors: ['White', 'Black'],
        sizes: ['S', 'M', 'L', 'XL'],
        sizeChart: {
          S: [42.5, 28.7],
          M: [44.9, 29.5],
          L: [47.2, 30.3],
          XL: [49.6, 31.1]
        }
      }
    },

    print_area_2d: {
      front: { top: 29, left: 32.5, width: 36, height: 39 },
      back: { top: 29, left: 32.5, width: 36, height: 39 }
    },

    vendor_maps: {
      printify: {
        blueprint_id: "1382",
        print_provider_id: "29",
        color_map: { "White": 101, "Black": 102, "Beige": 15 }
      },
      qikink: {
        // Base SKU for "Unisex Classic Oversized Tee"
        product_id: "UOsMRnHs",
        color_map: { "White": "Wh", "Black": "Bk" }
      },
      gelato: {
        product_uid: "apparel_product_gca_t-shirt_gsc_oversized_gcu_unisex_gqa_organic_gsi_{size}_gco_{color}_gpr_{print_code}_sols_03996",
        color_map: { "White": "white", "Black": "black" }
      }
    }
  },

  {
    id: "unisex-hoodie",
    title: "Unisex Essential Hoodie",
    category: "Unisex",
    image: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fmen-hoodie?alt=media&token=eb24627e-f16e-4c09-b2a4-417c86fb2139',
    image1: 'https://firebasestorage.googleapis.com/v0/b/tryam-5bff4.firebasestorage.app/o/catalog%2Fwomen-hoodie?alt=media&token=788e59c3-a0d8-489c-8603-c731023a2f10',
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
      US: 39.9,
      GB: 29.9,
      EU: 55.9,
      CA: 59.9
    },

    variants: {
      qikink: {
        colors: ['Black', 'White', 'Navy Blue', 'Grey Melange', 'Red'],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', '3XL'],
        sizeChart: {
          XS: [38, 25],
          S: [40, 26],
          M: [42, 27],
          L: [44, 28],
          XL: [46, 29],
          XXL: [48, 30],
          '3XL': [50, 31]          // (Chest, Length, Shoulder)
        }
      },
      printify: {
        colors: [
          "Black",
          "White",
          "Navy",
          "Sport Grey",
          "Dark Heather",
          "Charcoal",
          "Royal",
          "Red",
          "Maroon",
          "Forest Green",
          "Military Green"
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        sizeChart: {
          S: [40, 27.17],
          M: [44, 27.95],
          L: [48, 29.13],
          XL: [52, 29.92]
        }
      },
      gelato: {
        colors: ['White', 'Black', 'Light Blue', 'Gold', 'Military Green', 'Irish Green', 'Royal', 'Red', 'Maroon', 'Forest Green', 'Navy'],
        sizes: ['S', 'M', 'L', 'XL'],
        sizeChart: {
          S: [36, 28],
          M: [40, 29],
          L: [44, 30],
          XL: [48, 31]
        }
      }
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
        color_map: { "Black": "Bk", "White": "Wh", "Navy Blue": "Nb", "Grey Melange": "Gm", "Red": "Rd" }
      },
      gelato: {       
        product_uid: "apparel_product_gca_hoodie_gsc_pullover_gcu_unisex_gqa_classic_gsi_{size}_gco_{color}_gpr_{print_code}_gildan_18500",
        color_map: { "Black": "black", "White": "white", "Navy Blue": "navy", "Grey Melange": "sport-grey", "Red": "red" }
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
      front: "/assets/mockups/women-classic-tee-front.png",
      back: "/assets/mockups/women-classic-tee-back.png"
    },

    canvas_size: {
      width: 420,
      height: 560
    },

    price: {
      IN: 549,
      US: 24.99,
      GB: 19.99,
      EU: 20.99,
      CA: 34.99
    },

    variants: {
      qikink: {
        colors: ['Black', 'Bottle Green', 'Charcoal Melange', 'Grey Melange',
          'Maroon',
          'Navy Blue',
          'Red', 'Royal Blue', 'White',
        ],
        sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL'],
        sizeChart: {
          XS: [32, 23],
          S: [34, 24],
          M: [36, 25],
          L: [38, 26],
          XL: [40, 27],
          XXL: [42, 28]          // (Chest, Length)
        }
      },
      printify: {
        colors: [
          "Black",
          "White",
          "Navy",
          "Sport Grey",
          "Dark Heather",
          "Charcoal",
          "Royal",
          "Red",
          "Forest Green"
        ],
        sizes: ['S', 'M', 'L', 'XL'],
        sizeChart: {
          S: [18, 27],
          M: [20, 29],
          L: [22, 30],
          XL: [24, 30]
        }
      },
      gelato: {
        colors: ['White', 'Black', 'Natural', 'Light Blue', 'Military Green', 'Irish Green', 'Royal', 'Red', 'Maroon', 'Navy'],
        sizes: ['S', 'M', 'L', 'XL'],
        sizeChart: {
          S: [36, 28],
          M: [40, 29],
          L: [44, 30],
          XL: [48, 31]
        }
      }
    },

    print_area_2d: {
      front: { top: 29, left: 32.5, width: 35, height: 39 },
      back: { top: 29, left: 32.5, width: 35, height: 39 }
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
        product_uid: "apparel_product_gca_t-shirt_gsc_crewneck_gcu_unisex_gqa_classic_gsi_{size}_gco_{color}_gpr_{print_code}_gildan_64000",
        color_map: { "White": "white", "Black": "black", "Pink": "pink", "Heather Mauve": "heather_mauve" }
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

    variants: {
      qikink: {
        colors: ["White"],
        sizes: ["11oz"]
      },
      printify: {
        colors: ['White'],
        sizes: ['11oz']
      },
      gelato: {
        colors: ['White'],
        sizes: ['11oz']
      }
    },

    vendor_maps: {
      printify: {
        blueprint_id: "503",
        print_provider_id: "48",
        color_map: { "White": 101, "Black Handle": 115 },
        variant_id: 67624,
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
      US: 26.99,
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

    variants: {
      qikink: {
        colors: ["White"]
      },
      printify: {
        colors: ['Natural', 'Black']
      },
      gelato: {
        colors: ['White']
      }
    },

    vendor_maps: {
      printify: {
        blueprint_id: "1313",
        print_provider_id: "29",
        variant_id: { "Natural": 101409, "Black": 103598 }
      },
      qikink: {
        product_id: "UTbNz-Wh-NA",
        color_map: { "White": "Wh" }
      },
      gelato: {
        product_uid: "bag_product_bsc_tote-bag_bqa_clc_bsi_std-t_bco_white_bpr_{print_code}",
        color_map: { "Natural": "natural", "Black": "black" }
      }
    }
  }
];