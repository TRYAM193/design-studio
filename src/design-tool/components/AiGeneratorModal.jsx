import React, { useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FiLoader, FiCpu, FiZap, FiImage } from 'react-icons/fi';
import { generateImageFromPrompt } from '../utils/aiService';

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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    
    setIsGenerating(true);
    setError('');

    try {
      // 1. Generate Image
      const imageUrl = await generateImageFromPrompt(prompt, selectedStyle);
      
      // 2. Send back to editor
      onImageGenerated(imageUrl);
      
      // 3. Cleanup
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
      <DialogContent className="bg-zinc-950 border-zinc-800 text-white sm:max-w-[500px]">
        <DialogTitle className="flex items-center gap-2 text-xl font-bold border-b border-zinc-800 pb-4">
          <FiCpu className="text-indigo-500" /> 
          <span>Flux AI Generator</span>
          <span className="ml-auto text-[10px] bg-indigo-500/20 text-indigo-400 px-2 py-1 rounded border border-indigo-500/30">FAST MODE</span>
        </DialogTitle>

        <div className="space-y-5 py-2">
          
          {/* Prompt Area */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">What do you want to create?</label>
            <textarea
              className="w-full bg-zinc-900 border border-zinc-700 rounded-xl p-4 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[120px] resize-none placeholder:text-zinc-600"
              placeholder="E.g. A cute astronaut cat floating in space, holding a slice of pizza..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>

          {/* Style Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Choose a Style</label>
            <div className="grid grid-cols-3 gap-2">
              {STYLES.map((style) => (
                <button
                  key={style.id}
                  onClick={() => setSelectedStyle(style.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                    selectedStyle === style.id 
                      ? 'bg-indigo-600/20 border-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.3)]' 
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:bg-zinc-800 hover:border-zinc-700'
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

          <Button 
            onClick={handleGenerate} 
            disabled={isGenerating || !prompt.trim()}
            className="w-full h-12 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold tracking-wide shadow-lg shadow-indigo-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            {isGenerating ? (
              <span className="flex items-center gap-2">
                <FiLoader className="animate-spin" /> Generating (approx 1s)...
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