export const MODEL_REGISTRY = {
    "TSHIRT": {
        // Using a placeholder path; in a real app this would be the actual GLB file
        path: "/assets/t-shirt.glb",
        meshes: {
            front: "Body_Front_Node",
            back: "Body_Back_Node",
            leftSleeve: "Sleeves_Left",
            rightSleeve: "Sleeve_Right",
            collar: "Collar"
        }
    }
};

export const resolveProductType = (productId) => {
    if (!productId) return "TSHIRT";
    const upper = productId.toUpperCase();
    // Expand logic here for Hoodies, Mugs, etc.
    if (upper.includes("HOODIE")) return "HOODIE";
    return "TSHIRT";
};