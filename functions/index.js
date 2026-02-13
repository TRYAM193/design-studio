const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const axios = require("axios");
const Replicate = require("replicate");
const path = require("path");
const fs = require("fs");
const { StaticCanvas } = require("fabric/node");
const { registerFont } = require("canvas");
const Razorpay = require("razorpay");
const Stripe = require("stripe");
const { v4: uuidv4 } = require('uuid');
const { getDownloadURL } = require("firebase-admin/storage")
const nodemailer = require("nodemailer");
// Initialize Admin
if (admin.apps.length === 0) {
  admin.initializeApp();
}
const db = admin.firestore();

// 2. Payment Keys
const razorpay = new Razorpay({
  key_id: functions.config().razorpay?.key_id || "MISSING_ID",
  key_secret: functions.config().razorpay?.key_secret || "MISSING_SECRET"
});
const stripe = new Stripe(functions.config().stripe?.secret_key || "MISSING_KEY");

// 3. Replicate (AI)
const replicate = new Replicate({
  auth: functions.config().replicate?.key || "MISSING_KEY",
});

async function sendOrderEmail(orderData, providerName, estimatedDate) {
  try {
    const customerName = orderData.shippingAddress.fullName.split(" ")[0];
    const orderId = orderData.orderId;
    const email = orderData.shippingAddress.email;

    // Use Gmail App Password
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: functions.config().email?.user,
        pass: functions.config().email?.pass
      }
    });

    const html = `
      <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #ea580c;">Order Confirmed! 🚀</h2>
        <p>Hi ${customerName},</p>
        <p>Your custom order <strong>#${orderId}</strong> has been received and sent to production.</p>
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;" />
        <p><strong>Provider:</strong> ${providerName}</p>
        <p><strong>Est. Delivery:</strong> ${new Date(estimatedDate).toDateString()}</p>
        <br/>
        <a href="https://your-app.com/orders/${orderId}" style="background-color: #ea580c; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Track Order</a>
      </div>
    `;

    await transporter.sendMail({
      from: `"TryAm Store" <${functions.config().email?.user}>`,
      to: email,
      subject: `Order #${orderId} Confirmed!`,
      html: html
    });
    console.log(`📧 Email sent to ${email}`);

  } catch (error) {
    console.error("Email Failed:", error);
  }
}

// ------------------------------------------------------------------
// 🧩 PRINTIFY HELPER FUNCTIONS
// ------------------------------------------------------------------
async function getPrintifyVariantId(blueprintId, providerId, sizeName, colorName) {
  const API_TOKEN = functions.config().printify?.token;
  try {
    const res = await axios.get(`https://api.printify.com/v1/catalog/blueprints/${blueprintId}/print_providers/${providerId}/variants.json`, {
      headers: { 'Authorization': `Bearer ${API_TOKEN}` }
    });
    const variants = res.data.variants;
    const match = variants.find(v => {
      let vSize = "";
      if (v.options && v.options.size) vSize = v.options.size;
      else if (v.title) {
        const parts = v.title.split(' / ');
        if (parts.length > 1) vSize = parts[parts.length - 1].trim();
      }
      if (vSize.toUpperCase() !== sizeName.toUpperCase()) return false;

      if (v.options && v.options.color) {
        const vColor = v.options.color.toLowerCase();
        const myColor = colorName.toLowerCase();
        if (vColor === myColor || vColor.includes(myColor) || myColor.includes(vColor)) return true;
      }
      return false;
    });
    return match ? match.id : null;
  } catch (error) {
    console.error("Printify Variant Error:", error.message);
    return null;
  }
}

