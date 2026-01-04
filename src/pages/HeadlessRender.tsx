import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router';
import { db } from '@/firebase';
import { doc, getDoc } from 'firebase/firestore';
import * as fabric from 'fabric';

export default function HeadlessRender() {
    const [searchParams] = useSearchParams();
    const orderId = searchParams.get('orderId');
    const view = searchParams.get('view') || 'front'; // 'front' or 'back'
    
    const canvasRef = useRef(null);
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (!orderId) return;

        const loadDesign = async () => {
            // 1. Fetch Order Data
            const orderSnap = await getDoc(doc(db, 'orders', orderId));
            if (!orderSnap.exists()) return;

            const orderData = orderSnap.data();
            // Assuming first item for MVP
            const item = orderData.items[0]; 
            const designJson = item.designData?.viewStates?.[view];

            if (!designJson) return;

            // 2. Setup Canvas (High Res 4500x5400 scaled down for browser safety if needed)
            // We render at 2400px width for quality/performance balance
            const canvas = new fabric.Canvas(canvasRef?.current, {
                width: 2400, 
                height: 3200,
                backgroundColor: null // Transparent background
            });

            // 3. Load Data
            canvas.loadFromJSON({ version: "5.3.0", objects: designJson }, async () => {
                // Ensure fonts are loaded
                await document.fonts.ready;
                
                // Scale Objects if needed (Logic depends on your editor scale)
                // For now, we assume the saved JSON coordinates match the 2400px canvas
                // OR we zoom to fit.
                
                canvas.renderAll();
                
                // 4. Signal to Bot "I AM READY"
                // The bot waits for this specific ID to appear in the DOM
                setIsReady(true);
            });
        };

        loadDesign();
    }, [orderId, view]);

    return (
        <div style={{ background: 'transparent', padding: 0, margin: 0, overflow: 'hidden' }}>
            <canvas ref={canvasRef} />
            {/* The signal beacon for Puppeteer */}
            {isReady && <div id="render-complete-signal" style={{ display: 'none' }}>READY</div>}
        </div>
    );
}