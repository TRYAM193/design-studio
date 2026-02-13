// setupPrintifyWebhooks.js
const axios = require("axios");

// --------------------------------------------------------
// 1. CONFIGURATION (Replace these with your actual values)
// --------------------------------------------------------
const SHOP_ID = "25686438"; // Find this in Printify URL or functions config
const FIREBASE_FUNCTION_URL = "https://us-central1-tryam-5bff4.cloudfunctions.net/handleProviderWebhook?source=printify";
// --------------------------------------------------------

async function registerWebhooks() {
  if (PRINTIFY_TOKEN === "YOUR_PRINTIFY_ACCESS_TOKEN") {
    console.error("❌ Error: Please replace the placeholders with your actual Printify Token and URL.");
    return;
  }

  const baseUrl = `https://api.printify.com/v1/shops/${SHOP_ID}/webhooks.json`;
  const headers = {
    "Authorization": `Bearer ${PRINTIFY_TOKEN}`,
    "Content-Type": "application/json"
  };

  try {
    console.log("🔍 Checking existing webhooks...");
    const existing = await axios.get(baseUrl, { headers });

    // ✅ UPDATED LIST BASED ON YOUR DOCS
    const topicsNeeded = [
      "order:sent-to-production",  // New: Track when making starts
      "order:shipment:created",    // Critical: Tracking Number
      "order:shipment:delivered"   // New: Final Delivery
    ];

    for (const topic of topicsNeeded) {
      // Check if this specific topic is already registered to our URL
      const isRegistered = existing.data.find(h => h.topic === topic && h.url === FIREBASE_FUNCTION_URL);

      if (isRegistered) {
        console.log(`✅ Already registered: ${topic}`);
        continue;
      }

      console.log(`🚀 Creating webhook for: ${topic}...`);
      try {
        await axios.post(baseUrl, {
          topic: topic,
          url: FIREBASE_FUNCTION_URL
        }, { headers });
        console.log(`✅ Success! Registered ${topic}`);
      } catch (err) {
        // If it fails, log why (e.g., validation failed)
        console.error(`❌ Failed to register ${topic}:`, err.response?.data || err.message);
      }
    }

    console.log("\n🎉 Webhook setup complete!");

  } catch (error) {
    console.error("❌ Script Error:", error.response?.data || error.message);
  }
}

registerWebhooks();