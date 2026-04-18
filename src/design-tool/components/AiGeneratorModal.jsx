import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FiLoader, FiCpu, FiZap } from 'react-icons/fi';
import { generateDesignJsonFromPrompt, warmUpAIBackend } from '../utils/aiService';

import { useDailyLimits } from '../../hooks/useDailyLimits';
import { Loader2, Sparkles, Lock, ImagePlus, X } from 'lucide-react';
import { toast } from 'sonner';

const STYLES = [
  { id: 'none', label: 'No Style', icon: '🚫' },
  { id: 'typography poster', label: 'Typography', icon: '📝' },
  { id: 'abstract geometric layout', label: 'Geometric', icon: '🔺' },
  { id: 'retro synthwave text', label: 'Retro Text', icon: '📼' },
  { id: 'minimalist branding layout', label: 'Minimalist', icon: '✨' },
  { id: 'emoji art composition', label: 'Emoji Art', icon: '🎨' },
  { id: 'streetwear bold text', label: 'Streetwear', icon: '🔥' },
];

export function AiGeneratorModal({ isOpen, onClose, onDesignGenerated, fabricCanvas, productId, onGenerateStart, onGenerateEnd, onGenerateProgress }) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [image, setImage] = useState(null); // Single image object: { base64, previewUrl }
  const { genRemaining, genLimit } = useDailyLimits();

  useEffect(() => {
    if (isOpen) {
      warmUpAIBackend();
    }
  }, [isOpen]);


  const compressImage = (file) => {
    return new Promise((resolve, reject) => {
      const isSvg = file.type === 'image/svg+xml';
      const reader = new FileReader();
      reader.onload = (e) => {
        if (isSvg) {
          resolve({ base64: e.target.result.split(',')[1], mimeType: file.type, previewUrl: e.target.result });
          return;
        }
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          let { width, height } = img;
          const MAX_SIZE = 800;
          if (width > height && width > MAX_SIZE) {
            height *= MAX_SIZE / width;
            width = MAX_SIZE;
          } else if (height > MAX_SIZE) {
            width *= MAX_SIZE / height;
            height = MAX_SIZE;
          }
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx.drawImage(img, 0, 0, width, height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          resolve({
            base64: dataUrl.split(',')[1],
            mimeType: 'image/jpeg',
            previewUrl: dataUrl
          });
        };
        img.onerror = reject;
        img.src = e.target.result;
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileUpload = async (e) => {
    if (!e.target.files?.length) return;
    const file = e.target.files[0]; // Restrict to single file

    try {
      setIsGenerating(true);
      setError('');
      const processed = await compressImage(file);
      setImage(processed);
    } catch (err) {
      setError('Failed to process image.');
    } finally {
      setIsGenerating(false);
      e.target.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && referenceImages.length === 0) {
      setError('Please provide a prompt or an image.');
      return;
    }
    setIsGenerating(true);
    setError('');

    if (onGenerateStart) {
      onGenerateStart();
    }

    const STEPS = [
      "Consulting the Stars...",
      "Analyzing your prompt & references...",
      "Harmonizing colors & typography...",
      "Constructing vector paths...",
      "Aligning geometry...",
      "Finalizing layout design..."
    ];
    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      stepIndex++;
      if (stepIndex < STEPS.length) {
        if (onGenerateProgress) onGenerateProgress(STEPS[stepIndex]);
      }
    }, 1500);

    try {
      const cWidth = fabricCanvas ? Math.round(fabricCanvas.width / (fabricCanvas.getZoom() || 1)) : 800;
      const cHeight = fabricCanvas ? Math.round(fabricCanvas.height / (fabricCanvas.getZoom() || 1)) : 800;
      const pInfo = productId ? `product ID: ${productId}` : "a blank canvas";

      const data = await generateDesignJsonFromPrompt(prompt, selectedStyle, cWidth, cHeight, pInfo, image?.base64);

      console.log("Received AI Design:", data.objects);
      
      if (typeof onDesignGenerated === 'function') {
        onDesignGenerated(data.objects, data.suggestedBg);
      }
      
      // incrementGen(); // 🛑 REMOVED: Backend now handles this, and onSnapshot listener updates the UI.

      setPrompt('');
      setImage(null);

      clearInterval(progressInterval);
      setIsGenerating(false);

      if (onGenerateEnd) onGenerateEnd();
      else onClose();

    } catch (err) {
      console.error(err);
      toast.error(err.message || 'Cosmic AI failed to generate design. Please try again.');
      clearInterval(progressInterval);
      setIsGenerating(false);
      if (onGenerateEnd) onGenerateEnd(); 
    }

  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f172a]/95 border border-white/10 text-white sm:max-w-[480px] w-[95vw] rounded-2xl shadow-2xl backdrop-blur-xl p-0 overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-5 border-b border-white/10 bg-white/5 flex-shrink-0">
          <DialogTitle className="flex items-center justify-between text-lg font-bold">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <FiCpu className="text-orange-500" size={18} />
              </div>
              <span>Cosmic AI</span>
            </div>
          </DialogTitle>
        </div>

        <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-6">

          {/* Modern Chat-style Input Area */}
          <div className="relative group">
            <div className={`transition-all duration-300 bg-black/40 border ${error ? 'border-red-500/50' : 'border-white/10 group-focus-within:border-blue-500/50'} rounded-2xl overflow-hidden shadow-2xl`}>
              
              {/* Image Preview Area (Compact) */}
              {image && (
                <div className="px-4 pt-4">
                  <div className="relative w-20 h-20 rounded-xl border border-white/20 overflow-hidden group/img shadow-lg">
                    <img src={image.previewUrl} className="w-full h-full object-cover" alt="Reference" />
                    <button 
                      onClick={() => setImage(null)}
                      className="absolute top-1 right-1 p-1 bg-black/60 hover:bg-red-500 text-white rounded-full transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                </div>
              )}

              <textarea
                className="w-full bg-transparent border-none p-4 pb-12 text-sm text-white focus:outline-none placeholder:text-slate-500 min-h-[120px] resize-none"
                placeholder="What design should I generate? (e.g. A retro poster with a futuristic skull)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
              />

              {/* Action Bar inside textarea */}
              <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between">
                <label className={`cursor-pointer group/upload p-2 rounded-lg transition-all ${image ? 'text-blue-400 bg-blue-500/10' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}>
                  <ImagePlus size={18} />
                  <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleFileUpload} />
                </label>
                
                <div className="flex items-center gap-2">
                   {prompt.length > 0 && (
                     <span className="text-[10px] font-bold text-slate-500 bg-white/5 px-2 py-1 rounded">
                       {prompt.length} chars
                     </span>
                   )}
                </div>
              </div>
            </div>
          </div>

          {/* Style Selector */}
          <div className="space-y-3">
            <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span> Choose a Style
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all duration-200 group ${selectedStyle === style.id
                    ? 'bg-gradient-to-b from-blue-600/20 to-purple-600/20 border-blue-500/50 text-white shadow-[0_0_15px_rgba(59,130,246,0.2)] scale-105'
                    : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10 hover:border-white/20'
                    }`}
                >
                  <span className={`text-2xl mb-1.5 transition-transform duration-300 ${selectedStyle === style.id ? 'scale-110 drop-shadow-md' : 'group-hover:scale-110 grayscale group-hover:grayscale-0'}`}>{style.icon}</span>
                  <span className="text-[10px] font-semibold text-center leading-tight truncate w-full px-1">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center font-medium animate-in slide-in-from-top-2">
              {error}
            </div>
          )}

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center p-3.5 bg-gradient-to-r from-indigo-900/40 to-slate-900/40 border border-indigo-500/20 rounded-xl shadow-inner">
              <div className="flex items-center gap-3">
                <div className="p-1.5 bg-indigo-500/20 rounded-md">
                  <Sparkles size={14} className="text-indigo-400" />
                </div>
                <span className="text-sm font-medium text-indigo-100">Daily Quota</span>
              </div>
              <div className="text-sm font-black text-white bg-indigo-500/20 px-3 py-1 rounded-md border border-indigo-500/30">
                {genRemaining} / {genLimit}
              </div>
            </div>

            <div className="flex items-start gap-3 p-3.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
              <span className="text-amber-400 text-lg mt-0.5 animate-pulse">💡</span>
              <p className="text-[11px] text-amber-200/80 leading-relaxed font-medium">
                <strong className="text-amber-300">Friendly Caution:</strong> The Cosmic AI is currently experimental! If it generates something bizarre, don't worry—just tweak it on the canvas or roll the dice again!
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-white/10 bg-black/20 flex-shrink-0">
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || (!prompt.trim() && !image) || genRemaining === 0}
            className="w-full h-12 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:via-indigo-500 hover:to-purple-500 text-white font-bold tracking-wider shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all hover:shadow-[0_0_25px_rgba(79,70,229,0.5)] active:scale-[0.98] border-0 rounded-xl"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <FiLoader className="animate-spin" size={18} /> Consulting the Stars...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FiZap className="fill-current text-yellow-400" size={18} /> Generate Design Layout
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}