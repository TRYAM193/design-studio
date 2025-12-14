// src/pages/SavedDesignsPage.jsx
import React from 'react';
import useUserDesigns from '../hooks/useUserDesigns';
import { useNavigate } from 'react-router-dom';
import { FaEdit, FaTrash, FaArrowLeft } from 'react-icons/fa';
import { firestore } from '../firebase';
import { doc, deleteDoc } from "firebase/firestore";
import '../styles/SavedDesign.css';

export default function SavedDesignsPage() {
  const userId = 'test-user-123';
  const { designs, loading } = useUserDesigns(userId);
  const navigate = useNavigate();

  const handleEdit = (design) => {
    navigate('/', { state: { designToLoad: design } });
  };

  const handleDelete = async (userId, designId) => {
    if (!userId || !designId) return;

    try {
      console.log("Deleting:", designId);

      const designRef = doc(firestore, `users/${userId}/designs`, designId);

      await deleteDoc(designRef);

      console.log("Design deleted successfully!");
    } catch (error) {
      console.error("Error deleting design:", error);
    }
  };

  return (
    <>
      <div className="saved-designs-page">
        <div className="back-btn" onClick={() => navigate('/')}>
          <FaArrowLeft />
        </div>
        <h2>Saved Designs</h2>

        {loading ? (
          <div className="spinner"></div>
        ) : (
          <>
            {designs.length === 0 && <p>No designs saved yet.</p>}

            <div className="design-grid">
              {designs.map((design) => (
                <div key={design.id} className="design-card">
                  <div className="design-image-wrapper">
                    <img
                      src={design.imageData}
                      alt={design.name}
                      width={150}
                      onClick={() => handleEdit(design)}
                    />
                  </div>

                  <div className="overlay-icons">
                    <FaEdit
                      className="icon edit"
                      onClick={() => handleEdit(design)}
                    />
                    <FaTrash
                      className="icon delete"
                      onClick={() => handleDelete(userId, design.id)}
                    />
                  </div>

                  <p>{design.name || 'Untitled'}</p>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
}
