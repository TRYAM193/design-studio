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
const handlebars = require("handlebars");
const chromium = require("@sparticuz/chromium");
const puppeteer = require("puppeteer-core");
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

// Invoice Email
// ------------------------------------------------------------------
// 📄 UPDATED HELPER: Generate Invoice (With CGST/SGST Split)
// ------------------------------------------------------------------
async function generateInvoicePDF(orderData, itemsList) {
  try {
    const templateHtml = fs.readFileSync(path.join(__dirname, 'templates', 'invoice.html'), 'utf8');
    const template = handlebars.compile(templateHtml);
    
    // 1. Detect Context
    const isIndia = orderData.shippingAddress.countryCode === 'IN';
    const documentTitle = isIndia ? "TAX INVOICE" : "RECEIPT";
    
    // 2. Get Currency Symbol
    const currencyCode = (orderData.payment?.currency || "$")
    const currencyMap = { "IN": "₹", "US": "$", "GB": "£", "EU": "€", "CA": "C$" };
    const currencySymbol = currencyCode || currencyMap[orderData.shippingAddress.countryCode];

    // 3. Tax Logic
    const gstRate = 0.05; // 5%
    const halfRate = gstRate / 2; // 2.5%

    const processedItems = itemsList.map(item => {
        const price = Number(item.price) * Number(item.quantity);
        
        let taxable = price;
        let cgst = 0, sgst = 0;

        if (isIndia) {
            // India: Back-calculate Tax (Price includes 5% GST)
            taxable = price / (1 + gstRate);
            cgst = taxable * halfRate;
            sgst = taxable * halfRate;
        } 
        // International: Price is final (0% Tax)

        const variantStr = item.variant ? `${item.variant.color || ''} ${item.variant.size || ''}` : 'Custom';

        return {
            title: item.title,
            variant: variantStr,
            quantity: item.quantity,
            taxableValue: taxable.toFixed(2),
            cgstAmount: isIndia ? cgst.toFixed(2) : "0.00",
            sgstAmount: isIndia ? sgst.toFixed(2) : "0.00",
            total: price.toFixed(2)
        };
    });

    const grandTotal = processedItems.reduce((acc, item) => acc + Number(item.total), 0);
    const totalTaxable = processedItems.reduce((acc, item) => acc + Number(item.taxableValue), 0);
    const totalCGST = processedItems.reduce((acc, item) => acc + Number(item.cgstAmount), 0);
    const totalSGST = processedItems.reduce((acc, item) => acc + Number(item.sgstAmount), 0);

    const htmlData = {
        documentTitle: documentTitle,
        invoiceNumber: `INV-${orderData.groupId || orderData.orderId}`,
        date: new Date().toDateString(),
        // Customer
        customerName: orderData.shippingAddress.fullName,
        customerAddress: orderData.shippingAddress.line1,
        customerCity: orderData.shippingAddress.city,
        customerState: orderData.shippingAddress.state,
        customerZip: orderData.shippingAddress.zip,
        customerGst: orderData.shippingAddress.gstNumber || "", // Only show if exists
        // Flags & Data
        isIndia: isIndia,
        currency: currencySymbol,
        items: processedItems,
        subTotal: totalTaxable.toFixed(2),
        cgstTotal: totalCGST.toFixed(2),
        sgstTotal: totalSGST.toFixed(2),
        grandTotal: grandTotal.toFixed(2)
    };

    const html = template(htmlData);

    const browser = await puppeteer.launch({
        args: chromium.args,
        defaultViewport: chromium.defaultViewport,
        executablePath: await chromium.executablePath(),
        headless: chromium.headless,
    });

    const page = await browser.newPage();
    await page.setContent(html);
    const pdfBuffer = await page.pdf({ format: 'A4' });
    await browser.close();

    const bucket = admin.storage().bucket();
    const file = bucket.file(`invoices/INV-${orderData.groupId || orderData.orderId}.pdf`);
    
    await file.save(pdfBuffer, { metadata: { contentType: 'application/pdf' }, public: true });
    return file.publicUrl();

  } catch (error) {
    console.error("Invoice Gen Error:", error);
    return null;
  }
}

