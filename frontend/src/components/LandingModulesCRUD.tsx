import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Plus, Trash2, Edit3, Save, X, ToggleLeft, ToggleRight,
    GripVertical, Globe, Image as ImageIcon, Activity, UploadCloud, Video
} from 'lucide-react';
import { type NotificationType } from './Notification';
import { optimizeImageFile } from '../utils/imageOptimizer';
import { optimizeVideoFile } from '../utils/videoOptimizer';

import PremiumConfirmModal from './PremiumConfirmModal';

interface LandingModulesCRUDProps {
    module: 'banners' | 'gallery' | 'videos' | 'testimonials';
    token: string;
    onNotify: (msg: string, type: NotificationType) => void;
    availableLangs: string[];
}

const LANG_META: Record<string, { label: string; flag: string }> = {
    en: { label: 'English', flag: '🇺🇸' },
    es: { label: 'Español', flag: '🇪🇸' },
    pt: { label: 'Português', flag: '🇧🇷' },
};

const emptyItem = (module: string) => {
    switch (module) {
        case 'banners':      return { title: '', subtitle: '', description: '', cta_text: '', cta_url: '', image_url: '', bg_color: '#09194F', badge_text: '', display_order: 0, is_active: true };
        case 'gallery':      return { image_url: '', caption: '', alt_text: '', album: 'General', display_order: 0, is_active: true };
        case 'videos':       return { title: '', description: '', video_url: '', thumbnail_url: '', display_order: 0, is_active: true };
        case 'testimonials': return { author_name: '', author_role: '', author_avatar: '', quote: '', rating: 5, display_order: 0, is_active: true };
        default:             return {};
    }
};

