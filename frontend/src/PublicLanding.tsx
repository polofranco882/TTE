import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, Users, Globe, PlayCircle, Star, ChevronRight, Quote, X, Film, Images } from 'lucide-react';
import bgHero from './assets/final-login-bg.jpg';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';

interface PublicLandingProps {
    onLoginClick: () => void;
}

// ─── Helper: YouTube URL → embed URL ──────────────────────────────────────
function toEmbedUrl(url: string): string {
    if (!url) return '';
    if (url.includes('embed')) return url;
    const match = url.match(/(?:youtu\.be\/|v=|v\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    if (match) return `https://www.youtube.com/embed/${match[1]}`;
    return url;
}

const PublicLanding = ({ onLoginClick }: PublicLandingProps) => {
    const { i18n } = useTranslation();
    const [cms, setCms] = useState<any>(null);
    const [modules, setModules] = useState<{ banners: any[]; gallery: any[]; videos: any[]; testimonials: any[] }>({
        banners: [], gallery: [], videos: [], testimonials: []
    });
    const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
    const [activeVideo, setActiveVideo] = useState<any | null>(null);

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

    const h = cms?.header   || {};
    const hero = cms?.hero    || {};
    const about = cms?.about  || {};
    const courses = cms?.courses || {};
    const footer = cms?.footer || {};
    const seo = cms?.seo || {};

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
                    <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                        <div className="h-11 px-3 rounded-xl flex items-center justify-center shadow-lg bg-white/10 border border-white/20">
                            <img src={c(h, 'logoUrl', '/Logo.png')} alt="TTESOL Logo" className="h-6 w-auto object-contain" />
                        </div>
                        <span className="font-serif font-bold text-xl sm:text-2xl text-white tracking-tight truncate">{c(h, 'institutionName', 'TTESOL')}</span>
                    </div>
                    <div className="hidden md:flex items-center gap-8 text-sm font-bold tracking-wide text-gray-300">
                        <a href="#about" className="hover:text-white transition-colors">{c(h, 'nav_about', 'About Us')}</a>
                        <a href="#courses" className="hover:text-white transition-colors">{c(h, 'nav_courses', 'Courses')}</a>
                        <a href="#testimonials" className="hover:text-white transition-colors">{c(h, 'nav_testimonials', 'Testimonials')}</a>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
                        <LanguageSwitcher />
                        <button onClick={onLoginClick} aria-label="Platform Login" className="bg-accent hover:bg-accent-dark text-white px-3 sm:px-6 py-2.5 sm:py-2.5 rounded-xl font-bold text-xs sm:text-sm uppercase tracking-wider shadow-premium hover:shadow-premium-hover transition-all flex items-center gap-1 sm:gap-2 group min-h-[40px]">
                            <span className="hidden sm:inline">{c(h, 'ctaText', 'Platform Login')}</span> <ArrowRight className="w-4 h-4 sm:group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                </div>
            </nav>

            {/* ── Hero ──────────────────────────────────────────────────── */}
            <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-primary">
                <div className="absolute inset-0 z-0">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-light to-primary opacity-90 z-10" />
                    <div className="absolute inset-0 bg-cover bg-center opacity-20 z-0" style={{ backgroundImage: `url(${c(hero, 'backgroundImage', bgHero as string || '')})` }} />
                </div>
                <div className="max-w-7xl mx-auto px-6 relative z-20">
                    <div className="max-w-3xl">
                        <motion.div key={i18n.language} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                            <span className="inline-block py-1 px-3 rounded-full bg-white/10 border border-white/20 text-white text-xs font-bold uppercase tracking-widest mb-6 backdrop-blur-sm">
                                {c(hero, 'badgeText', 'Excellence in English Education')}
                            </span>
                            <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-6 leading-[1.1] tracking-tight">
                                {hero.title ? <span dangerouslySetInnerHTML={{ __html: hero.title.replace(',', ',<br/>') }} /> : <>Master the Language, <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400">Shape Your Future.</span></>}
                            </h1>
                            <p className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl font-light leading-relaxed">
                                {c(hero, 'subtitle', 'TTESOL Academy offers a premium, interactive learning experience designed to accelerate your fluency and professional growth.')}
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={onLoginClick} className="bg-accent text-white px-8 py-5 rounded-xl font-bold uppercase tracking-widest shadow-premium hover:bg-accent-dark transition-all flex items-center justify-center gap-2 group min-h-[56px]">
                                    {c(hero, 'primaryCta', 'Access Platform')} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </button>
                                <button className="bg-white/10 backdrop-blur-md border border-white/20 text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                                    <PlayCircle className="w-5 h-5" /> {c(hero, 'secondaryCta', 'Watch Video')}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                </div>
                <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1/3 h-full hidden lg:block opacity-50 pointer-events-none">
                    <div className="absolute top-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/30 rounded-full blur-[128px]" />
                </div>
            </section>

            {/* ── Promotional Banners (dynamic) ─────────────────────────── */}
            {modules.banners.length > 0 && (
                <section className="py-8 bg-surface-low">
                    <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {modules.banners.map((banner, i) => (
                            <motion.div
                                key={banner.id}
                                initial={{ opacity: 0, y: 16 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: i * 0.08 }}
                                className="relative rounded-2xl overflow-hidden shadow-premium min-h-[200px] flex flex-col justify-between p-8"
                                style={{ backgroundColor: banner.bg_color || '#09194F' }}
                            >
                                {banner.image_url && (
                                    <img src={banner.image_url} alt={banner.title} className="absolute inset-0 w-full h-full object-cover opacity-20" />
                                )}
                                <div className="relative z-10">
                                    {banner.title && <h3 className="text-2xl font-serif font-bold text-white mb-2">{banner.title}</h3>}
                                    {banner.subtitle && <p className="text-white/80 font-bold text-sm mb-3">{banner.subtitle}</p>}
                                    {banner.description && <p className="text-white/60 text-sm leading-relaxed">{banner.description}</p>}
                                </div>
                                {banner.cta_text && (
                                    <a href={banner.cta_url || '#'} onClick={!banner.cta_url ? (e) => { e.preventDefault(); onLoginClick(); } : undefined}
                                        className="relative z-10 mt-6 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold px-5 py-2.5 rounded-xl text-sm uppercase tracking-widest transition-all self-start border border-white/20">
                                        {banner.cta_text} <ArrowRight className="w-4 h-4" />
                                    </a>
                                )}
                            </motion.div>
                        ))}
                    </div>
                </section>
            )}

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
                            <span className="text-accent font-bold text-sm uppercase tracking-widest mb-2 block flex items-center justify-center gap-2"><Images className="w-4 h-4" /> Our Gallery</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">Campus & Community</h2>
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
                            <span className="text-accent font-bold text-sm uppercase tracking-widest mb-2 block flex items-center justify-center gap-2"><Film className="w-4 h-4" /> Videos</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-white">See TTESOL in Action</h2>
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
                                <div className="w-full max-w-4xl aspect-video rounded-2xl overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
                                    <iframe src={toEmbedUrl(activeVideo.video_url)} className="w-full h-full" allow="autoplay; fullscreen" allowFullScreen title={activeVideo.title} />
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
                            <span className="text-accent font-bold text-sm uppercase tracking-widest mb-2 block">{c(about, 'title', 'Student Voices')}</span>
                            <h2 className="text-4xl md:text-5xl font-serif font-bold text-primary">What Our Students Say</h2>
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
                            <div className="h-9 px-2.5 rounded-lg flex items-center justify-center bg-white/10 border border-white/20">
                                <img src={c(h, 'logoUrl', '/Logo.png')} alt="TTESOL Logo" className="h-5 w-auto object-contain" />
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
        </div>
    );
};

export default PublicLanding;