async function deletePrintifyProduct(shopId, productId) {
  const token = functions.config().printify?.token;
  try {
    await axios.delete(`https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log(`🗑️ Deleted temp mockup product: ${productId}`);
  } catch (error) {
    console.error("Failed to delete temp product:", error.message);
  }
}
// ------------------------------------------------------------------
// 🛠️ UPDATED PRINTIFY HELPERS
// ------------------------------------------------------------------

// 1. IMPROVED POLLING: Waits for Lifestyle Images
async function waitForPrintifyImages(shopId, productId, token, maxRetries = 15) {
  let attempt = 0;
  let lastImageCount = 0;
  let stabilityCount = 0; // How many times the count hasn't changed

  while (attempt < maxRetries) {
    try {
      console.log(`⏳ Polling Printify Product ${productId} (Attempt ${attempt + 1}/${maxRetries})...`);

      const res = await axios.get(`https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const images = res.data.images || [];
      const count = images.length;

      // SUCCESS CRITERIA:
      // 1. We have 3 or more images (Front + Back + At least 1 Lifestyle)
      if (count >= 3) {
        console.log(`✅ Detected ${count} images (Lifestyle included!)`);
        return images;
      }

      // 2. STABILITY CHECK:
      // If we have some images (e.g. 2), but the count hasn't changed for 3 checks, 
      // Printify might simply not have any more for this specific item.
      if (count > 0 && count === lastImageCount) {
        stabilityCount++;
        if (stabilityCount >= 3) {
          console.log(`⚠️ Image count stable at ${count} for 3 checks. Returning what we have.`);
          return images;
        }
      } else {
        stabilityCount = 0; // Reset if count changed (images are still loading)
      }

      lastImageCount = count;

    } catch (e) {
      console.warn(`⚠️ Polling error: ${e.message}`);
    }

    // Wait 2 seconds (Lifestyle images take time to render)
    await new Promise(resolve => setTimeout(resolve, 2000));
    attempt++;
  }

  // If we timed out but found some images (e.g., just the 2 front/back), return them 
  // so the user at least sees something.
  if (lastImageCount > 0) {
    console.log(`⚠️ Polling timed out. Returning ${lastImageCount} images found.`);
    // We need to fetch one last time to get the array, or ideally we should have stored it.
    // For simplicity in this flow, we'll try one last fetch:
    try {
      const finalRes = await axios.get(`https://api.printify.com/v1/shops/${shopId}/products/${productId}.json`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      return finalRes.data.images || [];
    } catch (e) { return null; }
  }

  return null;
}


// 2. UPDATED GENERATOR: Forces "Generate" Endpoint
async function getMockupsFromPrintify(item, printFiles) {
  const shopId = functions.config().printify?.shop_id;
  const token = functions.config().printify?.token;

  const map = item.vendor_maps?.printify || { blueprint_id: 12, print_provider_id: 29 };
  const isMug = item.title.toLowerCase().includes("mug");
  const isTote = item.title.toLowerCase().includes('tote');

  let tempProductId = null;

  try {
    // A. UPLOAD & PREPARE
    const frontImageId = printFiles.front ? await uploadPrintifyImage(printFiles.front) : null;
    const backImageId = printFiles.back ? await uploadPrintifyImage(printFiles.back) : null;

    const placeholders = [];
    if (frontImageId) placeholders.push({ position: "front", images: [{ id: frontImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }] });
    if (backImageId && !isMug) placeholders.push({ position: "back", images: [{ id: backImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }] });

    let variantId = await getPrintifyVariantId(map.blueprint_id, map.print_provider_id, 'L', item.variant.color);
    if (isMug) variantId = map.variant_id
    if (isTote) variantId = 101409
    if (!variantId) {
      variantId = await getPrintifyVariantId(map.blueprint_id, map.print_provider_id, "L", "Black") ||
        await getPrintifyVariantId(map.blueprint_id, map.print_provider_id, "L", "White");
    }
    if (!variantId) throw new Error("No variant found");

    // B. CREATE PRODUCT
    console.log("Creating Temp Product...");
    const createRes = await axios.post(`https://api.printify.com/v1/shops/${shopId}/products.json`, {
      title: "TEMP_MOCKUP_" + Date.now(),
      description: "Mockup Gen",
      blueprint_id: Number(map.blueprint_id),
      print_provider_id: Number(map.print_provider_id),
      variants: [{ id: variantId, price: 1000, is_enabled: true }],
      print_areas: [{ variant_ids: [variantId], placeholders: placeholders }]
    }, { headers: { 'Authorization': `Bearer ${token}` } });

    tempProductId = createRes.data.id;

    // C. ⚡ FORCE GENERATION (CRITICAL STEP ADDED) ⚡
    // This tells Printify: "Hey, render ALL the fancy lifestyle shots now!"
    try {
      console.log("⚡ Triggering full mockup generation...");
      await axios.post(`https://api.printify.com/v1/shops/${shopId}/products/${tempProductId}/mockups/generate.json`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (genError) {
      console.warn("Generation trigger warning (might be auto-generating):", genError.message);
    }

    // D. POLL FOR IMAGES
    const validImages = await waitForPrintifyImages(shopId, tempProductId, token);

    if (!validImages || validImages.length === 0) {
      throw new Error("Mockup generation timed out");
    }

    // E. EXTRACT GALLERY
    // Initialize with gallery array
    const mockupUrls = { front: null, back: null, gallery: [] };

    validImages.forEach(img => {
      // 1. Push EVERYTHING to gallery (Lifestyle shots will be here)
      if (img.src) {
        mockupUrls.gallery.push(img.src);
      }

      // 2. Identify Front/Back for the main view
      const pos = (img.position || "").toLowerCase();
      const isDefault = img.is_default;

      if (isMug) {
        if (pos === 'front' || pos === 'center') mockupUrls.front = img.src;
        else if (isDefault && !mockupUrls.front) mockupUrls.front = img.src;
      } else {
        if (pos === 'front') mockupUrls.front = img.src;
        else if (pos === 'back') mockupUrls.back = img.src;
      }
    });

    // Fallback: If 'front' is missing but we have gallery images, use the first one
    if (!mockupUrls.front && mockupUrls.gallery.length > 0) {
      mockupUrls.front = mockupUrls.gallery[0];
    }

    // F. DELETE TEMP PRODUCT
    console.log(`🗑️ Deleting temp product ${tempProductId}...`);
    await deletePrintifyProduct(shopId, tempProductId);

    return mockupUrls;

  } catch (error) {
    console.error("❌ Mockup Gen Failed:", error.message);
    if (tempProductId) await deletePrintifyProduct(shopId, tempProductId);
    // Return basics if advanced failed
    return { front: printFiles.front, back: printFiles.back, gallery: [] };
  }
}

async function uploadPrintifyImage(imageUrl) {
  const API_TOKEN = functions.config().printify?.token;
  const res = await axios.post(`https://api.printify.com/v1/uploads/images.json`, {
    "file_name": "ai_design.png", "url": imageUrl
  }, { headers: { 'Authorization': `Bearer ${API_TOKEN}` } });
  return res.data.id;
}

async function createPrintifyProduct(shopId, blueprintId, providerId, variantId, printFiles) {
  const API_TOKEN = functions.config().printify?.token;

  const frontImageId = printFiles.front ? await uploadPrintifyImage(printFiles.front) : null;
  const backImageId = printFiles.back ? await uploadPrintifyImage(printFiles.back) : null;
  const placeholders = [];

  if (frontImageId) placeholders.push({ position: "front", images: [{ id: frontImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }] });
  if (backImageId) placeholders.push({ position: "back", images: [{ id: backImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }] });

  const productPayload = {
    title: "Order-" + Date.now(),
    description: "AI Custom",
    blueprint_id: Number(blueprintId),
    print_provider_id: Number(providerId),
    variants: [{ id: variantId, price: 2000, is_enabled: true }],
    print_areas: [{ variant_ids: [variantId], placeholders }]
  };

  const res = await axios.post(`https://api.printify.com/v1/shops/${shopId}/products.json`, productPayload, {
    headers: { 'Authorization': `Bearer ${API_TOKEN}` }
  });
  return res.data;
}

// ------------------------------------------------------------------
// 🚀 1. SEND TO PRINTIFY (With Placeholder Date)
// ------------------------------------------------------------------
async function sendToPrintify(orderData, processedItems) {
  const shopId = functions.config().printify?.shop_id;
  const token = functions.config().printify?.token;

  const line_items = [];

  // Loop through items to prepare the order payload
  for (const item of processedItems) {
    const map = item.vendor_maps.printify;
    const colorName = item.variant?.color || item.selectedColor;
    const sizeName = item.variant?.size || item.selectedSize;

    // 1. Get Variant ID
    let catalogVariantId;
    if (item.title.toLowerCase().includes('mug')) catalogVariantId = map.variant_id; // If you hardcoded mugs
    else if (item.productId.toLowerCase().includes('tote')) catalogVariantId = map.variant_id?.[colorName];
    else catalogVariantId = await getPrintifyVariantId(map.blueprint_id, map.print_provider_id, sizeName, colorName);

    if (!catalogVariantId) throw new Error(`Printify Variant not found for ${item.title} (${colorName}/${sizeName})`);

    // 2. Create the Product on Printify (To attach the custom design)
    // Note: We use the 'printFiles' attached to the item
    const createdProduct = await createPrintifyProduct(
      shopId,
      map.blueprint_id,
      map.print_provider_id,
      catalogVariantId,
      item.printFiles
    );

    // 3. Add to Line Items
    line_items.push({
      product_id: createdProduct.id,
      variant_id: catalogVariantId,
      quantity: item.quantity
    });
  }

  // 4. Send the Final Order
  const payload = {
    external_id: orderData.orderId,
    line_items: line_items, // Now contains ALL items
    shipping_method: 1,
    send_shipping_notification: false,
    address_to: {
      first_name: orderData.shippingAddress.fullName.split(" ")[0],
      last_name: orderData.shippingAddress.fullName.split(" ")[1] || ".",
      email: orderData.shippingAddress.email,
      phone: orderData.shippingAddress.phone || "",
      country: orderData.shippingAddress.countryCode,
      region: orderData.shippingAddress.stateCode || "",
      address1: orderData.shippingAddress.line1,
      city: orderData.shippingAddress.city,
      zip: orderData.shippingAddress.zip
    }
  };

  try {
    const res = await axios.post(`https://api.printify.com/v1/shops/${shopId}/orders.json`, payload, {
      headers: { 'Authorization': `Bearer ${token}` }
    });

    // Calc Date
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 10);

    return {
      id: res.data.id,
      provider: 'printify',
      estimatedDelivery: estimatedDate.toISOString(),
      trackingUrl: null
    };
  } catch (error) {
    throw new Error("Printify Order Failed: " + (error.response?.data?.message || error.message));
  }
}

// ------------------------------------------------------------------
// 🚀 2. SEND TO GELATO (With Real Dates)
// ------------------------------------------------------------------
async function sendToGelato(orderData, processedItems) {
  const apiKey = functions.config().gelato.key;
  const countryCode = orderData.shippingAddress.countryCode;

  const gelatoItems = processedItems.map(item => {
    const map = item.vendor_maps.gelato;

    // Determine Print Code
    let printCode = "4-0";
    if (item.printFiles.front && item.printFiles.back) printCode = "4-4";
    else if (!item.printFiles.front && item.printFiles.back) printCode = "0-4";

    // Codes
    const userColor = item.variant?.color || item.selectedColor;
    let colorCode = map.color_map?.[userColor] || userColor.toLowerCase().replace(/ /g, "-");
    const sizeCode = (item.variant?.size || item.selectedSize).toLowerCase();

    // UID Construction
    let finalProductUid = map.uid_template || map.product_uid;
    finalProductUid = finalProductUid
      .replace("{size}", sizeCode)
      .replace("{color}", colorCode)
      .replace("{print_code}", printCode);

    // Files
    const filesArray = [];
    if (item.printFiles.front) filesArray.push({ type: "default", url: item.printFiles.front });
    if (item.printFiles.back) filesArray.push({ type: "back", url: item.printFiles.back });

    return {
      itemReferenceId: item.cartId || uuidv4(),
      productUid: finalProductUid,
      quantity: item.quantity,
      files: filesArray
    };
  });

  const payload = {
    orderType: "order",
    orderReferenceId: orderData.orderId,
    customerReferenceId: orderData.userId,
    currency: "USD",
    items: gelatoItems, // ✅ ALL items here
    shippingAddress: {
      first_name: orderData.shippingAddress.fullName.split(" ")[0],
      lastName: orderData.shippingAddress.fullName.split(" ")[1] || ".",
      country_code: countryCode,
      addressLine1: orderData.shippingAddress.line1,
      city: orderData.shippingAddress.city,
      postCode: orderData.shippingAddress.zip,
      email: orderData.shippingAddress.email,
      phone: orderData.shippingAddress.phone
    },
  };
  try {
    const res = await axios.post("https://order.gelatoapis.com/v4/orders", payload, {
      headers: { "X-API-KEY": apiKey }
    });
    // ... return success object ...
    return {
      id: res.data.id,
      provider: 'gelato',
      estimatedDate: res.data.shipment.maxDeliveryDate,
      trackingUrl: null
    }
  } catch (e) { throw new Error(e.message) }
}

// ------------------------------------------------------------------
// 🚀 3. SEND TO QIKINK (With Placeholder Date)
// ------------------------------------------------------------------
const QIKINK_BASE_URL = "https://sandbox.qikink.com";

async function getQikinkAccessToken() {
  const clientId = functions.config().qikink?.client_id;
  const clientSecret = functions.config().qikink?.client_secret;

  const params = new URLSearchParams();
  params.append('ClientId', clientId);
  params.append('client_secret', clientSecret);
  const res = await axios.post(`${QIKINK_BASE_URL}/api/token`, params, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
  });
  return res.data.Accesstoken;
}

async function sendToQikink(orderData, processedItems) {
  const token = await getQikinkAccessToken();
  const clientId = functions.config().qikink?.client_id;

  const qikinkLineItems = [];

  for (const item of processedItems) {
    const map = item.vendor_maps.qikink;
    const colorName = item.variant?.color || item.selectedColor;
    const sizeName = item.variant?.size || item.selectedSize;
    const isMug = item.title.toLowerCase().includes('mug')

    // Construct SKU
    const finalSku = isMug || item.title.toLowerCase().includes('tote')
      ? map.product_id // Handle special Mug logic if needed
      : `${map.product_id}-${map.color_map[colorName]}-${sizeName}`;

    const cleanOrderId = orderData.orderId.replace("ORD-", "").substring(0, 15);

    // Designs
    const designs = [];
    if (item.printFiles.front) {
      designs.push({
        design_code: `${cleanOrderId}_fr`, // Unique Code per item
        placement_sku: "fr",
        width_inches: "10",
        height_inches: "12",
        design_link: item.printFiles.front,
        mockup_link: item.mockupFiles?.front
      });
    }
    if (item.printFiles.back) {
      designs.push({
        design_code: `${cleanOrderId}_${item.cartId}_bk`,
        placement_sku: "bk",
        width_inches: "10",
        height_inches: "12",
        design_link: item.printFiles.back,
        mockup_link: item.mockupFiles?.back
      });
    }

    qikinkLineItems.push({
      search_from_my_products: 0,
      print_type_id: isMug ? 5 : 1,
      quantity: item.quantity,
      sku: finalSku,
      price: "0",
      designs: designs
    });
  }

  const payload = {
    order_number: orderData.orderId.replace("ORD-", "").substring(0, 15),
    qikink_shipping: "1",
    gateway: "Prepaid",
    total_order_value: "0",
    shipping_address: {
      first_name: orderData.shippingAddress.fullName.split(" ")[0],
      last_name: orderData.shippingAddress.fullName.split(" ")[1] || ".",
      address1: orderData.shippingAddress.line1,
      city: orderData.shippingAddress.city,
      zip: orderData.shippingAddress.zip,
      province: orderData.shippingAddress.stateCode,
      country_code: "IN",
      phone: orderData.shippingAddress.phone || "9999999999",
      email: orderData.shippingAddress.email
    },
    line_items: qikinkLineItems // ✅ ALL items here
  };

  const res = await axios.post(`${QIKINK_BASE_URL}/api/order/create`, payload, {
    headers: { 'ClientId': clientId, 'Accesstoken': token, 'Content-Type': 'application/json' }
  });

  // ... (Handle response parsing same as before) ...
  let responseData = res.data;
  // ... parse messy JSON string if needed ...

  if (responseData && responseData.order_id) {
    const estimatedDate = new Date();
    estimatedDate.setDate(estimatedDate.getDate() + 7);
    return {
      id: responseData.order_id.toString(),
      provider: 'qikink',
      estimatedDelivery: estimatedDate.toISOString(),
      trackingUrl: null
    };
  } else {
    throw new Error("No Order ID in Qikink response");
  }
}

// ------------------------------------------------------------------
// 📡 4. WEBHOOK HANDLER (THE LISTENER)
// ------------------------------------------------------------------
exports.handleProviderWebhook = functions.https.onRequest(async (req, res) => {
  const source = req.query.source; 
  const body = req.body;

  console.log(`🔔 Webhook received from ${source} [${body.type || body.event}]`);

  try {
    // 🛡️ 1. SAFETY: Handle Printify "Ping"
    if (body.type === 'ping' || (source === 'printify' && !body.resource)) {
      console.log("✅ Printify Ping received. Responding 200.");
      return res.status(200).send("Pong");
    }

    let firestoreOrderRef = null;
    let newStatus = "";
    let trackingData = {};

    // ------------------------------------------------------
    // A. HANDLE PRINTIFY EVENTS
    // ------------------------------------------------------
    if (source === 'printify') {
      const eventType = body.type;
      const printifyOrderId = body.resource.id; // "5a96f649b2439217d070f507"

      // 1. FIND ORDER IN DB (Using the Printify ID we saved earlier)
      const snapshot = await db.collection('orders')
        .where('providerOrderId', '==', printifyOrderId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(`⚠️ No order found with providerOrderId: ${printifyOrderId}`);
        return res.status(200).send("Order not found, skipping");
      }

      firestoreOrderRef = snapshot.docs[0].ref;

      // 2. PARSE EVENTS based on your payloads
      
      // -> Sent to Production
      if (eventType === 'order:sent-to-production') {
        newStatus = 'production';
      }
      
      // -> Shipped (Tracking Available)
      else if (eventType === 'order:shipment:created') {
        newStatus = 'shipped';
        const carrier = body.resource.data?.carrier; // Extract from 'data.carrier'
        
        trackingData = {
          trackingCode: carrier?.tracking_number,
          trackingUrl: carrier?.tracking_url,
          carrierName: carrier?.code
        };
      }

      // -> Delivered
      else if (eventType === 'order:shipment:delivered') {
        newStatus = 'delivered';
        const data = body.resource.data;
        trackingData = {
            deliveredAt: data?.delivered_at || new Date().toISOString()
        };
      }
    }

    // ------------------------------------------------------
    // B. HANDLE GELATO EVENTS (Unchanged)
    // ------------------------------------------------------
    else if (source === 'gelato') {
      if (body.event === 'shipment_dispatched') {
        const gelatoId = body.orderReferenceId; // Gelato sends YOUR ID back
        firestoreOrderRef = db.collection('orders').doc(gelatoId);
        newStatus = 'shipped';
        trackingData = {
          trackingCode: body.fulfillmentPackage?.trackingCode,
          trackingUrl: body.fulfillmentPackage?.trackingUrl
        };
      }
    }

    // ------------------------------------------------------
    // C. UPDATE DATABASE
    // ------------------------------------------------------
    if (firestoreOrderRef && newStatus) {
      console.log(`📝 Updating Order to '${newStatus}'`);
      
      // Prepare updates
      const updates = { status: newStatus };

      // Add tracking info if available
      if (trackingData.trackingCode) {
        updates['providerData.trackingCode'] = trackingData.trackingCode;
        updates['providerData.trackingUrl'] = trackingData.trackingUrl;
        updates['providerData.carrier'] = trackingData.carrierName;
      }
      if (trackingData.deliveredAt) {
        updates['deliveredAt'] = trackingData.deliveredAt;
      }

      await firestoreOrderRef.update(updates);
    }

    res.status(200).send("Webhook Processed");

  } catch (error) {
    console.error("Webhook Error:", error);
    res.status(200).send("Error logged");
  }
});


// ------------------------------------------------------------------
// 🔄 5. REFRESH STATUS (For Qikink / Backup)
// ------------------------------------------------------------------
exports.refreshOrderStatus = functions.https.onCall(async (data, context) => {
  const { orderId } = data;
  if (!orderId) throw new functions.https.HttpsError('invalid-argument', 'Missing orderId');

  const orderRef = db.collection('orders').doc(orderId);
  const doc = await orderRef.get();
  if (!doc.exists) throw new functions.https.HttpsError('not-found', 'Order not found');

  const order = doc.data();

  // LOGIC FOR QIKINK REFRESH
  if (order.provider === 'qikink') {
    const token = await getQikinkAccessToken();
    const clientId = functions.config().qikink?.client_id;

    try {
      // NOTE: Using the generic Qikink "Get Order Status" call (adjust endpoint if needed)
      const res = await axios.get(`${QIKINK_BASE_URL}/api/order/status?order_number=${order.providerOrderId}`, {
        headers: { 'ClientId': clientId, 'Accesstoken': token }
      });

      // Map Qikink Status to Our Status
      const qStatus = res.data.status?.toLowerCase(); // e.g. "shipped", "dispatched"
      let newStatus = order.status;
      let trackingUrl = order.providerData?.trackingUrl;

      if (qStatus.includes('ship') || qStatus.includes('dispatch')) {
        newStatus = 'shipped';
        trackingUrl = res.data.tracking_link || trackingUrl;
      } else if (qStatus.includes('deliver')) {
        newStatus = 'delivered';
      }

      if (newStatus !== order.status) {
        await orderRef.update({
          status: newStatus,
          'providerData.trackingUrl': trackingUrl
        });
        return { success: true, updated: true, newStatus };
      }
    } catch (e) {
      console.error("Qikink Refresh Failed:", e);
    }
  }

  return { success: true, updated: false };
});


// ------------------------------------------------------------------
// 🎨 SERVER SIDE RENDERING & BOT
// ------------------------------------------------------------------
const PRODUCT_DIMENSIONS = {
  // 👕 T-SHIRTS (Standard)
  "men-classic-tee": {
    canvas: { w: 420, h: 560 },
    print: { front: { w: 4500, h: 5400 }, back: { w: 4500, h: 5400 } }
  },
  "women-classic-tee": {
    canvas: { w: 420, h: 560 },
    print: { front: { w: 4000, h: 4800 }, back: { w: 4000, h: 4800 } }
  },

  // 👕 OVERSIZED TEES
  "unisex-oversized-tee": {
    canvas: { w: 420, h: 560 },
    print: { front: { w: 4500, h: 5400 }, back: { w: 4500, h: 5400 } }
  },

  // 🧥 HOODIES
  "unisex-hoodie": {
    canvas: { w: 420, h: 500 },
    print: { front: { w: 4000, h: 2750 }, back: { w: 4500, h: 5400 } }
  },

  // ☕ MUGS
  "mug-ceramic-11oz": {
    canvas: { w: 800, h: 300 },
    print: { front: { w: 2700, h: 1100 } } // Wrap-around print
  },

  // 👜 TOTE BAGS
  "tote-bag-canvas": {
    canvas: { w: 380, h: 380 },
    print: { front: { w: 3000, h: 3000 }, back: { w: 3000, h: 3000 } }
  }
};


try {
  const fontsDir = path.join(__dirname, 'fonts');
  if (fs.existsSync(fontsDir)) {
    fs.readdirSync(fontsDir).forEach(file => {
      if (file.endsWith('.ttf') || file.endsWith('.otf')) {
        const name = path.basename(file, path.extname(file));
        registerFont(path.join(fontsDir, file), { family: name.split('-')[0] });
      }
    });
  }
} catch (e) { }

async function renderDesignServerSide(designJson, productId, view = 'front') {
  const dims = PRODUCT_DIMENSIONS[productId] || { canvas: { w: 420, h: 560 }, print: { front: { w: 2400, h: 3200 } } };
  const targetW = dims.print[view]?.w || 2400;
  const targetH = dims.print[view]?.h || 3200;
  const scale = targetW / dims.canvas.w;

  const canvas = new StaticCanvas(null, { width: targetW, height: targetH });
  const sanitizedJson = designJson.map(obj => ({ ...obj, text: typeof obj.text === 'string' ? obj.text : "" }));

  await canvas.loadFromJSON({ version: "6.9.0", objects: sanitizedJson });
  canvas.setZoom(scale);
  canvas.setViewportTransform([scale, 0, 0, scale, 0, 0]);
  canvas.width = targetW; canvas.height = targetH;
  canvas.renderAll();

  const dataUrl = canvas.toDataURL({ format: 'png', multiplier: 1 });
  const buffer = Buffer.from(dataUrl.replace(/^data:image\/png;base64,/, ""), 'base64');
  canvas.dispose();
  return buffer;
}


exports.processNewOrder = functions
  .runWith({ timeoutSeconds: 540, memory: '2GB' }) // Increased timeout for multiple items
  .firestore.document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();

    // Safety Checks
    if (newData.status !== 'placed' || newData.providerStatus === 'synced') return null;
    if (newData.providerStatus === 'processing') return null;

    const orderId = context.params.orderId;
    console.log(`🤖 Processing Order ${orderId} with ${newData.items.length} items...`);

    await change.after.ref.update({ providerStatus: 'processing' });

    try {
      // ----------------------------------------------------
      // STEP 1: PRE-PROCESS ALL ITEMS (Generate Files)
      // ----------------------------------------------------
      const processedItems = [];
      const views = ['front', 'back'];

      for (let i = 0; i < newData.items.length; i++) {
        const item = newData.items[i];
        console.log(`🎨 Generating files for Item ${i + 1}: ${item.title}`);

        const printFiles = {};

        // A. Generate High-Res Print Files
        for (const view of views) {
          const designJson = item.designData?.canvasViewStates?.[view] || item.designData?.viewStates?.[view];
          if (!designJson || designJson.length === 0) continue;

          // Render
          const imageBuffer = await renderDesignServerSide(designJson, item.productId, view);

          // Save
          const bucket = admin.storage().bucket();
          const file = bucket.file(`orders/${orderId}/item_${i}_print_${view}.png`);
          await file.save(imageBuffer, { metadata: { contentType: 'image/png' }, public: true });

          printFiles[view] = await getDownloadURL(file);
        }

        // B. Generate Mockups (Using our new Printify Helper)
        // Only generate mockups if we actually have print files
        let mockupFiles = {};
        if (Object.keys(printFiles).length > 0) {
          mockupFiles = await getMockupsFromPrintify(item, printFiles);
        }

        // Add to our list
        processedItems.push({
          ...item,
          printFiles,
          mockupFiles
        });
      }

      // ----------------------------------------------------
      // STEP 2: BUNDLE & ROUTE TO PROVIDER
      // ----------------------------------------------------
      const country = newData.shippingAddress.countryCode.toUpperCase();
      let providerData = {};

      if (country === 'IN') {
        providerData = await sendToQikink(newData, processedItems);
      }
      else if (country === 'US' || country === 'CA') {
        providerData = await sendToPrintify(newData, processedItems);
      }
      else {
        providerData = await sendToGelato(newData, processedItems);
      }

      // ----------------------------------------------------
      // STEP 3: SUCCESS
      // ----------------------------------------------------
      await change.after.ref.update({
        providerStatus: 'synced',
        provider: providerData.provider,
        providerOrderId: providerData.id,
        providerData: providerData,
        // We store the processed items (with file URLs) back to DB for reference
        items: processedItems,
        botLog: `Fulfilled ${processedItems.length} items via ${providerData.provider}`
      });

      await sendOrderEmail(newData, providerData.provider, providerData.estimatedDelivery);

    } catch (error) {
      console.error("❌ Bot Failed:", error);
      await change.after.ref.update({ providerStatus: 'error', botError: error.message });
    }
  });

