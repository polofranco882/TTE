import React, { useState, useEffect } from 'react';
import { Save, Eye, EyeOff, Shield, Zap } from 'lucide-react';

interface AIConfigPanelProps {
    token: string;
    onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const API = (import.meta as any).env?.VITE_API_URL || 'http://localhost:3000';

const AIConfigPanel: React.FC<AIConfigPanelProps> = ({ token, onNotify }) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showKey, setShowKey] = useState(false);

    const [provider, setProvider] = useState('openai');
    const [apiKey, setApiKey] = useState('');
    const [apiKeyMasked, setApiKeyMasked] = useState('');
    const [model, setModel] = useState('gpt-image-1');
    const [allowImage, setAllowImage] = useState(true);
    const [allowVideo, setAllowVideo] = useState(true);
    const [maxSeconds, setMaxSeconds] = useState(15);
    const [maxResolution, setMaxResolution] = useState('1024x1024');
    const [maxSizeMb, setMaxSizeMb] = useState(10);

    useEffect(() => {
        fetchConfig();
    }, []);

    const fetchConfig = async () => {
        try {
            const res = await fetch(`${API}/api/ai/config`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const data = await res.json();
                if (data) {
                    setProvider(data.provider || 'openai');
                    setApiKeyMasked(data.api_key_masked || '');
                    setModel(data.model || 'gpt-image-1');
                    setAllowImage(data.allow_image !== false);
                    setAllowVideo(data.allow_video !== false);
                    setMaxSeconds(data.max_seconds || 15);
                    setMaxResolution(data.max_resolution || '1024x1024');
                    setMaxSizeMb(data.max_size_mb || 10);
                }
            }
        } catch {
            onNotify('Failed to load AI configuration.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch(`${API}/api/ai/config`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    provider,
                    api_key: apiKey, // only sends if user typed a new one
                    model,
                    allow_image: allowImage,
                    allow_video: allowVideo,
                    max_seconds: maxSeconds,
                    max_resolution: maxResolution,
                    max_size_mb: maxSizeMb,
                }),
            });
            if (res.ok) {
                onNotify('AI configuration saved successfully!', 'success');
                setApiKey('');
                fetchConfig();
            } else {
                onNotify('Failed to save AI configuration.', 'error');
            }
        } catch {
            onNotify('Network error saving AI configuration.', 'error');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="w-8 h-8 border-4 border-accent/30 border-t-accent rounded-full animate-spin" />
            </div>
        );
    }

    const Toggle = ({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) => (
        <label className="flex items-center gap-3 cursor-pointer group">
            <div
                onClick={() => onChange(!checked)}
                className={`relative w-11 h-6 rounded-full transition-colors cursor-pointer ${checked ? 'bg-accent' : 'bg-gray-300'}`}
            >
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-5' : ''}`} />
            </div>
            <span className="text-sm font-medium text-gray-700 group-hover:text-gray-900 transition-colors">{label}</span>
        </label>
    );

    return (
        <div className="max-w-2xl space-y-8">
            {/* Provider Selection */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-6">
                <div className="flex items-center gap-3 mb-5">
                    <div className="p-2.5 bg-accent/15 rounded-xl text-accent">
                        <Zap size={20} />
                    </div>
                    <div>
                        <h4 className="font-bold text-gray-800">AI Provider</h4>
                        <p className="text-xs text-gray-500">Select the AI service for asset generation</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-5">
                    {(['openai', 'gemini'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => {
                                setProvider(p);
                                setModel(p === 'openai' ? 'gpt-image-1' : 'gemini-2.0-flash-exp');
                            }}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${provider === p
                                ? 'border-accent bg-white shadow-lg shadow-accent/10'
                                : 'border-gray-200 bg-white/60 hover:border-gray-300'
                                }`}
                        >
                            <span className="text-sm font-bold text-gray-800 block">
                                {p === 'openai' ? '🤖 OpenAI' : '✨ Google Gemini'}
                            </span>
                            <span className="text-[10px] text-gray-400 mt-1 block">
                                {p === 'openai' ? 'GPT Image / DALL-E' : 'Gemini Flash / Pro'}
                            </span>
                        </button>
                    ))}
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                            API Key
                        </label>
                        <div className="relative">
                            <input
                                type={showKey ? 'text' : 'password'}
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                                placeholder={apiKeyMasked || 'Enter your API key...'}
                                className="w-full px-4 py-3 pr-12 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowKey(!showKey)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showKey ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        <p className="text-[10px] text-gray-400 mt-1 flex items-center gap-1">
                            <Shield size={10} /> Leave blank to keep current key. Never shown in frontend.
                        </p>
                    </div>

                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                            Model
                        </label>
                        <input
                            type="text"
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-accent focus:ring-2 focus:ring-accent/20 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Policies */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <Shield size={16} className="text-gray-400" /> Generation Policies
                </h4>
                <div className="space-y-4">
                    <Toggle checked={allowImage} onChange={setAllowImage} label="Allow image generation" />
                    <Toggle checked={allowVideo} onChange={setAllowVideo} label="Allow video generation" />
                </div>
            </div>

            {/* Limits */}
            <div className="bg-white border border-gray-100 rounded-2xl p-6 shadow-sm">
                <h4 className="font-bold text-gray-800 mb-4">Generation Limits</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                            Max Resolution
                        </label>
                        <select
                            value={maxResolution}
                            onChange={(e) => setMaxResolution(e.target.value)}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-accent"
                        >
                            <option value="512x512">512 × 512</option>
                            <option value="1024x1024">1024 × 1024</option>
                            <option value="1536x1024">1536 × 1024</option>
                            <option value="1024x1536">1024 × 1536</option>
                        </select>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                            Max Seconds (video)
                        </label>
                        <input
                            type="number"
                            value={maxSeconds}
                            onChange={(e) => setMaxSeconds(parseInt(e.target.value) || 15)}
                            min={1}
                            max={60}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-accent"
                        />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-wider block mb-1.5">
                            Max Size (MB)
                        </label>
                        <input
                            type="number"
                            value={maxSizeMb}
                            onChange={(e) => setMaxSizeMb(parseInt(e.target.value) || 10)}
                            min={1}
                            max={100}
                            className="w-full px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm focus:outline-none focus:border-accent"
                        />
                    </div>
                </div>
            </div>

            {/* Save */}
            <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3.5 rounded-xl bg-accent text-white font-bold text-sm hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg shadow-accent/20"
            >
                {saving ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <Save size={16} />
                )}
                {saving ? 'Saving...' : 'Save Configuration'}
            </button>
        </div>
    );
};

export default AIConfigPanel;
