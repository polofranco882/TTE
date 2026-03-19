import React from 'react';
import { motion } from 'framer-motion';
import { Image as ImageIcon, Music, HelpCircle, ArrowRight, Video, Play, Volume2, Maximize, Minimize } from 'lucide-react';
import InteractiveActivity from './InteractiveActivity';
import WordBankBlock from './WordBankBlock';
import MatchingPairsBlock from './MatchingPairsBlock';
import ClozeBlock from './ClozeBlock';
import DictationBlock from './DictationBlock';
import ListenTapBlock from './ListenTapBlock';
import PronunciationBlock from './PronunciationBlock';
import TranslationBlock from './TranslationBlock';
import StoryDialogueBlock from './StoryDialogueBlock';
import ReadingCompBlock from './ReadingCompBlock';
import CodeEditorBlock from './CodeEditorBlock';
import TextInputBlock from './TextInputBlock';
import CompletionBlock from './CompletionBlock';

export type BlockType = 'text' | 'image' | 'video' | 'audio' | 'button' | 'quiz' | 'activity' | 'html'
    | 'word_bank' | 'matching' | 'cloze' | 'listen_tap' | 'dictation' | 'pronunciation'
    | 'translation' | 'story_dialogue' | 'reading_comp' | 'gami_reward' | 'meta_hint'
    | 'code_editor' | 'layout_container' | 'text_input' | 'completion';

export interface BlockData {
    id: string;
    type: BlockType;
    data: any;
}

interface BlockRendererProps {
    block: BlockData;
    onInteract?: (blockId: string, interaction: any) => void;
    isAdmin?: boolean;
}

// --- AudioBlock extracted as a real React component so hooks work correctly ---
interface AudioBlockProps {
    data: any;
    isAdmin?: boolean;
}

