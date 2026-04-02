import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Image as ImageIcon, Video, Upload, Loader2, Check, AlertTriangle, Layout } from 'lucide-react';

interface AIAssetGeneratorProps {
    isOpen: boolean;
    onClose: () => void;
    token: string;
    onAssetGenerated: (asset: {
        type: 'image' | 'video' | 'layout';
        url?: string;
        base64?: string;
        mime?: string;
        width?: number;
        height?: number;
        title?: string;
        layout?: {
            isHtml?: boolean;
            content?: string;
            canvas?: any;
            blocks?: any[]
        };
    }) => void;
}

const API = (import.meta as any).env?.VITE_API_URL || '/api';

const AIAssetGenerator: React.FC<AIAssetGeneratorProps> = ({ isOpen, onClose, token, onAssetGenerated }) => {
    const [prompt, setPrompt] = useState('');
    const [assetType, setAssetType] = useState<'image' | 'video' | 'layout'>('image');
    const [sourceBase64, setSourceBase64] = useState<string | null>(null);
    const [sourcePreview, setSourcePreview] = useState<string | null>(null);
    const [generating, setGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [result, setResult] = useState<any>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onloadend = () => {
            const dataUrl = reader.result as string;
            setSourcePreview(dataUrl);
            // Extract pure base64 without prefix
            const b64 = dataUrl.split(',')[1];
            setSourceBase64(b64);
        };
        reader.readAsDataURL(file);
    };

    const handleGenerate = async () => {
        if (!prompt.trim()) return;
        if (assetType === 'layout' && !sourceBase64) {
            setError('A reference image is required for layout generation.');
            return;
        }
        setGenerating(true);
        setError(null);
        setResult(null);

        try {
            const res = await fetch(`${API}/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    prompt: prompt.trim(),
                    asset_type: assetType,
                    source_asset_base64: sourceBase64 || undefined,
                    html_current: null,
                    insertion: { insert_strategy: 'append' },
                }),
            });

            const data = await res.json();

            if (data.status === 'error') {
                setError(data.message || 'Generation failed.');
                return;
            }

            setResult(data);
        } catch (err: any) {
            setError(err.message || 'Network error during generation.');
        } finally {
            setGenerating(false);
        }
    };

    const handleInsert = () => {
        if (!result) return;

        if (result.asset_type === 'layout' && result.layout) {
            onAssetGenerated({
                type: 'layout',
                layout: result.layout,
                title: prompt,
            });
        } else {
            const dataUri = `data:${result.mime};base64,${result.base64}`;
            onAssetGenerated({
                type: result.asset_type,
                url: dataUri,
                base64: result.base64,
                mime: result.mime,
                width: result.width,
                height: result.height,
                title: result.title || prompt,
            });
        }
        handleReset();
        onClose();
    };

    const handleReset = () => {
        setPrompt('');
        setSourceBase64(null);
        setSourcePreview(null);
        setError(null);
        setResult(null);
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm"
                onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
            >
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    className="bg-[#0f1129] border border-white/10 rounded-3xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-white/10 bg-gradient-to-r from-accent/10 to-purple-500/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-accent/20 rounded-xl">
                                <Sparkles size={18} className="text-accent" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-sm">AI Asset Generator</h3>
                                <p className="text-[10px] text-gray-500">Generate images or videos with AI</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors p-1">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">

                        {/* Asset Type */}
                        <div className="flex gap-2">
                            {(['image', 'video', 'layout'] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setAssetType(t)}
                                    className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all border ${assetType === t
                                        ? 'bg-accent/20 border-accent/40 text-accent'
                                        : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10'
                                        }`}
                                >
                                    {t === 'image' ? <ImageIcon size={14} /> : t === 'video' ? <Video size={14} /> : <Layout size={14} />}
                                    {t === 'image' ? 'Image' : t === 'video' ? 'Video' : 'Layout'}
                                </button>
                            ))}
                        </div>

                        {/* Prompt */}
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">
                                Prompt
                            </label>
                            <textarea
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe the image you want to generate..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-white/10 bg-white/5 text-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all resize-none placeholder:text-gray-600"
                            />
                        </div>

                        {/* Source Image (optional) */}
                        <div>
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block mb-1.5">
                                Source Image {assetType === 'layout' ? '(required — reference design)' : '(optional — for edits/variations)'}
                            </label>
                            <input
                                ref={fileRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                            {sourcePreview ? (
                                <div className="relative group">
                                    <img
                                        src={sourcePreview}
                                        alt="Source"
                                        className="w-full h-32 object-cover rounded-xl border border-white/10"
                                    />
                                    <button
                                        onClick={() => { setSourceBase64(null); setSourcePreview(null); }}
                                        className="absolute top-2 right-2 p-1 bg-red-500 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                    >
                                        <X size={12} />
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={() => fileRef.current?.click()}
                                    className="w-full py-4 rounded-xl border-2 border-dashed border-white/10 bg-white/[0.02] text-gray-600 hover:border-accent/30 hover:text-gray-400 transition-all flex items-center justify-center gap-2 text-xs font-bold"
                                >
                                    <Upload size={14} />
                                    Click to upload source image
                                </button>
                            )}
                        </div>

                        {/* Error */}
                        {error && (
                            <motion.div
                                initial={{ opacity: 0, y: -5 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold flex items-start gap-2"
                            >
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                {error}
                            </motion.div>
                        )}

                        {/* Result Preview */}
                        {result && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="space-y-3"
                            >
                                {result.asset_type === 'layout' ? (
                                    <div className="p-4 bg-gradient-to-br from-accent/10 to-purple-500/10 rounded-2xl border border-accent/20 space-y-3">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-accent/20 rounded-xl">
                                                <Layout size={20} className="text-accent" />
                                            </div>
                                            <div>
                                                <p className="text-white font-bold text-sm">Interactive Page Ready!</p>
                                                <p className="text-gray-500 text-[10px]">
                                                    Full HTML activity generated
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-[10px] text-gray-400 space-y-1">
                                            <p><strong className="text-gray-300">Format:</strong> Standalone HTML</p>
                                            <p><strong className="text-gray-300">Size:</strong> {Math.round((result.layout?.content?.length || 0) / 1024)} KB</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-1 bg-gradient-to-br from-accent/20 to-purple-500/20 rounded-2xl">
                                        {result.asset_type === 'video' ? (
                                            <video
                                                src={`data:${result.mime};base64,${result.base64}`}
                                                controls
                                                className="w-full rounded-xl"
                                            />
                                        ) : (
                                            <img
                                                src={`data:${result.mime};base64,${result.base64}`}
                                                alt={result.title}
                                                className="w-full rounded-xl"
                                            />
                                        )}
                                    </div>
                                )}
                                {result.asset_type !== 'layout' && (
                                    <div className="text-[10px] text-gray-500 space-y-0.5">
                                        <p><strong className="text-gray-400">ID:</strong> {result.asset_id_suggested}</p>
                                        <p><strong className="text-gray-400">Size:</strong> {result.width}×{result.height}</p>
                                        <p><strong className="text-gray-400">MIME:</strong> {result.mime}</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-white/10 flex gap-3">
                        {result ? (
                            <>
                                <button
                                    onClick={handleReset}
                                    className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-gray-400 text-xs font-bold hover:bg-white/10 transition-all"
                                >
                                    Generate Another
                                </button>
                                <button
                                    onClick={handleInsert}
                                    className="flex-1 py-2.5 rounded-xl bg-accent text-white text-xs font-bold hover:bg-orange-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                                >
                                    <Check size={14} />
                                    {result.asset_type === 'layout' ? 'Apply Layout' : 'Insert into Page'}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={handleGenerate}
                                disabled={generating || !prompt.trim()}
                                className="w-full py-3 rounded-xl bg-accent text-white text-sm font-bold hover:bg-orange-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
                            >
                                {generating ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        {assetType === 'video' ? 'Generating video... (may take a few minutes)' : assetType === 'layout' ? 'Analyzing layout...' : 'Generating...'}
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        Generate {assetType === 'image' ? 'Image' : assetType === 'video' ? 'Video' : 'Layout'}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default AIAssetGenerator;
