import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutTemplate, Image as ImageIcon, AlignLeft, BookOpen, Images, Video,
    MessageSquare, PhoneCall, LayoutPanelTop, Search, Globe, Settings as SettingsIcon,
    Save, Activity, UploadCloud, CheckCircle, AlertCircle, Circle
} from 'lucide-react';
import { type NotificationType } from './components/Notification';
import { optimizeImageFile } from './utils/imageOptimizer';
import LandingModulesCRUD from './components/LandingModulesCRUD';

interface AdminLandingCMSProps {
    token: string;
    onNotify: (msg: string, type: NotificationType) => void;
    onUnauthorized: () => void;
}

// All sections
const SECTIONS = [
    { id: 'header',       label: 'Header & Navbar',   icon: <LayoutPanelTop size={18} />, translatable: true },
    { id: 'hero',         label: 'Hero Principal',     icon: <ImageIcon size={18} />,      translatable: true },
    { id: 'about',        label: 'About / Nosotros',   icon: <AlignLeft size={18} />,      translatable: true },
    { id: 'courses',      label: 'Cursos Destacados',  icon: <BookOpen size={18} />,       translatable: true },
    { id: 'footer',       label: 'Footer',             icon: <LayoutTemplate size={18} />, translatable: true },
    { id: 'seo',          label: 'SEO & Metadata',     icon: <Search size={18} />,         translatable: true },
    { id: 'testimonials', label: 'Testimonios',        icon: <MessageSquare size={18} />,  translatable: true },
    { id: 'gallery',      label: 'Galería',            icon: <Images size={18} />,         translatable: true },
    { id: 'videos',       label: 'Videos',             icon: <Video size={18} />,          translatable: true },
    { id: 'contact',      label: 'Contacto & Mapa',    icon: <PhoneCall size={18} />,      translatable: false },
    { id: 'banners',      label: 'Banners Promo',      icon: <ImageIcon size={18} />,      translatable: false },
    { id: 'languages',    label: 'Idiomas',            icon: <Globe size={18} />,          translatable: false },
    { id: 'visuals',      label: 'Config. Visual',     icon: <SettingsIcon size={18} />,   translatable: false },
];

// Key fields per section (used for completeness calculation)
const SECTION_KEY_FIELDS: Record<string, string[]> = {
    header:  ['institutionName', 'ctaText', 'nav_about', 'nav_courses', 'nav_gallery', 'nav_videos', 'nav_testimonials'],
    hero:    ['badgeText', 'title', 'subtitle', 'primaryCta', 'secondaryCta'],
    about:   ['title', 'mission', 'vision', 'stat1Label', 'stat2Label', 'stat3Label', 'stat4Label'],
    courses: ['sectionSubtitle', 'sectionTitle', 'learnMore', 'viewAll', 'course1Title', 'course1Desc', 'course2Title', 'course2Desc', 'course3Title', 'course3Desc'],
    footer:  ['description', 'platformTitle', 'legalTitle', 'link_courses', 'link_library', 'link_privacy', 'link_terms', 'copyright'],
    seo:     ['metaTitle', 'metaDescription', 'keywords'],
    gallery: ['sectionTitle', 'sectionSubtitle'],
    videos:  ['sectionTitle', 'sectionSubtitle'],
    testimonials: ['sectionTitle', 'sectionSubtitle'],
};

const LANG_META: Record<string, { label: string; flag: string }> = {
    en: { label: 'English', flag: '🇺🇸' },
    es: { label: 'Español', flag: '🇪🇸' },
    pt: { label: 'Português', flag: '🇧🇷' },
    zh: { label: '中文 (Chinese)', flag: '🇨🇳' },
    ja: { label: '日本語 (Japanese)', flag: '🇯🇵' },
    fr: { label: 'Français (French)', flag: '🇫🇷' },
    it: { label: 'Italiano (Italian)', flag: '🇮🇹' },
    ht: { label: 'Kreyòl (Haitian)', flag: '🇭🇹' },
};

