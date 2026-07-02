/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef } from 'react';
import { Upload, Wand2, Sparkles, Image as ImageIcon, LayoutTemplate, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const TRENDING_TEMPLATES = [
  { id: '1', url: 'https://i.imgflip.com/1ur9b0.jpg', name: 'Distracted Boyfriend' },
  { id: '2', url: 'https://i.imgflip.com/30b1gx.jpg', name: 'Drake Hotline Bling' },
  { id: '3', url: 'https://i.imgflip.com/1g8my4.jpg', name: 'Two Buttons' },
  { id: '4', url: 'https://i.imgflip.com/43a45p.jpg', name: 'Epic Handshake' },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'upload' | 'generate' | 'templates'>('templates');
  const [selectedImage, setSelectedImage] = useState<string | null>(TRENDING_TEMPLATES[0].url);
  const [prompt, setPrompt] = useState('');
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingCaptions, setIsGeneratingCaptions] = useState(false);
  const [captions, setCaptions] = useState<string[]>([]);
  const [selectedCaption, setSelectedCaption] = useState<string | null>(null);
  
  const imageContainerRef = useRef<HTMLDivElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      setSelectedImage(event.target?.result as string);
      setCaptions([]);
      setSelectedCaption(null);
    };
    reader.readAsDataURL(file);
  };

  const generateImage = async () => {
    if (!prompt.trim()) return;
    setIsGeneratingImage(true);
    setCaptions([]);
    setSelectedCaption(null);
    try {
      const res = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt })
      });
      const data = await res.json();
      if (data.imageUrl) {
        setSelectedImage(data.imageUrl);
      } else {
        alert(data.error || 'Failed to generate image');
      }
    } catch (err) {
      console.error(err);
      alert('Error generating image');
    } finally {
      setIsGeneratingImage(false);
    }
  };

  const generateCaptions = async () => {
    if (!selectedImage) return;
    
    setIsGeneratingCaptions(true);
    try {
      const payload: any = {};
      
      if (selectedImage.startsWith('data:')) {
        payload.imageBase64 = selectedImage;
        const match = selectedImage.match(/^data:(image\/\w+);base64,/);
        payload.mimeType = match ? match[1] : 'image/jpeg';
      } else {
        payload.imageUrl = selectedImage;
      }

      const res = await fetch('/api/captions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.captions && data.captions.length > 0) {
        setCaptions(data.captions);
      } else {
        alert(data.error || 'Failed to generate captions');
      }
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Error generating captions');
    } finally {
      setIsGeneratingCaptions(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-50 font-sans selection:bg-purple-500/30">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        
        <header className="mb-8 border-b border-neutral-800 pb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/20">
              <Sparkles className="text-white w-6 h-6" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">MemeAI</h1>
          </div>
          <p className="text-sm font-medium text-neutral-400">Magic Caption Generator</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT: Controls & Caption generation */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 shadow-xl">
              
              {/* Tabs */}
              <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 mb-6">
                <button 
                  onClick={() => setActiveTab('templates')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${activeTab === 'templates' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                  <LayoutTemplate className="w-4 h-4" /> Templates
                </button>
                <button 
                  onClick={() => setActiveTab('upload')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${activeTab === 'upload' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                  <Upload className="w-4 h-4" /> Upload
                </button>
                <button 
                  onClick={() => setActiveTab('generate')}
                  className={`flex-1 py-2 px-3 text-sm font-medium rounded-md flex items-center justify-center gap-2 transition-colors ${activeTab === 'generate' ? 'bg-neutral-800 text-white' : 'text-neutral-400 hover:text-white'}`}
                >
                  <ImageIcon className="w-4 h-4" /> AI Image
                </button>
              </div>

              {/* Tab Contents */}
              <div className="min-h-[140px] flex flex-col justify-center">
                {activeTab === 'templates' && (
                  <div className="grid grid-cols-2 gap-3">
                    {TRENDING_TEMPLATES.map(t => (
                      <button
                        key={t.id}
                        onClick={() => { setSelectedImage(t.url); setCaptions([]); setSelectedCaption(null); }}
                        className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-video ${selectedImage === t.url ? 'border-purple-500 shadow-lg shadow-purple-500/20' : 'border-transparent hover:border-neutral-700'}`}
                      >
                        <img src={t.url} alt={t.name} className="w-full h-full object-cover opacity-80 hover:opacity-100 transition-opacity" crossOrigin="anonymous" />
                      </button>
                    ))}
                  </div>
                )}

                {activeTab === 'upload' && (
                  <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-neutral-800 border-dashed rounded-lg cursor-pointer hover:bg-neutral-800/50 hover:border-neutral-700 transition-colors">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-8 h-8 mb-3 text-neutral-400" />
                      <p className="mb-2 text-sm text-neutral-400"><span className="font-semibold text-white">Click to upload</span> or drag and drop</p>
                      <p className="text-xs text-neutral-500">SVG, PNG, JPG or GIF</p>
                    </div>
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                  </label>
                )}

                {activeTab === 'generate' && (
                  <div className="flex flex-col gap-3">
                    <textarea 
                      placeholder="Describe the meme template you want to generate (e.g. 'A futuristic robot drinking coffee')..."
                      value={prompt}
                      onChange={e => setPrompt(e.target.value)}
                      className="w-full h-24 bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500 resize-none text-neutral-200 placeholder:text-neutral-600"
                    />
                    <button 
                      onClick={generateImage}
                      disabled={isGeneratingImage || !prompt.trim()}
                      className="w-full py-2.5 bg-neutral-100 text-neutral-950 hover:bg-white font-medium rounded-lg text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGeneratingImage ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
                      Generate Image
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-6 shadow-xl flex flex-col flex-1">
              <button
                onClick={generateCaptions}
                disabled={!selectedImage || isGeneratingCaptions}
                className="group relative w-full py-4 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-lg flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden shadow-[0_0_40px_-10px_rgba(147,51,234,0.5)] hover:shadow-[0_0_60px_-10px_rgba(147,51,234,0.7)]"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-700 ease-in-out" />
                {isGeneratingCaptions ? <Loader2 className="w-6 h-6 animate-spin" /> : <Wand2 className="w-6 h-6" />}
                Magic Caption
              </button>

              <div className="mt-6 flex-1 flex flex-col">
                <h3 className="text-sm font-medium text-neutral-400 mb-4 flex items-center justify-between">
                  Suggested Captions
                  {captions.length > 0 && <span className="text-xs bg-neutral-800 px-2 py-1 rounded-full text-neutral-300">{captions.length} found</span>}
                </h3>
                
                <div className="space-y-2 overflow-y-auto">
                  {!captions.length && !isGeneratingCaptions && (
                    <div className="text-center py-8 text-neutral-600 text-sm border border-neutral-800 border-dashed rounded-lg">
                      Click the Magic Caption button<br/>to generate ideas!
                    </div>
                  )}
                  <AnimatePresence>
                    {captions.map((caption, idx) => (
                      <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        key={idx}
                        onClick={() => setSelectedCaption(caption)}
                        className={`w-full text-left p-3 rounded-lg border transition-all text-sm group flex items-start gap-3
                          ${selectedCaption === caption 
                            ? 'bg-purple-500/10 border-purple-500/50 text-purple-100' 
                            : 'bg-neutral-950 border-neutral-800 text-neutral-300 hover:border-neutral-600 hover:bg-neutral-900'
                          }`}
                      >
                        <span className="text-neutral-500 font-mono text-xs mt-0.5">{idx + 1}.</span>
                        <span className="flex-1 leading-snug font-medium">{caption}</span>
                        <ArrowRight className={`w-4 h-4 shrink-0 transition-opacity ${selectedCaption === caption ? 'opacity-100 text-purple-400' : 'opacity-0 group-hover:opacity-50'}`} />
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            </div>

          </div>

          {/* RIGHT: Canvas */}
          <div className="lg:col-span-7">
            <div className="sticky top-8 bg-neutral-900 rounded-2xl border border-neutral-800 p-4 lg:p-8 shadow-xl min-h-[500px] flex items-center justify-center flex-col">
              
              {!selectedImage ? (
                <div className="text-neutral-500 flex flex-col items-center gap-4">
                  <ImageIcon className="w-12 h-12 opacity-50" />
                  <p>Select or generate an image to start</p>
                </div>
              ) : (
                <div className="w-full flex flex-col items-center">
                  <div 
                    ref={imageContainerRef}
                    className="relative max-w-full overflow-hidden rounded-lg shadow-2xl border border-neutral-800 bg-neutral-950 flex items-center justify-center"
                    style={{ minHeight: '300px' }}
                  >
                    <img 
                      src={selectedImage} 
                      alt="Meme template" 
                      className="max-w-full max-h-[70vh] object-contain block"
                      crossOrigin="anonymous"
                    />
                    
                    {selectedCaption && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute bottom-6 left-4 right-4 text-center pointer-events-none"
                      >
                        <p 
                          className="font-black uppercase tracking-wide leading-tight break-words mx-auto"
                          style={{
                            fontFamily: 'Impact, "Arial Black", sans-serif',
                            fontSize: 'clamp(1.5rem, 4vw, 3.5rem)',
                            color: 'white',
                            textShadow: '2px 2px 0 #000, -2px -2px 0 #000, 2px -2px 0 #000, -2px 2px 0 #000, 0 2px 0 #000, 2px 0 0 #000, 0 -2px 0 #000, -2px 0 0 #000, 0 0 10px rgba(0,0,0,0.5)',
                            WebkitTextStroke: '2px black',
                          }}
                        >
                          {selectedCaption}
                        </p>
                      </motion.div>
                    )}
                  </div>
                  
                  {selectedCaption && (
                    <p className="mt-6 text-sm text-neutral-500 flex items-center gap-2">
                      <Sparkles className="w-4 h-4" /> 
                      Your meme is ready! Right-click or long-press the image to save.
                    </p>
                  )}
                </div>
              )}

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
