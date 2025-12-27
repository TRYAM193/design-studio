import React, { useMemo } from 'react';
import useUserDesigns from '../hooks/useUserDesigns';
import { useNavigate, useLocation } from 'react-router';
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

  const { filterMode, filterProductId, filterColor, filterSize } = location.state || {};

  const filteredDesigns = useMemo(() => {
    if (!filterMode) return designs;

    return designs.filter(d => {
      if (d.type === 'BLANK' || !d.type) {
        if (filterMode === 'blank') return true;
        return true; 
      }

      if (filterMode === 'product') {
        return d.type === 'PRODUCT' && d.productConfig?.productId === filterProductId;
      }

      if (filterMode === 'blank') {
        return false;
      }

      return true;
    });
  }, [designs, filterMode, filterProductId]);


  const handleSelectDesign = (design) => {
    // SCENARIO 1: Merge (e.g., Adding a saved sticker to the current shirt)
    console.log('Selected design:', design);
    if (filterMode === 'product' && (design.type === 'BLANK' || !design.type)) {
      const targetUrl = `/design?product=${filterProductId}&color=${filterColor || ''}&size=${filterSize || ''}`;

      navigate(targetUrl, {
        state: {
          mergeDesign: design,
          previousState: location.state
        }
      });
    } 
    // SCENARIO 2: Load a Saved Product Design (Restore Context)
    else if (design.type === 'PRODUCT' && design.productConfig) {
        const { productId, variantColor, variantSize } = design.productConfig;
        
        // ✅ FIX: Build URL params so Editor initializes in Product Mode
        const params = new URLSearchParams();
        if (productId) params.set('product', productId);
        if (variantColor) params.set('color', variantColor);
        if (variantSize) params.set('size', variantSize);
        
        navigate(`/design?${params.toString()}`, { state: { designToLoad: design } });
    }
    // SCENARIO 3: Standard Load (Blank Design)
    else {
      navigate('/design', { state: { designToLoad: design } });
    }
  };

  const handleDelete = async (userId, designId) => {
    if (!userId || !designId) return;
    if (!window.confirm("Are you sure you want to delete this design?")) return;

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
                      <button
                        className="icon delete"
                        title='Delete Design'
                        onClick={() => handleDelete(userId, design.id)}
                      >
                        <FaTrash/>
                      </button>
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