const AudioBlock: React.FC<AudioBlockProps> = React.memo(({ data, isAdmin }) => {
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [progress, setProgress] = React.useState(0);
    const [error, setError] = React.useState<string | null>(null);
    const isHotspot = data.visualStyle === 'hotspot';

    // Sync audio source when data.url changes
    React.useEffect(() => {
        if (audioRef.current && data.url) {
            audioRef.current.load();
            setIsPlaying(false);
            setProgress(0);
            setError(null);
        }
    }, [data.url]);

    const togglePlay = async (e?: React.MouseEvent) => {
        if (!isAdmin && e) e.stopPropagation();
        const el = audioRef.current;
        if (!el || !data.url) return;

        try {
            if (isPlaying) {
                el.pause();
                setIsPlaying(false);
            } else {
                setError(null);
                const playPromise = el.play();
                if (playPromise !== undefined) {
                    await playPromise;
                    setIsPlaying(true);
                }
            }
        } catch (err) {
            console.error("Audio playback error:", err);
            setError("Playback failed. Try again.");
            setIsPlaying(false);
        }
    };

    const handleTimeUpdate = () => {
        const el = audioRef.current;
        if (!el || !el.duration) return;
        setProgress((el.currentTime / el.duration) * 100);
    };

    const handleEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const audioEl = data.url ? (
        <audio
            ref={audioRef}
            src={data.url}
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
            onError={() => setError("Error loading audio")}
            preload="auto"
            crossOrigin="anonymous"
        />
    ) : null;

    if (isHotspot) {
        return (
            <div className="w-full h-full relative" title={error || (data.url ? "Click to play" : "No audio loaded")}>
                {audioEl}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={togglePlay}
                    className={`w-full h-full rounded-full flex items-center justify-center text-white transition-all relative group ${error ? 'bg-red-500/20' : 'bg-accent/20'}`}
                >
                    {/* Ring aura */}
                    <div className={`absolute inset-0 rounded-full ${isPlaying ? 'animate-ping opacity-30 shadow-[0_0_20px_rgba(255,100,0,0.5)]' : 'opacity-0 group-hover:opacity-30 transition-opacity duration-300'} ${error ? 'bg-red-500' : 'bg-accent'}`} />

                    {/* Core Button */}
                    <div className={`relative w-[75%] h-[75%] rounded-full flex items-center justify-center shadow-2xl backdrop-blur-md transition-all ${error ? 'bg-red-500 shadow-red-500/40' : 'bg-accent shadow-accent/50'}`}>
                        {error ? <Music size={20} className="opacity-50" /> :
                            isPlaying ? <Volume2 size={24} className="animate-pulse drop-shadow-md" /> :
                                <Volume2 size={24} className="drop-shadow-md" />}
                    </div>
                </motion.button>
                {error && <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-red-400 uppercase whitespace-nowrap bg-black/60 px-2 py-1 rounded-full backdrop-blur-md">{error}</div>}
            </div>
        );
    }

    return (
        <div className={`w-full p-4 border rounded-[2rem] flex items-center gap-4 h-full transition-all backdrop-blur-xl shadow-2xl relative overflow-hidden group ${error ? 'bg-red-500/10 border-red-500/20' : 'bg-gradient-to-br from-white/10 to-transparent border-white/10 hover:border-white/20'}`}>
            {/* Ambient Background Glow */}
            {!error && <div className={`absolute top-0 right-0 w-64 h-64 bg-accent/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/4 ${isPlaying ? 'opacity-80' : 'opacity-40 group-hover:opacity-60'} transition-opacity duration-1000`} />}

            {audioEl}

            {/* Play Button */}
            <button
                onClick={togglePlay}
                disabled={!data.url}
                className={`w-14 h-14 rounded-full flex items-center justify-center text-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:scale-105 active:scale-95 transition-all shrink-0 z-10 disabled:opacity-40 disabled:cursor-not-allowed ${error ? 'bg-red-500' : 'bg-gradient-to-b from-accent to-[#d97706] shadow-accent/40'}`}
            >
                {isPlaying ? <Volume2 size={24} className="animate-pulse drop-shadow-md" /> : <Play size={24} className="drop-shadow-md ml-1" />}
            </button>

            {/* Content area */}
            <div className="flex-1 overflow-hidden z-10 pr-4">
                <p className={`text-base font-black mb-2 truncate tracking-tight drop-shadow-sm ${error ? 'text-red-400' : 'text-white'}`}>{error || data.title || 'AUDIO TRACK'}</p>
                <div
                    className="h-2.5 bg-black/40 rounded-full overflow-hidden cursor-pointer shadow-inner relative border border-white/5"
                    onClick={(e) => {
                        e.stopPropagation();
                        const el = audioRef.current;
                        if (!el || !el.duration) return;
                        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
                        const ratio = (e.clientX - rect.left) / rect.width;
                        el.currentTime = ratio * el.duration;
                    }}
                >
                    <motion.div
                        className={`absolute top-0 left-0 h-full rounded-full transition-all duration-100 ${error ? 'bg-red-500' : 'bg-gradient-to-r from-yellow-400 via-accent to-orange-500'}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>

            {/* Status Tags */}
            {!data.url && !error && <span className="absolute top-3 right-3 text-[9px] bg-red-500/20 px-2.5 py-1 rounded-lg text-red-400 uppercase tracking-widest font-black shrink-0 border border-red-500/20 backdrop-blur-md">NO AUDIO</span>}
            {isAdmin && data.url && !error && <span className="absolute top-3 right-3 text-[8px] bg-white/10 px-2 py-1 rounded-md text-gray-300 uppercase tracking-widest font-black shrink-0 border border-white/5 shadow-sm backdrop-blur-md">MP3 LOADED</span>}
        </div>
    );
});

// --- VideoBlock component for play toggle overlay ---
interface VideoBlockProps {
    data: any;
    isAdmin?: boolean;
}

const VideoBlock: React.FC<VideoBlockProps> = React.memo(({ data, isAdmin }) => {
    const videoRef = React.useRef<HTMLVideoElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [isPlaying, setIsPlaying] = React.useState(false);
    const [hasStarted, setHasStarted] = React.useState(data.autoPlay || false);
    const [isFullscreen, setIsFullscreen] = React.useState(false);

    React.useEffect(() => {
        const handleFsChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    const togglePlay = (e: React.MouseEvent) => {
        if (isAdmin) return;
        e.stopPropagation();
        
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(err => console.error("Playback error", err));
                setIsPlaying(true);
                setHasStarted(true);
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
            }
        }
    };

    const toggleFullscreen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!containerRef.current) return;
        
        if (!document.fullscreenElement) {
            containerRef.current.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    };

    return (
        <div 
            ref={containerRef}
            className={`w-full h-full bg-black flex items-center justify-center relative group overflow-hidden ${isFullscreen ? 'fixed inset-0 z-[9999]' : ''}`}
        >
            {data.url ? (
                <>
                    {/* Real Video Element */}
                    <video
                        ref={videoRef}
                        src={data.url}
                        className={`w-full h-full ${isFullscreen ? 'object-contain' : 'object-cover'} transition-all duration-500 ${(!hasStarted && data.previewUrl) ? 'opacity-0' : 'opacity-100'}`}
                        controls={!isAdmin && hasStarted}
                        autoPlay={data.autoPlay}
                        loop={data.loop}
                        muted={data.muted}
                        draggable={false}
                        onPlay={() => { setIsPlaying(true); setHasStarted(true); }}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                        onClick={hasStarted ? undefined : togglePlay}
                    />

                    {/* Preview / Poster Overlay */}
                    {!hasStarted && data.previewUrl && (
                        <div className="absolute inset-0 z-10">
                            <img 
                                src={data.previewUrl} 
                                alt="Video preview" 
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute inset-0 bg-black/20" />
                        </div>
                    )}

                    {/* Play Button Overlay (Visible before start or when paused in non-controls mode) */}
                    {(!isPlaying || !hasStarted) && !isAdmin && (
                        <div
                            className="absolute inset-0 flex items-center justify-center bg-black/10 cursor-pointer z-20 group/play"
                            onClick={togglePlay}
                        >
                            <motion.div
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                className="w-20 h-20 bg-accent/90 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(255,100,0,0.4)] backdrop-blur-md border border-white/20 transition-all group-hover/play:bg-accent"
                            >
                                <Play size={40} className="text-white fill-white ml-2 transition-transform group-hover/play:scale-110" />
                            </motion.div>
                        </div>
                    )}

                    {/* Fullscreen Toggle Button (Custom Overlay) */}
                    {data.allowFullscreen && data.url && !isAdmin && (
                        <button
                            onClick={toggleFullscreen}
                            className="absolute bottom-4 right-4 z-30 p-2.5 bg-black/40 hover:bg-accent rounded-xl text-white backdrop-blur-md border border-white/10 opacity-0 group-hover:opacity-100 transition-all shadow-xl"
                            title={isFullscreen ? "Exit Fullscreen" : "Maximize Video"}
                        >
                            {isFullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
                        </button>
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center gap-2 text-gray-600">
                    <Video size={48} />
                    <span className="text-[10px] font-black uppercase tracking-widest text-center px-4">Video Placeholder<br/><span className="lowercase font-normal opacity-50">Please set a URL or Upload a file</span></span>
                </div>
            )}
            
            {/* Admin visual feedback */}
            {isAdmin && <div className="absolute inset-0 bg-accent/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 rounded-xl border-2 border-dashed border-accent/40"><Play size={40} className="text-white fill-white ml-2" /></div>}
        </div>
    );
});

const BlockRenderer: React.FC<BlockRendererProps> = React.memo(({ block, onInteract, isAdmin }) => {
    const { type, data } = block;

    const renderText = () => {
        const isHtml = typeof data.content === 'string' && data.content.trim().startsWith('<');

        return (
            <div className="w-full h-full flex items-start justify-start p-3 relative overflow-hidden">
                {isHtml ? (
                    <div
                        className="w-full prose prose-invert max-w-none text-sm
                            [&_h1]:text-3xl [&_h1]:font-black [&_h1]:mb-2 [&_h1]:leading-tight
                            [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:mb-2
                            [&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-1
                            [&_h4]:text-lg [&_h4]:font-bold
                            [&_p]:mb-1 [&_p]:leading-relaxed
                            [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-400
                            [&_pre]:bg-black/40 [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-xs [&_pre]:font-mono
                            [&_a]:text-accent [&_a]:underline
                            [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-1
                            [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-1
                            [&_li]:mb-0.5
                            [&_hr]:border-white/20 [&_hr]:my-2
                            [&_strong]:font-black [&_em]:italic [&_u]:underline [&_s]:line-through"
                        dangerouslySetInnerHTML={{ __html: data.content }}
                    />
                ) : (
                    <div
                        className="text-lg text-gray-300 leading-relaxed w-full"
                        style={{
                            color: data.color,
                            textAlign: data.textAlign || 'left',
                            fontWeight: data.fontWeight || 'normal'
                        }}
                    >
                        {data.content || 'Text content...'}
                    </div>
                )}
            </div>
        );
    };

    const renderImage = () => (
        <div className="w-full h-full relative">
            {data.url ? (
                <img
                    src={data.url}
                    alt={data.alt || ''}
                    className="w-full h-full object-cover"
                    draggable={false}
                    onDragStart={e => e.preventDefault()}
                />
            ) : (
                <div className="bg-white/5 w-full h-full flex flex-col items-center justify-center gap-3 text-gray-600">
                    <ImageIcon size={isAdmin ? 32 : 48} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Image Placeholder</span>
                </div>
            )}
            {data.caption && <p className="absolute bottom-0 left-0 right-0 p-3 text-center text-[10px] text-gray-400 font-bold uppercase tracking-widest bg-black/60 backdrop-blur-md">{data.caption}</p>}
        </div>
    );

    const renderVideo = () => <VideoBlock data={data} isAdmin={isAdmin} />;

    const renderAudio = () => <AudioBlock data={data} isAdmin={isAdmin} />;

    const renderButton = () => (
        <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={(e) => {
                if (isAdmin) return;
                e.stopPropagation();
                onInteract?.(block.id, { action: data.action, value: data.value });
            }}
            className={`w-full h-full rounded-2xl font-black transition-all flex items-center justify-center gap-2 shadow-xl border-2 ${data.style === 'outline' ? 'border-accent text-accent hover:bg-accent/10' : 'bg-accent border-white/10 text-white hover:bg-orange-600'}`}
            style={{ fontSize: data.fontSize || '16px' }}
        >
            <span className="truncate px-2">{data.label || 'Action'}</span>
            {!data.hideIcon && <ArrowRight size={18} className="shrink-0" />}
        </motion.button>
    );

    const renderQuiz = () => {
        const [selected, setSelected] = React.useState<number | null>(null);
        const [showFeedback, setShowFeedback] = React.useState(false);

        const handleOptionClick = (idx: number, e: React.MouseEvent) => {
            if (isAdmin || showFeedback) return;
            e.stopPropagation();
            setSelected(idx);
            setShowFeedback(true);
            const isCorrect = idx === data.answerIndex;
            onInteract?.(block.id, { selected: idx, correct: isCorrect });

            if (!isCorrect) {
                // If incorrect, unlock after a moment so user can try again
                setTimeout(() => {
                    setShowFeedback(false);
                    setSelected(null);
                }, 2000);
            }
        };

        return (
            <div className="w-full h-full p-6 bg-white/5 border border-white/10 rounded-[2rem] shadow-2xl relative overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-accent/20 rounded-lg text-accent shrink-0">
                        <HelpCircle size={20} />
                    </div>
                    <h3 className="text-xl font-black text-white leading-tight">{data.question || 'New Quiz Question'}</h3>
                </div>

                <div className="space-y-3">
                    {(data.options || ['Option 1', 'Option 2']).map((opt: string, i: number) => {
                        const isCorrect = i === data.answerIndex;
                        const isSelected = selected === i;

                        let stateClass = "bg-white/5 border-white/10 hover:bg-white/10";
                        if (showFeedback) {
                            if (isCorrect) stateClass = "bg-green-500/20 border-green-500/50 text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]";
                            else if (isSelected) stateClass = "bg-red-500/20 border-red-500/50 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.2)]";
                            else stateClass = "opacity-40 border-white/5";
                        }

                        return (
                            <button
                                key={i}
                                onClick={(e) => handleOptionClick(i, e)}
                                disabled={showFeedback}
                                className={`w-full p-4 rounded-xl border text-left font-black transition-all flex justify-between items-center ${stateClass}`}
                            >
                                <span className="text-sm">{opt}</span>
                                {showFeedback && isCorrect && <div className="w-2.5 h-2.5 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]"></div>}
                                {showFeedback && isSelected && !isCorrect && <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]"></div>}
                            </button>
                        );
                    })}
                </div>

                {showFeedback && data.feedback && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-xl text-xs font-bold text-accent leading-relaxed italic"
                    >
                        {data.feedback}
                    </motion.div>
                )}
            </div>
        );
    };

    const renderActivity = () => (
        <InteractiveActivity
            data={data}
            isAdmin={isAdmin}
            onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })}
        />
    );

    const renderHtml = () => (
        <div className="w-full h-full relative" style={{ pointerEvents: isAdmin ? 'none' : 'auto' }}>
            {data.content ? (
                <iframe
                    srcDoc={data.content}
                    className="w-full h-full border-0 absolute inset-0 z-0 bg-white"
                    sandbox="allow-scripts allow-same-origin"
                    scrolling="yes"
                />
            ) : (
                <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 border-2 border-dashed border-white/20 text-gray-500 gap-3">
                    <span className="text-[10px] uppercase font-black tracking-widest text-center">Empty HTML Block</span>
                </div>
            )}
            {isAdmin && <div className="absolute inset-0 bg-transparent z-10"></div>}
        </div>
    );

    const renderStub = (name: string, desc: string) => (
        <div className="w-full h-full flex flex-col items-center justify-center bg-white/5 border border-dashed border-white/20 rounded-xl p-4 text-center">
            <h4 className="text-white font-black text-sm mb-1">{name}</h4>
            <p className="text-gray-400 text-[10px] leading-tight">{desc}</p>
        </div>
    );

    const renderContent = () => {
        switch (type) {
            case 'text': return renderText();
            case 'image': return renderImage();
            case 'video': return renderVideo();
            case 'audio': return renderAudio();
            case 'button': return renderButton();
            case 'quiz': return renderQuiz();
            case 'activity': return renderActivity();
            case 'html': return renderHtml();
            case 'word_bank': return <WordBankBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'matching': return <MatchingPairsBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'cloze': return <ClozeBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'dictation': return <DictationBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'listen_tap': return <ListenTapBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'pronunciation': return <PronunciationBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'translation': return <TranslationBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'story_dialogue': return <StoryDialogueBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'reading_comp': return <ReadingCompBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'gami_reward': return renderStub('Reward', 'XP, streak, or chests');
            case 'meta_hint': return renderStub('Hint/Explanation', 'Grammar tips or context');
            case 'code_editor': return <CodeEditorBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'text_input': return <TextInputBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'completion': return <CompletionBlock data={data} isAdmin={isAdmin} onComplete={(isCorrect) => onInteract?.(block.id, { isCorrect })} />;
            case 'layout_container': return renderStub('Container', 'Group blocks together');
            default: return <div className="p-4 bg-red-500/10 text-red-400 rounded-lg text-[10px] font-black uppercase">Unknown: {type}</div>;
        }
    };

    const isBubble = type === 'text' && data.bubbleType && data.bubbleType !== 'none';
    const bubbleType = data.bubbleType || 'none';
    const tailPos = data.bubbleTail || 'bottom-left';
    const borderColor = data.borderColor || '#ffffff';
    const bubbleColor = data.bubbleColor || '#161930';

    // === BUBBLE SVG RENDERER ===
    const renderBubbleSVG = () => {
        if (!isBubble) return null;

        const bColor = borderColor; // Border / outline color
        const bgCol = bubbleColor;  // Fill color
        const bw = 5; // Border width in viewBox units

        // --- SPEECH BUBBLE ---
        if (bubbleType === 'speech') {
            const r = 12; // corner radius
            const tailPoints: Record<string, string> = {
                'bottom-left': '15,97  8,120  40,97',
                'bottom-right': '60,97  92,120 85,97',
                'top-left': '15,3   8,-20  40,3',
                'top-right': '60,3   92,-20 85,3',
            };
            const tail = tailPoints[tailPos] || tailPoints['bottom-left'];
            return (
                <svg
                    className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{ overflow: 'visible' }}
                >
                    {/* Outer border shape (tail + body) */}
                    <polygon points={tail} fill={bColor} />
                    <rect x="0" y="0" width="100" height="100" rx={r} ry={r} fill={bColor} />
                    {/* Inner fill (tail + body) — covers tail base */}
                    <polygon points={tail} fill={bgCol} />
                    <rect x={bw} y={bw} width={100 - bw * 2} height={100 - bw * 2} rx={r - 2} ry={r - 2} fill={bgCol} />
                </svg>
            );
        }

        // --- THOUGHT BUBBLE ---
        if (bubbleType === 'thought') {
            // Chain circles positions per tail direction
            const chains: Record<string, [number, number, number][]> = {
                'bottom-left': [[22, 106, 5], [16, 118, 3.5], [12, 128, 2.5]],
                'bottom-right': [[78, 106, 5], [84, 118, 3.5], [88, 128, 2.5]],
                'top-left': [[22, -6, 5], [16, -18, 3.5], [12, -28, 2.5]],
                'top-right': [[78, -6, 5], [84, -18, 3.5], [88, -28, 2.5]],
            };
            const chain = chains[tailPos] || chains['bottom-left'];
            return (
                <svg
                    className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{ overflow: 'visible' }}
                >
                    {/* Chain circles */}
                    {chain.map(([cx, cy, r], i) => (
                        <g key={i}>
                            <circle cx={cx} cy={cy} r={r} fill={bColor} />
                            <circle cx={cx} cy={cy} r={r - 1.5} fill={bgCol} />
                        </g>
                    ))}
                    {/* Oval body */}
                    <ellipse cx="50" cy="50" rx="50" ry="50" fill={bColor} />
                    <ellipse cx="50" cy="50" rx={50 - bw} ry={50 - bw} fill={bgCol} />
                </svg>
            );
        }

        // --- SHOUT / STAR BURST ---
        if (bubbleType === 'shout') {
            const numSpikes = 14;
            const cx = 50, cy = 50;
            const outerR = 50, innerR = 34;
            const pts: string[] = [];
            for (let i = 0; i < numSpikes * 2; i++) {
                const angle = (i * Math.PI) / numSpikes - Math.PI / 2;
                const r2 = i % 2 === 0 ? outerR : innerR;
                pts.push(`${cx + r2 * Math.cos(angle)},${cy + r2 * Math.sin(angle)}`);
            }
            // Smaller inner star for fill
            const innerPts: string[] = [];
            for (let i = 0; i < numSpikes * 2; i++) {
                const angle = (i * Math.PI) / numSpikes - Math.PI / 2;
                const r2 = i % 2 === 0 ? outerR - bw : innerR + bw / 2;
                innerPts.push(`${cx + r2 * Math.cos(angle)},${cy + r2 * Math.sin(angle)}`);
            }
            return (
                <svg
                    className="absolute inset-0 w-full h-full z-10 pointer-events-none"
                    viewBox="0 0 100 100"
                    preserveAspectRatio="none"
                    style={{ overflow: 'visible' }}
                >
                    <polygon points={pts.join(' ')} fill={bColor} />
                    <polygon points={innerPts.join(' ')} fill={bgCol} />
                </svg>
            );
        }

        return null;
    };

    return (
        <div
            className={`w-full h-full pointer-events-auto transition-all relative block-interactive`}
            style={{
                opacity: data.opacity ?? 1,
                // Frame preset overrides block-level border/bg when enabled
                ...((type === 'text' || type === 'activity') && data.frameStyle && data.frameStyle !== 'none' ? {
                    backgroundColor: data.frameBg || '#0a1560',
                    border: `5px solid ${data.frameBorder || '#cc0000'}`,
                    boxShadow: `inset 0 0 0 3px ${data.frameInner || '#ffffff'}`,
                    borderRadius: `${data.borderRadius || 0}px`,
                    overflow: 'hidden',
                    color: data.color || 'inherit',
                } : isBubble ? {
                    color: data.color || 'inherit',
                } : {
                    overflow: 'hidden',
                    borderRadius: `${data.borderRadius || 0}px`,
                    boxShadow: data.boxShadow || 'none',
                    border: `${data.borderWidth || 0}px solid ${data.borderColor || 'transparent'}`,
                    backgroundColor: data.bgColor || 'transparent',
                    color: data.color || 'inherit',
                })
            }}
        >
            {renderBubbleSVG()}
            <div className={`w-full h-full ${isBubble ? 'relative z-30 flex items-center justify-center' : ''}`}>
                {renderContent()}
            </div>
        </div>
    );
});

export default BlockRenderer;