const LandingModulesCRUD = ({ module, token, onNotify, availableLangs }: LandingModulesCRUDProps) => {
    const [items, setItems] = useState<any[]>([]);
    const [editingId, setEditingId] = useState<number | 'new' | null>(null);
    const [formData, setFormData] = useState<any>({});
    const [activeLang, setActiveLang] = useState('en');
    const [transData, setTransData] = useState<any>({});
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // Modal state
    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; id: number | null }>({ isOpen: false, id: null });

    const baseUrl = `/api/landing-modules/${module}`;

    const load = useCallback(async () => {
        try {
            const r = await fetch(baseUrl, { headers: { Authorization: `Bearer ${token}` } });
            const data = await r.json();
            setItems(Array.isArray(data) ? data : []);
        } catch { /* noop */ }
    }, [baseUrl, token]);

    useEffect(() => { load(); }, [load]);

    const startEdit = (item: any) => {
        setFormData({ ...item });
        setTransData(item.translations || {});
        setEditingId(item.id);
        setActiveLang('en');
    };

    const startNew = () => {
        setFormData({ ...emptyItem(module) });
        setTransData({});
        setEditingId('new');
        setActiveLang('en');
    };

    const cancelEdit = () => { setEditingId(null); setFormData({}); setTransData({}); };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const isNew = editingId === 'new';
            const url = isNew ? baseUrl : `${baseUrl}/${editingId}`;
            const method = isNew ? 'POST' : 'PUT';
            const r = await fetch(url, {
                method, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(formData)
            });
            if (!r.ok) throw new Error();
            const saved = await r.json();
            const savedId = saved.id;

            // Save all translations
            for (const [langCode, trans] of Object.entries(transData)) {
                await fetch(`${baseUrl}/${savedId}/translations`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ language_code: langCode, ...trans as any })
                });
            }

            onNotify('Item saved successfully!', 'success');
            cancelEdit();
            load();
        } catch {
            onNotify('Error saving item.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async (id: number) => {
        try {
            const r = await fetch(`${baseUrl}/${id}`, {
                method: 'DELETE', headers: { Authorization: `Bearer ${token}` }
            });
            if (r.ok) {
                onNotify('Item deleted.', 'success');
                load();
            } else {
                throw new Error();
            }
        } catch { onNotify('Error deleting.', 'error'); }
    };

    const toggleActive = async (item: any) => {
        try {
            await fetch(`${baseUrl}/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ ...item, is_active: !item.is_active })
            });
            load();
        } catch { onNotify('Error updating.', 'error'); }
    };

    /** Upload any image file — converts to WebP base64 and stores directly in form data */
    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        onNotify('Optimizing image (WebP)...', 'info');
        try {
            const opt = await optimizeImageFile(file, 1920, 1080, 0.85);
            // Save raw base64 string directly in form data for the DB, bypassing external storage
            setFormData((p: any) => ({ ...p, [field]: opt.base64 }));
            onNotify('Image optimized to base64 successfully!', 'success');
        } catch (err: any) { onNotify(err.message || 'Upload failed.', 'error'); }
        finally { setIsUploading(false); }
    };

    /** Upload a video file — converts to base64 and auto-extracts thumbnail */
    const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setIsUploading(true);
        onNotify(`Processing video to base64 (${(file.size / 1024 / 1024).toFixed(1)}MB)...`, 'info');
        try {
            const opt = await optimizeVideoFile(file);
            setFormData((p: any) => ({ 
                ...p, 
                video_url: opt.base64,
                ...(opt.thumbnailBase64 ? { thumbnail_url: opt.thumbnailBase64 } : {})
            }));
            onNotify('Video converted to base64! Thumbnail auto-extracted.', 'success');
        } catch (err: any) { onNotify(err.message || 'Video processing failed.', 'error'); }
        finally { setIsUploading(false); }
    };

    const setTrans = (lang: string, field: string, value: string) => {
        setTransData((p: any) => ({ ...p, [lang]: { ...(p[lang] || {}), [field]: value } }));
    };
    const getTrans = (lang: string, field: string) => transData?.[lang]?.[field] ?? '';

    // ── Form renderer
    const renderForm = () => (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-surface border border-primary/10 rounded-2xl p-6 mb-4 shadow-premium">
            <div className="flex justify-between items-center mb-5">
                <h3 className="font-serif font-bold text-primary text-lg">{editingId === 'new' ? 'Add New Item' : 'Edit Item'}</h3>
                <button onClick={cancelEdit} className="p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all"><X size={18} /></button>
            </div>

            {/* ─ Structural fields per module ─ */}
            {module === 'banners' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Title (EN default)" value={formData.title} onChange={(v: string) => setFormData((p: any) => ({...p, title: v}))} />
                        <Field label="Subtitle (EN default)" value={formData.subtitle} onChange={(v: string) => setFormData((p: any) => ({...p, subtitle: v}))} />
                    </div>
                    <Field label="Badge Text (EN default)" value={formData.badge_text} onChange={(v: string) => setFormData((p: any) => ({...p, badge_text: v}))} />
                    <Field label="Description" textarea value={formData.description} onChange={(v: string) => setFormData((p: any) => ({...p, description: v}))} />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="CTA Button Text" value={formData.cta_text} onChange={(v: string) => setFormData((p: any) => ({...p, cta_text: v}))} />
                        <Field label="CTA URL" value={formData.cta_url} onChange={(v: string) => setFormData((p: any) => ({...p, cta_url: v}))} />
                    </div>
                    <ImageField label="Banner Image" value={formData.image_url} field="image_url" onChange={(v: string) => setFormData((p: any) => ({...p, image_url: v}))} onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleUpload(e, 'image_url')} isUploading={isUploading} />
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Background Color</label>
                            <input type="color" value={formData.bg_color || '#09194F'} onChange={(e: any) => setFormData((p: any) => ({...p, bg_color: e.target.value}))} className="h-10 w-full rounded-lg border border-gray-200 cursor-pointer" />
                        </div>
                        <div className="flex-1">
                            <Field label="Display Order" type="number" value={String(formData.display_order || 0)} onChange={(v: string) => setFormData((p: any) => ({...p, display_order: +v}))} />
                        </div>
                    </div>
                </div>
            )}

            {module === 'gallery' && (
                <div className="space-y-4">
                    <ImageField label="Image" value={formData.image_url} field="image_url" onChange={(v: string) => setFormData((p: any) => ({...p, image_url: v}))} onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleUpload(e, 'image_url')} isUploading={isUploading} />
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Caption" value={formData.caption} onChange={(v: string) => setFormData((p: any) => ({...p, caption: v}))} />
                        <Field label="Alt Text" value={formData.alt_text} onChange={(v: string) => setFormData((p: any) => ({...p, alt_text: v}))} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Album / Category" value={formData.album} onChange={(v: string) => setFormData((p: any) => ({...p, album: v}))} />
                        <Field label="Display Order" type="number" value={String(formData.display_order || 0)} onChange={(v: string) => setFormData((p: any) => ({...p, display_order: +v}))} />
                    </div>
                </div>
            )}

            {module === 'videos' && (
                <div className="space-y-4">
                    <Field label="Title (EN default)" value={formData.title} onChange={(v: string) => setFormData((p: any) => ({...p, title: v}))} />
                    {/* ─ Video source: upload file OR paste URL ─ */}
                    <div className="space-y-1">
                        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block">Video Source</label>
                        <div className="grid grid-cols-1 gap-3">
                            {/* Upload as base64 */}
                            <div className="border-2 border-dashed border-primary/20 rounded-xl p-4 relative cursor-pointer hover:border-primary/40 transition-colors group text-center">
                                <input type="file" accept="video/mp4,video/webm,video/ogg" onChange={handleVideoUpload} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                                {isUploading
                                    ? <Activity size={18} className="inline animate-spin text-accent mb-1" />
                                    : <Video size={18} className="inline text-primary/40 group-hover:text-primary mb-1" />
                                }
                                <p className="text-sm font-bold text-primary/60 group-hover:text-primary transition-colors">
                                    {isUploading ? 'Uploading video...' : 'Upload Video File (base64, max 50MB)'}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">MP4, WebM, OGG — thumbnail auto-extracted</p>
                            </div>
                            {/* OR paste external URL */}
                            <div className="flex items-center gap-2">
                                <div className="h-px flex-1 bg-gray-100" />
                                <span className="text-xs text-gray-400 font-bold">OR paste YouTube/external URL</span>
                                <div className="h-px flex-1 bg-gray-100" />
                            </div>
                            <input type="text" value={formData.video_url || ''} onChange={e => setFormData((p: any) => ({...p, video_url: e.target.value}))} placeholder="https://youtube.com/watch?v=... or /api/media/ID"
                                className="w-full px-4 py-2.5 rounded-xl border border-black/10 outline-none text-sm font-medium text-primary focus:border-primary transition-all" />
                        </div>
                        {/* Preview current video URL */}
                        {formData.video_url && (
                            <p className="text-xs text-gray-400 mt-1 truncate">📎 {formData.video_url}</p>
                        )}
                    </div>
                    <Field label="Description" textarea value={formData.description} onChange={(v: string) => setFormData((p: any) => ({...p, description: v}))} />
                    <ImageField label="Thumbnail Image (auto-uploaded from video or upload separately)" value={formData.thumbnail_url} field="thumbnail_url" onChange={(v: string) => setFormData((p: any) => ({...p, thumbnail_url: v}))} onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleUpload(e, 'thumbnail_url')} isUploading={isUploading} />
                    <Field label="Display Order" type="number" value={String(formData.display_order || 0)} onChange={(v: string) => setFormData((p: any) => ({...p, display_order: +v}))} />
                </div>
            )}

            {module === 'testimonials' && (
                <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Field label="Author Name" value={formData.author_name} onChange={(v: string) => setFormData((p: any) => ({...p, author_name: v}))} />
                        <Field label="Role / Title (EN default)" value={formData.author_role} onChange={(v: string) => setFormData((p: any) => ({...p, author_role: v}))} />
                    </div>
                    <Field label="Quote / Testimonial Text (EN default)" textarea value={formData.quote} onChange={(v: string) => setFormData((p: any) => ({...p, quote: v}))} />
                    <ImageField label="Author Avatar" value={formData.author_avatar} field="author_avatar" onChange={(v: string) => setFormData((p: any) => ({...p, author_avatar: v}))} onUpload={(e: React.ChangeEvent<HTMLInputElement>) => handleUpload(e, 'author_avatar')} isUploading={isUploading} />
                    <div className="flex gap-4 items-end">
                        <div className="flex-1">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest block mb-1">Rating (1–5 Stars)</label>
                            <div className="flex gap-2">
                                {[1,2,3,4,5].map(n => (
                                    <button key={n} type="button" onClick={() => setFormData((p: any) => ({...p, rating: n}))} className={`text-2xl transition-all ${n <= (formData.rating || 5) ? 'text-yellow-400' : 'text-gray-200 hover:text-yellow-300'}`}>★</button>
                                ))}
                            </div>
                        </div>
                        <div className="flex-1">
                            <Field label="Display Order" type="number" value={String(formData.display_order || 0)} onChange={(v: string) => setFormData((p: any) => ({...p, display_order: +v}))} />
                        </div>
                    </div>
                </div>
            )}

            {/* ─ Language translations (not gallery) ─ */}
            {module !== 'gallery' && (
                <div className="mt-6 border-t border-gray-100 pt-5">
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Globe size={12} /> Translations</p>
                    <div className="flex gap-2 mb-4">
                        {availableLangs.map(l => (
                            <button key={l} onClick={() => setActiveLang(l)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${activeLang === l ? 'bg-primary text-white border-primary' : 'border-gray-200 text-gray-500 hover:border-primary/50'}`}>
                                {LANG_META[l]?.flag} {LANG_META[l]?.label || l.toUpperCase()}
                            </button>
                        ))}
                    </div>
                    <AnimatePresence mode="wait">
                        <motion.div key={activeLang} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }} className="space-y-3">
                            {module === 'banners' && (<>
                                <Field label="Title" value={getTrans(activeLang, 'title')} onChange={(v: string) => setTrans(activeLang, 'title', v)} placeholder={formData.title || ''} />
                                <Field label="Subtitle" value={getTrans(activeLang, 'subtitle')} onChange={(v: string) => setTrans(activeLang, 'subtitle', v)} />
                                <Field label="Badge Text" value={getTrans(activeLang, 'badge_text')} onChange={(v: string) => setTrans(activeLang, 'badge_text', v)} />
                                <Field label="Description" textarea value={getTrans(activeLang, 'description')} onChange={(v: string) => setTrans(activeLang, 'description', v)} />
                                <Field label="CTA Button Text" value={getTrans(activeLang, 'cta_text')} onChange={(v: string) => setTrans(activeLang, 'cta_text', v)} />
                            </>)}
                            {module === 'videos' && (<>
                                <Field label="Title" value={getTrans(activeLang, 'title')} onChange={(v: string) => setTrans(activeLang, 'title', v)} placeholder={formData.title || ''} />
                                <Field label="Description" textarea value={getTrans(activeLang, 'description')} onChange={(v: string) => setTrans(activeLang, 'description', v)} />
                            </>)}
                            {module === 'testimonials' && (<>
                                <Field label="Quote / Testimonial Text" textarea value={getTrans(activeLang, 'quote')} onChange={(v: string) => setTrans(activeLang, 'quote', v)} placeholder="Enter the testimonial text in this language..." />
                                <Field label="Author Role (translated)" value={getTrans(activeLang, 'author_role')} onChange={(v: string) => setTrans(activeLang, 'author_role', v)} placeholder={formData.author_role || ''} />
                            </>)}
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}

            <div className="mt-6 flex justify-end gap-3">
                <button onClick={cancelEdit} className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-500 font-bold text-sm hover:bg-gray-50 transition-all">Cancel</button>
                <button onClick={handleSave} disabled={isSaving} className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-accent text-white font-bold text-sm uppercase tracking-widest shadow-premium hover:bg-accent-dark transition-all">
                    {isSaving ? <Activity size={16} className="animate-spin" /> : <Save size={16} />}
                    Save
                </button>
            </div>
        </motion.div>
    );

    // ── Item card
    const renderItem = (item: any) => (
        <motion.div
            key={item.id}
            layout
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className={`bg-surface border rounded-xl p-4 flex items-start gap-4 transition-all ${item.is_active ? 'border-black/5' : 'border-dashed border-gray-200 opacity-60'}`}
        >
            <GripVertical size={16} className="text-gray-300 mt-1 flex-shrink-0" />

            {/* Thumbnail */}
            {(module === 'gallery' || module === 'banners' || module === 'videos') && item.image_url || item.thumbnail_url ? (
                <img src={item.image_url || item.thumbnail_url} alt="" className="w-16 h-12 object-cover rounded-lg flex-shrink-0 bg-gray-100" />
            ) : module === 'testimonials' && item.author_avatar ? (
                <img src={item.author_avatar} alt="" className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-gray-100 border-2 border-white shadow" />
            ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/5 flex items-center justify-center flex-shrink-0">
                    <ImageIcon size={16} className="text-gray-300" />
                </div>
            )}

            <div className="flex-1 min-w-0">
                <div className="flex items-start gap-2 justify-between">
                    <div className="min-w-0">
                        <p className="font-bold text-sm text-primary truncate">
                            {item.title || item.caption || item.author_name || 'Untitled'}
                        </p>
                        <p className="text-xs text-gray-400 truncate">
                            {item.subtitle || item.description || item.quote || item.video_url || item.album || ''}
                        </p>
                        {module === 'testimonials' && (
                            <div className="flex gap-0.5 mt-1">
                                {[1,2,3,4,5].map(n => <span key={n} className={`text-sm ${n <= item.rating ? 'text-yellow-400' : 'text-gray-200'}`}>★</span>)}
                            </div>
                        )}
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button onClick={() => toggleActive(item)} title={item.is_active ? 'Active' : 'Inactive'} className="p-1.5 rounded-lg hover:bg-gray-100 transition-all">
                            {item.is_active ? <ToggleRight size={18} className="text-green-500" /> : <ToggleLeft size={18} className="text-gray-400" />}
                        </button>
                        <button onClick={() => startEdit(item)} className="p-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 text-primary transition-all"><Edit3 size={15} /></button>
                        <button 
                            type="button"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setConfirmModal({ isOpen: true, id: item.id });
                            }} 
                            className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-400 transition-all pointer-events-auto"
                        >
                            <Trash2 size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </motion.div>
    );

    return (
        <div className="space-y-4 relative">
            {/* Premium Confirmation Modal */}
            <PremiumConfirmModal
                isOpen={confirmModal.isOpen}
                title="Delete Item"
                message="Are you sure you want to delete this item? This action cannot be undone and will be removed from all languages."
                confirmLabel="Yes, Delete"
                cancelLabel="Keep it"
                variant="danger"
                onConfirm={() => {
                    if (confirmModal.id) handleDelete(confirmModal.id);
                }}
                onCancel={() => setConfirmModal({ isOpen: false, id: null })}
            />

            {/* Add new button */}
            {editingId === null && (
                <button onClick={startNew} className="w-full flex items-center justify-center gap-2 px-5 py-3 rounded-xl border-2 border-dashed border-primary/20 text-primary font-bold text-sm hover:border-primary/50 hover:bg-primary/5 transition-all">
                    <Plus size={18} /> Add New Item
                </button>
            )}

            {/* Form */}
            <AnimatePresence>{editingId !== null && renderForm()}</AnimatePresence>

            {/* Item list */}
            {items.length === 0 ? (
                <div className="py-12 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-gray-50/50">
                    <ImageIcon size={36} className="mx-auto mb-3 opacity-20" />
                    <p className="font-bold text-gray-500">No items yet</p>
                    <p className="text-sm mt-1">Click "Add New Item" to get started.</p>
                </div>
            ) : (
                <AnimatePresence>
                    {items.map(item => renderItem(item))}
                </AnimatePresence>
            )}
        </div>
    );
};

