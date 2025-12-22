export const INITIAL_PRODUCTS = [
  // --- MEN'S COLLECTION ---
  {
    id: "men-classic-tee",
    title: "Men's Classic Premium Tee",
    category: "Men",
    price: 24.99,
    image: null, // Will be filled by Upload
    description: "A timeless classic. Soft cotton, reliable fit.",
    vendor_maps: {
      printify: { blueprint_id: "12", print_provider_id: "29", variant_map: "standard" },
      qikink: { product_id: "men_round_neck" },
      gelato: { product_uid: "apparel_classic_tee_unisex" }
    }
  },
  {
    id: "men-oversized-tee",
    title: "Men's Streetwear Oversized Tee",
    category: "Men",
    price: 32.00,
    image: null,
    description: "Heavyweight cotton with a boxy, dropped-shoulder fit.",
    vendor_maps: {
      printify: { blueprint_id: "1096", print_provider_id: "29" }, 
      qikink: { product_id: "men_oversized" },
      gelato: { product_uid: "apparel_heavyweight_tee" }
    }
  },
  {
    id: "men-hoodie",
    title: "Men's Essential Hoodie",
    category: "Men",
    price: 45.00,
    image: null,
    description: "Cozy, durable, and perfect for layering.",
    vendor_maps: {
      printify: { blueprint_id: "77", print_provider_id: "29" },
      qikink: { product_id: "unisex_hoodie" },
      gelato: { product_uid: "apparel_hoodie_classic" }
    }
  },

  // --- WOMEN'S COLLECTION ---
  {
    id: "women-classic-tee",
    title: "Women's Fitted Premium Tee",
    category: "Women",
    price: 24.99,
    image: null,
    description: "A feminine cut with shorter sleeves and a subtle waist curve.",
    vendor_maps: {
      printify: { blueprint_id: "36", print_provider_id: "29", variant_map: "ladies" },
      qikink: { product_id: "women_round_neck" },
      gelato: { product_uid: "apparel_ladies_tee" }
    }
  },
  {
    id: "women-oversized-tee",
    title: "Women's Boyfriend Oversized Tee",
    category: "Women",
    price: 32.00,
    image: null,
    description: "Relaxed boyfriend fit. Style it tucked in or loose.",
    vendor_maps: {
      printify: { blueprint_id: "1096", print_provider_id: "29" },
      qikink: { product_id: "men_oversized" }, 
      gelato: { product_uid: "apparel_heavyweight_tee" }
    }
  },
  {
    id: "women-hoodie",
    title: "Women's Cozy Hoodie",
    category: "Women",
    price: 45.00,
    image: null,
    description: "Soft fleece fabric, kangaroo pocket, standard fit.",
    vendor_maps: {
      printify: { blueprint_id: "77", print_provider_id: "29" },
      qikink: { product_id: "unisex_hoodie" },
      gelato: { product_uid: "apparel_hoodie_classic" }
    }
  },

  // --- ACCESSORIES ---
  {
    id: "mug-ceramic-11oz",
    title: "Classic Ceramic Mug (11oz)",
    category: "Accessories",
    price: 14.00,
    image: null,
    description: "Durable ceramic mug with high-quality printing.",
    vendor_maps: {
      printify: { blueprint_id: "68", print_provider_id: "9" },
      qikink: { product_id: "coffee_mug" },
      gelato: { product_uid: "mug_11oz_ceramic" }
    }
  },
  {
    id: "tote-bag-canvas",
    title: "Eco Canvas Tote Bag",
    category: "Accessories",
    price: 19.00,
    image: null,
    description: "Heavy duty canvas tote for daily use.",
    vendor_maps: {
      printify: { blueprint_id: "472", print_provider_id: "2" },
      qikink: { product_id: "tote_bag" },
      gelato: { product_uid: "tote_bag_canvas" }
    }
  }
];