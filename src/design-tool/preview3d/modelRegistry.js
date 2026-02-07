// src/preview3d/modelRegistry.js

export const MODEL_REGISTRY = {
    "TSHIRT": {
        path: "/assets/t-shirt.glb",
        meshes: {
            front: "Body_Front_Node",
            back: "Body_Back_Node",
            leftSleeve: "Sleeves_Node",
            rightSleeve: "Sleeves_Node001",
            
            // ✅ FIX: Change 'Ribbon' to 'Ribbing' to match your GLB
            fcollar: "Ribbing_Node001", 
            bcollar: "Ribbing_Node"     
        }
    }
};

export const resolveProductType = (productId) => {
    if (!productId) return "TSHIRT";
    const upper = productId.toUpperCase();
    if (upper.includes("HOODIE")) return "HOODIE";
    return "TSHIRT";
};