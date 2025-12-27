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
      // Allow Blank designs to appear in Product Mode (for merging)
      if (d.type === 'BLANK' || !d.type) return true; 

      if (filterMode === 'product') {
        return d.type === 'PRODUCT' && d.productConfig?.productId === filterProductId;
      }
      return true;
    });
  }, [designs, filterMode, filterProductId]);


  const handleSelectDesign = (design) => {
    // SCENARIO 1: MERGE (Add Saved Blank/Sticker to Current Product Context)
    // We check if we are in 'product' mode AND the selected design is a BLANK/Template
    if (filterMode === 'product' && (design.type === 'BLANK' || !design.type)) {
      
      // Construct the URL to keep the user in the same Product Context
      const params = new URLSearchParams();
      if (filterProductId) params.set('product', filterProductId);
      if (filterColor) params.set('color', filterColor);
      if (filterSize) params.set('size', filterSize);

      // Navigate back to Editor, passing the ID to merge
      navigate(`/design?${params.toString()}`, {
        state: {
          mergeDesignId: design.id
        }
      });
    } 
    // SCENARIO 2: LOAD (Full Replace)
    else {
      // Just navigate with ID. Editor will fetch and replace everything.
      navigate(`/design?designId=${design.id}`);
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
                // Check if this card represents a Mergeable item (Blank in Product Mode)
                const isMergeable = filterMode === 'product' && (design.type === 'BLANK' || !design.type);

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