// Keep your standard exports...
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  try {
    const order = await razorpay.orders.create({ amount: Math.round(data.amount * 100), currency: data.currency || "INR", payment_capture: 1 });
    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId: functions.config().razorpay.key_id };
  } catch (error) { throw new functions.https.HttpsError('internal', error.message); }
});

exports.createStripeIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required');
  try {
    const paymentIntent = await stripe.paymentIntents.create({ amount: Math.round(data.amount * 100), currency: data.currency || "usd", automatic_payment_methods: { enabled: true } });
    return { clientSecret: paymentIntent.client_secret };
  } catch (error) { throw new functions.https.HttpsError('internal', error.message); }
});

exports.generateAiImage = functions.https.onCall(async (data, context) => {
  const { prompt, style } = data;
  const userId = context.auth.uid;
  const today = new Date().toISOString().split('T')[0];
  const docRef = db.collection('users').doc(userId).collection('daily_stats').doc(today);
  const MAX_GEN = 5; // 💎 Visible Limit

  await db.runTransaction(async (t) => {
    const doc = await t.get(docRef);
    const current = doc.exists ? (doc.data().gen_count || 0) : 0;

    if (current >= MAX_GEN) {
      throw new functions.https.HttpsError('resource-exhausted', `You have used your ${MAX_GEN} free generations for today.`);
    }

    t.set(docRef, {
      gen_count: current + 1,
      last_updated: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  });
  try {
    const output = await replicate.run("black-forest-labs/flux-schnell", { input: { prompt: style ? `${prompt}, ${style} style` : prompt, output_format: "png" } });
    const imageResponse = await axios.get(output[0], { responseType: 'arraybuffer' });
    const base64Image = Buffer.from(imageResponse.data, 'binary').toString('base64');
    return { success: true, image: `data:image/png;base64,${base64Image}` };
  } catch (error) { throw new functions.https.HttpsError('internal', 'Image generation failed'); }
});

exports.saveTshirtDesign = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', 'Login required.');

  try {
    const designRef = await db.collection("designs").add({
      userId: context.auth.uid,
      tshirtColor: data.tshirtColor || "white",
      canvasJson: JSON.stringify(data.canvasJson),
      previewImage: data.previewImage,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      status: "saved"
    });
    return { success: true, designId: designRef.id };
  } catch (error) { throw new functions.https.HttpsError('internal', 'Unable to save design.'); }
});

