// setupPrintifyWebhooks.js
const axios = require("axios");

// --------------------------------------------------------
// 1. CONFIGURATION (Replace these with your actual values)
// --------------------------------------------------------
const PRINTIFY_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiIzN2Q0YmQzMDM1ZmUxMWU5YTgwM2FiN2VlYjNjY2M5NyIsImp0aSI6ImUxY2EzOGEzMmM2NGM5M2YxNGQ3MTM3MmI1ZmQwZWY1N2ZlOWMzZTVkMDI0YmRlMWE3ODBkNDM4NmZlNDQyOTVmODIzZDA2NmE5YWQxMjE4IiwiaWF0IjoxNzY1OTA3NjA4LjM5MTAxNSwibmJmIjoxNzY1OTA3NjA4LjM5MTAxNywiZXhwIjoxNzk3NDQzNjA4LjM4MjYyMSwic3ViIjoiMjU3MDI3MjEiLCJzY29wZXMiOlsic2hvcHMubWFuYWdlIiwic2hvcHMucmVhZCIsImNhdGFsb2cucmVhZCIsIm9yZGVycy5yZWFkIiwib3JkZXJzLndyaXRlIiwicHJvZHVjdHMucmVhZCIsInByb2R1Y3RzLndyaXRlIiwid2ViaG9va3MucmVhZCIsIndlYmhvb2tzLndyaXRlIiwidXBsb2Fkcy5yZWFkIiwidXBsb2Fkcy53cml0ZSIsInByaW50X3Byb3ZpZGVycy5yZWFkIiwidXNlci5pbmZvIl19.cwmW9eDrWz6Urfizuz-u7JYfYLEH_Q8_oAUsK4fINEfwlVRLaXX-HuNvygiuFBkCPOkK6cQ2nlunOMHzdWVVNdYTHnuo5DRuO0Va5GC3MH9zBwiiMnaYQjtB9upRbKvAF8PkdWfLLzCuqasoVhJswDX3KPpcmESEki7wA0Q-J3AQjyY2OZplGgQzDwJq3ck4AyWgeLrr5Ntd3Pb5OtXQfJoJ5n1W0TfAwYyhVrOnfhjcQd7rZsD29gBHRUNrCJYhoCF44Kv9p9vzfu_fc7AwkKPfl0XTId4x3wYa0GM-cSZ3ATt5Ndc2VSeQkx5FfzJqwkLDWlrnG58dMVNbWuG9EF4NpfJj9wsiWFXzLjLDcBNcD1JbTQMGQDNDbogdNhULVFHBHhX8LEj7F3aF3JjsqO5e3Ivf3hfL68culz4XGkp9LKLypZ1o5c5Csq-9KNOxV08KBYBa76ewenMdCQMXbiMjcZTvTK9cn2twp6cC3Av7mifkFWfy-e1XfJ7x6wjIr5wxzGDYrdQ6SOBPHtiK_J_Az2hwiIaNN7cfnmXt02WFZL8Mvkd58YxPtlwrr9eVJQdc3nSz0sqXv6Zg1_si3gr3JH_MxFZYj7yEO39CPuv-2_6foI6EpGoio6C5JIOqt9rxL9AraAhcdIPRdn6OAw79YIsIbmUQZs7NHYowQEQ"; // Same as in functions config
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