const AdminLandingCMS = ({ token, onNotify, onUnauthorized }: AdminLandingCMSProps) => {
    const [activeSection, setActiveSection] = useState('hero');
    const [activeLang, setActiveLang] = useState('en');
    const [availableLangs, setAvailableLangs] = useState<string[]>(['en', 'es', 'pt']);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);

    // translations[sectionKey][langCode][fieldKey] = value
    const [translations, setTranslations] = useState<any>({});
    // draftSettings: structural / non-translatable config (images, toggles)
    const [draftSettings, setDraftSettings] = useState<any>({});
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    // ── Load available languages
    useEffect(() => {
        fetch('/api/i18n/locales', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                if (r.status === 401) onUnauthorized();
                return r.json();
            })
            .then(data => {
                const langs = Object.keys(data || {}).filter(k => k !== 'en');
                setAvailableLangs(['en', ...langs]);
            })
            .catch(() => {/* keep defaults */});
    }, [token]);

    // ── Load translations for admin
    const loadTranslations = useCallback(() => {
        fetch('/api/landing/translations', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                if (r.status === 401) onUnauthorized();
                return r.json();
            })
            .then(data => setTranslations(data || {}))
            .catch(err => console.error('Failed to load translations:', err));
    }, [token, onUnauthorized]);

    // ── Load base (structural) config
    const loadBase = useCallback(() => {
        fetch('/api/landing', { headers: { Authorization: `Bearer ${token}` } })
            .then(r => {
                if (r.status === 401) onUnauthorized();
                return r.json();
            })
            .then(data => {
                if (data.landing_cms_config) {
                    setDraftSettings(JSON.parse(data.landing_cms_config));
                }
                setHasUnsavedChanges(false);
            })
            .catch(err => console.error('Error fetching settings:', err));
    }, [token, onUnauthorized]);

    useEffect(() => { loadBase(); loadTranslations(); }, [loadBase, loadTranslations]);

    // ── Get / set translation field
    const getTransField = (section: string, lang: string, field: string): string => {
        return translations?.[section]?.[lang]?.[field] ?? '';
    };

    const setTransField = (section: string, lang: string, field: string, value: string) => {
        setTranslations((prev: any) => ({
            ...prev,
            [section]: {
                ...(prev[section] || {}),
                [lang]: {
                    ...(prev[section]?.[lang] || {}),
                    [field]: value,
                },
            },
        }));
        setHasUnsavedChanges(true);
    };

    // ── Completeness indicator
    const getCompleteness = (section: string, lang: string): 'full' | 'partial' | 'empty' => {
        const keys = SECTION_KEY_FIELDS[section] || [];
        if (keys.length === 0) return 'full';
        const filled = keys.filter(k => getTransField(section, lang, k).trim() !== '').length;
        if (filled === 0) return 'empty';
        if (filled === keys.length) return 'full';
        return 'partial';
    };

    // ── Save translations for active section + active lang
    const handleSaveTranslation = async () => {
        setIsSaving(true);
        try {
            const fields = translations?.[activeSection]?.[activeLang] || {};
            const res = await fetch('/api/landing/translations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ sectionKey: activeSection, languageCode: activeLang, fields })
            });
            if (res.ok) {
                onNotify(`${activeSection} – ${activeLang.toUpperCase()} translations saved!`, 'success');
                setHasUnsavedChanges(false);
            } else {
                onNotify('Failed to save translations.', 'error');
            }
        } catch (err) {
            console.error(err);
            onNotify('Connection error while saving.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    // ── Save structural (non-translation) config
    const handleSaveStructural = async () => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/landing', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ settings: { landing_cms_config: JSON.stringify(draftSettings) } })
            });
            if (res.ok) {
                onNotify('Landing Page structural config saved!', 'success');
                setHasUnsavedChanges(false);
            } else {
                onNotify('Failed to save settings.', 'error');
            }
        } catch (err) {
            onNotify('Connection error while saving.', 'error');
        } finally {
            setIsSaving(false);
        }
    };

    const handleStructuralChange = (sectionId: string, field: string, value: any) => {
        setDraftSettings((prev: any) => ({ ...prev, [sectionId]: { ...(prev[sectionId] || {}), [field]: value } }));
        setHasUnsavedChanges(true);
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, sectionId: string, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            setIsUploading(true);
            const isVideo = file.type.startsWith('video/');
            onNotify(isVideo ? 'Optimizing video (Super Light)...' : 'Optimizing image...', 'info');

            let payload: any;

            if (isVideo) {
                // For videos, we send the raw base64 and let the backend optimize it
                const reader = new FileReader();
                const base64: string = await new Promise((resolve) => {
                    reader.onload = (ev) => resolve(ev.target?.result as string);
                    reader.readAsDataURL(file);
                });
                
                payload = { 
                    module: 'landing', 
                    entity_type: field, 
                    file_name: file.name, 
                    mime_type: file.type, 
                    base64_content: base64, 
                    size: file.size 
                };
            } else {
                const optimized = await optimizeImageFile(file, 1920, 1080, 0.85);
                payload = { 
                    module: 'landing', 
                    entity_type: field, 
                    file_name: file.name, 
                    mime_type: optimized.mimeType, 
                    base64_content: optimized.base64, 
                    size: optimized.size, 
                    width: optimized.width, 
                    height: optimized.height 
                };
            }

            const res = await fetch('/api/media/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(payload)
            });

            if (!res.ok) throw new Error((await res.json()).error || 'Upload failed');
            const data = await res.json();
            handleStructuralChange(sectionId, field, `/api/media/${data.asset.id}`);
            onNotify(isVideo ? 'Video optimized & uploaded!' : 'Image uploaded!', 'success');
        } catch (err: any) {
            onNotify(err.message || 'Upload error', 'error');
        } finally {
            setIsUploading(false);
            if (e.target) e.target.value = '';
        }
    };

    // UI helpers
    const renderToggle = (sectionId: string, field: string, label: string) => {
        const val = draftSettings[sectionId]?.[field] ?? true;
        return (
            <div className="flex items-center justify-between p-4 border border-gray-100 rounded-xl bg-gray-50/50">
                <span className="font-bold text-sm text-gray-700">{label}</span>
                <button onClick={() => handleStructuralChange(sectionId, field, !val)} className={`w-12 h-6 rounded-full p-1 transition-colors ${val ? 'bg-green-500' : 'bg-gray-300'}`}>
                    <div className={`w-4 h-4 rounded-full bg-white shadow-sm transform transition-transform ${val ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>
        );
    };

    const renderStructuralInput = (sectionId: string, field: string, label: string, type = 'text', placeholder = '') => {
        const val = draftSettings[sectionId]?.[field] || '';
        return (
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
                {type === 'textarea' ? (
                    <textarea value={val} onChange={e => handleStructuralChange(sectionId, field, e.target.value)} placeholder={placeholder} rows={3} className="w-full px-4 py-3 rounded-xl border border-black/10 bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-primary resize-none" />
                ) : (
                    <input type={type} value={val} onChange={e => handleStructuralChange(sectionId, field, e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-black/10 bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-primary" />
                )}
            </div>
        );
    };

    // Translatable field input
    const renderTransInput = (field: string, label: string, type: 'text' | 'textarea' = 'text', placeholder = '') => {
        const val = getTransField(activeSection, activeLang, field);
        return (
            <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
                {type === 'textarea' ? (
                    <textarea value={val} rows={3} onChange={e => setTransField(activeSection, activeLang, field, e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-black/10 bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-primary resize-none" />
                ) : (
                    <input type={type} value={val} onChange={e => setTransField(activeSection, activeLang, field, e.target.value)} placeholder={placeholder} className="w-full px-4 py-3 rounded-xl border border-black/10 bg-surface focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none font-medium text-primary" />
                )}
            </div>
        );
    };

    const renderImageUpload = (sectionId: string, field: string, label: string) => {
        const val = draftSettings[sectionId]?.[field] || '';
        const isVideo = val.toLowerCase().includes('video') || val.includes('.mp4');

        return (
            <div className="space-y-1">
                <div className="flex justify-between items-center">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</label>
                    {val && (
                        <button onClick={() => handleStructuralChange(sectionId, field, '')} className="text-[9px] font-bold text-red-500 hover:underline uppercase tracking-tighter">Remove</button>
                    )}
                </div>
                <div className="border-2 border-dashed border-gray-200 rounded-2xl p-6 text-center hover:border-accent transition-colors relative cursor-pointer group bg-gray-50 overflow-hidden">
                    <input type="file" accept="image/*,video/*" onChange={(e) => handleFileUpload(e, sectionId, field)} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" disabled={isUploading} />
                    
                    {val ? (
                        <div className="relative z-0 w-full aspect-video bg-black rounded-lg overflow-hidden mb-4 border border-gray-200 shadow-inner">
                            {isVideo ? (
                                <video src={val} className="w-full h-full object-cover" controls muted loop />
                            ) : (
                                <img src={val} className="w-full h-full object-cover" alt="Preview" />
                            )}
                        </div>
                    ) : (
                        <div className="w-12 h-12 bg-white rounded-xl shadow-sm border border-gray-100 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                            {isUploading ? <Activity className="w-6 h-6 text-accent animate-spin" /> : <UploadCloud className="w-6 h-6 text-gray-400 group-hover:text-accent" />}
                        </div>
                    )}
                    
                    <p className="text-sm font-bold text-gray-600 mb-1">
                        {isUploading ? 'Optimizing Media...' : val ? 'Change Media' : 'Click to upload'}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium tracking-wide">JPG, PNG, WebP or MP4 up to 50MB</p>
                    
                    <div className="relative z-20 mt-4">
                        <input 
                            type="text" 
                            value={val} 
                            onClick={(e) => e.stopPropagation()} 
                            onChange={e => handleStructuralChange(sectionId, field, e.target.value)} 
                            className="w-full px-3 py-2 text-xs border rounded-lg bg-white bg-opacity-90 focus:ring-2 focus:ring-accent/20 outline-none" 
                            placeholder="Or enter external URL..." 
                        />
                    </div>
                </div>
            </div>
        );
    };

    const renderListPrompt = (sectionName: string, description: string) => (
        <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 text-center text-gray-400 bg-gray-50/50">
            <LayoutTemplate className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p className="text-lg font-bold text-gray-600 mb-2">Manage {sectionName}</p>
            <p className="text-sm">{description}</p>
        </div>
    );

    // ── Language tab bar (shown for translatable sections)
    const currentSection = SECTIONS.find(s => s.id === activeSection);
    const isTranslatable = currentSection?.translatable ?? false;

    const renderLangTabs = () => (
        <div className="flex items-center gap-2 flex-wrap mb-6">
            {availableLangs.map(lang => {
                const meta = LANG_META[lang] || { label: lang.toUpperCase(), flag: '🌐' };
                const completeness = getCompleteness(activeSection, lang);
                const isActive = activeLang === lang;
                return (
                    <button
                        key={lang}
                        onClick={() => setActiveLang(lang)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm border transition-all ${
                            isActive
                                ? 'bg-primary text-white border-primary shadow-md'
                                : 'bg-surface border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary'
                        }`}
                    >
                        <span className="text-base">{meta.flag}</span>
                        <span>{meta.label}</span>
                        {/* Completeness dot */}
                        {completeness === 'full'    && <CheckCircle  size={14} className={isActive ? 'text-green-300' : 'text-green-500'} />}
                        {completeness === 'partial' && <AlertCircle  size={14} className={isActive ? 'text-yellow-200' : 'text-yellow-500'} />}
                        {completeness === 'empty'   && <Circle       size={14} className={isActive ? 'text-white/40'  : 'text-gray-300'} />}
                    </button>
                );
            })}
            <span className="ml-2 text-[10px] font-bold uppercase tracking-widest text-gray-400 hidden sm:inline">
                ● = complete &nbsp;⚠ = partial &nbsp;○ = empty
            </span>
        </div>
    );

    // ── Section field editors (translatable)
    const renderTranslatableEditor = () => {
        switch (activeSection) {
            case 'header':
                return (
                    <div className="space-y-5">
                        {renderTransInput('institutionName', 'Institution Name', 'text', 'TTESOL Academy')}
                        {renderTransInput('ctaText', 'Login Button Text', 'text', 'Platform Login')}
                        <div className="grid grid-cols-3 gap-4">
                            {renderTransInput('nav_about', 'Nav: About')}
                            {renderTransInput('nav_courses', 'Nav: Courses')}
                            {renderTransInput('nav_gallery', 'Nav: Gallery')}
                            {renderTransInput('nav_videos', 'Nav: Videos')}
                            {renderTransInput('nav_testimonials', 'Nav: Testimonials')}
                        </div>
                        <hr className="border-gray-100" />
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Structural (shared across all languages)</p>
                        {renderImageUpload('header', 'logoUrl', 'Logo Image')}
                    </div>
                );
            case 'hero':
                return (
                    <div className="space-y-5">
                        {renderTransInput('badgeText', 'Badge / Eyebrow Text', 'text', 'Excellence in English Education')}
                        {renderTransInput('title', 'Main Headline', 'text', 'Master the Language, Shape Your Future.')}
                        {renderTransInput('subtitle', 'Sub-headline', 'textarea', 'TTESOL Academy offers...')}
                        <div className="grid grid-cols-2 gap-4">
                            {renderTransInput('primaryCta', 'Primary Button')}
                            {renderTransInput('secondaryCta', 'Secondary Button')}
                        </div>
                        <hr className="border-gray-100" />
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Structural</p>
                        {renderImageUpload('hero', 'backgroundImage', 'Background Image')}
                    </div>
                );
            case 'about':
                return (
                    <div className="space-y-5">
                        {renderTransInput('title', 'Section Title', 'text', 'About TTESOL')}
                        {renderTransInput('mission', 'Mission Statement', 'textarea')}
                        {renderTransInput('vision', 'Vision Statement', 'textarea')}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {renderTransInput('stat1Label', 'Stat 1 Label')}
                            {renderTransInput('stat2Label', 'Stat 2 Label')}
                            {renderTransInput('stat3Label', 'Stat 3 Label')}
                            {renderTransInput('stat4Label', 'Stat 4 Label')}
                        </div>
                        <hr className="border-gray-100" />
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Stat Values (same for all languages)</p>
                        <div className="grid grid-cols-4 gap-4">
                            {renderStructuralInput('about', 'stat1', 'Stat 1 Value', 'text', '10k+')}
                            {renderStructuralInput('about', 'stat2', 'Stat 2 Value', 'text', '50+')}
                            {renderStructuralInput('about', 'stat3', 'Stat 3 Value', 'text', '98%')}
                            {renderStructuralInput('about', 'stat4', 'Stat 4 Value', 'text', '4.9')}
                        </div>
                    </div>
                );
            case 'courses':
                return (
                    <div className="space-y-5">
                        <div className="grid grid-cols-2 gap-4">
                            {renderTransInput('sectionSubtitle', 'Section Subtitle')}
                            {renderTransInput('sectionTitle', 'Section Title')}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            {renderTransInput('learnMore', 'Learn More Button')}
                            {renderTransInput('viewAll', 'View Catalog Button')}
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest border-t pt-4">Course Cards</p>
                        {[1, 2, 3].map(n => (
                            <div key={n} className="bg-surface-low rounded-xl p-4 space-y-3">
                                <p className="text-xs font-black text-primary uppercase tracking-widest mb-1">Course {n}</p>
                                <div className="grid grid-cols-2 gap-3">
                                    {renderTransInput(`course${n}Title`, 'Title')}
                                    {renderTransInput(`course${n}Level`, 'Level Badge')}
                                </div>
                                {renderTransInput(`course${n}Desc`, 'Short Description', 'textarea')}
                            </div>
                        ))}
                    </div>
                );
            case 'footer':
                return (
                    <div className="space-y-5">
                        {renderTransInput('description', 'Footer Description', 'textarea')}
                        <div className="grid grid-cols-2 gap-4">
                            {renderTransInput('platformTitle', 'Platform Column Title')}
                            {renderTransInput('legalTitle', 'Legal Column Title')}
                        </div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-widest border-t pt-4">Links</p>
                        <div className="grid grid-cols-2 gap-3">
                            {renderTransInput('link_courses', 'Courses Link')}
                            {renderTransInput('link_library', 'Library Link')}
                            {renderTransInput('link_certification', 'Certification Link')}
                            {renderTransInput('link_support', 'Support Link')}
                            {renderTransInput('link_privacy', 'Privacy Link')}
                            {renderTransInput('link_terms', 'Terms Link')}
                        </div>
                        {renderTransInput('copyright', 'Copyright Text')}
                        <hr className="border-gray-100" />
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">Social Links (shared)</p>
                        <div className="grid grid-cols-2 gap-4">
                            {renderStructuralInput('footer', 'facebookUrl', 'Facebook URL')}
                            {renderStructuralInput('footer', 'instagramUrl', 'Instagram URL')}
                            {renderStructuralInput('footer', 'linkedinUrl', 'LinkedIn URL')}
                            {renderStructuralInput('footer', 'twitterUrl', 'Twitter URL')}
                        </div>
                    </div>
                );
            case 'gallery':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {renderTransInput('sectionSubtitle', 'Section Subtitle')}
                            {renderTransInput('sectionTitle', 'Section Title')}
                        </div>
                        <hr className="border-gray-100" />
                        <p className="text-sm text-gray-500 mb-4">Upload gallery images. You can group them by album/category.</p>
                        <LandingModulesCRUD module="gallery" token={token} onNotify={onNotify} availableLangs={availableLangs} />
                    </div>
                );
            case 'videos':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {renderTransInput('sectionSubtitle', 'Section Subtitle')}
                            {renderTransInput('sectionTitle', 'Section Title')}
                        </div>
                        <hr className="border-gray-100" />
                        <p className="text-sm text-gray-500 mb-4">Add featured videos. Paste a YouTube embed URL or direct video link.</p>
                        <LandingModulesCRUD module="videos" token={token} onNotify={onNotify} availableLangs={availableLangs} />
                    </div>
                );
            case 'testimonials':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            {renderTransInput('sectionSubtitle', 'Section Subtitle')}
                            {renderTransInput('sectionTitle', 'Section Title')}
                        </div>
                        <hr className="border-gray-100" />
                        <p className="text-sm text-gray-500 mb-4">Add student testimonials. Each item can have its quote translated per language.</p>
                        <LandingModulesCRUD module="testimonials" token={token} onNotify={onNotify} availableLangs={availableLangs} />
                    </div>
                );
            case 'seo':
                return (
                    <div className="space-y-5">
                        {renderTransInput('metaTitle', 'Meta Title', 'text', 'TTESOL Academy - Premium English Education')}
                        {renderTransInput('metaDescription', 'Meta Description', 'textarea')}
                        {renderTransInput('keywords', 'Meta Keywords')}
                        <hr className="border-gray-100" />
                        <p className="text-xs text-gray-400 font-bold uppercase tracking-widest">OG Image (shared)</p>
                        {renderImageUpload('seo', 'ogImage', 'OG Social Share Image')}
                    </div>
                );
            default:
                return null;
        }
    };

    const renderEditorContent = () => {
        const title = SECTIONS.find(s => s.id === activeSection)?.label || activeSection;
        const isTransSection = isTranslatable;

        const getFields = () => {
            if (isTransSection) {
                return (
                    <div>
                        {renderLangTabs()}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={`${activeSection}-${activeLang}`}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -6 }}
                                transition={{ duration: 0.2 }}
                            >
                                {renderTranslatableEditor()}
                            </motion.div>
                        </AnimatePresence>
                    </div>
                );
            }

            // Non-translatable sections
            switch (activeSection) {
                case 'contact':
                    return (
                        <div className="space-y-6">
                            {renderToggle('contact', 'enabled', 'Show Contact Section')}
                            <div className="grid grid-cols-2 gap-6">
                                {renderStructuralInput('contact', 'email', 'Contact Email')}
                                {renderStructuralInput('contact', 'phone', 'Phone Number')}
                            </div>
                            {renderStructuralInput('contact', 'address', 'Physical Address')}
                            {renderStructuralInput('contact', 'mapUrl', 'Google Maps Embed URL')}
                            {renderToggle('contact', 'showForm', 'Show Contact Form')}
                        </div>
                    );
                case 'visuals':
                    return (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-6">
                                {renderStructuralInput('visuals', 'colorPrimary', 'Primary Color', 'color')}
                                {renderStructuralInput('visuals', 'colorAccent', 'Accent Color', 'color')}
                            </div>
                            {renderImageUpload('visuals', 'faviconUrl', 'Favicon')}
                        </div>
                    );
                case 'languages':
                    return (
                        <div className="space-y-6">
                            {renderToggle('languages', 'enabled', 'Enable Language Switcher')}
                            {renderStructuralInput('languages', 'defaultLanguage', 'Default Language Code', 'text', 'en')}
                            <p className="text-sm text-gray-500">Languages are auto-detected from the Translations module.</p>
                        </div>
                    );
                case 'banners':
                    return (
                        <div>
                            <p className="text-sm text-gray-500 mb-4">Create promotional banners shown on the landing page.</p>
                            <LandingModulesCRUD module="banners" token={token} onNotify={onNotify} availableLangs={availableLangs} />
                        </div>
                    );
                default:
                    return renderListPrompt(title, `Manage ${title} items here. List editor coming soon.`);
            }
        };

        return (
            <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className="bg-surface rounded-2xl border border-black/5 shadow-premium overflow-hidden"
            >
                <div className="p-6 border-b border-black/5 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-surface-low">
                    <div>
                        <h2 className="text-xl font-serif font-bold text-primary">{title} Editor</h2>
                        {isTransSection && (
                            <p className="text-xs text-gray-400 mt-0.5">Editing <span className="font-bold text-primary">{LANG_META[activeLang]?.flag} {LANG_META[activeLang]?.label || activeLang.toUpperCase()}</span> translations</p>
                        )}
                    </div>
                    <button
                        onClick={isTransSection ? handleSaveTranslation : handleSaveStructural}
                        disabled={isSaving || !hasUnsavedChanges}
                        className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm uppercase tracking-widest transition-all ${
                            hasUnsavedChanges
                                ? 'bg-accent hover:bg-accent-dark text-white shadow-premium'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                        }`}
                    >
                        {isSaving ? <Activity className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Changes
                    </button>
                </div>
                <div className="p-6 md:p-8">
                    {getFields()}
                </div>
            </motion.div>
        );
    };

    return (
        <div className="flex flex-col h-full">
            {/* CMS Topbar */}
            <div className="flex justify-between items-center mb-6 bg-surface-low p-5 rounded-2xl">
                <div>
                    <h1 className="text-2xl md:text-3xl font-serif font-bold text-primary tracking-tight">Landing Page CMS</h1>
                    <p className="text-sm text-gray-500 mt-1">Manage all public content in multiple languages without touching backend code.</p>
                </div>
                {hasUnsavedChanges && (
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest animate-pulse">Unsaved Changes</span>
                )}
            </div>

            {/* CMS Body */}
            <div className="flex flex-col lg:flex-row gap-8 flex-1 min-h-0">
                {/* Left Nav */}
                <div className="w-full lg:w-64 flex-shrink-0 bg-surface rounded-2xl border border-black/5 shadow-premium overflow-hidden flex flex-col h-[300px] lg:h-auto">
                    <div className="p-4 bg-surface-dark border-b border-black/5">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 ml-2">Content Modules</span>
                    </div>
                    <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
                        {SECTIONS.map((section) => {
                            const isActive = activeSection === section.id;
                            return (
                                <button
                                    key={section.id}
                                    onClick={() => setActiveSection(section.id)}
                                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                                        isActive
                                            ? 'bg-primary/5 text-primary font-bold shadow-sm border border-primary/10'
                                            : 'text-gray-500 hover:bg-surface-low hover:text-primary font-medium border border-transparent'
                                    }`}
                                >
                                    <span className={isActive ? 'text-accent' : 'text-gray-400'}>{section.icon}</span>
                                    <span className="text-sm flex-1">{section.label}</span>
                                    {section.translatable && (
                                        <Globe size={10} className={isActive ? 'text-accent/70' : 'text-gray-300'} />
                                    )}
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Right Editor */}
                <div className="flex-1 overflow-y-auto pb-20 lg:pb-0">
                    {renderEditorContent()}
                </div>
            </div>
        </div>
    );
};

export default AdminLandingCMS;