// ------------------------------------------------------------------
// 💰 1. STRIPE WEBHOOK (Payment Confirmation)
// ------------------------------------------------------------------
exports.stripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = functions.config().stripe?.webhook_secret;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
  } catch (err) {
    console.error(`⚠️  Webhook signature verification failed.`, err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === 'payment_intent.succeeded') {
    const paymentIntent = event.data.object;
    console.log(`💰 Stripe Payment Succeeded: ${paymentIntent.id}`);
    
    // Find order by Payment Intent ID and update status
    // Note: You need to store 'paymentIntentId' in your order doc when creating it on client
    const snapshot = await db.collection('orders').where('paymentId', '==', paymentIntent.id).get();
    
    if (!snapshot.empty) {
      const orderDoc = snapshot.docs[0];
      await orderDoc.ref.update({
        status: 'processing', // This triggers the processNewOrder bot
        paymentStatus: 'paid',
        paidAt: admin.firestore.FieldValue.serverTimestamp()
      });
      console.log(`✅ Order ${orderDoc.id} updated to processing`);
    } else {
      console.warn(`⚠️ No order found for PaymentIntent ${paymentIntent.id}`);
    }
  }

  res.json({received: true});
});

// ------------------------------------------------------------------
// 💰 2. RAZORPAY WEBHOOK (Payment Confirmation)
// ------------------------------------------------------------------
exports.razorpayWebhook = functions.https.onRequest(async (req, res) => {
  const secret = functions.config().razorpay?.webhook_secret; 
  
  // Validate Signature
  const shasum = crypto.createHmac("sha256", secret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if (digest !== req.headers["x-razorpay-signature"]) {
    console.error("❌ Invalid Razorpay Signature");
    return res.status(400).send("Invalid signature");
  }

  const event = req.body.event;

  if (event === "payment.captured") {
    const payment = req.body.payload.payment.entity;
    const orderId = payment.notes.orderId; // Make sure to pass 'notes: { orderId: ... }' from frontend
    
    console.log(`💰 Razorpay Payment Captured for Order ${orderId}`);

    if (orderId) {
      try {
        await db.collection("orders").doc(orderId).update({
          status: "processing", // This triggers the processNewOrder bot
          paymentStatus: "paid",
          paymentId: payment.id,
          paidAt: admin.firestore.FieldValue.serverTimestamp(),
        });
        console.log(`✅ Order ${orderId} updated to processing`);
      } catch (e) {
        console.error("Failed to update order from Razorpay webhook", e);
        return res.status(500).send("Db Error");
      }
    }
  }

  res.json({ status: "ok" });
});