async function sendInvoiceEmail(email, pdfUrl, isConsolidated, orderId, isIndia) {
    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: functions.config().email.user, pass: functions.config().email.pass }
    });

    const docName = isIndia ? "Tax Invoice" : "Receipt";
    
    // Subject Logic
    const subject = isConsolidated 
        ? `Order #${orderId} Confirmed! (${docName} Attached)` 
        : `Shipment Delivered (${docName} Attached)`;

    // Body Logic
    const htmlBody = isConsolidated
      ? `
        <div style="font-family: Arial, sans-serif; color: #333;">
          <h2 style="color: #ea580c;">Thank you for your order!</h2>
          <p>We have received your order <strong>#${orderId}</strong> and it is now being processed.</p>
          <p>Please find your official <strong>${docName}</strong> attached to this email.</p>
          <hr/>
          <p>You will receive separate updates when your items ship.</p>
        </div>
      `
      : `<p>Your order has been delivered! Please find your ${docName} attached.</p>`;

    await transporter.sendMail({
        from: `"TRYAM" <${functions.config().email.user}>`,
        to: email,
        subject: subject,
        html: htmlBody,
        attachments: [{
            filename: `${docName.replace(" ", "_")}.pdf`,
            path: pdfUrl 
        }]
    });
}

// Order Confirmation E-Mail
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
// ------------------------------------------------------------------
// ☁️ HELPER: Upload URL to Firebase Storage (Permanent Hosting)
// ------------------------------------------------------------------
async function uploadToFirebase(imageUrl, filePath) {
  try {
    const bucket = admin.storage().bucket();
    const file = bucket.file(filePath);

    // 1. Check if already exists (optional optimization)
    const [exists] = await file.exists();
    if (exists) return await getDownloadURL(file);

    // 2. Download Image
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    const buffer = Buffer.from(response.data, 'binary');

    // 3. Upload to Firebase
    await file.save(buffer, {
      metadata: { contentType: 'image/png' },
      public: true // Make public so frontend can see it
    });

    // 4. Get Permanent URL
    return await getDownloadURL(file);

  } catch (error) {
    console.error(`Upload failed for ${filePath}:`, error.message);
    return null; // Fail gracefully
  }
}

