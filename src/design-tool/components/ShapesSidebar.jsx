// src/components/ShapesSidebar.jsx
import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { setCanvasObjects } from '../redux/canvasSlice';
import { v4 as uuidv4 } from 'uuid';
// Using React Icons for the UI
import { FiSquare, FiCircle, FiTriangle, FiStar, FiHexagon, FiMinus, FiArrowRight, FiHeart, FiMessageSquare, FiZap } from 'react-icons/fi';
// You can also use explicit SVG icons if preferred

export default function ShapesSidebar() {
  const dispatch = useDispatch();
  const canvasObjects = useSelector((state) => state.canvas.present);

  const handleAddShape = (type) => {
    const id = uuidv4();
    
    // Default properties
    const commonProps = {
      left: 400, // Center of 800x800 canvas
      top: 400,
      fill: '#000000',
      stroke: '#000000',
      strokeWidth: 0,
      opacity: 1,
      angle: 0,
      scaleX: 1,
      scaleY: 1,
    };

    let shapeProps = {};

    switch (type) {
      case 'rect': shapeProps = { width: 100, height: 100 }; break;
      case 'circle': shapeProps = { radius: 50 }; break;
      case 'triangle': shapeProps = { width: 100, height: 100 }; break;
      case 'star': shapeProps = { width: 100, height: 100 }; break; // Fabric calcs actual size from points
      case 'pentagon': shapeProps = { width: 100, height: 100 }; break;
      case 'line': 
        // Lines rely on stroke, not fill
        shapeProps = { width: 100, height: 4, strokeWidth: 4, stroke: '#3b82f6', fill: null }; 
        break;
      case 'arrow': shapeProps = { radius: 0 }; break;
      case 'diamond': shapeProps = { radius: 0 }; break;
      case 'trapezoid': shapeProps = { radius: 0 }; break;
      case 'lightning': shapeProps = { radius: 0 }; break;
      case 'heart': shapeProps = {}; break; // Heart doesn't typically need corner radius
      case 'bubble': shapeProps = {}; break;
      default: break;
    }

    const newObject = {
      id: id,
      type: type, // This string ('star', 'line') tells ShapeAdder what to create
      props: { ...commonProps, ...shapeProps }
    };

    dispatch(setCanvasObjects([...canvasObjects, newObject]));
  };

  return (
    <div className="sidebar-content">
       <div style={{ 
           display: 'grid', 
           gridTemplateColumns: 'repeat(2, 1fr)', 
           gap: '12px',
           padding: '5px'
       }}>
          <ShapeButton label="Square" onClick={() => handleAddShape('rect')} icon={<FiSquare size={24} />} />
          <ShapeButton label="Circle" onClick={() => handleAddShape('circle')} icon={<FiCircle size={24} />} />
          <ShapeButton label="Triangle" onClick={() => handleAddShape('triangle')} icon={<FiTriangle size={24} />} />
          
          {/* 🆕 New Buttons */}
          <ShapeButton label="Star" onClick={() => handleAddShape('star')} icon={<FiStar size={24} />} />
          <ShapeButton label="Pentagon" onClick={() => handleAddShape('pentagon')} icon={<FiHexagon size={24} />} />
          <ShapeButton label="Line" onClick={() => handleAddShape('line')} icon={<FiMinus size={24} />} />

          <ShapeButton label="Arrow" onClick={() => handleAddShape('arrow')} icon={<FiArrowRight size={24} />} />
          <ShapeButton label="Diamond" onClick={() => handleAddShape('diamond')} icon={<div style={{ transform: 'rotate(45deg)' }}><FiSquare size={20} /></div>} />
          <ShapeButton 
            label="Trapezoid" 
            onClick={() => handleAddShape('trapezoid')} 
            icon={
              <svg 
                width="24" 
                height="24" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                {/* Draws a trapezoid shape: Bottom-Left -> Bottom-Right -> Top-Right -> Top-Left -> Close */}
                <path d="M4 20h16l-4-16H8L4 20z" />
              </svg>
            } 
          />
          <ShapeButton label="Heart" onClick={() => handleAddShape('heart')} icon={<FiHeart size={24} />} />
          <ShapeButton label="Bolt" onClick={() => handleAddShape('lightning')} icon={<FiZap size={24} />} />
          <ShapeButton label="Bubble" onClick={() => handleAddShape('bubble')} icon={<FiMessageSquare size={24} />} />
       </div>
    </div>
  );
}

function ShapeButton({ label, onClick, icon }) {
    return (
        <button 
            onClick={onClick}
            style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '20px', border: '1px solid #e5e7eb', borderRadius: '8px',
                background: 'white', cursor: 'pointer', color: '#4b5563', transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f3f4f6';
                e.currentTarget.style.color = '#111827';
            }}
            onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
                e.currentTarget.style.color = '#4b5563';
            }}
        >
            <div style={{ pointerEvents: 'none' }}>{icon}</div>
            <span style={{ fontSize: '13px', fontWeight: '500' }}>{label}</span>
        </button>
    )
}