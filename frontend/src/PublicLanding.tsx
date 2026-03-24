import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, Users, Globe, PlayCircle, Star, ChevronRight, Quote, X, Film, Images, Menu } from 'lucide-react';
import bgHero from './assets/final-login-bg.jpg';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';
import bgBanner from './assets/graduation_banner_bg.png';

interface PublicLandingProps {
    onLoginClick: () => void;
}

// ─── Helper: YouTube URL → embed URL ──────────────────────────────────────
function getVideoType(url: string): 'youtube' | 'direct' | 'unknown' {
    if (!url) return 'unknown';
    if (url.includes('youtube.com') || url.includes('youtu.be') || url.includes('youtube-nocookie.com')) return 'youtube';
    if (url.startsWith('data:video/') || url.match(/\.(mp4|webm|ogg)$/i) || url.startsWith('/api/media/')) return 'direct';
    return 'unknown';
}

function toEmbedUrl(url: string): string {
    if (!url) return '';
    const match = url.match(/(?:youtu\.be\/|v=|v\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    if (match) return `https://www.youtube-nocookie.com/embed/${match[1]}?autoplay=1&rel=0`;
    return url;
}

const PublicLanding = ({ onLoginClick }: PublicLandingProps) => {
    const { t, i18n } = useTranslation();
    const [cms, setCms] = useState<any>(null);
    const [modules, setModules] = useState<{ banners: any[]; gallery: any[]; videos: any[]; testimonials: any[] }>({
        banners: [], gallery: [], videos: [], testimonials: []
    });
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [activeVideo, setActiveVideo] = useState<any | null>(null);
    const [showPromo, setShowPromo] = useState(false);
    const [activeBannerIdx, setActiveBannerIdx] = useState(0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    const fetchAll = useCallback((lang: string) => {
        const langCode = lang.split('-')[0].toLowerCase();
        fetch(`/api/landing?lang=${langCode}`)
            .then(r => r.json())
            .then(data => { if (data.landing_cms_config) setCms(JSON.parse(data.landing_cms_config)); })
            .catch(err => console.error('CMS error', err));

        fetch(`/api/landing-modules?lang=${langCode}`)
            .then(r => r.json())
            .then(data => setModules({ banners: data.banners || [], gallery: data.gallery || [], videos: data.videos || [], testimonials: data.testimonials || [] }))
            .catch(err => console.error('Modules error', err));
    }, []);

    useEffect(() => { fetchAll(i18n.language || 'en'); }, []);
    useEffect(() => { fetchAll(i18n.language || 'en'); }, [i18n.language, fetchAll]);

    useEffect(() => {
        if (modules.banners.length > 0) {
            setShowPromo(true);
            setActiveBannerIdx(0);
        }
    }, [modules.banners]);

    useEffect(() => {
        if (!showPromo || modules.banners.length <= 1) return;
        const timer = setInterval(() => {
            setActiveBannerIdx(prev => (prev + 1) % modules.banners.length);
        }, 30000); // 30 seconds as requested
        return () => clearInterval(timer);
    }, [showPromo, modules.banners.length]);


    const h = cms?.header   || {};
    const hero = cms?.hero    || {};
    const about = cms?.about  || {};
    const courses = cms?.courses || {};
    const footer = cms?.footer || {};
    const seo = cms?.seo || {};
    const gallery = cms?.gallery || {};
    const videos = cms?.videos || {};
    const testimonials = cms?.testimonials || {};

    const c = (section: any, field: string, fallback = '') =>
        (section && section[field] != null && section[field] !== '') ? section[field] : fallback;

    useEffect(() => {
        if (seo.metaTitle) document.title = seo.metaTitle;
        const metaDesc = document.querySelector('meta[name="description"]');
        if (metaDesc && seo.metaDescription) metaDesc.setAttribute('content', seo.metaDescription);
    }, [seo]);

    const courseCards = [
        { icon: <Globe className="w-6 h-6" />, title: c(courses, 'course1Title', 'Business English Elite'), level: c(courses, 'course1Level', 'Advanced'), desc: c(courses, 'course1Desc', 'Master corporate communication and negotiation skills.') },
        { icon: <BookOpen className="w-6 h-6" />, title: c(courses, 'course2Title', 'IELTS Preparation'), level: c(courses, 'course2Level', 'Intermediate'), desc: c(courses, 'course2Desc', 'Comprehensive strategies to achieve your target band score.') },
        { icon: <Users className="w-6 h-6" />, title: c(courses, 'course3Title', 'Conversational Mastery'), level: c(courses, 'course3Level', 'All Levels'), desc: c(courses, 'course3Desc', 'Build fluency and confidence in daily social interactions.') }
    ];

    return (
        <div className="min-h-screen bg-surface font-sans text-primary overflow-x-hidden selection:bg-accent selection:text-white">

            {/* ── Navigation ────────────────────────────────────────────── */}
            <nav className="fixed top-0 left-0 w-full z-50 bg-primary/95 backdrop-blur-xl border-b border-white/10 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-1 sm:gap-3 flex-shrink-0 lg:flex-1">
                        <div className="flex items-center justify-center pr-1 shrink-0">
                            <img src={c(h, 'logoUrl', '/Logo.png')} alt="TTESOL Logo" className="h-7 sm:h-10 md:h-12 w-auto object-contain drop-shadow-lg" />
                        </div>
                        <span className="font-serif font-bold text-[14px] leading-none sm:text-xl md:text-2xl text-white tracking-tight shrink min-w-0 max-w-[140px] sm:max-w-none break-words">{c(h, 'institutionName', 'TTESOL Academy')}</span>
                    </div>
                    <div className="hidden lg:flex items-center gap-4 xl:gap-8 text-sm font-bold tracking-wide text-gray-300">
                        <a href="#about" className="hover:text-white transition-colors">{c(h, 'nav_about', 'About Us')}</a>
                        {modules.gallery.length > 0 && <a href="#gallery" className="hover:text-white transition-colors">{c(h, 'nav_gallery', 'Gallery')}</a>}
                        {modules.videos.length > 0 && <a href="#videos" className="hover:text-white transition-colors">{c(h, 'nav_videos', 'Videos')}</a>}
                        <a href="#courses" className="hover:text-white transition-colors">{c(h, 'nav_courses', 'Courses')}</a>
                        <a href="#testimonials" className="hover:text-white transition-colors">{c(h, 'nav_testimonials', 'Testimonials')}</a>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-4 flex-shrink-0">
                        <LanguageSwitcher direction="down" />
                        <button onClick={onLoginClick} data-testid="login-cta-nav" aria-label="Platform Login" className="bg-accent hover:bg-accent-dark text-white px-2 sm:px-6 py-1.5 sm:py-2.5 rounded-[10px] sm:rounded-xl font-bold text-[10px] sm:text-sm uppercase tracking-wider shadow-premium hover:shadow-premium-hover transition-all flex items-center gap-1 sm:gap-2 group min-h-[32px] sm:min-h-[40px]">
                            <span className="hidden sm:inline">{c(h, 'ctaText', 'Platform Login')}</span>
                            <span className="sm:hidden">Login</span>
                            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button 
                            className="lg:hidden p-1 text-gray-300 hover:text-white hover:bg-white/10 rounded-lg transition-colors shrink-0"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle mobile menu"
                        >
                            {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                <AnimatePresence>
                    {isMobileMenuOpen && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="md:hidden overflow-hidden bg-primary shadow-xl border-b border-white/10"
                        >
                            <div className="px-4 py-4 flex flex-col gap-4 text-sm font-bold tracking-wide text-gray-300">
                                <a href="#about" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors">{c(h, 'nav_about', 'About Us')}</a>
                                {modules.gallery.length > 0 && <a href="#gallery" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors">{c(h, 'nav_gallery', 'Gallery')}</a>}
                                {modules.videos.length > 0 && <a href="#videos" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors">{c(h, 'nav_videos', 'Videos')}</a>}
                                <a href="#courses" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors">{c(h, 'nav_courses', 'Courses')}</a>
                                <a href="#testimonials" onClick={() => setIsMobileMenuOpen(false)} className="px-4 py-3 rounded-xl hover:bg-white/5 hover:text-white transition-colors">{c(h, 'nav_testimonials', 'Testimonials')}</a>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </nav>

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-primary px-6">
                {/* Background Shapes */}
                <div className="absolute inset-0 z-0 overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-secondary/5 to-transparent" />
                    <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/10 rounded-full blur-[120px]" />
                </div>

                <div className="max-w-7xl mx-auto relative z-20">
                    <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
                        {/* Left: Content */}
                        <motion.div 
                            key={i18n.language} 
                            initial={{ opacity: 0, x: -30 }} 
                            animate={{ opacity: 1, x: 0 }} 
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="max-w-2xl"
                        >
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_10px_rgba(220,38,38,0.5)]" />
                                <span className="text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] text-gray-400">
                                    {c(hero, 'badgeText', 'Excellence in Pedagogy')}
                                </span>
                            </div>

                            <h1 className="text-4xl sm:text-5xl md:text-7xl font-serif font-bold text-white mb-8 leading-[1.05] tracking-tight">
                                Mastering <br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-red-900 pr-2">Global English</span> <br />
                                with Academic Rigor.
                            </h1>

                            <p className="text-lg md:text-xl text-gray-300/90 mb-12 max-w-xl font-medium leading-relaxed">
                                {c(hero, 'subtitle', 'TTESOL English Academy provides a world-class linguistic environment where professional growth meets academic excellence. Join an international community of scholars.')}
                            </p>

                            <div className="flex flex-col sm:flex-row gap-5 items-stretch sm:items-center">
                                <button 
                                    onClick={onLoginClick} 
                                    className="bg-red-700 hover:bg-red-800 text-white px-10 py-5 rounded-xl font-black uppercase tracking-widest shadow-xl shadow-red-900/40 transition-all transform hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-3 min-h-[60px]"
                                >
                                    {c(hero, 'primaryCta', 'Join Now')} <ArrowRight size={20} />
                                </button>
                                <button className="bg-white/5 hover:bg-white/10 backdrop-blur-md border border-white/20 text-white px-10 py-5 rounded-xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 min-h-[60px]">
                                    {c(hero, 'secondaryCta', 'View Curriculum')}
                                </button>
                            </div>
                        </motion.div>

                        {/* Right: Premium Image */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9, x: 30 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                            className="relative"
                        >
                            {/* Decorative element behind image */}
                            <div className="absolute -inset-4 bg-gradient-to-br from-accent/20 to-secondary/20 rounded-[3rem] blur-2xl -z-10 opacity-30" />
                            
                            <div className="relative aspect-[4/5] sm:aspect-video lg:aspect-[4/5] overflow-hidden rounded-[2.5rem] sm:rounded-[4rem] shadow-2xl border border-white/10 group">
                                <img 
                                    src="/classroom-hero.png" 
                                    alt="Classroom Education"
                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-primary/40 via-transparent to-transparent opacity-60 pointer-events-none" />
                            </div>

                            {/* Floating Detail */}
                            <motion.div 
                                animate={{ y: [0, -10, 0] }}
                                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                                className="absolute -bottom-6 -left-6 sm:-bottom-10 sm:-left-10 bg-white/10 backdrop-blur-xl border border-white/20 p-6 rounded-3xl shadow-2xl hidden sm:block"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center">
                                        <BookOpen className="text-accent w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-white font-bold text-lg leading-tight tracking-tight">World-Class</p>
                                        <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Pedagogy</p>
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── Removed static banners: implementation moved to Promo Popup ── */}

            {/* ── Stats Banner ──────────────────────────────────────────── */}
            <section id="about" className="relative -mt-4 z-30 max-w-7xl mx-auto px-6">
                <div className="bg-surface rounded-2xl shadow-premium border border-black/5 p-8 md:p-12">
                    <motion.div key={`stats-${i18n.language}`} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-gray-100">
                        <div className="text-center"><h3 className="text-4xl font-serif font-bold text-primary mb-2">{about.stat1 || '10k+'}</h3><p className="text-gray-500 font-bold text-xs uppercase tracking-widest">{c(about, 'stat1Label', 'Active Students')}</p></div>
                        <div className="text-center"><h3 className="text-4xl font-serif font-bold text-primary mb-2">{about.stat2 || '50+'}</h3><p className="text-gray-500 font-bold text-xs uppercase tracking-widest">{c(about, 'stat2Label', 'Premium Courses')}</p></div>
                        <div className="text-center"><h3 className="text-4xl font-serif font-bold text-primary mb-2">{about.stat3 || '98%'}</h3><p className="text-gray-500 font-bold text-xs uppercase tracking-widest">{c(about, 'stat3Label', 'Success Rate')}</p></div>
                        <div className="text-center">
                            <h3 className="text-4xl font-serif font-bold text-primary mb-2">{about.stat4 || '4.9'}</h3>
                            <div className="flex justify-center gap-0.5 my-1">{[1,2,3,4,5].map(i => <Star key={i} className="w-4 h-4 text-yellow-400 fill-yellow-400" />)}</div>
                            <p className="text-gray-500 font-bold text-xs uppercase tracking-widest">{c(about, 'stat4Label', 'Average Rating')}</p>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── Courses ───────────────────────────────────────────────── */}
            <section id="courses" className="py-24 bg-surface-low relative">
                <div className="max-w-7xl mx-auto px-6">
                    <div className="text-center mb-16">
                        <span className="text-accent font-bold text-sm uppercase tracking-widest mb-2 block">{c(courses, 'sectionSubtitle', 'Our Curriculum')}</span>
                        <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">{c(courses, 'sectionTitle', 'Featured Programs')}</h2>
                    </div>
                    <motion.div key={`courses-${i18n.language}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {courseCards.map((course, i) => (
                            <div key={i} className="bg-surface rounded-2xl p-8 border border-black/5 shadow-sm hover:shadow-premium transition-all duration-300 group">
                                <div className="w-14 h-14 rounded-xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 group-hover:bg-primary group-hover:text-white transition-all">{course.icon}</div>
                                <span className="text-xs font-bold text-accent uppercase tracking-widest mb-2 block">{course.level}</span>
                                <h3 className="text-2xl font-serif font-bold text-primary mb-4">{course.title}</h3>
                                <p className="text-gray-500 mb-8 line-clamp-2">{course.desc}</p>
                                <button className="flex items-center gap-2 text-primary font-bold text-sm group-hover:text-accent transition-colors">{c(courses, 'learnMore', 'Learn More')} <ChevronRight className="w-4 h-4" /></button>
                            </div>
                        ))}
                    </motion.div>
                    <div className="text-center mt-12">
                        <button onClick={onLoginClick} className="bg-surface border border-gray-200 text-primary px-8 py-3 rounded-xl font-bold uppercase tracking-widest shadow-sm hover:border-primary hover:text-primary transition-all">
                            {c(courses, 'viewAll', 'View Full Catalog')}
                        </button>
                    </div>
                </div>
            </section>

            {/* ── Gallery (dynamic) ─────────────────────────────────────── */}
            {modules.gallery.length > 0 && (
                <section id="gallery" className="py-24 bg-surface">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-14">
                            <span className="text-accent font-bold text-sm uppercase tracking-widest mb-2 block flex items-center justify-center gap-2"><Images className="w-4 h-4" /> {c(gallery, 'sectionSubtitle', 'Our Gallery')}</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">{c(gallery, 'sectionTitle', 'Campus & Community')}</h2>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {modules.gallery.map((img, i) => (
                                <motion.div
                                    key={img.id}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.05 }}
                                    className="relative group cursor-pointer overflow-hidden rounded-2xl aspect-square bg-gray-100 shadow-sm hover:shadow-premium transition-all"
                                    onClick={() => setLightboxSrc(img.image_url)}
                                >
                                    <img src={img.image_url} alt={img.alt_text || img.caption || ''} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                    <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/60 transition-all flex items-end p-4">
                                        {img.caption && <p className="text-white text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">{img.caption}</p>}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    {/* Lightbox */}
                    <AnimatePresence>
                        {lightboxSrc && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxSrc(null)}>
                                <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2" onClick={() => setLightboxSrc(null)}><X size={28} /></button>
                                <img src={lightboxSrc} alt="" className="max-h-[90vh] max-w-full rounded-2xl shadow-2xl" onClick={e => e.stopPropagation()} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            )}

            {/* ── Videos (dynamic) ──────────────────────────────────────── */}
            {modules.videos.length > 0 && (
                <section id="videos" className="py-24 bg-primary">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-14">
                            <span className="text-accent font-bold text-sm uppercase tracking-widest mb-2 block flex items-center justify-center gap-2"><Film className="w-4 h-4" /> {c(videos, 'sectionSubtitle', 'Videos')}</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">{c(videos, 'sectionTitle', 'See TTESOL in Action')}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {modules.videos.map((video, i) => (
                                <motion.div
                                    key={video.id}
                                    initial={{ opacity: 0, y: 16 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                    className="group cursor-pointer"
                                    onClick={() => setActiveVideo(video)}
                                >
                                    <div className="relative rounded-2xl overflow-hidden aspect-video bg-white/5 border border-white/10 shadow-premium mb-4">
                                        {video.thumbnail_url ? (
                                            <img src={video.thumbnail_url} alt={video.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-white/5">
                                                <Film className="w-12 h-12 text-white/20" />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-primary/40 group-hover:bg-primary/20 transition-all flex items-center justify-center">
                                            <div className="w-16 h-16 rounded-full bg-accent/90 flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                                <PlayCircle className="w-8 h-8 text-white" />
                                            </div>
                                        </div>
                                    </div>
                                    {video.title && <h3 className="font-bold text-white text-lg group-hover:text-accent transition-colors">{video.title}</h3>}
                                    {video.description && <p className="text-gray-400 text-sm mt-1 line-clamp-2">{video.description}</p>}
                                </motion.div>
                            ))}
                        </div>
                    </div>
                    {/* Video Modal */}
                    <AnimatePresence>
                        {activeVideo && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4" onClick={() => setActiveVideo(null)}>
                                <button className="absolute top-6 right-6 text-white/70 hover:text-white p-2"><X size={28} /></button>
                                <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl bg-black" onClick={e => e.stopPropagation()}>
                                    {getVideoType(activeVideo.video_url) === 'youtube' ? (
                                        <iframe 
                                            src={toEmbedUrl(activeVideo.video_url)} 
                                            className="w-full h-full" 
                                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                                            allowFullScreen 
                                            title={activeVideo.title} 
                                        />
                                    ) : (
                                        <video 
                                            src={activeVideo.video_url} 
                                            controls 
                                            autoPlay 
                                            className="w-full h-full"
                                            title={activeVideo.title}
                                        />
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </section>
            )}

            {/* ── Testimonials (dynamic) ────────────────────────────────── */}
            {modules.testimonials.length > 0 && (
                <section id="testimonials" className="py-24 bg-surface-low">
                    <div className="max-w-7xl mx-auto px-6">
                        <div className="text-center mb-14">
                            <span className="text-accent font-bold text-sm uppercase tracking-widest mb-2 block">{c(testimonials, 'sectionSubtitle', 'Student Voices')}</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">{c(testimonials, 'sectionTitle', 'What Our Students Say')}</h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {modules.testimonials.map((t, i) => (
                                <motion.div
                                    key={t.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.08 }}
                                    className="bg-surface rounded-2xl p-8 border border-black/5 shadow-sm hover:shadow-premium transition-all relative"
                                >
                                    <Quote className="w-8 h-8 text-accent/20 absolute top-6 right-6" />
                                    <div className="flex gap-0.5 mb-5">
                                        {[1,2,3,4,5].map(n => <Star key={n} className={`w-4 h-4 ${n <= (t.rating || 5) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}`} />)}
                                    </div>
                                    <p className="text-gray-600 leading-relaxed mb-6 text-sm font-medium italic">"{t.quote}"</p>
                                    <div className="flex items-center gap-3 border-t border-gray-100 pt-5">
                                        {t.author_avatar ? (
                                            <img src={t.author_avatar} alt={t.author_name} className="w-12 h-12 rounded-full object-cover border-2 border-white shadow" />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center text-white font-bold text-lg shadow">
                                                {t.author_name?.charAt(0)?.toUpperCase() || '?'}
                                            </div>
                                        )}
                                        <div>
                                            <p className="font-bold text-primary text-sm">{t.author_name}</p>
                                            {t.author_role && <p className="text-xs text-gray-400">{t.author_role}</p>}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* ── Footer ────────────────────────────────────────────────── */}
            <footer className="bg-primary text-white py-12 border-t border-white/10">
                <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="flex items-center justify-center pr-1">
                                <img src={c(h, 'logoUrl', '/Logo.png')} alt="TTESOL Logo" className="h-8 w-auto object-contain drop-shadow-md" />
                            </div>
                            <span className="font-serif font-bold text-xl text-white tracking-tight">{c(h, 'institutionName', 'TTESOL')}</span>
                        </div>
                        <p className="text-gray-400 max-w-sm mb-6">{c(footer, 'description', 'Transforming lives through language. The premium academic platform for modern English learners.')}</p>
                    </div>
                    <div>
                        <h4 className="font-bold uppercase tracking-widest mb-6 text-sm">{c(footer, 'platformTitle', 'Platform')}</h4>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">{c(footer, 'link_courses', 'Courses')}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{c(footer, 'link_library', 'Library')}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{c(footer, 'link_certification', 'Certification')}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{c(footer, 'link_support', 'Support')}</a></li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold uppercase tracking-widest mb-6 text-sm">{c(footer, 'legalTitle', 'Legal')}</h4>
                        <ul className="space-y-3 text-gray-400 text-sm">
                            <li><a href="#" className="hover:text-white transition-colors">{c(footer, 'link_privacy', 'Privacy Policy')}</a></li>
                            <li><a href="#" className="hover:text-white transition-colors">{c(footer, 'link_terms', 'Terms of Service')}</a></li>
                        </ul>
                    </div>
                </div>
                <div className="max-w-7xl mx-auto px-6 mt-12 pt-8 border-t border-white/10 text-center text-gray-500 text-sm">
                    {c(footer, 'copyright', `© ${new Date().getFullYear()} TTESOL Academy. All rights reserved.`)}
                </div>
            </footer>

            {/* ── Premium Promotional Popup Carousel ───────────────────── */}
            <AnimatePresence>
                {showPromo && modules.banners.length > 0 && (
                    <motion.div 
                        data-testid="promo-popup"
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-primary/60 backdrop-blur-xl"
                        onClick={() => setShowPromo(false)}
                    >
                        <motion.div 
                            initial={{ scale: 0.95, y: 30, opacity: 0 }}
                            animate={{ scale: 1, y: 0, opacity: 1 }}
                            exit={{ scale: 0.95, y: 30, opacity: 0 }}
                            className="relative w-full max-w-5xl bg-[#0a1931] rounded-[2rem] overflow-hidden shadow-[0_32px_64px_-16px_rgba(0,0,0,0.6)] border border-white/10 max-h-[90svh] overflow-y-auto"
                            onClick={e => e.stopPropagation()}
                        >
                            {/* Close Button */}
                            <button 
                                data-testid="close-promo"
                                onClick={() => setShowPromo(false)}
                                className="absolute top-6 right-6 z-[120] p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all backdrop-blur-md border border-white/10"
                            >
                                <X size={20} />
                            </button>

                            {/* Carousel Content Container */}
                            <div className="flex flex-col">
                                {modules.banners.map((banner, idx) => (
                                    <AnimatePresence mode="wait" key={banner.id}>
                                        {idx === activeBannerIdx && (
                                            <motion.div 
                                                initial={{ opacity: 0, x: 20 }}
                                                animate={{ opacity: 1, x: 0 }}
                                                exit={{ opacity: 0, x: -20 }}
                                                transition={{ duration: 0.6 }}
                                                className="flex flex-col md:flex-row"
                                            >
                                                {/* Left Side: Dynamic Image */}
                                                <div className="w-full md:w-1/2 relative h-52 sm:h-72 md:h-auto md:min-h-[460px]">
                                                    <img 
                                                        src={banner.image_url || bgBanner} 
                                                        alt={banner.title} 
                                                        className="w-full h-full object-cover object-center"
                                                    />
                                                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0a1931] hidden md:block" />
                                                    <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#0a1931] to-transparent md:hidden" />
                                                </div>

                                                {/* Right Side: Dynamic Content */}
                                                <div className="w-full md:w-1/2 p-6 sm:p-8 md:p-14 flex flex-col justify-center relative">
                                                    <div className="space-y-6">
                                                        <motion.span 
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.2 }}
                                                            className="inline-block text-accent font-bold text-xs uppercase tracking-[0.2em]"
                                                        >
                                                            {banner.badge_text || t('banner.badge')}
                                                        </motion.span>
                                                        
                                                        <motion.h2 
                                                            initial={{ opacity: 0, y: 10 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.3 }}
                                                            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-serif font-bold text-white leading-[1.1] tracking-tight"
                                                        >
                                                            {banner.title || t('banner.title')}
                                                        </motion.h2>

                                                        <motion.p 
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ delay: 0.4 }}
                                                            className="text-white/80 font-bold text-sm uppercase tracking-widest"
                                                        >
                                                            {banner.subtitle || t('banner.subtitle')}
                                                        </motion.p>

                                                        <motion.p 
                                                            initial={{ opacity: 0 }}
                                                            animate={{ opacity: 1 }}
                                                            transition={{ delay: 0.5 }}
                                                            className="text-gray-400 text-sm leading-relaxed max-w-sm"
                                                        >
                                                            {banner.description || t('banner.description')}
                                                        </motion.p>

                                                        <motion.div 
                                                            initial={{ opacity: 0, y: 20 }}
                                                            animate={{ opacity: 1, y: 0 }}
                                                            transition={{ delay: 0.6 }}
                                                            className="pt-4"
                                                        >
                                                            <button 
                                                                onClick={() => { 
                                                                    setShowPromo(false); 
                                                                    if (banner.cta_url && banner.cta_url !== '#') {
                                                                        window.location.href = banner.cta_url;
                                                                    } else {
                                                                        onLoginClick(); 
                                                                    }
                                                                }}
                                                                className="group relative inline-flex items-center gap-3 bg-gradient-to-br from-[#9e1c22] to-[#7a1418] text-white px-10 py-4 rounded-xl font-bold uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-[0_10px_20px_-5px_rgba(158,28,34,0.4)] border border-[#c4a661]/30 hover:border-[#c4a661]/60"
                                                            >
                                                                <span className="relative z-10">{banner.cta_text || t('banner.cta')}</span>
                                                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                                                <div className="absolute inset-0 rounded-xl bg-[#c4a661]/10 opacity-0 group-hover:opacity-100 blur-md transition-opacity" />
                                                            </button>
                                                        </motion.div>
                                                    </div>

                                                    {/* Decorative Detail */}
                                                    <Star className="absolute bottom-10 right-10 text-white/10 w-12 h-12" />
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>
                                ))}
                            </div>

                            {/* Carousel Controls (if more than 1) */}
                            {modules.banners.length > 1 && (
                                <div className="flex justify-center items-center gap-4 py-5">
                                    <div className="flex gap-2">
                                        {modules.banners.map((_, dotIdx) => (
                                            <button 
                                                key={dotIdx}
                                                onClick={() => setActiveBannerIdx(dotIdx)}
                                                className={`w-2 h-2 rounded-full transition-all duration-500 ${dotIdx === activeBannerIdx ? 'bg-accent w-8' : 'bg-white/20'}`}
                                            />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default PublicLanding;
