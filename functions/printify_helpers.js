/**
 * One-time helper script to fetch and save Printify Shop ID
 * Run: node getPrintifyShopId.js
 */

const fs = require("fs");
const axios = require("axios");

// 🔐 PUT YOUR API TOKEN HERE (TEMPORARILY)
const PRINTIFY_API_TOKEN = "XXX-XXX-XXX"
// 📁 Output file

async function getShopId() {
    try {
        const res = await axios.get(
            "https://api.printify.com/v1/shops.json",
            {
                headers: {
                    Authorization: `Bearer ${PRINTIFY_API_TOKEN}`
                }
            }
        );

        if (!res.data || res.data.length === 0) {
            console.error("❌ No shops found. Check your API token.");
            return;
        }

        console.log("✅ Shops found:\n");

        res.data.forEach((shop, index) => {
            console.log(`${index + 1}. ${shop.title} → ID: ${shop.id}`);
        });

        // If only one shop exists, auto-pick it
        const shopId = res.data[0].id;

        // Save to file
        console.log(`➡️ Shop ID: ${shopId}`);

    } catch (err) {
        console.error(
            "❌ Error fetching shops:",
            err.response?.data || err.message
        );
    }
}