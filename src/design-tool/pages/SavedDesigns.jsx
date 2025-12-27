import React, { useMemo } from 'react'; // Added useMemo
import useUserDesigns from '../hooks/useUserDesigns';
import { useNavigate, useLocation } from 'react-router'; // Added useLocation
import { FaEdit, FaTrash, FaArrowLeft, FaPlus } from 'react-icons/fa';
import { db as firestore } from "@/firebase";
import { doc, deleteDoc } from "firebase/firestore";
import { useAuth } from '@/hooks/use-auth';
import '../styles/SavedDesign.css';

export default function SavedDesignsPage() {
  const { user } = useAuth();
  const userId = user?.uid;
  const { designs, loading } = useUserDesigns(userId);
  const navigate = useNavigate();
  const location = useLocation();

  // 1. Get Context from Navigation State
  const { filterMode, filterProductId, filterColor, filterSize } = location.state || {};

  // 2. Filter Designs Logic
  const filteredDesigns = useMemo(() => {
    if (!filterMode) return designs; // Show all if accessed directly

    return designs.filter(d => {
      // Rule 1: Always show Blank designs
      if (d.type === 'BLANK' || !d.type) { // assume untyped are blank
         if (filterMode === 'blank') return true;
         // If in product mode, we allow blanks too (to merge)
         return true;
      }

      // Rule 2: If Product Mode, show ONLY matching products
      if (filterMode === 'product') {
         return d.type === 'PRODUCT' && d.productConfig?.productId === filterProductId;
      }

      // Rule 3: If Blank Mode, HIDE Products
      if (filterMode === 'blank') {
         return false;
      }

      return true;
    });
  }, [designs, filterMode, filterProductId]);


  // 3. Handle Load vs Merge
  const handleSelectDesign = (design) => {
    // SCENARIO: We are in Product Mode AND loading a Blank Design
    if (filterMode === 'product' && (design.type === 'BLANK' || !design.type)) {
       const targetUrl = `/design?product=${filterProductId}&color=${filterColor || ''}&size=${filterSize || ''}`;

       navigate(targetUrl, { 
           state: { 
               mergeDesign: design, // Special flag for Editor.jsx
               previousState: location.state // Keep context if needed
           } 
       });
    } else {
       // STANDARD LOAD (Replace)
       navigate('/design', { state: { designToLoad: design } });
    }
  };

  const handleDelete = async (userId, designId) => {
    if (!userId || !designId) return;
    if(!window.confirm("Are you sure you want to delete this design?")) return;

    try {
      const designRef = doc(firestore, `users/${userId}/designs`, designId);
      await deleteDoc(designRef);
    } catch (error) {
      console.error("Error deleting design:", error);
    }
  };

  return (
    <>
      <div className="saved-designs-page">
        <div className="back-btn" onClick={() => navigate(-1)}>
          <FaArrowLeft />
        </div>
        <h2>
            {filterMode === 'product' ? 'Select Design to Load or Merge' : 'Your Saved Designs'}
        </h2>

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <>
            {filteredDesigns.length === 0 && <p>No matching designs found.</p>}

            <div className="design-grid">
              {filteredDesigns.map((design) => {
                 const isMergeable = filterMode === 'product' && design.type === 'BLANK';
                 
                 return (
                    <div key={design.id} className="design-card">
                      <div className="design-image-wrapper">
                        <img
                          src={design.imageData}
                          alt={design.name}
                          width={150}
                          onClick={() => handleSelectDesign(design)}
                        />
                        {/* Visual hint for merging */}
                        {isMergeable && (
                            <div className="merge-badge">Add to Current</div>
                        )}
                      </div>

                      <div className="overlay-icons">
                        <button 
                            className="icon edit" 
                            title={isMergeable ? "Add to current design" : "Load design"}
                            onClick={() => handleSelectDesign(design)}
                        >
                           {isMergeable ? <FaPlus /> : <FaEdit />}
                        </button>
                        <FaTrash
                          className="icon delete"
                          onClick={() => handleDelete(userId, design.id)}
                        />
                      </div>

                      <p>{design.name || 'Untitled'}</p>
                    </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </>
  );
}