// ------------------------------------------------------------------
// 🛠️ UPDATED GENERATOR: With Firebase Upload & Smart Filtering
// ------------------------------------------------------------------
async function getMockupsFromPrintify(item, printFiles, orderId) {
  const shopId = functions.config().printify?.shop_id;
  const token = functions.config().printify?.token;
  const map = item.vendor_maps?.printify || { blueprint_id: 12, print_provider_id: 29 };

  // Detect Product Type for better filtering
  const isMug = item.title.toLowerCase().includes("mug");
  const isTote = item.title.toLowerCase().includes('tote');
  const isHoodie = item.title.toLowerCase().includes('hoodie');

  let tempProductId = null;

  try {
    // A. UPLOAD RAW DESIGNS TO PRINTIFY (Same as before)
    const frontImageId = printFiles.front ? await uploadPrintifyImage(printFiles.front) : null;
    const backImageId = printFiles.back ? await uploadPrintifyImage(printFiles.back) : null;

    const placeholders = [];
    if (frontImageId) placeholders.push({ position: "front", images: [{ id: frontImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }] });
    if (backImageId && !isMug) placeholders.push({ position: "back", images: [{ id: backImageId, x: 0.5, y: 0.5, scale: 1, angle: 0 }] });

    // Get Variant
    let variantId = await getPrintifyVariantId(map.blueprint_id, map.print_provider_id, 'L', item.variant.color);
    if (isMug) variantId = map.variant_id;
    if (isTote) variantId = 101409;
    if (!variantId) variantId = await getPrintifyVariantId(map.blueprint_id, map.print_provider_id, "L", "Black") ||
      await getPrintifyVariantId(map.blueprint_id, map.print_provider_id, "L", "White");
    if (!variantId) throw new Error("No variant found");

    // B. CREATE TEMP PRODUCT
    console.log("Creating Temp Product for Mockups...");
    const createRes = await axios.post(`https://api.printify.com/v1/shops/${shopId}/products.json`, {
      title: "TEMP_MOCKUP_" + Date.now(),
      description: "Mockup Gen",
      blueprint_id: Number(map.blueprint_id),
      print_provider_id: Number(map.print_provider_id),
      variants: [{ id: variantId, price: 1000, is_enabled: true }],
      print_areas: [{ variant_ids: [variantId], placeholders: placeholders }]
    }, { headers: { 'Authorization': `Bearer ${token}` } });

    tempProductId = createRes.data.id;

    // C. TRIGGER GENERATION
    try {
      await axios.post(`https://api.printify.com/v1/shops/${shopId}/products/${tempProductId}/mockups/generate.json`, {}, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
    } catch (e) { console.warn("Gen trigger warning:", e.message); }

    // D. WAIT FOR IMAGES
    const validImages = await waitForPrintifyImages(shopId, tempProductId, token);
    if (!validImages || validImages.length === 0) throw new Error("Mockup timeout");

    // ==================================================================
    // 🧠 E. SMART SELECTION & UPLOAD (The New Logic)
    // ==================================================================

    // We want to limit storage usage. Let's pick max 5-6 best images.
    // Categories we want: Front, Back, Person(Front/Back), Folded/Hanging/Lifestyle

    let selectedMockups = {
      front: null,
      back: null,
      gallery: []
    };

    // Helper to find image by analyzing src or position
    // Note: Printify doesn't explicitly label "folded", so we look for visual variance or specific keywords if available
    const candidates = {
      front: validImages.find(img => img.position === 'front' && img.is_default),
      back: validImages.find(img => img.position === 'back'),
      person_front: validImages.find(img => img.position === 'front' && !img.is_default && img.src.includes('person')),
      person_back: validImages.find(img => img.position === 'back' && !img.is_default && img.src.includes('person')),
      lifestyle: validImages.find(img => img.src.includes('lifestyle') || img.src.includes('context')),
      other: validImages.filter(img => !img.is_default).slice(0, 3) // Fallback: Take first 3 other images
    };

    // 1. Assign Main Front/Back
    const mainFront = candidates.front || validImages[0];
    const mainBack = candidates.back; // Might be null if mug/poster

    // 2. Build Upload List (Array of promises)
    const uploadTasks = [];
    const timestamp = Date.now();
    const basePath = `orders/${orderId}`;

    // --> Push Front
    if (mainFront) {
      uploadTasks.push(uploadToFirebase(mainFront.src, `${basePath}/front.png`).then(url => selectedMockups.front = url));
    }

    // --> Push Back
    if (mainBack) {
      uploadTasks.push(uploadToFirebase(mainBack.src, `${basePath}/back.png`).then(url => selectedMockups.back = url));
    }

    // --> Push Gallery (Folding, Person, Lifestyle, etc.)
    // We iterate through validImages and pick unique ones to fill the gallery
    // We skip the ones we already used for main front/back
    const usedSrcs = new Set([mainFront?.src, mainBack?.src]);
    let galleryCount = 0;
    const MAX_GALLERY = 4; // Cost effective limit

    for (const img of validImages) {
      if (usedSrcs.has(img.src)) continue;
      if (galleryCount >= MAX_GALLERY) break;

      // Simple heuristic: Try to get 'person' or 'context' images first if available
      // otherwise just take the next available image to ensure we have *something*

      const fileName = `gallery_${galleryCount}.png`;
      uploadTasks.push(
        uploadToFirebase(img.src, `${basePath}/${fileName}`).then(url => {
          if (url) selectedMockups.gallery.push(url);
        })
      );

      usedSrcs.add(img.src);
      galleryCount++;
    }

    // 3. Execute All Uploads in Parallel (Fast!)
    console.log(`☁️ Uploading ${uploadTasks.length} mockups to Firebase...`);
    await Promise.all(uploadTasks);

    // F. DELETE TEMP PRODUCT
    await deletePrintifyProduct(shopId, tempProductId);

    return selectedMockups;

  } catch (error) {
    console.error("❌ Mockup Gen Failed:", error.message);
    if (tempProductId) await deletePrintifyProduct(shopId, tempProductId);
    // Fallback: Return the raw print files if generation failed
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
    order_number: orderData.orderId,
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
      const printifyOrderId = body.resource.id;

      // Find Order via Provider ID
      const snapshot = await db.collection('orders')
        .where('providerOrderId', '==', printifyOrderId)
        .limit(1)
        .get();

      if (snapshot.empty) {
        console.warn(`⚠️ No order found with providerOrderId: ${printifyOrderId}`);
        return res.status(200).send("Order not found, skipping");
      }

      firestoreOrderRef = snapshot.docs[0].ref;

      if (eventType === 'order:sent-to-production') {
        newStatus = 'production';
      } else if (eventType === 'order:shipment:created') {
        newStatus = 'shipped';
        const carrier = body.resource.data?.carrier;
        trackingData = {
          trackingCode: carrier?.tracking_number,
          trackingUrl: carrier?.tracking_url,
          carrierName: carrier?.code
        };
      } else if (eventType === 'order:shipment:delivered') {
        newStatus = 'delivered';
        const data = body.resource.data;
        trackingData = { deliveredAt: data?.delivered_at || new Date().toISOString() };
      }
    }

    // ------------------------------------------------------
    // B. HANDLE GELATO EVENTS
    // ------------------------------------------------------
    else if (source === 'gelato') {
      if (body.event === 'shipment_dispatched') {
        const gelatoId = body.orderReferenceId;
        firestoreOrderRef = db.collection('orders').doc(gelatoId);
        newStatus = 'shipped';
        trackingData = {
          trackingCode: body.fulfillmentPackage?.trackingCode,
          trackingUrl: body.fulfillmentPackage?.trackingUrl
        };
      }
      // Note: Add Gelato 'delivered' event check here if they provide one
    }

    // ------------------------------------------------------
    // C. UPDATE DATABASE & HANDLE COD INVOICE
    // ------------------------------------------------------
    if (firestoreOrderRef && newStatus) {
      console.log(`📝 Updating Order to '${newStatus}'`);

      const docSnap = await firestoreOrderRef.get();
      const orderData = docSnap.data();

      // 1. Prepare Updates
      const updates = { status: newStatus };
      if (trackingData.trackingCode) {
        updates['providerData.trackingCode'] = trackingData.trackingCode;
        updates['providerData.trackingUrl'] = trackingData.trackingUrl;
        updates['providerData.carrier'] = trackingData.carrierName;
      }
      if (trackingData.deliveredAt) {
        updates['deliveredAt'] = trackingData.deliveredAt;
      }

      await firestoreOrderRef.update(updates);

      if (orderData.payment?.method === 'cod' && newStatus === 'delivered') {
        console.log(`🚚 COD Delivery Detected. Generating Bill...`);

        // ⚠️ CHANGE: Wrap orderData in an array [orderData]
        // Because orderData IS the item now (it has .title, .price, .quantity directly)
        const pdfUrl = await generateInvoicePDF(orderData, [orderData]);

        if (pdfUrl) {
          await sendInvoiceEmail(orderData.shippingAddress.email, pdfUrl, false);
        }
      }
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
  .runWith({ timeoutSeconds: 300, memory: '1GB' })
  .firestore.document('orders/{orderId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();

    // 1. Safety Checks
    if (newData.status !== 'placed' || newData.providerStatus === 'synced') return null;
    if (newData.providerStatus === 'processing') return null;

    const orderId = context.params.orderId;
    console.log(`🤖 Processing Split Order ${orderId} (${newData.title})...`);

    await change.after.ref.update({ providerStatus: 'processing' });

    try {
      const item = newData;
      const printFiles = {};
      const views = ['front', 'back'];

      // A. Generate Print Files
      for (const view of views) {
        // Access design data directly from root
        const designJson = item.designData?.canvasViewStates?.[view] || item.designData?.viewStates?.[view];
        if (!designJson || designJson.length === 0) continue;

        const imageBuffer = await renderDesignServerSide(designJson, item.productId, view);

        const bucket = admin.storage().bucket();
        const file = bucket.file(`orders/${orderId}/print_${view}.png`);
        await file.save(imageBuffer, { metadata: { contentType: 'image/png' }, public: true });

        printFiles[view] = await getDownloadURL(file);
      }

      // B. Generate Mockups
      let mockupFiles = {};
      if (Object.keys(printFiles).length > 0) {
        // Pass 'item' (which is newData)
        mockupFiles = await getMockupsFromPrintify(item, printFiles, orderId);
      }

      // Create a clean "Processed Item" object for the provider helpers
      const processedItem = {
        ...item,
        printFiles,
        mockupFiles
      };

      // ----------------------------------------------------
      // STEP 2: ROUTE TO PROVIDER
      // ----------------------------------------------------
      const country = newData.shippingAddress.countryCode.toUpperCase();
      let providerData = {};

      // Note: helpers expect an ARRAY of items, so we pass [processedItem]
      if (country === 'IN') {
        providerData = await sendToQikink(newData, [processedItem]);
      }
      else if (['US', 'CA'].includes(country)) {
        providerData = await sendToPrintify(newData, [processedItem]);
      }
      else {
        providerData = await sendToGelato(newData, [processedItem]);
      }

      // ----------------------------------------------------
      // STEP 3: SUCCESS
      // ----------------------------------------------------
      await change.after.ref.update({
        providerStatus: 'synced',
        provider: providerData.provider,
        providerOrderId: providerData.id,
        providerData: providerData,

        // Save generated files back to root
        printFiles: printFiles,
        mockupFiles: mockupFiles,

        botLog: `Fulfilled via ${providerData.provider}`
      });

      console.log(`✅ Order ${orderId} synced.`);

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
exports.stripeWebhook = functions
  .runWith({ memory: '1GB', timeoutSeconds: 120 })
  .https.onRequest(async (req, res) => {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = functions.config().stripe?.webhook_secret;
    let event;

    try {
      event = stripe.webhooks.constructEvent(req.rawBody, sig, endpointSecret);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      console.log(`💰 Stripe Payment Succeeded: ${paymentIntent.id}`);

      // 🔍 FIND ALL ORDERS WITH THIS PAYMENT ID
      // Since we assigned the same paymentId (client_secret or intent id) to all split orders
      // Note: In frontend, ensure you saved 'paymentId' or 'groupId' to the doc.

      // If you used PaymentIntent ID as the common link:
      const snapshot = await db.collection('orders')
        .where('paymentId', '==', paymentIntent.id) // Query all docs with this ID
        .get();

      if (!snapshot.empty) {
        console.log(`✅ Found ${snapshot.size} split orders. Updating...`);

        const batch = db.batch();
        snapshot.docs.forEach(doc => {
          batch.update(doc.ref, {
            status: 'processing', // Triggers Bot
            paymentStatus: 'paid',
            paidAt: admin.firestore.FieldValue.serverTimestamp()
          });
        });

        await batch.commit();

        // 📧 TRIGGER CONSOLIDATED INVOICE (Optional here if Frontend didn't do it)
        // It's safer to do it here.
        const orders = snapshot.docs.map(d => d.data());
        // We can reuse the callable function logic or call it directly
        await generateAndSendConsolidatedInvoice(orders);

      } else {
        console.warn(`⚠️ No orders found for PaymentIntent ${paymentIntent.id}`);
      }
    }

    res.json({ received: true });
  });

// ------------------------------------------------------------------
// 💰 2. RAZORPAY WEBHOOK (Updated for Split Orders)
// ------------------------------------------------------------------
exports.razorpayWebhook = functions
  .runWith({ memory: '1GB', timeoutSeconds: 120 })
  .https.onRequest(async (req, res) => {
    const secret = functions.config().razorpay?.webhook_secret;
    // ... (Signature validation code remains same) ...

    const event = req.body.event;

    if (event === "payment.captured") {
      const payment = req.body.payload.payment.entity;
      const notes = payment.notes; // { groupId: "GRP-123..." }

      if (notes.groupId) {
        // 🔍 Find by Group ID
        const snapshot = await db.collection("orders")
          .where("groupId", "==", notes.groupId)
          .get();

        if (!snapshot.empty) {
          const batch = db.batch();
          snapshot.docs.forEach(doc => {
            batch.update(doc.ref, {
              status: "processing",
              paymentStatus: "paid",
              paymentId: payment.id,
              paidAt: admin.firestore.FieldValue.serverTimestamp(),
            });
          });
          await batch.commit();

          // 📧 Trigger Invoice
          const orders = snapshot.docs.map(d => d.data());
          await generateAndSendConsolidatedInvoice(orders);
        }
      }
    }
    res.json({ status: "ok" });
  });

exports.sendConsolidatedInvoice = functions
  .runWith({ memory: '1GB', timeoutSeconds: 120 })
  .https.onCall(async (data, context) => {
    if (!data.orders || data.orders.length === 0) return;

    const firstOrder = data.orders[0];

    // 🛠️ FIX: Handle both structures
    let allItems = [];
    if (firstOrder.items && Array.isArray(firstOrder.items)) {
      allItems = data.orders.flatMap(o => o.items);
    } else {
      allItems = data.orders;
    }

    const pdfUrl = await generateInvoicePDF(firstOrder, allItems);

    if (pdfUrl) {
      await sendInvoiceEmail(firstOrder.shippingAddress.email, pdfUrl, true);
    }

    return { success: true };
  });

// ------------------------------------------------------------------
// 📄 INTERNAL HELPER: Consolidated Invoice Logic (FIXED)
// ------------------------------------------------------------------
async function generateAndSendConsolidatedInvoice(orders) {
  if (!orders || orders.length === 0) return;
  
  const firstOrder = orders[0];
  
  // 🛑 STOP DUPLICATES
  if (firstOrder.invoiceSent) {
      console.log("⚠️ Invoice already sent. Skipping.");
      return;
  }

  let allItems = [];
  if (firstOrder.items && Array.isArray(firstOrder.items)) {
     allItems = orders.flatMap(o => o.items); // Legacy
  } else {
     allItems = orders; // Flattened
  }

  const groupId = firstOrder.groupId || firstOrder.orderId;
  const isIndia = firstOrder.shippingAddress.countryCode === 'IN';

  console.log(`🧾 Generating ${isIndia ? 'Invoice' : 'Receipt'} for Group ${groupId}`);

  const pdfUrl = await generateInvoicePDF(firstOrder, allItems);

  if (pdfUrl) {
    await sendInvoiceEmail(firstOrder.shippingAddress.email, pdfUrl, true, groupId, isIndia);
    
    // ✅ Mark as Sent
    const batch = db.batch();
    orders.forEach(o => {
        const ref = db.collection('orders').doc(o.orderId);
        batch.update(ref, { invoiceSent: true });
    });
    await batch.commit();
  }
}