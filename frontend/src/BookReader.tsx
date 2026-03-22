import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, BookOpen, Star, Clock, Share2, Bookmark, Play, Download, X, ArrowRight, Menu, ZoomIn, ZoomOut, Maximize, Layout, Expand, Shrink, Volume2, VolumeX, Search } from 'lucide-react';
import { type NotificationType } from './components/Notification';
import BlockRenderer from './components/BlockRenderer';
import type { BlockData } from './components/BlockRenderer';
import ValidationFooter from './components/ValidationFooter';
import type { ValidationState } from './components/ValidationFooter';
import { useGamification } from './context/GamificationContext';
import HTMLFlipBook from 'react-pageflip';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import pasaHojaAudio from './assets/pasaHoja.mp3';

// ScaledCanvas: auto-scales content to fit within available width
const ScaledCanvas = ({ designWidth, height, canvas, children }: {
    designWidth: number;
    height: string;
    canvas: { color: string; url: string };
    children: React.ReactNode;
}) => {
    const wrapperRef = useRef<HTMLDivElement>(null);
    const [scale, setScale] = useState(1);

    useEffect(() => {
        const el = wrapperRef.current;
        if (!el) return;

        const observer = new ResizeObserver(entries => {
            for (const entry of entries) {
                const availableWidth = entry.contentRect.width;
                const availableHeight = entry.contentRect.height;
                
                if (availableWidth > 0 && availableHeight > 0) {
                    const dHeight = parseFloat(height);
                    const scaleX = availableWidth / designWidth;
                    const scaleY = availableHeight / dHeight;
                    
                    // Use the minimum scale to ensure content fits both dimensions (contain)
                    const newScale = Math.min(scaleX, scaleY);
                    setScale(newScale);
                }
            }
        });

        observer.observe(el);
        return () => observer.disconnect();
    }, [designWidth]);

    return (
        <div ref={wrapperRef} className="w-full h-full mx-auto flex justify-center items-center overflow-hidden">
            <div
                className="relative bg-white/5 overflow-hidden backdrop-blur-sm shadow-inner"
                style={{
                    width: `${designWidth}px`,
                    height,
                    backgroundColor: canvas.url ? 'transparent' : canvas.color,
                    backgroundImage: canvas.url ? `url(${canvas.url})` : 'none',
                    backgroundSize: '100% 100%',
                    backgroundPosition: 'center',
                    transform: `scale(${scale})`,
                    transformOrigin: 'center center',
                    flexShrink: 0,
                }}
            >
                {children}
            </div>
        </div>
    );
};

interface FlipbookPageProps {
    contentItem: {
        content?: string;
        canvas?: { color: string; url: string };
    };
    onInteract: (interaction: any) => void;
    debugNav?: boolean;
}

