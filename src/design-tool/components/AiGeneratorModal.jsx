// src/design-tool/components/AiGeneratorModal.jsx
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FiLoader, FiCpu, FiZap } from 'react-icons/fi';
import { generateImageFromPrompt } from '../utils/aiService';
import { useDailyLimits } from '../../hooks/useDailyLimits';
import { Loader2, Sparkles, Lock } from 'lucide-react';

const STYLES = [
  { id: 'none', label: 'No Style', icon: '🚫' },
  { id: 'vector illustration', label: 'Vector Art', icon: '🎨' },
  { id: 't-shirt design, flat colors', label: 'T-Shirt Print', icon: '👕' },
  { id: 'cute sticker, white border', label: 'Sticker', icon: '🏷️' },
  { id: 'vintage retro poster', label: 'Vintage', icon: '📼' },
  { id: 'cyberpunk digital art', label: 'Cyberpunk', icon: '🤖' },
  { id: 'anime manga style', label: 'Anime', icon: '🎌' },
];

export function AiGeneratorModal({ isOpen, onClose, onImageGenerated }) {
  const [prompt, setPrompt] = useState('');
  const [selectedStyle, setSelectedStyle] = useState('none');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const { genRemaining, genLimit } = useDailyLimits();

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError('');

    try {
      const imageUrl = await generateImageFromPrompt(prompt, selectedStyle);
      onImageGenerated(imageUrl);
      onClose();
      setPrompt('');
    } catch (err) {
      console.error(err);
      setError('Failed to generate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#0f172a] border border-white/10 text-white sm:max-w-[500px] shadow-2xl backdrop-blur-xl">
        <DialogTitle className="flex items-center gap-2 text-xl font-bold border-b border-white/10 pb-4">
          <FiCpu className="text-orange-500" />
          <span>Cosmic AI Generator</span>
          <span className="ml-auto text-[10px] bg-orange-500/20 text-orange-400 px-2 py-1 rounded border border-orange-500/30">PRO</span>
        </DialogTitle>

        <div className="space-y-5 py-2">

          {/* Prompt Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">What do you want to create?</label>
            <textarea
              className="w-full bg-slate-900/50 border border-white/10 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500 min-h-[120px] resize-none placeholder:text-slate-600 transition-all"
              placeholder="E.g. A mystical shiva trident glowing in space with nebula background..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Style Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Choose a Style</label>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${selectedStyle === style.id
                      ? 'bg-orange-600/20 border-orange-500 text-white shadow-[0_0_15px_rgba(234,88,12,0.3)]'
                      : 'bg-slate-900/30 border-white/10 text-slate-400 hover:bg-slate-800 hover:border-white/20'
                    }`}
                >
                  <span className="text-xl mb-2">{style.icon}</span>
                  <span className="text-[10px] font-semibold text-center leading-tight">{style.label}</span>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-xs text-center">
              {error}
            </div>
          )}

          <div className="flex justify-between items-center mb-4 p-3 bg-indigo-900/20 border border-indigo-500/30 rounded-lg">
            <div className="flex items-center gap-2">
              <Sparkles size={16} className="text-indigo-400" />
              <span className="text-sm font-medium text-indigo-200">Daily Quota</span>
            </div>
            <div className="text-sm font-bold text-white">
              {genRemaining} / {genLimit} Left
            </div>
          </div>

          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full h-12 bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-bold tracking-wide shadow-lg shadow-orange-900/40 transition-all hover:scale-[1.02] active:scale-[0.98] border-0"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <FiLoader className="animate-spin" /> Generating...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <FiZap className="fill-current" /> Generate Image
              </span>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}