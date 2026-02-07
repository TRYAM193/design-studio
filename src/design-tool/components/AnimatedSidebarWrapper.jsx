// src/design-tool/components/AnimatedSidebarWrapper.jsx
import React from 'react';
import { motion } from 'framer-motion'; 
import { useIsMobile } from '@/hooks/use-mobile'; 

export default function AnimatedSidebarWrapper({ children, onClose }) {
  const isMobile = useIsMobile();

  const mobileVariants = {
    hidden: { y: "100%" },
    visible: { 
      y: 0, 
      transition: { type: "spring", damping: 25, stiffness: 300 } 
    },
    exit: { 
      y: "100%", 
      transition: { ease: "easeInOut", duration: 0.2 } 
    }
  };

  const desktopVariants = {
    hidden: { x: "-100%", width: 0, opacity: 0 },
    visible: { 
      x: 0, 
      width: "300px", 
      opacity: 1,
      transition: { type: "spring", damping: 30, stiffness: 300 } 
    },
    exit: { 
      x: "-100%", 
      width: 0, 
      opacity: 0,
      transition: { ease: "easeInOut", duration: 0.2 } 
    }
  };

  // ✅ Wrap everything in a Fragment or transparent div so AnimatePresence tracks it as one unit
  return (
    <div className="sidebar-animation-container" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 40 }}>
      
      {/* Mobile Backdrop (Pointer events auto to catch clicks) */}
      {isMobile && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          style={{ pointerEvents: 'auto' }}
        />
      )}

      {/* The Sidebar Panel */}
      <motion.div
        variants={isMobile ? mobileVariants : desktopVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className={
          isMobile 
            ? "fixed bottom-0 left-0 right-0 z-50 h-[60vh] bg-[#1e293b] rounded-t-2xl overflow-hidden border-t border-white/10 shadow-2xl flex flex-col"
            : "relative h-full bg-[#1e293b] border-r border-white/10 z-10 overflow-hidden"
        }
        // ✅ Re-enable pointer events for the drawer content
        style={{ pointerEvents: 'auto' }} 
        onClick={(e) => e.stopPropagation()} 
      >
         {/* Mobile Drag Handle */}
         {isMobile && (
             <div className="w-full flex justify-center pt-3 pb-1 bg-[#1e293b]" onClick={onClose}>
                 <div className="w-12 h-1.5 bg-white/20 rounded-full" />
             </div>
         )}
         
         {/* Content Area */}
         <div className="w-full flex-1 overflow-y-auto bg-[#1e293b]">
            {children}
         </div>
      </motion.div>
    </div>
  );
}