const FlipbookPage = forwardRef<HTMLDivElement, FlipbookPageProps>((props, ref) => {
    const { contentItem, debugNav } = props;
    let blocks: BlockData[] = [];
    let canvas: any = { color: 'transparent', url: '' };

    try {
        const content = contentItem.content || '{}';
        if (content.startsWith('{')) {
            const data = JSON.parse(content);
            blocks = data.blocks || [];
            canvas = data.canvas || canvas;
        } else {
            blocks = JSON.parse(content);
        }
    } catch (e) {
        console.error("Parse error:", e);
    }

    // Removing page-level interceptor to use global one instead for better coverage
    const designWidth = 1350;
    const designHeight = 1909; 
    const height = `${designHeight}px`;

    return (
        <div 
            ref={ref} 
            className="page bg-white relative overflow-hidden flex flex-col items-center justify-center transition-shadow duration-500 shadow-2xl" 
            style={{ width: '100%', height: '100%' }}
            // KILL THE BUBBLE: Prevent any interaction inside the page from reaching the library motor
            onClick={(e) => {
                console.log("FlipbookPage: Bubble Blocked (Click)");
                e.stopPropagation();
            }}
            onPointerDown={(e) => {
                // We don't stop propagation here for all pointers to allow the Master Overlay 
                // (which is a sibling) to potentially see it if we changed the layout, 
                // but since it's a sibling, bubble goes through parent.
                // Stopping it here ensures the FlipBook parent never sees it.
                console.log("FlipbookPage: Bubble Blocked (PointerDown)");
                e.stopPropagation();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
        >
            {/* Debug Layer (Overlay that shows navigation zones) */}
            {debugNav && (
                <div className="absolute inset-0 z-[100] pointer-events-none flex">
                    <div className="h-full w-[5%] bg-green-500/30 border-r border-green-500 flex items-center justify-center text-[8px] font-black text-white">CLICK ZONE</div>
                    <div className="h-full flex-1 bg-red-500/20 flex flex-col items-center justify-center text-[8px] font-black text-white">
                        <span>PROTECTED AREA</span>
                        <div className="w-1/2 h-px bg-white/20 my-1"/>
                        <span>CONTENT ONLY</span>
                    </div>
                    <div className="h-full w-[5%] bg-green-500/30 border-l border-green-500 flex items-center justify-center text-[8px] font-black text-white">CLICK ZONE</div>
                </div>
            )}

            <div className="absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-black/10 to-transparent z-10 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-black/5 to-transparent z-10 pointer-events-none" />
            
            {/* Edge Indicators (Subtle visual cues) */}
            <div className="absolute inset-y-0 left-0 w-2 hover:bg-accent/5 transition-colors z-20 pointer-events-none" />
            <div className="absolute inset-y-0 right-0 w-2 hover:bg-accent/5 transition-colors z-20 pointer-events-none" />
            <ScaledCanvas designWidth={designWidth} height={height} canvas={canvas}>
                {blocks.map((block, idx) => (
                    <div
                        key={block.id}
                        className="absolute"
                        style={{
                            left: block.data.x,
                            top: block.data.y,
                            width: block.data.width,
                            height: block.data.height,
                            zIndex: block.data.zIndex || (idx + 10),
                            transform: `rotate(${block.data.rotate || 0}deg)`,
                            pointerEvents: 'auto' // RE-ENABLE pointer events for interactive blocks only
                        }}
                    >
                        <div className="w-full h-full relative">
                            <BlockRenderer
                                block={block}
                                onInteract={(_, interaction) => {
                                    props.onInteract(interaction);
                                }}
                            />
                        </div>
                    </div>
                ))}
            </ScaledCanvas>
        </div>
    );
});

interface BookItem {
    id: number;
    title: string;
    category: string;
    status: 'active' | 'inactive';
    cover_image?: string;
    description?: string;
    details?: string;
    rating?: string;
    reading_time?: string;
    publisher?: string;
    isbn?: string;
    publication_date?: string;
}

interface ContentItem {
    id: number;
    title: string;
    type: 'chapter' | 'topic';
    content?: string;
    page_number?: string;
}

interface BookReaderProps {
    bookId: number;
    token: string;
    sidebarOpen: boolean;
    onBack: () => void;
    onNotify: (msg: string, type: NotificationType) => void;
}

// Activity icon for stats
const Activity = ({ className, size = 18 }: { className?: string; size?: number }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
    </svg>
);

const BookReader = ({ bookId, token, onBack, onNotify }: BookReaderProps) => {
    const [book, setBook] = useState<BookItem | null>(null);
    const [contents, setContents] = useState<ContentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewState, setViewState] = useState<'COVER' | 'INDEX' | 'READING'>('COVER');
    const [debugNav, setDebugNav] = useState(false);
    const [selectedChapter, setSelectedChapter] = useState<ContentItem | null>(null);
    const [showToolbar, setShowToolbar] = useState(false);
    const [currentScale, setCurrentScale] = useState(1);
    const [isSinglePage, setIsSinglePage] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const flipBookRef = useRef<any>(null);
    const flipAudioRef = useRef(new Audio(pasaHojaAudio));
    const isNavigatingFromTOC = useRef(false);
    const bookContainerRef = useRef<HTMLDivElement>(null);
 
    // Auto-detect single page for small screens
    useEffect(() => {
        const checkMobile = () => {
            if (window.innerWidth < 1024) {
                setIsSinglePage(true);
            }
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    // Fix 100vh on mobile browsers (especially iOS Safari) + handle virtual keyboard
    useEffect(() => {
        const updateVh = () => {
            const vp = window.visualViewport;
            const h = vp ? vp.height : window.innerHeight;
            document.documentElement.style.setProperty('--vh', `${h * 0.01}px`);
        };
        updateVh();
        window.addEventListener('resize', updateVh);
        if (window.visualViewport) {
            window.visualViewport.addEventListener('resize', updateVh);
            window.visualViewport.addEventListener('scroll', updateVh);
        }
        return () => {
            window.removeEventListener('resize', updateVh);
            if (window.visualViewport) {
                window.visualViewport.removeEventListener('resize', updateVh);
                window.visualViewport.removeEventListener('scroll', updateVh);
            }
        };
    }, []);

    // --- DOCUMENT-LEVEL NATIVE NAVIGATION SHIELD ---
    useEffect(() => {
        if (viewState !== 'READING') return;

        const interceptor = (e: MouseEvent | TouchEvent | PointerEvent) => {
            const container = bookContainerRef.current;
            if (!container) return;

            const target = e.target as HTMLElement;
            
            // 1. Identify if we are inside the book reader container
            if (!container.contains(target)) return;

            // 2. Identify if it's an interactive element
            const isInteractive = target.closest('.block-interactive') || 
                                target.closest('button') || 
                                target.closest('input') || 
                                target.closest('video') || 
                                target.closest('audio') ||
                                target.closest('.notification-container') ||
                                target.closest('.nav-zone'); // Allow explicit nav zones to receive their clicks

            if (isInteractive) {
                console.log("Document Shield: PROTECTED INTERACTIVE BLOCK OR NAV ZONE", target);
                return; // Let interactive elements handle their own events
            }

            // 3. Coordinate Check for Edges
            const flipbookBody = container.querySelector('.flip-book-container');
            if (!flipbookBody) return;

            const rect = flipbookBody.getBoundingClientRect();
            let clientX: number;
            if ('clientX' in e) {
                clientX = (e as MouseEvent).clientX;
            } else if ((e as TouchEvent).touches && (e as TouchEvent).touches[0]) {
                clientX = (e as TouchEvent).touches[0].clientX;
            } else {
                return;
            }

            // Only act if the click is inside the actual flipbook area
            if (clientX < rect.left || clientX > rect.right) return;

            const x = clientX - rect.left;
            const totalWidth = rect.width;
            
            const margin = totalWidth * 0.12; // Wider margin for touch (fat finger accuracy)
            const isNearEdge = x < margin || x > (totalWidth - margin);

            if (!isNearEdge) {
                console.log("Document Shield: KILLING CENTRAL TAP at X:", x, "Target:", target);
                // KILL THE EVENT at the root before anyone else sees it
                e.stopPropagation();
                e.stopImmediatePropagation();
                
                // For 'click' events, we must preventDefault to stop the library's internal logic
                if (e.type === 'click' || e.type === 'mousedown' || e.type === 'touchstart') {
                    // e.preventDefault(); // Careful with preventDefault as it might break zoom/pan
                }
            } else {
                console.log("Document Shield: ALLOWED EDGE TAP at X:", x);
            }
        };

        // Attach to document with CAPTURE phase for ultimate priority
        // NOTE: touchstart must be passive:true on iOS to prevent scroll jank (we don't call preventDefault)
        document.addEventListener('mousedown', interceptor, { capture: true });
        document.addEventListener('touchstart', interceptor, { capture: true, passive: true });
        document.addEventListener('pointerdown', interceptor, { capture: true });
        document.addEventListener('click', interceptor, { capture: true });

        return () => {
            document.removeEventListener('mousedown', interceptor, { capture: true });
            document.removeEventListener('touchstart', interceptor, { capture: true });
            document.removeEventListener('pointerdown', interceptor, { capture: true });
            document.removeEventListener('click', interceptor, { capture: true });
        };
    }, [viewState, bookContainerRef]);

    // Audio Flip Settings
    const [flipVolume] = useState(() => {
        const saved = localStorage.getItem('tte_flip_volume');
        return saved ? parseFloat(saved) : 1;
    });
    const [flipMuted, setFlipMuted] = useState(() => {
        const saved = localStorage.getItem('tte_flip_muted');
        return saved === 'true';
    });

    // Gamification & Validation
    const { hearts, addXp, subtractHeart, incrementStreak, xp } = useGamification();
    const [validationState, setValidationState] = useState<ValidationState>('idle');
    const [validationMessage, setValidationMessage] = useState('');
    const [isGameOver, setIsGameOver] = useState(false);

    // Advanced Navigation States
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [jumpPageInput, setJumpPageInput] = useState('');
    
    // Derived Search Results filtering
    const searchResults = contents.filter(item => {
        if (!searchQuery.trim()) return false;
        const q = searchQuery.toLowerCase();
        return (item.title && item.title.toLowerCase().includes(q)) || 
               (item.content && item.content.toLowerCase().includes(q)) ||
               (item.page_number && item.page_number.toString() === q);
    });

    useEffect(() => {
        const fetchBookAndContents = async () => {
            try {
                // Fetch basic book info
                const resBooks = await fetch(`/api/books`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resBooks.ok) {
                    const data = await resBooks.json();
                    const found = data.find((b: BookItem) => b.id === bookId);
                    setBook(found || null);
                }

                // Fetch TOC
                const resContents = await fetch(`/api/books/${bookId}/contents`, {
                    headers: { Authorization: `Bearer ${token}` }
                });
                if (resContents.ok) {
                    const data = await resContents.json();
                    setContents(data);
                }
            } catch (err) {
                console.error(err);
                onNotify('Error loading content', 'error');
            } finally {
                setLoading(false);
            }
        };

        fetchBookAndContents();
        window.scrollTo(0, 0);
    }, [bookId, token]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key === 'd') {
                setDebugNav(prev => !prev);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    useEffect(() => {
        if (selectedChapter) {
            const container = document.querySelector('.overflow-y-auto');
            if (container) container.scrollTo({ top: 0, behavior: 'smooth' });
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [selectedChapter]);

    // Sync Navigation from TOC or Internal Links to Flipbook
    useEffect(() => {
        if (viewState === 'READING' && selectedChapter && isNavigatingFromTOC.current) {
            const chapterIndex = contents.findIndex(c => c.id === selectedChapter.id);
            console.log("SyncNav: Attempting flip to index", chapterIndex, "Title:", selectedChapter.title);
            
            if (chapterIndex !== -1) {
                // Reset jump input when navigating from TOC
                setJumpPageInput('');
                
                // Clear the navigation lock after some time to allow the effect to complete
                const clearLock = () => {
                    setTimeout(() => {
                        isNavigatingFromTOC.current = false;
                        console.log("SyncNav: Lock Released");
                    }, 500);
                };

                // Use multiple attempts or a slightly longer delay to ensure the flipbook is ready
                let attempts = 0;
                const tryFlip = () => {
                    if (flipBookRef.current && flipBookRef.current.pageFlip()) {
                        console.log("SyncNav: Executing turnToPage", chapterIndex);
                        flipBookRef.current.pageFlip().turnToPage(chapterIndex);
                        clearLock();
                    } else if (attempts < 10) {
                        attempts++;
                        setTimeout(tryFlip, 100);
                    } else {
                        console.warn("SyncNav: Flipbook not ready after 10 attempts");
                        isNavigatingFromTOC.current = false;
                    }
                };
                
                tryFlip();
            } else {
                isNavigatingFromTOC.current = false;
            }
        }
    }, [viewState, selectedChapter, contents]);

    // Handle Page Form Submit
    const handleJumpPageSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        const targetPageNum = jumpPageInput.trim().toLowerCase();
        
        // Find by precise content page_number metric
        const targetItem = contents.find(c => 
            c.page_number && c.page_number.toString().toLowerCase() === targetPageNum
        );

        if (targetItem) {
            isNavigatingFromTOC.current = true;
            setSelectedChapter(targetItem);
            setJumpPageInput(''); // Clear input visually upon jump
        } else {
            // Optional: Soft-notify or shake animation here if not found.
            setJumpPageInput('');
        }
    };

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Sync Audio Ref with States
    useEffect(() => {
        if (flipAudioRef.current) {
            flipAudioRef.current.volume = flipVolume;
            flipAudioRef.current.muted = flipMuted;
        }
        localStorage.setItem('tte_flip_volume', flipVolume.toString());
        localStorage.setItem('tte_flip_muted', flipMuted.toString());
    }, [flipVolume, flipMuted]);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleBack = () => {
        if (viewState === 'READING') setViewState('INDEX');
        else if (viewState === 'INDEX') setViewState('COVER');
        else onBack();
    };

    const handleFlipPrev = () => {
        if (isSinglePage) {
            const currentIndex = contents.findIndex(c => String(c.id) === String(selectedChapter?.id));
            if (currentIndex > 0) {
                const prevChapter = contents[currentIndex - 1];
                setSelectedChapter(prevChapter);
                if (flipAudioRef.current && !flipMuted) {
                    flipAudioRef.current.currentTime = 0;
                    flipAudioRef.current.play().catch(() => {});
                }
            }
            return;
        }

        if (!flipBookRef.current) return;
        try {
            const pf = flipBookRef.current.pageFlip();
            if (pf) {
                const currentIndex = pf.getCurrentPageIndex();
                if (currentIndex > 0) {
                    pf.flipPrev('top');
                }
            }
        } catch (e) {
            console.error("Flip error:", e);
        }
    };

    const handleFlipNext = () => {
        if (isSinglePage) {
            const currentIndex = contents.findIndex(c => String(c.id) === String(selectedChapter?.id));
            if (currentIndex < contents.length - 1) {
                const nextChapter = contents[currentIndex + 1];
                setSelectedChapter(nextChapter);
                if (flipAudioRef.current && !flipMuted) {
                    flipAudioRef.current.currentTime = 0;
                    flipAudioRef.current.play().catch(() => {});
                }
            }
            return;
        }

        if (!flipBookRef.current) return;
        try {
            const pf = flipBookRef.current.pageFlip();
            if (pf) {
                const currentIndex = pf.getCurrentPageIndex();
                if (currentIndex < contents.length - 1) {
                    pf.flipNext('top');
                }
            }
        } catch (e) {
            console.error("Flip error:", e);
        }
    };

    const colors = [
        { bg: 'bg-blue-400/10', border: 'border-blue-400/20', text: 'text-blue-300', hover: 'hover:bg-blue-400/20' },
        { bg: 'bg-rose-400/10', border: 'border-rose-400/20', text: 'text-rose-300', hover: 'hover:bg-rose-400/20' },
        { bg: 'bg-purple-400/10', border: 'border-purple-400/20', text: 'text-purple-300', hover: 'hover:bg-purple-400/20' },
        { bg: 'bg-indigo-400/10', border: 'border-indigo-400/20', text: 'text-indigo-300', hover: 'hover:bg-indigo-400/20' },
        { bg: 'bg-amber-400/10', border: 'border-amber-400/20', text: 'text-amber-300', hover: 'hover:bg-amber-400/20' },
        { bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', text: 'text-emerald-300', hover: 'hover:bg-emerald-400/20' },
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin"></div>
                    <p className="text-gray-400 font-medium animate-pulse">Opening reading portal...</p>
                </div>
            </div>
        );
    }

    if (!book) {
        return (
            <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
                <div className="text-center">
                    <p className="text-white text-xl mb-4">Book not found</p>
                    <button onClick={onBack} className="text-accent hover:underline">Back to library</button>
                </div>
            </div>
        );
    }

    const transitionClass = 'transition-all duration-300 ease-in-out';

    return (
        <div className={`fixed inset-y-0 right-0 z-[150] bg-[#0f172a] text-white overflow-hidden ${transitionClass}`} style={{ left: 'var(--sidebar-width)' }}>
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0 overflow-hidden">
                <div
                    className="absolute inset-0 bg-cover bg-center scale-110 blur-2xl opacity-40 transition-all duration-1000"
                    style={{ backgroundImage: `url(${book.cover_image})` }}
                ></div>
                <div className="absolute inset-0 bg-gradient-to-b from-surface-dark/90 via-surface-dark to-surface-dark"></div>
            </div>

            {/* Navigation Bar */}
            <AnimatePresence>
                {showToolbar && (
                    <motion.nav
                        initial={{ y: -100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -100, opacity: 0 }}
                        className={`fixed top-0 right-0 z-[110] p-4 md:p-6 pb-6 pt-[calc(1rem+var(--sat))] flex flex-wrap justify-between items-center gap-y-4 bg-gradient-to-b from-black/80 to-transparent backdrop-blur-md ${transitionClass}`}
                        style={{ left: 'var(--sidebar-width)' }}
                    >
                        <motion.button
                            initial={{ x: -20, opacity: 0 }}
                            animate={{ x: 0, opacity: 1 }}
                            onClick={handleBack}
                            className="flex items-center gap-2 px-4 md:px-6 py-2.5 md:py-3 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 transition-all group shadow-2xl shrink-0"
                        >
                            <ArrowLeft size={18} className="md:w-5 md:h-5 group-hover:-translate-x-1 transition-transform" />
                            <span className="font-bold text-xs md:text-sm tracking-wider uppercase hidden sm:inline">
                                {viewState === 'COVER' ? 'Library' : viewState === 'INDEX' ? 'Book Cover' : 'Index'}
                            </span>
                            <span className="font-bold text-xs tracking-wider uppercase sm:hidden">
                                {viewState === 'COVER' ? 'Lib' : viewState === 'INDEX' ? 'Cover' : 'Idx'}
                            </span>
                        </motion.button>

                        <div className="flex flex-wrap gap-2 md:gap-4 items-center justify-end flex-1 sm:flex-none">
                            {/* Gamification Stats */}
                            {viewState === 'READING' && (
                                <div className="flex items-center gap-3 md:gap-4 bg-white/10 px-3 md:px-4 py-1.5 md:py-2 rounded-full border border-white/20 shrink-0 shadow-lg">
                                    <div className="flex items-center gap-1 md:gap-1.5 text-[#ff4b4b] font-black text-sm md:text-lg">
                                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none" className="drop-shadow-sm md:w-[20px] md:h-[20px]">
                                            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                        </svg>
                                        {hearts}
                                    </div>
                                    <div className="w-px h-3 md:h-4 bg-white/20"></div>
                                    <div className="flex items-center gap-1 md:gap-1.5 text-[#ffc800] font-black text-sm md:text-lg">
                                        <span className="text-base md:text-xl leading-none drop-shadow-sm">⚡</span> {xp}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 shrink-0">
                                <button className="p-2 md:p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all shadow-xl">
                                    <Share2 size={16} className="md:w-5 md:h-5" />
                                </button>
                                <button className="p-2 md:p-2.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 hover:text-white transition-all shadow-xl text-accent">
                                    <Bookmark size={16} className="md:w-5 md:h-5" />
                                </button>
                                <button
                                    onClick={() => setShowToolbar(false)}
                                    className="p-2.5 rounded-full bg-white/10 border border-white/20 hover:bg-white/20 text-white transition-all shadow-xl ml-2"
                                    title="Hide Toolbar"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                        </div>
                    </motion.nav>
                )}
            </AnimatePresence>

            {/* Floating Toolbar Toggle (Visible when toolbar is hidden) */}
            <AnimatePresence>
                {!showToolbar && viewState !== 'COVER' && (
                    <motion.button
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: -20, opacity: 0 }}
                        onClick={() => setShowToolbar(true)}
                        className="absolute top-6 right-6 z-[115] p-4 rounded-2xl bg-white/5 border border-white/10 text-gray-400 hover:text-white hover:bg-white/10 backdrop-blur-md transition-all group shadow-2xl hover:scale-105 active:scale-95"
                        title="Show Navigation"
                    >
                        <Menu size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </motion.button>
                )}
            </AnimatePresence>


            {/* Main Content (Scrollable Container) */}
            <div className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
                <div className="relative pt-20 md:pt-24 lg:pt-32 pb-12 md:pb-20 px-4 md:px-6 max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 md:gap-12 lg:gap-20 items-start">

                        {/* Left: Premium Cover Section */}
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0, rotateY: 20 }}
                            animate={{ scale: 1, opacity: 1, rotateY: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="lg:col-span-5 xl:col-span-4 perspective-1000 max-w-[280px] sm:max-w-md md:max-w-none mx-auto lg:mx-0 w-full"
                        >
                            <div className="relative group">
                                {/* Glow Effect */}
                                <div className="absolute -inset-4 bg-accent/20 rounded-[2rem] blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

                                <div className="relative aspect-[2/3] w-full rounded-[2rem] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] group-hover:shadow-accent/20 group-hover:scale-[1.02] border border-white/10 transition-all duration-700 bg-gray-900">
                                    {book.cover_image ? (
                                        <img src={book.cover_image} alt={book.title} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-gray-700">
                                            <BookOpen size={64} className="opacity-20" />
                                            <span className="text-xs uppercase font-black tracking-widest">No Cover Available</span>
                                        </div>
                                    )}
                                    {/* Shine Effect */}
                                    <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                                </div>
                            </div>

                            {/* Quick Stats */}
                            <div className="grid grid-cols-3 gap-2 md:gap-4 mt-6 md:mt-10">
                                {[
                                    { label: 'Rating', val: book.rating || '4.9', icon: <Star size={14} className="text-yellow-400 fill-yellow-400" /> },
                                    { label: 'Reading', val: book.reading_time || '2h 15m', icon: <Clock size={14} className="text-blue-400" /> },
                                    { label: 'Level', val: book.category, icon: <Activity className="text-green-400" /> }
                                ].map((stat, i) => (
                                    <div key={i} className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex flex-col items-center text-center">
                                        <div className="mb-2 p-2 bg-white/5 rounded-full">{stat.icon}</div>
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</span>
                                        <span className="text-sm font-black text-white mt-0.5">{stat.val}</span>
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Right: Info Section */}
                        <div className="lg:col-span-7 xl:col-span-8 space-y-12">
                            <motion.div
                                initial={{ y: 30, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.2, duration: 0.6 }}
                            >
                                <div className="inline-flex items-center gap-2 border border-accent/30 bg-accent/10 px-4 py-1.5 rounded-full mb-6">
                                    <span className="w-2 h-2 rounded-full bg-accent animate-pulse"></span>
                                    <span className="text-xs font-black text-accent uppercase tracking-widest">{book.category} Program</span>
                                </div>

                                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tighter mb-4 md:mb-6 leading-[1.1] md:leading-[0.9] drop-shadow-2xl text-center lg:text-left">
                                    {book.title}
                                </h1>

                                <p className="text-lg sm:text-xl md:text-2xl text-gray-400 font-light leading-relaxed mb-8 text-center lg:text-left">
                                    {book.details || "An immersive learning experience designed to enhance your linguistic skills."}
                                </p>

                                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 w-full justify-center lg:justify-start">
                                    <button
                                        onClick={() => {
                                            setViewState('INDEX');
                                            setShowToolbar(false);
                                        }}
                                        className="w-full sm:w-auto px-6 py-4 md:px-10 md:py-5 bg-accent hover:bg-orange-500 text-white rounded-2xl font-black text-sm md:text-lg justify-center shadow-2xl shadow-accent/30 flex items-center gap-3 transition-all hover:scale-105 active:scale-95"
                                    >
                                        <Play size={24} fill="currentColor" />
                                        START READING
                                    </button>
                                    <button className="w-full sm:w-auto px-6 py-4 md:px-8 md:py-5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-2xl font-bold justify-center flex items-center gap-3 transition-all">
                                        <Download size={20} />
                                        PDF RESOURCES
                                    </button>
                                </div>
                            </motion.div>

                            {/* Full Description Section */}
                            <motion.div
                                initial={{ y: 50, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                transition={{ delay: 0.4, duration: 0.8 }}
                                className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-[2.5rem] p-6 sm:p-8 md:p-12 shadow-2xl relative overflow-hidden mt-8 md:mt-12"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-5 hidden lg:block">
                                    <BookOpen size={120} />
                                </div>

                                <h2 className="text-2xl font-black text-white uppercase tracking-tighter mb-8 flex items-center gap-4">
                                    <span className="w-12 h-1 bg-accent rounded-full text-2xl tracking-tighter shadow-lg"></span>
                                    About this book
                                </h2>

                                <div className="text-gray-400 text-lg leading-relaxed space-y-6 font-medium">
                                    {book.description ? (
                                        book.description.split('\n').map((para, i) => (
                                            <p key={i}>{para}</p>
                                        ))
                                    ) : (
                                        <>
                                            <p>
                                                Welcome to the TTE platform, where education meets cutting-edge technology. This interactive book has been meticulously developed by pedagogical experts to offer you a clear and structured path to academic success.
                                            </p>
                                            <p>
                                                Inside you will find practical exercises, immersive readings, and multimedia content designed to be consumed smoothly and dynamically. Each chapter is optimized to maximize your information retention.
                                            </p>
                                        </>
                                    )}
                                </div>

                                <div className="mt-8 md:mt-12 pt-8 md:pt-12 border-t border-white/10 flex flex-col sm:flex-row flex-wrap gap-6 md:gap-10">
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Publisher</p>
                                        <p className="text-base font-bold text-white">{book.publisher || 'TTE Global Education'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">Publication</p>
                                        <p className="text-base font-bold text-white">{book.publication_date || 'March 2026'}</p>
                                    </div>
                                    <div>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.2em] mb-2">ISBN</p>
                                        <p className="text-base font-bold text-white tracking-widest">{book.isbn || '978-3-16-148410-0'}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overlays for Index and Reading */}
            <AnimatePresence mode="wait">
                {viewState === 'INDEX' && (
                    <motion.div
                        key="index"
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        exit={{ x: 50, opacity: 0 }}
                        className={`absolute inset-0 z-[150] bg-[#1e293b]/50 backdrop-blur-xl overflow-y-auto pt-20 md:pt-32 pb-10 md:pb-20 px-4 md:px-12 ${transitionClass}`}
                    >
                        <div className="max-w-4xl mx-auto">
                            <div className="flex flex-col md:flex-row justify-center items-center gap-4 md:gap-6 mb-8 md:mb-16">
                                <motion.h2
                                    initial={{ y: -20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    className="text-4xl sm:text-7xl font-black tracking-tighter text-white/90 m-0"
                                >
                                    Contents
                                </motion.h2>
                                <button
                                    onClick={onBack}
                                    className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-black text-[10px] uppercase tracking-[0.2em] text-gray-400 hover:text-white group sm:mt-4 shadow-xl"
                                >
                                    <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                                    Return to Library
                                </button>
                            </div>

                            <div className="bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl">
                                <div className="grid grid-cols-12 bg-white/5 border-b border-white/10 px-6 py-4">
                                    <div className="col-span-10 text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Topics</div>
                                    <div className="col-span-2 text-center text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Pages</div>
                                </div>

                                <div className="divide-y divide-white/5">
                                    {contents.reduce((acc: any[], item, idx) => {
                                        // Color logic: increment when a new chapter starts
                                        const lastChapterIdx = contents.slice(0, idx + 1).filter(c => c.type === 'chapter').length - 1;
                                        const color = colors[lastChapterIdx % colors.length];

                                        acc.push(
                                            <motion.div
                                                key={idx}
                                                initial={{ x: -20, opacity: 0 }}
                                                animate={{ x: 0, opacity: 1 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => {
                                                    isNavigatingFromTOC.current = true;
                                                    setSelectedChapter(item);
                                                    setViewState('READING');
                                                }}
                                                className={`grid grid-cols-12 px-6 py-4 cursor-pointer transition-all items-center ${color.bg} ${color.hover} group`}
                                            >
                                                <div className={`col-span-10 flex items-center gap-4 ${item.type === 'chapter' ? 'font-black text-sm md:text-lg uppercase tracking-wider' : 'font-medium pl-6 text-white/80'}`}>
                                                    <span className={color.text}>{item.title}</span>
                                                </div>
                                                <div className="col-span-2 text-center text-sm font-bold text-gray-400 group-hover:text-white transition-colors">
                                                    {item.page_number}
                                                </div>
                                            </motion.div>
                                        );
                                        return acc;
                                    }, [])}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* SEARCH MODAL OVERLAY */}
                <AnimatePresence>
                    {showSearch && (
                        <motion.div
                            initial={{ y: -50, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -50, opacity: 0 }}
                            className="absolute inset-x-0 top-0 z-[200] p-4 md:p-8 flex justify-center backdrop-blur-sm pointer-events-auto"
                        >
                            <div className="bg-[#1e293b] border border-white/20 shadow-2xl rounded-2xl w-full max-w-2xl px-6 py-6 overflow-hidden flex flex-col gap-4">
                                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                                    <div className="flex items-center gap-3 w-full relative">
                                        <Search className="text-accent absolute left-0" size={20} />
                                        <input
                                            id="b-search-input"
                                            className="w-full bg-transparent outline-none border-none text-white text-lg placeholder-white/30 pl-8 pr-10"
                                            placeholder="Search by Title, Topic or Page Number..."
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            autoComplete="off"
                                        />
                                        {searchQuery && (
                                            <button onClick={() => setSearchQuery('')} className="absolute right-0 text-white/50 hover:text-white transition-colors">
                                                <X size={18} />
                                            </button>
                                        )}
                                    </div>
                                    <button onClick={() => setShowSearch(false)} className="ml-4 p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-all">
                                        <X size={20} />
                                    </button>
                                </div>
                                
                {/* Search Results Scrollable Area */}
                                <div className="max-h-[50vh] overflow-y-auto space-y-1 pr-2 custom-scrollbar">
                                    {searchQuery ? (
                                        searchResults.length > 0 ? (
                                            searchResults.map((item, idx) => (
                                                <div 
                                                    key={idx} 
                                                    onClick={() => {
                                                        isNavigatingFromTOC.current = true;
                                                        setSelectedChapter(item);
                                                        setViewState('READING');
                                                        setShowSearch(false);
                                                        setSearchQuery('');
                                                    }}
                                                    className="flex justify-between items-center p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-colors group"
                                                >
                                                    <div className="flex flex-col">
                                                        <span className="text-white font-medium group-hover:text-accent transition-colors">
                                                            {item.title}
                                                        </span>
                                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider">
                                                            {item.type}
                                                        </span>
                                                    </div>
                                                    <span className="text-sm font-bold text-gray-400 bg-black/20 px-3 py-1 rounded-full border border-white/5">
                                                        Pg {item.page_number}
                                                    </span>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="text-center py-8 text-white/40">
                                                No results found for "{searchQuery}"
                                            </div>
                                        )
                                    ) : (
                                        <div className="text-center py-6 text-white/20 text-sm">
                                            Type content to search...
                                        </div>
                                    )}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {viewState === 'READING' && selectedChapter && (
                    <motion.div
                        key="reading"
                        ref={bookContainerRef}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className={`reader-fullscreen bg-[#0f172a] ${transitionClass}`}
                    >
                        <div className={`w-full flex-1 flex flex-col mx-auto perspective-2000`}>

                            <div className={`w-full flex-1 flex flex-col min-h-0`}>
                                <div className={`flex-1 flex flex-col bg-white/5 backdrop-blur-xl border-t border-white/10 shadow-2xl relative transition-all duration-300 overflow-hidden`}>                                    {/* Merged Header & Navigation Section */}
                                    {!isFullscreen && (
                                        <div className="flex flex-col gap-y-2 mb-1 border-b border-white/5 pb-2 pt-1 px-2 md:px-4 pointer-events-auto">
                                            {/* Row 1: All Nav Icons Scrollable + Mobile Page Jumper */}
                                            <div className="flex items-center justify-between w-full">
                                                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar shrink mx-1 pb-1 pl-14 sm:pl-0">
                                                    <button onClick={onBack} className="p-2 md:p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white group flex-shrink-0" title="Return to Library">
                                                        <BookOpen size={16} className="md:w-3.5 md:h-3.5" />
                                                    </button>
                                                    <button onClick={() => setViewState('INDEX')} className="p-2 md:p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white group flex-shrink-0" title="Back to Index">
                                                        <Menu size={16} className="md:w-3.5 md:h-3.5" />
                                                    </button>
                                                    <button onClick={() => setIsSinglePage(!isSinglePage)} className="p-2 md:p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white group flex items-center justify-center relative flex-shrink-0" title={isSinglePage ? "Switch to Double Page View" : "Switch to Single Page View"}>
                                                        <Layout size={16} className={`transition-transform md:w-3.5 md:h-3.5 ${isSinglePage ? 'rotate-90' : ''}`} />
                                                        <span className="absolute -bottom-1 -right-1 text-[8px] md:text-[7px] font-black bg-accent text-white px-1 rounded-sm leading-none">{isSinglePage ? '1' : '2'}</span>
                                                    </button>
                                                    <button onClick={toggleFullscreen} className="p-2 md:p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white group flex-shrink-0" title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen (F11)"}>
                                                        {isFullscreen ? <Shrink size={16} className="md:w-3.5 md:h-3.5" /> : <Expand size={16} className="md:w-3.5 md:h-3.5" />}
                                                    </button>
                                                    <button onClick={() => { setShowSearch(true); setTimeout(() => document.getElementById('b-search-input')?.focus(), 100); }} className="p-2 md:p-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white group flex-shrink-0" title="Search Book Contents">
                                                        <Search size={16} className="md:w-3.5 md:h-3.5" />
                                                    </button>

                                                    <button 
                                                        onClick={() => setFlipMuted(!flipMuted)} 
                                                        className={`p-2 md:p-1.5 rounded-lg bg-white/5 border border-white/10 transition-all group flex-shrink-0 ${flipMuted ? 'text-red-400 hover:bg-red-400/10 hover:text-red-300' : 'text-gray-400 hover:bg-white/10 hover:text-white'}`} 
                                                        title={flipMuted ? "Unmute Flip Sound" : "Mute Flip Sound"}>
                                                        {flipMuted ? <VolumeX size={16} className="md:w-3.5 md:h-3.5" /> : <Volume2 size={16} className="md:w-3.5 md:h-3.5" />}
                                                    </button>
                                                </div>

                                                {/* Page Jumper (Mobile Only) */}
                                                <div className="sm:hidden flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-1.5 rounded-xl transition-all overflow-hidden flex-shrink-0 ml-2">
                                                    <form onSubmit={handleJumpPageSubmit} className="flex flex-row items-center gap-0.5">
                                                        <span className="text-accent text-[8px] font-black shrink-0 mr-1">PG</span>
                                                        <input 
                                                            type="text"
                                                            placeholder={String(selectedChapter?.page_number || '')}
                                                            value={jumpPageInput}
                                                            onChange={(e) => setJumpPageInput(e.target.value)}
                                                            className="w-7 bg-accent/10 text-accent text-[10px] font-black border-b border-accent/20 focus:border-accent focus:bg-accent/20 outline-none text-center p-0.5 rounded-sm transition-all appearance-none placeholder:text-accent/40"
                                                            onFocus={(e) => e.target.select()}
                                                        />
                                                    </form>
                                                </div>
                                            </div>

                                            {/* Row 2: Breadcrumbs & Desktop Right Nav */}
                                            <div className="flex flex-wrap items-center justify-between w-full">
                                                {/* Desktop-only Breadcrumbs */}
                                                <div className="hidden sm:flex items-center gap-1 md:gap-2 text-[10px] md:text-[9px] font-black uppercase tracking-[0.2em] truncate min-w-0 pr-2">
                                                    <div className="flex items-center gap-1 border border-accent/30 bg-accent/10 px-2 py-0.5 rounded-full truncate shrink min-w-0 max-w-[150px]">
                                                        <span className="text-accent truncate">{book?.title}</span>
                                                    </div>
                                                    <span className="text-white/40 shrink-0">/</span>
                                                    <h2 className="m-0 text-white/50 inline truncate shrink min-w-0">{selectedChapter?.title}</h2>
                                                </div>

                                                {/* Right: Prev/Next & Progress Navigation (Desktop Only) */}
                                                <div className="hidden sm:flex items-center gap-1 sm:gap-2 text-[9px] font-black uppercase tracking-[0.2em] shrink-0 justify-end flex-1 min-w-0">
                                                    <button onClick={handleFlipPrev} className="flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-gray-400 hover:text-white group relative shrink-0">
                                                    <ArrowLeft size={10} className="group-hover:-translate-x-1 transition-transform" />
                                                    <span>Prev</span>
                                                </button>

                                                {/* Desktop Page Jumper */}
                                                <div className="flex items-center gap-2 sm:gap-3 bg-white/5 border border-white/10 px-2 sm:px-4 py-1.5 rounded-xl hover:border-accent/40 transition-all group/jumper overflow-hidden">
                                                    <div className="hidden sm:flex items-center gap-1.5 opacity-70 px-1 shrink-0">
                                                        <span className="text-white/50">Prog: {Math.round(((contents.findIndex(c => c.title === selectedChapter.title) + 1) / contents.length) * 100)}%</span>
                                                        <span className="w-1 h-1 rounded-full bg-white/20 mx-1"></span>
                                                    </div>
                                                    
                                                    <form onSubmit={handleJumpPageSubmit} className="flex flex-row items-center gap-1">
                                                        <span className="text-accent text-[10px] font-black shrink-0">PG</span>
                                                        <input 
                                                            type="text"
                                                            placeholder={String(selectedChapter?.page_number || '')}
                                                            value={jumpPageInput}
                                                            onChange={(e) => setJumpPageInput(e.target.value)}
                                                            className="w-8 sm:w-10 bg-accent/10 text-accent text-[11px] font-black border-b-2 border-accent/20 focus:border-accent focus:bg-accent/20 outline-none text-center p-1 rounded-sm transition-all appearance-none placeholder:text-accent/40"
                                                            onFocus={(e) => e.target.select()}
                                                            onBlur={() => {}}
                                                            title="Enter page number and press Enter"
                                                        />
                                                        <span className="text-white/30 text-[9px] sm:text-[10px] ml-0.5 shrink-0">/ {contents.length}</span>
                                                    </form>
                                                </div>

                                                <button onClick={handleFlipNext} className="flex items-center justify-center gap-1 px-3 py-1.5 lg:py-1 rounded-lg bg-accent/20 border border-accent/30 hover:bg-accent/30 transition-all text-accent group shadow-lg shadow-accent/10 relative shrink-0">
                                                    <span>Next</span>
                                                    <ArrowRight size={10} className="group-hover:translate-x-1 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                    {/* Content Section utilizing HTMLFlipBook wrapped in Pan-Zoom */}
                                    <div className={`w-full flex-1 flex flex-col items-center justify-center py-2 min-h-0 relative ${isFullscreen ? 'h-full' : ''}`}>
                                        {contents.length > 0 ? (
                                            <TransformWrapper
                                                key={`viewer-${isSinglePage}`}
                                                initialScale={1}
                                                minScale={0.5}
                                                maxScale={4}
                                                centerOnInit={true}
                                                wheel={{ disabled: false, step: 0.1 }}
                                                doubleClick={{ disabled: false, step: 0.5 }}
                                                pinch={{ disabled: false }}
                                                panning={{ disabled: currentScale <= 1.05 }}
                                                onTransformed={(_, state) => setCurrentScale(state.scale)}
                                            >
                                                {({ zoomIn, zoomOut, resetTransform }) => (
                                                    <div className="w-full h-full relative group">
                                                         {/* THE MASTER CONTROLLER OVERLAY: Moved OUTSIDE TransformComponent to avoid event interference */}
                                                         <div className="absolute inset-0 z-[500] pointer-events-none flex">
                                                             {/* Left Navigation Zone */}
                                                             <div 
                                                                className="nav-zone h-full w-[17%] sm:w-[10%] pointer-events-auto cursor-pointer"
                                                                onClick={handleFlipPrev}
                                                             ></div>

                                                             {/* Protected Central Area */}
                                                             <div className="h-full flex-1 pointer-events-none relative"></div>

                                                             {/* Right Navigation Zone */}
                                                             <div 
                                                                className="nav-zone h-full w-[17%] sm:w-[10%] pointer-events-auto cursor-pointer"
                                                                onClick={handleFlipNext}
                                                             ></div>
                                                         </div>
                                                        {/* Fixed Zoom Controls on Screen */}
                                                        <div className="absolute top-2 right-2 z-50 flex flex-col gap-1 bg-[#161930]/80 backdrop-blur-md p-1.5 rounded-xl border border-white/10 shadow-xl">
                                                            <button title="Zoom In" onClick={() => zoomIn(0.5)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                                                <ZoomIn size={14} />
                                                            </button>
                                                            <button title="Zoom Out" onClick={() => zoomOut(0.5)} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                                                <ZoomOut size={14} />
                                                            </button>
                                                            <div className="w-full h-[1px] bg-white/10 my-0.5" />
                                                            <button title="Fit to Screen" onClick={() => resetTransform()} className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors">
                                                                <Maximize size={14} />
                                                            </button>
                                                            <div className="w-full h-[1px] bg-white/10 my-0.5" />
                                                            <button title="Toggle Fullscreen" onClick={toggleFullscreen} className="p-1.5 rounded-lg hover:bg-accent/20 text-accent transition-colors">
                                                                {isFullscreen ? <Shrink size={14} /> : <Expand size={14} />}
                                                            </button>
                                                            <div className="w-full h-[1px] bg-white/10 my-0.5" />
                                                            <button 
                                                                title="Debug Navigation Zones (Alt+D)" 
                                                                onClick={() => setDebugNav(!debugNav)} 
                                                                className={`p-1.5 rounded-lg hover:bg-white/10 transition-colors ${debugNav ? 'text-green-500' : 'text-gray-400'}`}
                                                            >
                                                                <ArrowRight size={14} className={debugNav ? "rotate-45" : ""} />
                                                            </button>
                                                        </div>

                                                        <TransformComponent
                                                            wrapperClass="w-full h-full overflow-hidden"
                                                            wrapperStyle={{ width: '100%', height: '100%' }}
                                                            contentClass={`w-full h-full ${currentScale > 1.05 ? 'cursor-grab active:cursor-grabbing' : ''}`}
                                                        >                                                             <div 
                                                                className="relative shadow-premium bg-white/5 overflow-visible"
                                                                style={{ 
                                                                    /* On large screens subtract the sidebar width from available vw so the book is never hidden under the sidebar */
                                                                    width: isSinglePage 
                                                                        ? 'min(calc(100vw - var(--sidebar-width, 0px)), calc((var(--vh, 1dvh) * 100 - 160px - var(--sab, 0px)) * (1350 / 1909)))' 
                                                                        : 'min(calc(100vw - var(--sidebar-width, 0px)), calc((var(--vh, 1dvh) * 100 - 160px - var(--sab, 0px)) * (2700 / 1909)))',
                                                                    aspectRatio: isSinglePage ? '1350/1909' : '2700/1909'
                                                                }}
                                                            >
                                                                {/* @ts-ignore - react-pageflip typings are problematic with React 18 */}
                                                                {isSinglePage ? (
                                                                    <AnimatePresence mode="wait">
                                                                        <motion.div
                                                                            key={selectedChapter.id}
                                                                            initial={{ opacity: 0, x: 10 }}
                                                                            animate={{ opacity: 1, x: 0 }}
                                                                            exit={{ opacity: 0, x: -10 }}
                                                                            transition={{ duration: 0.2 }}
                                                                            className="w-full h-full"
                                                                        >
                                                                            <FlipbookPage
                                                                                contentItem={selectedChapter}
                                                                                debugNav={debugNav}
                                                                                onInteract={(interaction: any) => {
                                                                                    if (interaction.action === 'next') handleFlipNext();
                                                                                    if (interaction.action === 'link' && interaction.value) {
                                                                                        window.open(interaction.value, '_blank');
                                                                                    }
                                                                                    if (interaction.action === 'page' && interaction.value) {
                                                                                        const targetItem = contents.find(c => String(c.id) === String(interaction.value));
                                                                                        if (targetItem) {
                                                                                            isNavigatingFromTOC.current = true;
                                                                                            setSelectedChapter(targetItem);
                                                                                        }
                                                                                    }
                                                                                    const isTrue = interaction.isCorrect !== undefined ? interaction.isCorrect : interaction.correct;
                                                                                    if (isTrue !== undefined) {
                                                                                        if (isTrue) {
                                                                                            setValidationState('correct');
                                                                                            setValidationMessage('Excellent progress!');
                                                                                            addXp(10);
                                                                                            incrementStreak();
                                                                                        } else {
                                                                                            setValidationState('incorrect');
                                                                                            setValidationMessage('');
                                                                                            subtractHeart();
                                                                                            if (hearts <= 1) {
                                                                                                setIsGameOver(true);
                                                                                            }
                                                                                        }
                                                                                    }
                                                                                }}
                                                                            />
                                                                        </motion.div>
                                                                    </AnimatePresence>
                                                                ) : (
                                                                    <HTMLFlipBook
                                                                        width={1350}
                                                                        height={1909}
                                                                        size="stretch"
                                                                        minWidth={315}
                                                                        maxWidth={4000}
                                                                        minHeight={400}
                                                                        maxHeight={4000}
                                                                        showCover={true}
                                                                        mobileScrollSupport={true}
                                                                        usePortrait={isSinglePage}
                                                                        
                                                                        // disableFlipByClick prevents clicking the page center from turning pages
                                                                        // useMouseEvents must be true so the internal animation engine can work (flipPrev relies on it)
                                                                        disableFlipByClick={true}
                                                                        useMouseEvents={true}
                                                                        swipeDistance={999999}
                                                                        showPageCorners={true}
                                                                        
                                                                        ref={flipBookRef}
                                                                        onFlip={(e: any) => {
                                                                            const pageIdx = e.data;
                                                                            
                                                                            if (!isNavigatingFromTOC.current) {
                                                                                if (flipAudioRef.current && !flipMuted) {
                                                                                    flipAudioRef.current.currentTime = 0;
                                                                                    flipAudioRef.current.play().catch(err => console.log('Audio error:', err));
                                                                                }
                                                                                if (contents[pageIdx]) setSelectedChapter(contents[pageIdx]);
                                                                            }
                                                                        }}
                                                                        className="flip-book-container h-full w-full"
                                                                    >
                                                                    {contents.map((chapter) => (
                                                                        <FlipbookPage
                                                                            key={chapter.id}
                                                                            contentItem={chapter}
                                                                            debugNav={debugNav}
                                                                            onInteract={(interaction: any) => {
                                                                                if (interaction.action === 'next') flipBookRef.current?.pageFlip()?.flipNext();
                                                                                if (interaction.action === 'link' && interaction.value) {
                                                                                    window.open(interaction.value, '_blank');
                                                                                }
                                                                                if (interaction.action === 'page' && interaction.value) {
                                                                                    // internal link to another page/topic inside the same book
                                                                                    const targetItem = contents.find(c => String(c.id) === String(interaction.value));
                                                                                    if (targetItem) {
                                                                                        isNavigatingFromTOC.current = true;
                                                                                        setSelectedChapter(targetItem);
                                                                                    }
                                                                                }
                                                                                const isTrue = interaction.isCorrect !== undefined ? interaction.isCorrect : interaction.correct;
                                                                                if (isTrue !== undefined) {
                                                                                    if (isTrue) {
                                                                                        setValidationState('correct');
                                                                                        setValidationMessage('Excellent progress!');
                                                                                        addXp(10);
                                                                                        incrementStreak();
                                                                                    } else {
                                                                                        setValidationState('incorrect');
                                                                                        setValidationMessage('');
                                                                                        subtractHeart();
                                                                                        if (hearts <= 1) {
                                                                                            setIsGameOver(true);
                                                                                        }
                                                                                    }
                                                                                }
                                                                            }}
                                                                        />
                                                                    ))}
                                                                    </HTMLFlipBook>
                                                                )}

                                                        </div>
                                                    </TransformComponent>
                                                </div>
                                            )}
                                            </TransformWrapper>
                                        ) : (
                                            <p className="text-white/50 text-center py-12">No content available for this book.</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {/* Bottom Navigation Bar */}
                            {!isFullscreen && (
                                <div className="mt-2 flex justify-between items-center bg-white/5 backdrop-blur-md rounded-xl p-2 px-1 lg:px-4 border border-white/10 shadow-premium text-white/90 pointer-events-auto pb-safe z-[1000]">
                                    <button
                                        onClick={handleFlipPrev}
                                        className="touch-target flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all font-bold text-[12px] sm:text-[10px] uppercase tracking-widest text-gray-400 hover:text-white group w-[100px] sm:w-[120px] lg:w-auto flex-shrink-0"
                                    >
                                        <ArrowLeft size={16} className="sm:w-3 sm:h-3 group-hover:-translate-x-1 transition-transform" />
                                        Prev
                                    </button>

                                    <div className="text-center overflow-hidden flex-1 px-2">
                                        <p className="text-[10px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-accent truncate">
                                            {selectedChapter?.title}
                                        </p>
                                    </div>

                                    <button
                                        onClick={handleFlipNext}
                                        className="touch-target flex items-center justify-center gap-1.5 px-4 py-3 sm:py-2 rounded-lg bg-accent/20 border border-accent/30 hover:bg-accent/30 transition-all font-black text-[12px] sm:text-[10px] uppercase tracking-widest text-accent hover:text-orange-400 group shadow-lg shadow-accent/10 w-[100px] sm:w-[120px] lg:w-auto flex-shrink-0"
                                    >
                                        Next
                                        <ArrowRight size={16} className="sm:w-3 sm:h-3 group-hover:translate-x-1 transition-transform" />
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Validation Footer for Interactive Blocks */}
                        {viewState === 'READING' && (
                            <ValidationFooter
                                status={validationState}
                                message={validationMessage}
                                onContinue={() => {
                                    setValidationState('idle');
                                    // if correct, optionally auto-advance, or let the user click 'Next Topic' manually
                                    // handleNextTopic();
                                }}
                            />
                        )}

                        {/* Game Over Modal overlay */}
                        {isGameOver && (
                            <div className="fixed inset-0 z-[300] bg-black/80 flex flex-col items-center justify-center p-6 backdrop-blur-sm">
                                <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
                                    <div className="bg-[#ff4b4b]/10 absolute inset-0 pb-32 z-0"></div>
                                    <div className="relative z-10 flex flex-col items-center">
                                        <div className="w-24 h-24 mb-6 text-[#ff4b4b]">
                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                                {/* Cracked line */}
                                                <path d="M12 5.67l-1 5 3 2-2 4 4 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"></path>
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-black text-gray-800 mb-2">You ran out of lives!</h2>
                                        <p className="text-gray-500 font-medium mb-8">You must wait for them to regenerate or try again later.</p>
                                        <button onClick={() => { setIsGameOver(false); setViewState('INDEX'); }} className="w-full py-4 rounded-2xl bg-[#ff4b4b] text-white font-black hover:bg-[#ea2b2b] shadow-[0_4px_0_0_#ba1919] transition-all active:translate-y-1 active:shadow-none mb-3">
                                            EXIT LESSON
                                        </button>
                                        <button onClick={() => setIsGameOver(false)} className="w-full py-4 text-gray-400 font-bold hover:bg-gray-100 rounded-2xl transition-colors">
                                            LATER
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default BookReader;
