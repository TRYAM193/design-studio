import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";
import { FiLock, FiLogIn, FiX, FiShield } from "react-icons/fi";

const LoginRequiredModal = ({
  isOpen,
  onClose,
  onSignIn,
}) => {
  const [mounted, setMounted] = useState(false);
  const [animateIn, setAnimateIn] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Trigger entrance animation after mount
      requestAnimationFrame(() => setAnimateIn(true));
    } else {
      setAnimateIn(false);
    }
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center px-4">
      {/* Backdrop with Blur */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal Box - Cosmic Theme */}
      <div
        className={`relative w-full max-w-md bg-[#0f172a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden transition-all duration-300 ease-out ${
          animateIn
            ? "opacity-100 scale-100 translate-y-0"
            : "opacity-0 scale-95 translate-y-4"
        }`}
      >
        {/* Ambient Glow */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Content */}
        <div className="relative p-6 space-y-6">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-white/10"
          >
            <FiX size={18} />
          </button>

          {/* Icon + Header */}
          <div className="flex flex-col items-center text-center space-y-4 pt-2">
            {/* Animated Lock Icon */}
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500/20 rounded-full blur-xl animate-pulse pointer-events-none" />
              <div className="relative w-20 h-20 bg-gradient-to-br from-orange-500/20 to-red-500/20 rounded-full flex items-center justify-center border border-orange-500/30">
                <FiLock className="text-orange-400 w-9 h-9" />
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-bold text-white tracking-tight">
                Sign in to Save
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed max-w-xs">
                Your design is safe! Sign in or create an account to save your
                work. You'll return right back here with your design intact.
              </p>
            </div>
          </div>

          {/* Trust Badges */}
          <div className="flex items-center justify-center gap-4 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <FiShield className="text-green-500" size={12} />
              Design preserved
            </span>
            <span className="w-1 h-1 rounded-full bg-slate-700" />
            <span className="flex items-center gap-1.5">
              <FiShield className="text-green-500" size={12} />
              Instant return
            </span>
          </div>

          {/* Buttons  */}
          <div className="flex flex-col gap-3 pt-1">
            {/* Primary: Sign In */}
            <button
              onClick={onSignIn}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold shadow-lg shadow-orange-900/20 hover:shadow-orange-900/40 transition-all duration-200 flex items-center justify-center gap-2 group"
            >
              <FiLogIn
                size={18}
                className="group-hover:translate-x-0.5 transition-transform"
              />
              Sign In to Save
            </button>

            {/* Secondary: Cancel */}
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl border border-white/10 text-slate-400 hover:bg-white/5 hover:text-white transition-all text-sm font-medium"
            >
              Continue without saving
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
};

export default LoginRequiredModal;
