import os
import cv2
import numpy as np
import requests
import firebase_admin
from firebase_admin import credentials, auth, firestore
from fastapi import FastAPI, File, UploadFile, Header, HTTPException, Depends, Response
from fastapi.middleware.cors import CORSMiddleware
from rembg import remove
from PIL import Image
import io
from datetime import datetime
import pytz

# --- 1. FIREBASE INITIALIZATION ---
# Use explicit credentials if you have the JSON file, otherwise default to environment
# cred = credentials.Certificate("serviceAccountKey.json") 
# firebase_admin.initialize_app(cred)
if not firebase_admin._apps:
    firebase_admin.initialize_app()

db = firestore.client()

# --- 2. FASTAPI SETUP ---
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # Allow all for dev; restrict in prod
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- 3. AI MODEL SETUP (Upscaler) ---
MODEL_PATH = "EDSR_x4.pb"
MODEL_URL = "https://github.com/Saafke/EDSR_Tensorflow/raw/master/models/EDSR_x4.pb"
upscaler = None

def load_upscaler():
    """Downloads and initializes the Super Resolution Model."""
    global upscaler
    if not os.path.exists(MODEL_PATH):
        print(f"📥 Downloading AI Model ({MODEL_PATH})...")
        try:
            response = requests.get(MODEL_URL, stream=True)
            with open(MODEL_PATH, "wb") as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)
            print("✅ Model downloaded successfully.")
        except Exception as e:
            print(f"❌ Failed to download model: {e}")
            return

    try:
        sr = cv2.dnn_superres.DnnSuperResImpl_create()
        sr.readModel(MODEL_PATH)
        sr.setModel("edsr", 4) # 4x Upscale
        upscaler = sr
        print("✅ AI Upscaler Loaded (EDSR x4)")
    except Exception as e:
        print(f"❌ Error loading Upscaler: {e}")

# Load model on startup
load_upscaler()

# --- 4. HELPER FUNCTIONS ---

async def verify_firebase_token(authorization: str = Header(...)):
    """Verifies the Bearer Token from the Frontend."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid auth header")
    
    token = authorization.split("Bearer ")[1]
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token["uid"]
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

def check_and_increment_limit(user_id: str, field: str = "cheap_count", max_limit: int = 50):
    """
    Checks if user has exceeded daily limit for 'cheap' tools.
    Increments count if allowed.
    """
    today = datetime.now(pytz.utc).strftime('%Y-%m-%d')
    doc_ref = db.collection('users').document(user_id).collection('daily_stats').document(today)

    @firestore.transactional
    def update_in_transaction(transaction, ref):
        snapshot = ref.get(transaction=transaction)
        current_val = 0
        
        if snapshot.exists:
            current_val = snapshot.get(field) or 0
        
        if current_val >= max_limit:
            return False, current_val
        
        # Increment
        transaction.set(ref, {
            field: current_val + 1,
            'last_updated': firestore.SERVER_TIMESTAMP
        }, merge=True)
        return True, current_val + 1

    transaction = db.transaction()
    allowed, new_val = update_in_transaction(transaction, doc_ref)

    if not allowed:
        print(f"⛔ User {user_id} hit daily limit ({max_limit})")
        raise HTTPException(
            status_code=429, 
            detail=f"Daily limit reached ({max_limit}/{max_limit}). Resets at midnight UTC."
        )
    
    return True

# --- 5. ENDPOINTS ---

@app.get("/")
def health_check():
    return {"status": "running", "ai_model": "loaded" if upscaler else "failed"}

@app.post("/remove-bg")
async def remove_background(
    file: UploadFile = File(...), 
    user_id: str = Depends(verify_firebase_token)
):
    # 1. Check Credits (Invisible Limit: 50)
    check_and_increment_limit(user_id, field="cheap_count", max_limit=50)

    try:
        # 2. Process Image
        content = await file.read()
        output_data = remove(content) # rembg magic
        
        return Response(content=output_data, media_type="image/png")

    except Exception as e:
        print(f"Remove BG Error: {e}")
        raise HTTPException(status_code=500, detail="Background removal failed")

@app.post("/upscale")
async def upscale_image(
    file: UploadFile = File(...), 
    user_id: str = Depends(verify_firebase_token)
):
    if upscaler is None:
        raise HTTPException(status_code=503, detail="AI Model not loaded")

    # 1. Check Credits (Invisible Limit: 50)
    check_and_increment_limit(user_id, field="cheap_count", max_limit=50)

    try:
        # 2. Read Image
        contents = await file.read()
        nparr = np.frombuffer(contents, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        # 3. Safety Check: Don't upscale if already huge
        h, w, _ = img.shape
        if w > 1200 or h > 1200:
             # Just return original if it's already big enough to save server CPU
             return Response(content=contents, media_type="image/png")

        # 4. Run AI (4x Upscale)
        print(f"⚡ Upscaling image for {user_id} ({w}x{h})...")
        result = upscaler.upsample(img)

        # 5. Encode back to PNG
        _, encoded_img = cv2.imencode('.png', result)
        return Response(content=encoded_img.tobytes(), media_type="image/png")

    except Exception as e:
        print(f"Upscale Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))