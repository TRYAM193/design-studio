export const MODEL_REGISTRY = {
    "TSHIRT": {
        // Using a placeholder path; in a real app this would be the actual GLB file
        path: "/assets/t-shirt.glb",
        meshes: {
            front: "Body_Front_Node",
            back: "Body_Back_Node",
            leftSleeve: "Sleeves_Node",
            rightSleeve: "Sleeves_Node001",
            fcollar: "Ribbon_Node001",
            bcollar: "Ribbon_Node"
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