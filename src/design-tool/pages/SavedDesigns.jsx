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

  const { filterMode, filterProductId } = location.state || {};

  const filteredDesigns = useMemo(() => {
    if (!filterMode) return designs;
    return designs.filter(d => {
      if (d.type === 'BLANK' || !d.type) return true; // Allow blanks
      if (filterMode === 'product') {
        return d.type === 'PRODUCT' && d.productConfig?.productId === filterProductId;
      }
      return true;
    });
  }, [designs, filterMode, filterProductId]);


  const handleSelectDesign = (design) => {
    // We only pass the ID now. The Editor will handle the fetching.
    navigate(`/design?designId=${design.id}`);
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
        <h2>{filterMode === 'product' ? 'Select Design' : 'Your Saved Designs'}</h2>

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <div className="design-grid">
            {filteredDesigns.map((design) => (
              <div key={design.id} className="design-card">
                <div className="design-image-wrapper">
                  <img src={design.imageData} alt={design.name} width={150} onClick={() => handleSelectDesign(design)} />
                </div>
                <div className="overlay-icons">
                  <button className="icon edit" onClick={() => handleSelectDesign(design)}><FaEdit /></button>
                  <button className="icon delete" onClick={() => handleDelete(userId, design.id)}><FaTrash/></button>
                </div>
                <p>{design.name || 'Untitled'}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}