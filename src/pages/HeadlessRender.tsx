import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router'; // Note: check your router import
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import * as fabric from 'fabric';
import { INITIAL_PRODUCTS } from '@/data/initialProducts'; // 👈 Import your products

export default function HeadlessRender() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const view = searchParams.get('view') || 'front'; // 'front' or 'back'

    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!orderId) return;

        const loadDesign = async () => {
            // 1. Fetch Order Data
            const orderSnap = await getDoc(doc(db, 'orders', orderId));
            if (!orderSnap.exists()) return;

            const orderData = orderSnap.data();
            const item = orderData.items[0];
            const designJson = item.designData?.canvasViewStates?.[view];

            if (!designJson) {
                console.error("No design JSON found for view:", view);
                setIsReady(false); // Fail gracefully so bot doesn't hang
                return;
            }

            // 2. Determine ORIGINAL Dimensions (Logic must match CanvasEditor)
            let originalWidth = 800;  // Default fallback from CanvasEditor
            let originalHeight = 930;

            if (item.productId) {
                const product = INITIAL_PRODUCTS.find(p => p.id === item.productId);
                if (product && product.canvas_size) {
                    // If CanvasEditor used these dimensions, we must use them too
                    originalWidth = product.canvas_size.width;
                    originalHeight = product.canvas_size.height;
                }
            }

            // 3. Define TARGET Output Dimensions
            // We want a high-res output (e.g., 2400px width)
            // But we MUST maintain the aspect ratio of the original product
            const TARGET_WIDTH = 2400;
            const scaleFactor = TARGET_WIDTH / originalWidth;
            const TARGET_HEIGHT = originalHeight * scaleFactor;

            console.log(`Scaling Design: ${originalWidth}x${originalHeight} -> ${TARGET_WIDTH}x${TARGET_HEIGHT} (Zoom: ${scaleFactor})`);
            console.log(designJson)
            if (!canvasRef.current) {
                console.error("Canvas ref not available");
                setIsReady(true); // fail gracefully
                return;
            }

            // 4. Setup Canvas with Target Dimensions
            const canvas = new fabric.Canvas(canvasRef.current, {
                width: TARGET_WIDTH,
                height: TARGET_HEIGHT,
                backgroundColor: 'transparent' // Transparent background for PNG
            });

            // 5. Load Data & Apply Zoom
            canvas.loadFromJSON({ version: "6.9.0", objects: designJson }, async () => {
                await document.fonts.ready;

                // 🚀 THE FIX: Apply the calculated Zoom
                // This scales the 800px coordinates up to 2400px (or 4500px down to 2400px)
                canvas.setZoom(scaleFactor);

                // Ensure viewport transform is updated so objects render in correct position
                canvas.setWidth(TARGET_WIDTH);
                canvas.setHeight(TARGET_HEIGHT);

                canvas.renderAll();

                // 6. Signal to Bot
                setIsReady(true);
            });
        };

        loadDesign();
    }, [orderId, view]);

    return (
        <div style={{
            background: 'transparent',
            padding: 0,
            margin: 0,
            overflow: 'hidden',
            display: 'flex', // Ensures no weird whitespace
            width: 'fit-content'
        }}>
            <canvas ref={canvasRef} />

            {/* The signal beacon for Puppeteer */}
            {isReady && <div id="render-complete-signal" style={{ display: 'none' }}>READY</div>}
        </div>
    );
}