// ── Reusable field components ─────────────────────────────────────────────
const Field = ({ label, value, onChange, textarea = false, type = 'text', placeholder = '' }: any) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
        {textarea ? (
            <textarea value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder} rows={3}
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-primary resize-none text-sm" />
        ) : (
            <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} placeholder={placeholder}
                className="w-full px-4 py-3 rounded-xl border border-black/10 bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-primary text-sm" />
        )}
    </div>
);

/** Resolve /api/media/{id} URLs for preview within the admin (proxy-aware) */
function resolvePreviewUrl(url: string): string {
    if (!url) return '';
    // /api/media/* → served by backend via Vite proxy, use relative path
    if (url.startsWith('/api/media/')) return url;
    // data:... base64 previews → use as-is
    if (url.startsWith('data:')) return url;
    return url;
}

const ImageField = ({ label, value, onChange, onUpload, isUploading }: any) => (
    <div className="space-y-1">
        <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
        <div className="flex gap-3">
            {value && (
                <img
                    src={resolvePreviewUrl(value)}
                    alt=""
                    className="w-24 h-16 object-cover rounded-lg border border-gray-100 flex-shrink-0 bg-gray-50"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                />
            )}
            <div className="flex-1 space-y-2">
                <div className="border-2 border-dashed border-gray-200 rounded-xl p-3 hover:border-accent transition-colors relative cursor-pointer group text-center text-xs overflow-hidden">
                    <input type="file" accept="image/*" onChange={onUpload} disabled={isUploading} className="absolute inset-0 opacity-0 cursor-pointer w-full h-full z-10" />
                    {isUploading ? <Activity size={14} className="inline animate-spin text-accent" /> : <UploadCloud size={14} className="inline text-gray-400 mr-1" />}
                    <span className="text-gray-500">{isUploading ? 'Uploading & optimizing...' : 'Click to upload (auto-WebP)'}</span>
                </div>
                <input type="text" value={value || ''} onChange={e => onChange(e.target.value)} placeholder="Or paste external URL..."
                    className="w-full px-3 py-2 rounded-lg border border-black/10 outline-none text-xs font-medium text-primary focus:border-primary transition-all" />
            </div>
        </div>
    </div>
);

export default LandingModulesCRUD;
