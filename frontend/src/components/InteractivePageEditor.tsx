import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Settings, Trash2,
    Type, Image as ImageIcon, Music, HelpCircle,
    MousePointer2, Save, Eye, Layout, Upload, Download, Video, Maximize,
    ChevronLeft, ChevronRight, Star, Sparkles, ArrowLeft, ArrowRight,
    ListOrdered, CheckSquare, Edit3, Headphones, Mic, Info, Code, CopyCheck, CheckCircle2,
    Crop, ArrowUpToLine, ArrowDownToLine, FileUp,
    Bold, Italic, Underline
} from 'lucide-react';
import ImageCropperModal from './ImageCropperModal';
import BlockRenderer from './BlockRenderer';
import type { BlockData, BlockType } from './BlockRenderer';
import ValidationFooter from './ValidationFooter';
import type { ValidationState } from './ValidationFooter';
import RichTextEditor from './RichTextEditor';
import AIAssetGenerator from './AIAssetGenerator';
import PremiumConfirmModal from './PremiumConfirmModal';

interface InteractivePageEditorProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    initialData: { canvas?: any; blocks: BlockData[] };
    onSave: (data: { canvas: any; blocks: BlockData[] }) => void;
    token?: string;
}

const DESIGN_WIDTH = 1350;
const DESIGN_HEIGHT = 1909;

const InteractivePageEditor: React.FC<InteractivePageEditorProps> = ({
    isOpen, onClose, title, initialData, onSave, token
}) => {
    const [blocks, setBlocks] = useState<BlockData[]>(initialData?.blocks || []);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPreview, setIsPreview] = useState(false);
    const [leftPanelOpen, setLeftPanelOpen] = useState(false);
    const [rightPanelOpen, setRightPanelOpen] = useState(true);
    const [canvasBg, setCanvasBg] = useState(initialData?.canvas || { color: '#16193020', url: '' });
    const [aiModalOpen, setAiModalOpen] = useState(false);
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importJsonText, setImportJsonText] = useState('');
    const [zoom, setZoom] = useState(1);
    const [autoZoom, setAutoZoom] = useState(true);

    // Image Cropper State
    const [isCropperOpen, setIsCropperOpen] = useState(false);
    const [cropImageSrc, setCropImageSrc] = useState<string>('');

    // Preview Validation State
    const [validationState, setValidationState] = useState<ValidationState>('idle');
    const [validationMessage, setValidationMessage] = useState('');

    // Modal state for deletions
    const [confirmModal, setConfirmModal] = useState<{
        isOpen: boolean;
        title: string;
        description: string;
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        description: '',
        onConfirm: () => { }
    });

    const handleCropComplete = (croppedBase64: string) => {
        if (selectedIds.length > 0) {
            updateBlockData(selectedIds[0], { url: croppedBase64 });
        }
    };

    const canvasRef = useRef<HTMLDivElement>(null);

    // Derived state -> must be after ALL hooks!
    const selectedId = selectedIds.length > 0 ? selectedIds[0] : null;

    const handleExportJson = () => {
        const dataToExport = { canvas: canvasBg, blocks };
        const jsonString = JSON.stringify(dataToExport, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_export.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleImportJson = () => {
        try {
            const data = JSON.parse(importJsonText);
            if (data.blocks && Array.isArray(data.blocks)) {
                setBlocks(data.blocks);
                if (data.canvas) setCanvasBg(data.canvas);
            } else if (Array.isArray(data)) {
                setBlocks(data);
            } else {
                alert("Invalid format. Expected an array of blocks or an object with a 'blocks' array.");
                return;
            }
            setImportModalOpen(false);
            setImportJsonText('');
            setSelectedIds([]);
        } catch (e) {
            alert("Invalid JSON data: " + (e as Error).message);
        }
    };

    useEffect(() => {
        if (isOpen) {
            setBlocks(initialData?.blocks || []);
            setCanvasBg(initialData?.canvas || { color: '#16193020', url: '' });
            setSelectedIds([]);
            document.body.classList.add('editor-active');
        } else {
            document.body.classList.remove('editor-active');
        }
        return () => {
            document.body.classList.remove('editor-active');
        };
    }, [isOpen, initialData]);

    const addBlock = (type: BlockType) => {
        const id = Math.random().toString(36).substr(2, 9);
        let defaultData: any = {
            x: 50,
            y: 50,
            width: 200,
            height: 150,
            rotate: 0,
            zIndex: blocks.length + 1,
            opacity: 1,
            borderRadius: 16,
            borderWidth: 0,
            borderColor: '#ffffff',
            boxShadow: 'none',
        };

        switch (type) {
            case 'text':
                defaultData = { ...defaultData, content: 'New Text', style: 'p', width: 300, height: 100, bubbleType: 'none', bubbleTail: 'bottom-left', bubbleColor: '#161930' };
                break;
            case 'image':
                defaultData = { ...defaultData, url: '', alt: '', caption: '', width: 400, height: 300 };
                break;
            case 'video':
                defaultData = { ...defaultData, url: '', width: 400, height: 225, autoPlay: false, loop: false, muted: false };
                break;
            case 'audio':
                defaultData = { ...defaultData, url: '', title: 'Track', visualStyle: 'bar', width: 300, height: 80 };
                break;
            case 'button':
                defaultData = { ...defaultData, label: 'Button', action: 'next', value: '', style: 'solid', width: 160, height: 50 };
                break;
            case 'quiz':
                defaultData = { ...defaultData, question: 'Question?', options: ['Option 1', 'Option 2'], answerIndex: 0, feedback: '', width: 400, height: 400 };
                break;
            case 'activity':
                defaultData = { ...defaultData, mode: 'scramble', question: 'Sentencia...', correctAnswer: 'Hello world', options: [], feedback: '', width: 250, height: 180 };
                break;
            case 'word_bank':
                defaultData = { ...defaultData, prompt: 'Translate this', correctSentence: 'Correct sentence', distractors: ['wrong', 'words'], width: 350, height: 200 };
                break;
            case 'matching':
                defaultData = { ...defaultData, pairs: [{ left: 'A', right: '1' }, { left: 'B', right: '2' }], width: 400, height: 300 };
                break;
            case 'cloze':
                defaultData = { ...defaultData, textWithBlanks: 'Fill in the [blank]', width: 350, height: 150 };
                break;
            case 'listen_tap':
                defaultData = { ...defaultData, audioAssetId: '', correctSentence: 'Hello world', distractors: ['hi', 'earth'], width: 350, height: 250 };
                break;
            case 'dictation':
                defaultData = { ...defaultData, audioAssetId: '', correctText: 'Hello', width: 350, height: 200 };
                break;
            case 'pronunciation':
                defaultData = { ...defaultData, targetPhrase: 'Good morning', width: 300, height: 150 };
                break;
            case 'translation':
                defaultData = { ...defaultData, sourceText: 'Translate this', targetLanguage: 'es', width: 350, height: 200 };
                break;
            case 'story_dialogue':
                defaultData = { ...defaultData, characterId: '', dialogueText: 'Hello!', userOptions: [], width: 350, height: 200 };
                break;
            case 'reading_comp':
                defaultData = { ...defaultData, storyText: 'Once upon a time...', questions: [], width: 450, height: 400 };
                break;
            case 'gami_reward':
                defaultData = { ...defaultData, xpAmount: 15, streakMultiplier: 1.0, width: 200, height: 100 };
                break;
            case 'meta_hint':
                defaultData = { ...defaultData, markdownContent: 'Explain concepts here...', triggerOn: 'always', width: 300, height: 150 };
                break;
            case 'code_editor':
                defaultData = { ...defaultData, language: 'javascript', initialCode: '// Write code here\n', expectedOutput: '', showRunButton: true, tests: [], width: 500, height: 350 };
                break;
            case 'text_input':
                defaultData = { ...defaultData, placeholder: 'Type your answer...', correctAnswer: '', successMessage: 'Great job!', showValidation: false, fontSize: 16, color: '#000000', bgColor: 'transparent', align: 'left', width: 300, height: 50 };
                break;
            case 'layout_container':
                defaultData = { ...defaultData, layoutType: 'column', gap: '16px', childrenBlocks: [], width: 400, height: 400 };
                break;
            case 'completion':
                defaultData = { 
                    ...defaultData, 
                    title: 'Good', 
                    correctAnswers: ['night'], 
                    caseSensitive: false, 
                    preset: 'classic', 
                    bgColor: '#d1d1a1', 
                    titleColor: '#000000', 
                    textColor: '#000000', 
                    fontFamily: 'serif', 
                    fontSize: 24, 
                    placeholder: '...',
                    inputWidth: 'auto',
                    align: 'center',
                    bold: false,
                    italic: false,
                    underline: false,
                    width: 400, 
                    height: 120
                };
                break;
        }

        const newBlock = { id, type, data: defaultData };
        setBlocks([...blocks, newBlock]);
        setSelectedIds([id]);
    };

    const duplicateBlock = (id: string) => {
        const block = blocks.find(b => b.id === id);
        if (!block) return;

        const newId = Math.random().toString(36).substr(2, 9);
        const newBlock = {
            ...block,
            id: newId,
            data: {
                ...block.data,
                x: block.data.x + 20,
                y: block.data.y + 20,
                zIndex: blocks.length + 1
            }
        };
        setBlocks([...blocks, newBlock]);
        setSelectedIds([newId]);
    };

    const bringToFront = (id: string) => {
        const maxZ = Math.max(0, ...blocks.map(b => b.data.zIndex || 0));
        updateBlockData(id, { zIndex: maxZ + 1 });
    };

    const sendToBack = (id: string) => {
        const minZ = Math.min(...blocks.map(b => b.data.zIndex || 0));
        updateBlockData(id, { zIndex: minZ - 1 });
    };

    const removeBlock = (id: string) => {
        setBlocks(blocks.filter(b => b.id !== id));
        setSelectedIds(prev => prev.filter(selId => selId !== id));
    };

    const updateBlockData = (id: string, newData: any) => {
        setBlocks(prev => prev.map(b => b.id === id ? { ...b, data: { ...b.data, ...newData } } : b));
    };

    const updateSelectedBlocks = (newData: any) => {
        setBlocks(prev => prev.map(b => selectedIds.includes(b.id) ? { ...b, data: { ...b.data, ...newData } } : b));
    };

    const selectedBlock = blocks.find(b => b.id === selectedId);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validation for common patterns
        const isVideo = file.type.startsWith('video/');
        const isAudio = file.type.startsWith('audio/');
        
        // Size limit: 50MB
        const maxSize = 50 * 1024 * 1024;
        if (file.size > maxSize) {
            alert(`File too large (${(file.size / 1024 / 1024).toFixed(2)}MB). Maximum allowed is 50MB.`);
            return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
            const base64 = reader.result as string;
            
            // If it's a video or audio, we might want to store metadata
            if (isVideo || isAudio) {
                updateSelectedBlocks({ 
                    [field]: base64,
                    fileName: file.name,
                    mimeType: file.type,
                    size: file.size,
                    lastModified: file.lastModified
                });
            } else {
                updateSelectedBlocks({ [field]: base64 });
            }
        };
        reader.onerror = () => {
            alert("Error reading file.");
        };
        reader.readAsDataURL(file);
    };

    const handleDragEnd = (id: string, info: any) => {
        const idsToMove = selectedIds.includes(id) ? selectedIds : [id];
        setBlocks(prev => prev.map(b => {
            if (idsToMove.includes(b.id)) {
                return {
                    ...b,
                    data: {
                        ...b.data,
                        x: b.data.x + info.offset.x,
                        y: b.data.y + info.offset.y
                    }
                };
            }
            return b;
        }));
    };

    // Keyboard shortcuts for arrow movement and delete
    useEffect(() => {
        if (!isOpen || isPreview) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;
            if (['INPUT', 'TEXTAREA'].includes(target.tagName) || target.isContentEditable) {
                return;
            }

            // Ctrl+A = Select All
            if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
                e.preventDefault();
                setSelectedIds(blocks.map(b => b.id));
                return;
            }

            if (selectedIds.length > 0) {
                let dx = 0;
                let dy = 0;
                const step = e.shiftKey ? 10 : 1;

                if (e.key === 'ArrowUp') dy = -step;
                if (e.key === 'ArrowDown') dy = step;
                if (e.key === 'ArrowLeft') dx = -step;
                if (e.key === 'ArrowRight') dx = step;

                if (dx !== 0 || dy !== 0) {
                    e.preventDefault();
                    setBlocks(prev => prev.map(b =>
                        selectedIds.includes(b.id)
                            ? { ...b, data: { ...b.data, x: b.data.x + dx, y: b.data.y + dy } }
                            : b
                    ));
                    return;
                }

                if (e.key === 'Delete' || e.key === 'Backspace') {
                    setBlocks(prev => prev.filter(b => !selectedIds.includes(b.id)));
                    setSelectedIds([]);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isOpen, isPreview, selectedIds]);


    const handleResize = (id: string, direction: string, info: any) => {
        const block = blocks.find(b => b.id === id);
        if (!block) return;

        const { x, y, width, height } = block.data;
        const deltaX = info.delta.x;
        const deltaY = info.delta.y;

        let newX = x;
        let newY = y;
        let newWidth = width;
        let newHeight = height;

        const minSize = 20;

        if (direction.includes('r')) {
            newWidth = Math.max(minSize, width + deltaX);
        }
        if (direction.includes('l')) {
            const potentialWidth = width - deltaX;
            if (potentialWidth > minSize) {
                newWidth = potentialWidth;
                newX = x + deltaX;
            }
        }
        if (direction.includes('b')) {
            newHeight = Math.max(minSize, height + deltaY);
        }
        if (direction.includes('t')) {
            const potentialHeight = height - deltaY;
            if (potentialHeight > minSize) {
                newHeight = potentialHeight;
                newY = y + deltaY;
            }
        }

        updateBlockData(id, { x: newX, y: newY, width: newWidth, height: newHeight });
    };

    const handleRotate = (id: string, info: any) => {
        const block = blocks.find(b => b.id === id);
        if (!block || !canvasRef.current) return;

        // Calculate center of block
        const centerX = block.data.x + block.data.width / 2;
        const centerY = block.data.y + block.data.height / 2;

        // Get mouse position relative to canvas
        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = info.point.x - rect.left;
        const mouseY = info.point.y - rect.top;

        // Calculate angle
        const angle = Math.atan2(mouseY - centerY, mouseX - centerX) * (180 / Math.PI);
        // Correct for handle being at top (90 degrees)
        updateBlockData(id, { rotate: angle + 90 });
    };

    // Responsive Zoom Logic
    useEffect(() => {
        if (!autoZoom || !canvasRef.current || isPreview) return;

        const updateZoom = () => {
            const container = canvasRef.current?.parentElement;
            if (!container) return;

            const padding = 80; // Safety margin
            const availableWidth = container.clientWidth - padding;
            const availableHeight = container.clientHeight - padding;
            
            const scaleX = availableWidth / DESIGN_WIDTH;
            const scaleY = availableHeight / DESIGN_HEIGHT;
            
            // We want the canvas to fit completely, so we take the smaller scale
            const newZoom = Math.min(scaleX, scaleY, 1); // Max 100% to avoid pixelation
            setZoom(newZoom);
        };

        const resizeObserver = new ResizeObserver(updateZoom);
        if (canvasRef.current.parentElement) {
            resizeObserver.observe(canvasRef.current.parentElement);
        }

        updateZoom();
        return () => resizeObserver.disconnect();
    }, [autoZoom, isPreview, leftPanelOpen, rightPanelOpen, isOpen]);

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-[#0c0e1a] text-white flex flex-col font-sans overflow-hidden"
        >
            {/* ── TOPBAR ── */}
            {!isPreview && (
                <div className="h-14 bg-[#161930] border-b border-white/5 flex items-center justify-between px-4 shadow-xl relative z-50">
                    <div className="flex items-center gap-4">
                        <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all text-gray-400 hover:text-white" title="Close Editor">
                            <X size={18} />
                        </button>
                        
                        <div className="h-8 w-[1px] bg-white/10 mx-1" />

                        <div>
                            <p className="text-[7px] font-black text-accent uppercase tracking-[0.2em]">Editor Pro</p>
                            <h2 className="text-xs font-black tracking-tight flex items-center gap-1.5 truncate max-w-[200px]">
                                <Layout size={12} className="text-accent" /> {title}
                            </h2>
                        </div>
                    </div>

                    {/* Zoom & Viewport Controls */}
                    <div className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-black/20 rounded-full border border-white/5 p-1">
                        <button 
                            onClick={() => { setAutoZoom(false); setZoom(prev => Math.max(0.1, prev - 0.1)); }}
                            className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft size={14} />
                        </button>
                        <div 
                            className={`px-3 py-1 rounded-full text-[10px] font-black cursor-pointer transition-all ${autoZoom ? 'bg-accent text-white' : 'text-gray-400'}`}
                            onClick={() => setAutoZoom(true)}
                        >
                            {autoZoom ? 'AUTO' : `${Math.round(zoom * 100)}%`}
                        </div>
                        <button 
                            onClick={() => { setAutoZoom(false); setZoom(prev => Math.min(2, prev + 0.1)); }}
                            className="p-1.5 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors"
                        >
                            <ArrowRight size={14} />
                        </button>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex bg-white/5 rounded-lg p-1 border border-white/10 mr-2 h-9">
                            <button
                                onClick={() => setLeftPanelOpen(!leftPanelOpen)}
                                className={`px-2.5 rounded-md transition-all flex items-center gap-1.5 ${leftPanelOpen ? 'bg-accent text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Layout size={14} />
                                <span className="text-[9px] font-black">TOOLS</span>
                            </button>
                            <button
                                onClick={() => setRightPanelOpen(!rightPanelOpen)}
                                className={`px-2.5 rounded-md transition-all flex items-center gap-1.5 ${rightPanelOpen ? 'bg-accent text-white' : 'text-gray-500 hover:text-white'}`}
                            >
                                <Settings size={14} />
                                <span className="text-[9px] font-black">PROPS</span>
                            </button>
                        </div>

                        <div className="flex items-center gap-1.5">
                            <button onClick={handleExportJson} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Export JSON"><Download size={16} /></button>
                            <button onClick={() => setImportModalOpen(true)} className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-all" title="Import JSON"><Code size={16} /></button>
                        </div>

                        <div className="h-6 w-[1px] bg-white/10 mx-2" />

                        <button
                            onClick={() => setIsPreview(true)}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-black transition-all border border-white/10 text-gray-400 hover:bg-white/5"
                        >
                            <Eye size={14} /> PREVIEW
                        </button>
                        <button
                            onClick={() => onSave({ canvas: canvasBg, blocks })}
                            className="flex items-center gap-2 px-5 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-xs font-black transition-all shadow-lg active:scale-95"
                        >
                            <Save size={14} /> SAVE
                        </button>
                    </div>
                </div>
            )}

            <div className="flex-1 flex overflow-hidden relative">
                {/* ── LEFT SIDEBAR (TOOLS) ── */}
                {!isPreview && (
                    <motion.div 
                        initial={false}
                        animate={{ width: leftPanelOpen ? 220 : 0, opacity: leftPanelOpen ? 1 : 0 }}
                        className="bg-[#161930] border-r border-white/5 flex flex-col h-full shadow-2xl relative z-40 overflow-hidden"
                    >
                        <div className="w-[220px] flex flex-col h-full"> 
                            <div className="h-10 flex items-center justify-between px-4 border-b border-white/5">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Components</p>
                                <button onClick={() => setLeftPanelOpen(false)} className="p-1 hover:bg-white/5 rounded text-gray-500"><ChevronLeft size={14} /></button>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 custom-scrollbar space-y-4">
                                {[
                                    {
                                        group: 'Multimedia', items: [
                                            { type: 'text', icon: <Type size={14} />, label: 'Text' },
                                            { type: 'image', icon: <ImageIcon size={14} />, label: 'Image' },
                                            { type: 'video', icon: <Video size={14} />, label: 'Video' },
                                            { type: 'audio', icon: <Music size={14} />, label: 'Audio' },
                                            { type: 'button', icon: <MousePointer2 size={14} />, label: 'Button' }
                                        ]
                                    },
                                    {
                                        group: 'Actividades', items: [
                                            { type: 'quiz', icon: <HelpCircle size={14} />, label: 'Quiz' },
                                            { type: 'activity', icon: <Star size={14} />, label: 'Activity' },
                                            { type: 'word_bank', icon: <ListOrdered size={14} />, label: 'Word Bank' },
                                            { type: 'matching', icon: <CopyCheck size={14} />, label: 'Matching' },
                                            { type: 'cloze', icon: <Edit3 size={14} />, label: 'Cloze' },
                                            { type: 'completion', icon: <CheckCircle2 size={14} />, label: 'Completion' }
                                        ]
                                    },
                                    {
                                        group: 'Linguistic', items: [
                                            { type: 'listen_tap', icon: <Headphones size={14} />, label: 'Audio Tap' },
                                            { type: 'dictation', icon: <CheckSquare size={14} />, label: 'Dictation' },
                                            { type: 'pronunciation', icon: <Mic size={14} />, label: 'Speak' }
                                        ]
                                    }
                                ].map((section, idx) => (
                                    <div key={idx} className="space-y-1">
                                        <p className="text-[7px] font-black text-gray-600 uppercase tracking-[0.2em] px-2 mb-2">{section.group}</p>
                                        <div className="grid grid-cols-2 gap-1.5">
                                            {section.items.map((item) => (
                                                <button
                                                    key={item.type}
                                                    onClick={() => addBlock(item.type as BlockType)}
                                                    className="flex flex-col items-center justify-center gap-1.5 p-2 bg-white/5 border border-white/5 rounded-xl hover:bg-white/10 hover:border-accent/30 hover:text-accent transition-all group"
                                                >
                                                    <div className="text-gray-400 group-hover:text-accent group-hover:scale-110 transition-all">{item.icon}</div>
                                                    <span className="font-black text-[8px] uppercase tracking-tighter text-center leading-none">{item.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                
                                <div className="pt-2">
                                    <button
                                        onClick={() => setAiModalOpen(true)}
                                        className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/20 rounded-xl hover:from-accent/20 hover:to-purple-500/20 transition-all group"
                                    >
                                        <Sparkles size={14} className="text-accent group-hover:rotate-12 transition-transform" />
                                        <span className="font-black text-[9px] uppercase tracking-widest text-accent">AI Genius</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                {/* ── CENTRAL WORKSPACE (CANVAS) ── */}
                <div
                    className={`flex-1 relative flex flex-col items-center overflow-auto custom-scrollbar bg-[#101328] transition-all duration-500 ${isPreview ? 'p-0 pt-20 pb-40' : 'p-20'}`}
                    onClick={() => setSelectedIds([])}
                >
                    {isPreview && (
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="fixed top-6 right-10 z-[1000] flex items-center gap-3"
                        >
                            <div className="px-4 py-2 bg-[#161930] border border-white/10 rounded-full shadow-2xl flex items-center gap-3 backdrop-blur-md">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Preview Mode</span>
                                </div>
                                <div className="h-4 w-[1px] bg-white/10" />
                                <button
                                    onClick={(e) => { e.stopPropagation(); setIsPreview(false); }}
                                    className="flex items-center gap-2 px-3 py-1.5 bg-accent hover:bg-orange-600 text-white rounded-lg text-[10px] font-black transition-all active:scale-95 shadow-lg shadow-accent/20"
                                >
                                    <Eye size={14} /> EXIT PREVIEW
                                </button>
                            </div>
                        </motion.div>
                    )}

                    {/* Viewport Container for Scaling */}
                    <div 
                        className="relative origin-top transition-transform duration-300 ease-out flex-shrink-0"
                        style={{ 
                            transform: `scale(${zoom})`,
                            width: DESIGN_WIDTH,
                            height: DESIGN_HEIGHT
                        }}
                    >
                        {/* Floating Quick Selection Toolbars */}
                        {!isPreview && blocks.length > 0 && (
                            <div className="absolute -top-16 left-0 right-0 flex items-center justify-between pointer-events-auto">
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedIds(blocks.map(b => b.id)); }}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border ${selectedIds.length === blocks.length
                                            ? 'bg-accent text-white border-accent'
                                            : 'bg-white/5 border-white/10 text-gray-500 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <CheckSquare size={12} /> SELECT ALL
                                    </button>
                                    {selectedIds.length > 0 && (
                                        <button
                                            onClick={(e) => { e.stopPropagation(); setSelectedIds([]); }}
                                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all border bg-white/5 border-white/10 text-gray-500 hover:text-white"
                                        >
                                            <X size={12} /> DESELECT
                                        </button>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setConfirmModal({
                                                isOpen: true,
                                                title: "Clear Current Page",
                                                description: "Are you sure you want to clear all elements from this page?",
                                                onConfirm: () => { setBlocks([]); setSelectedIds([]); }
                                            });
                                        }}
                                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-lg"
                                    >
                                        <Trash2 size={12} /> CLEAR CANVAS
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* The Actual Designer Canvas */}
                        <div
                            ref={canvasRef}
                            className={`relative bg-white rounded-[1.5rem] overflow-hidden shadow-[0_30px_90px_rgba(0,0,0,0.6)] border border-white/5 ${!isPreview ? 'ring-8 ring-white/5' : ''}`}
                            style={{
                                width: `${DESIGN_WIDTH}px`,
                                height: `${DESIGN_HEIGHT}px`,
                                backgroundColor: canvasBg.url ? 'transparent' : canvasBg.color,
                                backgroundImage: canvasBg.url ? `url(${canvasBg.url})` : 'none',
                                backgroundSize: '100% 100%',
                                backgroundPosition: 'center',
                            }}
                        >
                            {blocks.length === 0 && (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center opacity-20">
                                    <Maximize size={60} className="mb-4 text-accent" />
                                    <h3 className="text-xl font-black uppercase tracking-tighter">Drag-and-Drop Canvas</h3>
                                    <p className="text-xs font-bold text-gray-500 mt-2">Any element can be placed and resized anywhere.</p>
                                </div>
                            )}

                            {/* Virtual Guides (Grid + Crosshair) visible only in Editor */}
                            {!isPreview && (
                                <div className="absolute inset-0 pointer-events-none z-0">
                                    {/* Grid background */}
                                    <div className="absolute inset-0 opacity-20" style={{
                                        backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)',
                                        backgroundSize: '20px 20px'
                                    }} />
                                    {/* Horizontal and Vertical Center crosshairs based on 1350px width max canvas */}
                                    <div className="absolute top-0 bottom-0 left-[675px] w-[1px] bg-red-400/30 border-r border-dashed border-red-400/50" />
                                </div>
                            )}

                            {blocks.map((block) => (
                                <motion.div
                                    key={block.id}
                                    drag={!isPreview}
                                    dragMomentum={false}
                                    dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
                                    dragElastic={0}
                                    onDragStart={() => {
                                        if (!selectedIds.includes(block.id)) {
                                            setSelectedIds([block.id]);
                                        }
                                    }}
                                    onDragEnd={(_e, info) => handleDragEnd(block.id, info)}
                                    className={`absolute ${isPreview ? 'pointer-events-none' : 'pointer-events-auto cursor-move'}`}
                                    style={{
                                        left: block.data.x,
                                        top: block.data.y,
                                        width: block.data.width,
                                        height: block.data.height,
                                        rotate: block.data.rotate || 0,
                                        zIndex: block.data.zIndex || (selectedIds.includes(block.id) ? 50 : 10),
                                    }}
                                    onClick={(_e) => {
                                        _e.stopPropagation();
                                        if (!isPreview) {
                                            if (_e.shiftKey) {
                                                setSelectedIds(prev => prev.includes(block.id) ? prev.filter(id => id !== block.id) : [...prev, block.id]);
                                            } else {
                                                setSelectedIds([block.id]);
                                            }
                                        }
                                    }}
                                >
                                    <div className={`w-full h-full relative transition-all ${!isPreview && selectedIds.includes(block.id) ? 'outline outline-2 outline-accent cursor-move rounded-lg shadow-2xl' : ''}`}>
                                        <BlockRenderer
                                            block={block}
                                            isAdmin={!isPreview}
                                            onInteract={(_, interaction) => {
                                                if (!isPreview) return; // Only process interactions in preview mode
                                                const isTrue = interaction.isCorrect !== undefined ? interaction.isCorrect : interaction.correct;
                                                if (isTrue !== undefined) {
                                                    if (isTrue) {
                                                        setValidationState('correct');
                                                        setValidationMessage('Excellent progress! (Preview)');
                                                    } else {
                                                        setValidationState('incorrect');
                                                        setValidationMessage('Incorrect answer (Preview)');
                                                    }
                                                }
                                            }}
                                        />

                                        {!isPreview && selectedIds.includes(block.id) && (
                                            <>
                                                {/* Resize handles - Corners */}
                                                {['tl', 'tr', 'bl', 'br'].map(dir => (
                                                    <motion.div
                                                        key={dir}
                                                        drag
                                                        dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
                                                        dragElastic={0}
                                                        onDrag={(_e, info) => handleResize(block.id, dir, info)}
                                                        className={`absolute w-3 h-3 bg-white border-2 border-accent rounded-full shadow-lg z-50 flex items-center justify-center pointer-events-auto
                                                        ${dir === 'tl' ? '-left-1.5 -top-1.5 cursor-nwse-resize' :
                                                                dir === 'tr' ? '-right-1.5 -top-1.5 cursor-nesw-resize' :
                                                                    dir === 'bl' ? '-left-1.5 -bottom-1.5 cursor-nesw-resize' :
                                                                        '-right-1.5 -bottom-1.5 cursor-nwse-resize'}`}
                                                    />
                                                ))}

                                                {/* Resize handles - Edges */}
                                                {['t', 'b', 'l', 'r'].map(dir => (
                                                    <motion.div
                                                        key={dir}
                                                        drag
                                                        dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
                                                        dragElastic={0}
                                                        onDrag={(_e, info) => handleResize(block.id, dir, info)}
                                                        className={`absolute bg-white border-2 border-accent shadow-lg z-50 flex items-center justify-center pointer-events-auto
                                                        ${dir === 't' ? 'h-2 w-6 -top-1 left-1/2 -translate-x-1/2 cursor-ns-resize rounded-full' :
                                                                dir === 'b' ? 'h-2 w-6 -bottom-1 left-1/2 -translate-x-1/2 cursor-ns-resize rounded-full' :
                                                                    dir === 'l' ? 'w-2 h-6 -left-1 top-1/2 -translate-y-1/2 cursor-ew-resize rounded-full' :
                                                                        'w-2 h-6 -right-1 top-1/2 -translate-y-1/2 cursor-ew-resize rounded-full'}`}
                                                    />
                                                ))}

                                                {/* Rotation handle */}
                                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 pointer-events-auto">
                                                    <motion.div
                                                        drag
                                                        dragConstraints={{ left: 0, top: 0, right: 0, bottom: 0 }}
                                                        dragElastic={0}
                                                        onDrag={(_e, info) => handleRotate(block.id, info)}
                                                        className="w-7 h-7 bg-accent text-white rounded-full flex items-center justify-center shadow-lg border-2 border-white cursor-pointer hover:scale-110 active:scale-95 transition-transform"
                                                    >
                                                        <Layout size={14} className="rotate-45" />
                                                    </motion.div>
                                                    <div className="w-0.5 h-3 bg-accent/40" />
                                                </div>

                                                {/* Quick Delete */}
                                                <button
                                                    onClick={(_e) => { _e.stopPropagation(); removeBlock(block.id); }}
                                                    className="absolute -top-3 -left-3 w-7 h-7 bg-red-500 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 transition-transform pointer-events-auto z-[60]"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                        {/* Editor Preview Validation Footer */}
                        <AnimatePresence>
                            {isPreview && validationState !== 'idle' && (
                                <div className="absolute bottom-0 left-0 right-0 z-[100]">
                                    <ValidationFooter
                                        status={validationState}
                                        message={validationMessage}
                                        onContinue={() => setValidationState('idle')}
                                    />
                                </div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {/* ── RIGHT SIDEBAR (PROPERTIES) ── */}
                {!isPreview && (
                    <motion.div
                        initial={false}
                        animate={{ width: rightPanelOpen ? 320 : 0, opacity: rightPanelOpen ? 1 : 0 }}
                        className="bg-[#161930] border-l border-white/5 flex flex-col h-full shadow-2xl relative z-40 overflow-hidden"
                    >
                        <div className="w-[320px] flex flex-col h-full">
                            <div className="p-4 border-b border-white/5 flex items-center justify-between bg-[#1a1d3a]">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-accent/20 rounded-lg text-accent">
                                        <Settings size={14} />
                                    </div>
                                    <h3 className="font-black text-[10px] uppercase tracking-[0.2em]">{selectedBlock ? selectedBlock.type : 'Lienzo'}</h3>
                                </div>
                                <div className="flex items-center gap-1">
                                    {selectedBlock && <button onClick={() => setSelectedIds([])} className="text-gray-500 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-all"><X size={14} /></button>}
                                    <button onClick={() => setRightPanelOpen(false)} className="text-gray-500 hover:text-white p-1.5 hover:bg-white/5 rounded-lg transition-all"><ChevronRight size={14} /></button>
                                </div>
                            </div>

                            <div className="flex-1 overflow-y-auto p-5 custom-scrollbar space-y-6">
                                {!selectedBlock ? (
                                    <div className="space-y-6">
                                        <div className="p-4 bg-white/5 rounded-xl border border-white/10 space-y-4">
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Canvas Designer</label>
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[9px] font-black text-gray-500 uppercase">Bg Color</span>
                                                    <input type="color" value={canvasBg.color} onChange={e => setCanvasBg({ ...canvasBg, color: e.target.value })} className="w-8 h-8 rounded-lg bg-transparent cursor-pointer" />
                                                </div>
                                                <label className="w-full p-4 border-2 border-dashed border-white/10 rounded-xl hover:border-accent group cursor-pointer transition-all flex flex-col items-center gap-2">
                                                    <Upload size={20} className="text-gray-500 group-hover:text-accent" />
                                                    <span className="text-[9px] font-black text-gray-500 uppercase">Set Canvas Image</span>
                                                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                                                        const file = e.target.files?.[0];
                                                        if (file) {
                                                            const reader = new FileReader();
                                                            reader.onloadend = () => setCanvasBg({ ...canvasBg, url: reader.result as string });
                                                            reader.readAsDataURL(file);
                                                        }
                                                    }} />
                                                </label>
                                                {canvasBg.url && (
                                                    <button onClick={() => setCanvasBg({ ...canvasBg, url: '' })} className="w-full py-2 bg-red-500/10 text-red-500 text-[8px] font-black uppercase rounded-lg border border-red-500/20">Remove Image</button>
                                                )}
                                            </div>
                                        </div>
                                        <div className="p-10 text-center opacity-20">
                                            <Layout size={40} className="mx-auto mb-4" />
                                            <p className="text-[10px] font-bold">Select an element to edit its properties</p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        {/* Geometry & Layering */}
                                        <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                            <div className="flex items-center justify-between mb-2">
                                                <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Position & Layering</label>
                                                <div className="flex gap-1">
                                                    <button onClick={() => sendToBack(selectedId!)} className="p-1 px-2 bg-black/20 hover:bg-black/40 rounded text-[8px] font-black uppercase tracking-tighter transition-colors" title="Send to Back">Back</button>
                                                    <button onClick={() => bringToFront(selectedId!)} className="p-1 px-2 bg-black/20 hover:bg-black/40 rounded text-[8px] font-black uppercase tracking-tighter transition-colors" title="Bring to Front">Front</button>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-3">
                                                <div className="space-y-1">
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">X-POS</p>
                                                    <input type="number" value={Math.round(selectedBlock.data.x)} onChange={e => updateBlockData(selectedId!, { x: parseInt(e.target.value) })} className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-accent font-black" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Y-POS</p>
                                                    <input type="number" value={Math.round(selectedBlock.data.y)} onChange={e => updateBlockData(selectedId!, { y: parseInt(e.target.value) })} className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-accent font-black" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">WIDTH</p>
                                                    <input type="number" value={Math.round(selectedBlock.data.width)} onChange={e => updateBlockData(selectedId!, { width: parseInt(e.target.value) })} className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-accent font-black" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">HEIGHT</p>
                                                    <input type="number" value={Math.round(selectedBlock.data.height)} onChange={e => updateBlockData(selectedId!, { height: parseInt(e.target.value) })} className="w-full bg-black/20 border border-white/10 rounded-lg px-2 py-1.5 text-xs text-accent font-black" />
                                                </div>
                                                <div className="col-span-2 space-y-2">
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest text-center">ROTATION ({Math.round(selectedBlock.data.rotate || 0)}°)</p>
                                                    <input type="range" min="0" max="360" value={Math.round(selectedBlock.data.rotate || 0)} onChange={e => updateBlockData(selectedId!, { rotate: parseInt(e.target.value) })} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent" />
                                                </div>
                                            </div>

                                            {/* Layer Controls */}
                                            <div className="flex gap-2 mt-3 pt-3 border-t border-white/10">
                                                <button onClick={() => bringToFront(selectedId!)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 flex items-center justify-center gap-1.5 transition-colors text-gray-400 hover:text-white">
                                                    <ArrowUpToLine size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Traer Frente</span>
                                                </button>
                                                <button onClick={() => sendToBack(selectedId!)} className="flex-1 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl p-2 flex items-center justify-center gap-1.5 transition-colors text-gray-400 hover:text-white">
                                                    <ArrowDownToLine size={14} /> <span className="text-[9px] font-black uppercase tracking-widest">Enviar Fondo</span>
                                                </button>
                                            </div>
                                        </div>

                                        {/* Advanced Visual Styles */}
                                        <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-1">Visual Styling</label>
                                            <div className="space-y-3">
                                                <div className="space-y-1">
                                                    <div className="flex justify-between text-[8px] text-gray-500 font-bold uppercase tracking-widest">
                                                        <span>Opacity</span>
                                                        <span className="text-white">{Math.round((selectedBlock.data.opacity ?? 1) * 100)}%</span>
                                                    </div>
                                                    <input type="range" min="0" max="100" value={(selectedBlock.data.opacity ?? 1) * 100} onChange={e => updateBlockData(selectedId!, { opacity: parseInt(e.target.value) / 100 })} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent" />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[8px] text-gray-500 font-bold uppercase tracking-widest">
                                                            <span>Radius</span>
                                                            <span className="text-white">{selectedBlock.data.borderRadius || 0}px</span>
                                                        </div>
                                                        <input type="range" min="0" max="100" value={selectedBlock.data.borderRadius || 0} onChange={e => updateBlockData(selectedId!, { borderRadius: parseInt(e.target.value) })} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <div className="flex justify-between text-[8px] text-gray-500 font-bold uppercase tracking-widest">
                                                            <span>Border</span>
                                                            <span className="text-white">{selectedBlock.data.borderWidth || 0}px</span>
                                                        </div>
                                                        <input type="range" min="0" max="20" value={selectedBlock.data.borderWidth || 0} onChange={e => updateBlockData(selectedId!, { borderWidth: parseInt(e.target.value) })} className="w-full h-1 bg-white/10 rounded-full appearance-none cursor-pointer accent-accent" />
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-2">
                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Border Color</span>
                                                    <input type="color" value={selectedBlock.data.borderColor || '#ffffff'} onChange={e => updateBlockData(selectedId!, { borderColor: e.target.value })} className="w-6 h-6 rounded bg-transparent cursor-pointer" />
                                                </div>

                                                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-white/5">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Text Color</span>
                                                        <input type="color" value={selectedBlock.data.color || '#ffffff'} onChange={e => updateBlockData(selectedId!, { color: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent border-0" />
                                                    </div>
                                                    <div className="flex flex-col gap-1">
                                                        <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Bg Color</span>
                                                        <div className="flex items-center gap-1">
                                                            <input type="color" value={selectedBlock.data.bgColor === 'transparent' ? '#ffffff' : (selectedBlock.data.bgColor || '#ffffff')} onChange={e => updateBlockData(selectedId!, { bgColor: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent border-0" disabled={selectedBlock.data.bgColor === 'transparent' || !selectedBlock.data.bgColor} />
                                                            <button onClick={() => updateBlockData(selectedId!, { bgColor: !selectedBlock.data.bgColor || selectedBlock.data.bgColor === 'transparent' ? '#ffffff' : 'transparent' })} className={`text-[8px] px-1.5 py-1 rounded transition ${!selectedBlock.data.bgColor || selectedBlock.data.bgColor === 'transparent' ? 'bg-white/10 text-gray-400' : 'bg-accent text-white'}`}>
                                                                Fill
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="space-y-2 pt-2 border-t border-white/5">
                                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Shadow Effect</p>
                                                    <div className="grid grid-cols-4 gap-1">
                                                        {[
                                                            { label: 'None', val: 'none' },
                                                            { label: 'Soft', val: '0 4px 20px rgba(0,0,0,0.2)' },
                                                            { label: 'Med', val: '0 10px 40px rgba(0,0,0,0.4)' },
                                                            { label: 'Hard', val: '0 20px 60px rgba(0,0,0,0.6)' }
                                                        ].map(s => (
                                                            <button
                                                                key={s.label}
                                                                onClick={() => updateBlockData(selectedId!, { boxShadow: s.val })}
                                                                className={`py-1.5 rounded-lg text-[8px] font-black border transition-all ${selectedBlock.data.boxShadow === s.val ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                            >
                                                                {s.label.toUpperCase()}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Component Specific Settings */}
                                        <div className="space-y-4 p-4 bg-white/5 rounded-xl border border-white/10">
                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">{selectedBlock.type} Controls</label>

                                            {selectedBlock.type === 'text' && (
                                                <div className="space-y-4">
                                                    <RichTextEditor
                                                        value={selectedBlock.data.content || ''}
                                                        onChange={(html) => updateBlockData(selectedBlock.id, { content: html })}
                                                    />

                                                    {/* ── FRAME PRESETS ── */}
                                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Marco / Frame</p>
                                                        <div className="grid grid-cols-4 gap-1">
                                                            {[
                                                                { id: 'none', label: 'Sin marco', bg: '', outer: '', inner: '' },
                                                                { id: 'navy-red', label: '🇺🇸 Navy', bg: '#0a1560', outer: '#cc0000', inner: '#ffffff' },
                                                                { id: 'classic', label: '📜 Classic', bg: '#1a0a00', outer: '#c8860a', inner: '#fffde0' },
                                                                { id: 'dark', label: '⬛ Dark', bg: '#0f0f0f', outer: '#444444', inner: '#888888' },
                                                                { id: 'success', label: '✅ Green', bg: '#052e16', outer: '#16a34a', inner: '#86efac' },
                                                                { id: 'warning', label: '⚠️ Amber', bg: '#431407', outer: '#d97706', inner: '#fde68a' },
                                                                { id: 'info', label: '🔵 Blue', bg: '#0c1a40', outer: '#2563eb', inner: '#bfdbfe' },
                                                                { id: 'purple', label: '💜 Purple', bg: '#1a0537', outer: '#7c3aed', inner: '#ddd6fe' },
                                                            ].map(f => (
                                                                <button
                                                                    key={f.id}
                                                                    onClick={() => updateBlockData(selectedId!, {
                                                                        frameStyle: f.id,
                                                                        frameBg: f.bg,
                                                                        frameBorder: f.outer,
                                                                        frameInner: f.inner,
                                                                    })}
                                                                    className={`py-1.5 px-1 rounded-lg text-[8px] font-black border transition-all truncate
                                                                    ${selectedBlock.data.frameStyle === f.id
                                                                            ? 'border-accent bg-accent/20 text-white'
                                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                                                >
                                                                    {f.label}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {selectedBlock.data.frameStyle && selectedBlock.data.frameStyle !== 'none' && (
                                                            <div className="grid grid-cols-3 gap-2 mt-1">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="text-[7px] text-gray-600 uppercase tracking-widest">Fondo</span>
                                                                    <input type="color" value={selectedBlock.data.frameBg || '#0a1560'}
                                                                        onChange={e => updateBlockData(selectedId!, { frameBg: e.target.value })}
                                                                        className="w-full h-7 rounded cursor-pointer bg-transparent border-0" />
                                                                </div>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="text-[7px] text-gray-600 uppercase tracking-widest">Borde ext</span>
                                                                    <input type="color" value={selectedBlock.data.frameBorder || '#cc0000'}
                                                                        onChange={e => updateBlockData(selectedId!, { frameBorder: e.target.value })}
                                                                        className="w-full h-7 rounded cursor-pointer bg-transparent border-0" />
                                                                </div>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="text-[7px] text-gray-600 uppercase tracking-widest">Borde int</span>
                                                                    <input type="color" value={selectedBlock.data.frameInner || '#ffffff'}
                                                                        onChange={e => updateBlockData(selectedId!, { frameInner: e.target.value })}
                                                                        className="w-full h-7 rounded cursor-pointer bg-transparent border-0" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>

                                                    <div className="space-y-3 pt-2 border-t border-white/5">
                                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Bubble Style</p>
                                                        <div className="grid grid-cols-4 gap-1">
                                                            {[
                                                                { id: 'none', label: 'None' },
                                                                { id: 'speech', label: 'Talk' },
                                                                { id: 'thought', label: 'Think' },
                                                                { id: 'shout', label: 'Shout' }
                                                            ].map(b => (
                                                                <button
                                                                    key={b.id}
                                                                    onClick={() => updateBlockData(selectedId!, { bubbleType: b.id })}
                                                                    className={`py-1.5 rounded-lg text-[8px] font-black border transition-all ${selectedBlock.data.bubbleType === b.id ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                                >
                                                                    {b.label.toUpperCase()}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {selectedBlock.data.bubbleType !== 'none' && (
                                                            <div className="space-y-4">
                                                                <div className="space-y-2">
                                                                    <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Tail Position</p>
                                                                    <div className="grid grid-cols-4 gap-1">
                                                                        {[
                                                                            { id: 'top-left', label: 'TL' },
                                                                            { id: 'top-right', label: 'TR' },
                                                                            { id: 'bottom-left', label: 'BL' },
                                                                            { id: 'bottom-right', label: 'BR' }
                                                                        ].map(p => (
                                                                            <button
                                                                                key={p.id}
                                                                                onClick={() => updateBlockData(selectedId!, { bubbleTail: p.id })}
                                                                                className={`py-1.5 rounded-lg text-[8px] font-black border transition-all ${selectedBlock.data.bubbleTail === p.id ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                                            >
                                                                                {p.label}
                                                                            </button>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                                <div className="flex items-center justify-between px-1">
                                                                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Bubble Color</span>
                                                                    <input type="color" value={selectedBlock.data.bubbleColor || '#161930'} onChange={_e => updateBlockData(selectedId!, { bubbleColor: _e.target.value })} className="w-8 h-8 rounded-lg bg-transparent cursor-pointer" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedBlock.type === 'image' && (
                                                <div className="space-y-4">
                                                    <div className="flex gap-2">
                                                        <label className="flex-1 p-3 border border-white/10 rounded-xl hover:border-accent group cursor-pointer transition-all flex flex-col items-center justify-center gap-1 bg-white/5">
                                                            <Upload size={16} className="text-gray-500 group-hover:text-accent" />
                                                            <span className="text-[9px] font-black text-white uppercase">Upload</span>
                                                            <input type="file" className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'url')} />
                                                        </label>
                                                        {selectedBlock.data.url && (
                                                            <button
                                                                onClick={() => {
                                                                    setCropImageSrc(selectedBlock.data.url);
                                                                    setIsCropperOpen(true);
                                                                }}
                                                                className="flex-1 p-3 border border-white/10 rounded-xl hover:bg-accent/20 hover:border-accent hover:text-accent group cursor-pointer transition-all flex flex-col items-center justify-center gap-1 bg-white/5 text-gray-400">
                                                                <Crop size={16} />
                                                                <span className="text-[9px] font-black uppercase tracking-widest text-white">Recortar</span>
                                                            </button>
                                                        )}
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.data.url}
                                                        onChange={(e) => updateBlockData(selectedBlock.id, { url: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                        placeholder="Or paste URL..."
                                                    />
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.data.caption}
                                                        placeholder="Caption..."
                                                        onChange={(e) => updateBlockData(selectedBlock.id, { caption: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                    />
                                                </div>
                                            )}

                                            {selectedBlock.type === 'text_input' && (
                                                <div className="space-y-4 pt-4 border-t border-white/5">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Placeholder</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.data.placeholder || ''}
                                                            onChange={(e) => updateBlockData(selectedId!, { placeholder: e.target.value })}
                                                            className="w-full bg-[#0c0e1a] border border-white/10 rounded-lg p-2 text-xs text-white"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Correct Answer(s)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.data.correctAnswer || ''}
                                                            onChange={(e) => updateBlockData(selectedId!, { correctAnswer: e.target.value })}
                                                            placeholder="answer1|answer2|answer3"
                                                            className="w-full bg-[#0c0e1a] border border-white/10 rounded-lg p-2 text-xs text-white"
                                                        />
                                                        <div className="bg-accent/10 border border-accent/20 rounded-lg p-2 mt-2">
                                                            <p className="text-[8px] text-gray-400 leading-relaxed">
                                                                Use <span className="text-white font-bold">|</span> to separate multiple valid answers. E.g. <span className="text-white">Good morning|Good afternoon</span>
                                                            </p>
                                                        </div>
                                                        {selectedBlock.data.correctAnswer && selectedBlock.data.correctAnswer.includes('|') && (
                                                            <div className="mt-2 space-y-1">
                                                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Accepted Answers</p>
                                                                <div className="flex flex-wrap gap-1">
                                                                    {selectedBlock.data.correctAnswer.split('|').map((ans: string, i: number) => (
                                                                        <span key={i} className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">
                                                                            {ans.trim()}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedBlock.data.showValidation || false}
                                                            onChange={(e) => updateBlockData(selectedId!, { showValidation: e.target.checked })}
                                                            className="rounded border-white/10 bg-black"
                                                        />
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Show Auto-Validation</label>
                                                    </div>
                                                    {selectedBlock.data.showValidation && (
                                                        <div className="animate-fade-in">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-1 block">Success Message (Optional)</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.data.successMessage || ''}
                                                                onChange={(e) => updateBlockData(selectedId!, { successMessage: e.target.value })}
                                                                placeholder="Great job!"
                                                                className="w-full bg-[#0c0e1a]/50 border border-green-500/20 text-green-400 rounded-lg p-2 text-xs focus:ring-1 focus:ring-green-500/50 outline-none"
                                                            />
                                                        </div>
                                                    )}

                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Font Size</label>
                                                            <input
                                                                type="number"
                                                                value={selectedBlock.data.fontSize || 16}
                                                                onChange={(e) => updateBlockData(selectedId!, { fontSize: parseInt(e.target.value) })}
                                                                className="w-full bg-[#0c0e1a] border border-white/10 rounded-lg p-2 text-xs text-white"
                                                            />
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Text Color</label>
                                                            <input
                                                                type="color"
                                                                value={selectedBlock.data.color || '#000000'}
                                                                onChange={(e) => updateBlockData(selectedId!, { color: e.target.value })}
                                                                className="w-full h-[34px] rounded-lg cursor-pointer bg-transparent"
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Background Color</label>
                                                            <div className="flex items-center gap-2">
                                                                <input
                                                                    type="color"
                                                                    value={selectedBlock.data.bgColor === 'transparent' ? '#ffffff' : selectedBlock.data.bgColor}
                                                                    onChange={(e) => updateBlockData(selectedId!, { bgColor: e.target.value })}
                                                                    className="w-10 h-[34px] rounded-lg cursor-pointer bg-transparent"
                                                                    disabled={selectedBlock.data.bgColor === 'transparent'}
                                                                />
                                                                <button
                                                                    onClick={() => updateBlockData(selectedId!, { bgColor: selectedBlock.data.bgColor === 'transparent' ? '#ffffff' : 'transparent' })}
                                                                    className={`text-[9px] px-2 py-1.5 rounded transition ${selectedBlock.data.bgColor === 'transparent' ? 'bg-accent text-white' : 'bg-white/10 text-gray-400'}`}
                                                                >
                                                                    Clear
                                                                </button>
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Align</label>
                                                            <select
                                                                value={selectedBlock.data.align || 'left'}
                                                                onChange={(e) => updateBlockData(selectedId!, { align: e.target.value })}
                                                                className="w-full bg-[#0c0e1a] border border-white/10 rounded-lg p-2 text-xs text-white"
                                                            >
                                                                <option value="left">Left</option>
                                                                <option value="center">Center</option>
                                                                <option value="right">Right</option>
                                                            </select>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedBlock.type === 'completion' && (
                                                <div className="space-y-4 pt-4 border-t border-white/5">
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Title / Prefix</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.data.title || ''}
                                                            onChange={(e) => updateBlockData(selectedId!, { title: e.target.value })}
                                                            className="w-full bg-[#0c0e1a] border border-white/10 rounded-lg p-2 text-xs text-white"
                                                            placeholder="Good"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Correct Answers</label>
                                                        <input
                                                            type="text"
                                                            value={(selectedBlock.data.correctAnswers || []).join(' | ')}
                                                            onChange={(e) => updateBlockData(selectedId!, { correctAnswers: e.target.value.split('|').map(s => s.trim()) })}
                                                            className="w-full bg-[#0c0e1a] border border-white/10 rounded-lg p-2 text-xs text-white"
                                                            placeholder="night | NIGHT | evening"
                                                        />
                                                        <p className="text-[7px] text-gray-500 mt-1 uppercase">Separate with Pipe (|) for multiple options</p>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <input
                                                            type="checkbox"
                                                            checked={selectedBlock.data.caseSensitive || false}
                                                            onChange={(e) => updateBlockData(selectedId!, { caseSensitive: e.target.checked })}
                                                            className="rounded border-white/10 bg-black"
                                                        />
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">Case Sensitive</label>
                                                    </div>

                                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Premium Design (Preset)</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[
                                                                { id: 'classic', label: 'Classic' },
                                                                { id: 'modern', label: 'Modern' },
                                                                { id: 'glass', label: 'Glass' },
                                                                { id: 'neon', label: 'Neon' }
                                                            ].map(p => (
                                                                <button
                                                                    key={p.id}
                                                                    onClick={() => updateBlockData(selectedId!, { preset: p.id })}
                                                                    className={`py-2 rounded-lg text-[9px] font-black border transition-all ${selectedBlock.data.preset === p.id ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                                >
                                                                    {p.label.toUpperCase()}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3 pt-2">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Title Color</span>
                                                            <input type="color" value={selectedBlock.data.titleColor || '#000000'} onChange={e => updateBlockData(selectedId!, { titleColor: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent border-0" />
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Text Color</span>
                                                            <input type="color" value={selectedBlock.data.textColor || '#000000'} onChange={e => updateBlockData(selectedId!, { textColor: e.target.value })} className="w-full h-8 rounded cursor-pointer bg-transparent border-0" />
                                                        </div>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Font</span>
                                                            <select 
                                                                value={selectedBlock.data.fontFamily || 'serif'} 
                                                                onChange={e => updateBlockData(selectedId!, { fontFamily: e.target.value })}
                                                                className="bg-[#0c0e1a] border border-white/10 rounded-lg p-2 text-[10px] text-white outline-none"
                                                            >
                                                                <option value="serif">Serif (Classic)</option>
                                                                <option value="sans-serif">Sans Serif</option>
                                                                <option value="monospace">Monospace</option>
                                                            </select>
                                                        </div>
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Size</span>
                                                            <input type="number" value={selectedBlock.data.fontSize || 24} onChange={e => updateBlockData(selectedId!, { fontSize: parseInt(e.target.value) })} className="w-full bg-[#0c0e1a] border border-white/10 rounded-lg p-2 text-xs text-white" />
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-white/5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Field Width (px / auto)</label>
                                                        <div className="flex gap-2">
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.data.inputWidth || 'auto'}
                                                                onChange={(e) => updateBlockData(selectedId!, { inputWidth: e.target.value })}
                                                                className="flex-1 bg-[#0c0e1a] border border-white/10 rounded-lg p-2 text-xs text-white"
                                                                placeholder="auto or 300"
                                                            />
                                                            <button
                                                                onClick={() => updateBlockData(selectedId!, { inputWidth: 'auto' })}
                                                                className={`px-3 py-1 rounded-lg text-[10px] uppercase font-bold border transition ${selectedBlock.data.inputWidth === 'auto' ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                                            >
                                                                AUTO
                                                            </button>
                                                        </div>
                                                        <p className="text-[7px] text-gray-500 mt-1 uppercase">Enter a number (px) or use AUTO for dynamic adjustment</p>
                                                    </div>

                                                    <div className="pt-2 border-t border-white/5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Content Alignment</label>
                                                        <div className="grid grid-cols-3 gap-2">
                                                            {[
                                                                { id: 'left', label: 'Left' },
                                                                { id: 'center', label: 'Center' },
                                                                { id: 'right', label: 'Right' }
                                                            ].map(a => (
                                                                <button
                                                                    key={a.id}
                                                                    onClick={() => updateBlockData(selectedId!, { align: a.id })}
                                                                    className={`py-2 rounded-lg text-[9px] font-black border transition-all ${selectedBlock.data.align === a.id ? 'bg-accent border-accent text-white shadow-lg shadow-accent/20' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                                >
                                                                    {a.label.toUpperCase()}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="pt-2 border-t border-white/5">
                                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1 block">Text Format</label>
                                                        <div className="flex gap-2">
                                                            <button 
                                                                onClick={() => updateBlockData(selectedId!, { bold: !selectedBlock.data.bold })}
                                                                className={`p-2 rounded-lg border transition ${selectedBlock.data.bold ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                            >
                                                                <Bold size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => updateBlockData(selectedId!, { italic: !selectedBlock.data.italic })}
                                                                className={`p-2 rounded-lg border transition ${selectedBlock.data.italic ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                            >
                                                                <Italic size={16} />
                                                            </button>
                                                            <button 
                                                                onClick={() => updateBlockData(selectedId!, { underline: !selectedBlock.data.underline })}
                                                                className={`p-2 rounded-lg border transition ${selectedBlock.data.underline ? 'bg-accent border-accent text-white' : 'bg-white/5 border-white/10 text-gray-500 hover:text-white'}`}
                                                            >
                                                                <Underline size={16} />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedBlock.type === 'video' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="w-full p-4 border-2 border-dashed border-white/10 rounded-xl hover:border-accent group cursor-pointer transition-all flex flex-col items-center gap-2">
                                                            <Upload size={20} className="text-gray-500 group-hover:text-accent" />
                                                            <span className="text-[9px] font-black text-gray-500 uppercase">
                                                                {selectedBlock.data.url?.startsWith('data:video') ? '✓ Video loaded — click to replace' : 'Upload Video File'}
                                                            </span>
                                                            <span className="text-[8px] text-gray-600">MP4, WEBM, MOV, AVI, MKV</span>
                                                            <input
                                                                type="file"
                                                                className="hidden"
                                                                accept="video/*"
                                                                onChange={(e) => handleFileUpload(e, 'url')}
                                                            />
                                                        </label>

                                                        {selectedBlock.data.fileName && (
                                                            <div className="px-3 py-2 bg-white/5 border border-white/5 rounded-lg flex flex-col gap-0.5">
                                                                <p className="text-[8px] font-black text-accent uppercase tracking-widest truncate">{selectedBlock.data.fileName}</p>
                                                                <p className="text-[7px] text-gray-500 uppercase">{(selectedBlock.data.size / 1024 / 1024).toFixed(2)} MB • {selectedBlock.data.mimeType}</p>
                                                            </div>
                                                        )}

                                                        <input
                                                            type="text"
                                                            value={selectedBlock.data.url}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { url: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                            placeholder="Or paste video URL (mp4)..."
                                                        />

                                                        <div className="pt-2 border-t border-white/5">
                                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2 block">Preview Image (Poster)</label>
                                                            <label className="w-full p-3 border border-dashed border-white/10 rounded-lg hover:border-accent group cursor-pointer transition-all flex items-center justify-center gap-2 mb-2">
                                                                <FileUp size={14} className="text-gray-500 group-hover:text-accent" />
                                                                <span className="text-[8px] font-black text-gray-500 uppercase">
                                                                    {selectedBlock.data.previewUrl?.startsWith('data:image') ? '✓ Image loaded' : 'Upload Cover'}
                                                                </span>
                                                                <input
                                                                    type="file"
                                                                    className="hidden"
                                                                    accept="image/*"
                                                                    onChange={(e) => handleFileUpload(e, 'previewUrl')}
                                                                />
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.data.previewUrl || ''}
                                                                onChange={(e) => updateBlockData(selectedBlock.id, { previewUrl: e.target.value })}
                                                                className="w-full bg-black/30 border border-white/10 rounded-lg py-1.5 px-3 text-[9px] font-bold focus:border-accent outline-none"
                                                                placeholder="Or paste preview image URL..."
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {[
                                                            { label: 'Autoplay', key: 'autoPlay' },
                                                            { label: 'Loop', key: 'loop' },
                                                            { label: 'Muted', key: 'muted' },
                                                            { label: 'Allow Fullscreen', key: 'allowFullscreen' }
                                                        ].map(opt => (
                                                            <button
                                                                key={opt.key}
                                                                onClick={() => updateBlockData(selectedId!, { [opt.key]: !selectedBlock.data[opt.key] })}
                                                                className={`flex items-center justify-between w-full p-2.5 rounded-lg border transition-all ${selectedBlock.data[opt.key] ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-white/5 border-white/5 text-gray-500'}`}
                                                            >
                                                                <span className="text-[9px] font-black uppercase tracking-widest">{opt.label}</span>
                                                                <div className={`w-2.5 h-2.5 rounded-full ${selectedBlock.data[opt.key] ? 'bg-accent' : 'bg-gray-700'}`}></div>
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedBlock.type === 'audio' && (
                                                <div className="space-y-4">
                                                    <div className="p-1 bg-black/30 rounded-lg grid grid-cols-2 gap-1 mb-2">
                                                        {['bar', 'hotspot'].map(s => (
                                                            <button key={s} onClick={() => updateBlockData(selectedId!, { visualStyle: s, width: s === 'hotspot' ? 60 : 300, height: s === 'hotspot' ? 60 : 80 })} className={`py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${selectedBlock.data.visualStyle === s ? 'bg-accent text-white' : 'text-gray-500 hover:text-white'}`}>{s}</button>
                                                        ))}
                                                    </div>

                                                    {/* Upload audio file → base64 */}
                                                    <label className="w-full p-4 border-2 border-dashed border-white/10 rounded-xl hover:border-accent group cursor-pointer transition-all flex flex-col items-center gap-2">
                                                        <Upload size={20} className="text-gray-500 group-hover:text-accent" />
                                                        <span className="text-[9px] font-black text-gray-500 uppercase">
                                                            {selectedBlock.data.url?.startsWith('data:') ? '✓ Audio loaded — click to replace' : 'Upload Audio File'}
                                                        </span>
                                                        <span className="text-[8px] text-gray-600">MP3, WAV, OGG, M4A</span>
                                                        <input
                                                            type="file"
                                                            className="hidden"
                                                            accept="audio/*"
                                                            onChange={(e) => handleFileUpload(e, 'url')}
                                                        />
                                                    </label>

                                                    {/* Show current source */}
                                                    {selectedBlock.data.url && !selectedBlock.data.url.startsWith('data:') && (
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.data.url}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { url: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                            placeholder="Or paste audio URL (.mp3)..."
                                                        />
                                                    )}
                                                    {!selectedBlock.data.url && (
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.data.url}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { url: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                            placeholder="Or paste audio URL (.mp3)..."
                                                        />
                                                    )}

                                                    <input
                                                        type="text"
                                                        value={selectedBlock.data.title}
                                                        onChange={(e) => updateBlockData(selectedBlock.id, { title: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                        placeholder="Label..."
                                                    />
                                                </div>
                                            )}

                                            {selectedBlock.type === 'button' && (
                                                <div className="space-y-4">
                                                    <input
                                                        type="text"
                                                        value={selectedBlock.data.label}
                                                        onChange={(e) => updateBlockData(selectedBlock.id, { label: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                    />
                                                    <select
                                                        value={selectedBlock.data.action}
                                                        onChange={(e) => updateBlockData(selectedId!, { action: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-black uppercase outline-none"
                                                    >
                                                        <option value="next" className="bg-[#161930]">Next Page</option>
                                                        <option value="link" className="bg-[#161930]">Open Link</option>
                                                    </select>
                                                    {selectedBlock.data.action === 'link' && (
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.data.value}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { value: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                            placeholder="URL..."
                                                        />
                                                    )}
                                                </div>
                                            )}

                                            {selectedBlock.type === 'activity' && (
                                                <div className="space-y-4">
                                                    <div className="p-1 bg-black/30 rounded-lg grid grid-cols-2 gap-1 mb-2">
                                                        {[
                                                            { id: 'scramble', label: 'Scramble' },
                                                            { id: 'input', label: 'Input' }
                                                        ].map(m => (
                                                            <button
                                                                key={m.id}
                                                                onClick={() => updateBlockData(selectedId!, { mode: m.id })}
                                                                className={`py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${selectedBlock.data.mode === m.id ? 'bg-accent text-white' : 'text-gray-500 hover:text-white'}`}
                                                            >
                                                                {m.label}
                                                            </button>
                                                        ))}
                                                    </div>

                                                    <textarea
                                                        value={selectedBlock.data.question}
                                                        onChange={(e) => updateBlockData(selectedBlock.id, { question: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:border-accent outline-none resize-none"
                                                        placeholder="Question / Prompt?"
                                                    />

                                                    <input
                                                        type="text"
                                                        value={selectedBlock.data.correctAnswer}
                                                        onChange={(e) => updateBlockData(selectedBlock.id, { correctAnswer: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                        placeholder="Correct Answer..."
                                                    />

                                                    {selectedBlock.data.mode === 'scramble' && (
                                                        <div className="space-y-2">
                                                            <div className="flex justify-between items-center">
                                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Options (Optional)</p>
                                                                <button
                                                                    onClick={() => {
                                                                        const current = selectedBlock.data.options || [];
                                                                        updateBlockData(selectedId!, { options: [...current, 'New Word'] });
                                                                    }}
                                                                    className="text-[10px] text-accent font-black uppercase"
                                                                >
                                                                    + Add
                                                                </button>
                                                            </div>
                                                            <p className="text-[7px] text-gray-600 font-bold uppercase italic">If empty, words from the correct answer will be shuffled.</p>
                                                            {(selectedBlock.data.options || []).map((opt: string, i: number) => (
                                                                <div key={i} className="flex gap-2 items-center">
                                                                    <input
                                                                        type="text"
                                                                        value={opt}
                                                                        onChange={(e) => {
                                                                            const newOpts = [...selectedBlock.data.options];
                                                                            newOpts[i] = e.target.value;
                                                                            updateBlockData(selectedBlock.id, { options: newOpts });
                                                                        }}
                                                                        className="flex-1 bg-black/20 border border-white/10 rounded-md py-1 px-2 text-[10px] font-bold text-accent"
                                                                    />
                                                                    <button
                                                                        onClick={() => {
                                                                            setConfirmModal({
                                                                                isOpen: true,
                                                                                title: "Delete Option",
                                                                                description: "Are you sure you want to remove this answer option?",
                                                                                onConfirm: () => {
                                                                                    const newOpts = [...selectedBlock.data.options];
                                                                                    newOpts.splice(i, 1);
                                                                                    updateBlockData(selectedId!, { options: newOpts });
                                                                                }
                                                                            });
                                                                        }}
                                                                        className="text-red-500 hover:text-red-400"
                                                                    >
                                                                        <Trash2 size={12} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}

                                                    <textarea
                                                        value={selectedBlock.data.feedback}
                                                        onChange={(e) => updateBlockData(selectedBlock.id, { feedback: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:border-accent outline-none resize-none italic"
                                                        placeholder="Success feedback (optional)..."
                                                    />

                                                    {/* ── CUSTOMIZATION SWITCHES ── */}
                                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest mb-2">Display Options</p>
                                                        <div className="grid grid-cols-2 gap-2">
                                                            {[
                                                                { label: 'Hide Question', key: 'hideQuestion' },
                                                                { label: 'Hide Check', key: 'hideCheckButton' },
                                                                { label: 'Hide Reset', key: 'hideResetButton' },
                                                                { label: 'Compact UI', key: 'compact' }
                                                            ].map(opt => (
                                                                <button
                                                                    key={opt.key}
                                                                    onClick={() => updateBlockData(selectedId!, { [opt.key]: !selectedBlock.data[opt.key] })}
                                                                    className={`flex items-center justify-between p-2 rounded-lg border transition-all ${selectedBlock.data[opt.key] ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                                                >
                                                                    <span className="text-[8px] font-black uppercase">{opt.label}</span>
                                                                    <div className={`w-2 h-2 rounded-full ${selectedBlock.data[opt.key] ? 'bg-accent' : 'bg-gray-700'}`}></div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* ── FRAME PRESETS ── */}
                                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                                        <p className="text-[8px] text-gray-500 font-bold uppercase tracking-widest">Marco / Frame</p>
                                                        <div className="grid grid-cols-4 gap-1">
                                                            {[
                                                                { id: 'none', label: 'Sin marco', bg: '', outer: '', inner: '' },
                                                                { id: 'navy-red', label: '🇺🇸 Navy', bg: '#0a1560', outer: '#cc0000', inner: '#ffffff' },
                                                                { id: 'classic', label: '📜 Classic', bg: '#1a0a00', outer: '#c8860a', inner: '#fffde0' },
                                                                { id: 'dark', label: '⬛ Dark', bg: '#0f0f0f', outer: '#444444', inner: '#888888' },
                                                                { id: 'success', label: '✅ Green', bg: '#052e16', outer: '#16a34a', inner: '#86efac' },
                                                                { id: 'warning', label: '⚠️ Amber', bg: '#431407', outer: '#d97706', inner: '#fde68a' },
                                                                { id: 'info', label: '🔵 Blue', bg: '#0c1a40', outer: '#2563eb', inner: '#bfdbfe' },
                                                                { id: 'purple', label: '💜 Purple', bg: '#1a0537', outer: '#7c3aed', inner: '#ddd6fe' },
                                                            ].map(f => (
                                                                <button
                                                                    key={f.id}
                                                                    onClick={() => updateBlockData(selectedId!, {
                                                                        frameStyle: f.id,
                                                                        frameBg: f.bg,
                                                                        frameBorder: f.outer,
                                                                        frameInner: f.inner,
                                                                    })}
                                                                    className={`py-1.5 px-1 rounded-lg text-[8px] font-black border transition-all truncate
                                                                    ${selectedBlock.data.frameStyle === f.id
                                                                            ? 'border-accent bg-accent/20 text-white'
                                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'}`}
                                                                >
                                                                    {f.label}
                                                                </button>
                                                            ))}
                                                        </div>

                                                        {selectedBlock.data.frameStyle && selectedBlock.data.frameStyle !== 'none' && (
                                                            <div className="grid grid-cols-3 gap-2 mt-1">
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="text-[7px] text-gray-600 uppercase tracking-widest">Background</span>
                                                                    <input type="color" value={selectedBlock.data.frameBg || '#0a1560'}
                                                                        onChange={e => updateBlockData(selectedId!, { frameBg: e.target.value })}
                                                                        className="w-full h-7 rounded cursor-pointer bg-transparent border-0" />
                                                                </div>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="text-[7px] text-gray-600 uppercase tracking-widest">Outer Border</span>
                                                                    <input type="color" value={selectedBlock.data.frameBorder || '#cc0000'}
                                                                        onChange={e => updateBlockData(selectedId!, { frameBorder: e.target.value })}
                                                                        className="w-full h-7 rounded cursor-pointer bg-transparent border-0" />
                                                                </div>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <span className="text-[7px] text-gray-600 uppercase tracking-widest">Inner Border</span>
                                                                    <input type="color" value={selectedBlock.data.frameInner || '#ffffff'}
                                                                        onChange={e => updateBlockData(selectedId!, { frameInner: e.target.value })}
                                                                        className="w-full h-7 rounded cursor-pointer bg-transparent border-0" />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}

                                            {(selectedBlock.type === 'word_bank' || selectedBlock.type === 'listen_tap') && (
                                                <div className="space-y-4">
                                                    {selectedBlock.type === 'listen_tap' && (
                                                        <div className="space-y-2">
                                                            <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Audio URL (Optional)</label>
                                                            <input
                                                                type="text"
                                                                value={selectedBlock.data.audioUrl || ''}
                                                                onChange={(e) => updateBlockData(selectedBlock.id, { audioUrl: e.target.value })}
                                                                className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                                placeholder="Paste audio URL (.mp3)..."
                                                            />
                                                        </div>
                                                    )}
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Correct Sentence</label>
                                                        <textarea
                                                            value={selectedBlock.data.correctSentence || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { correctSentence: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:border-accent outline-none resize-none"
                                                            placeholder="The boy eats an apple"
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Distractors</p>
                                                            <button
                                                                onClick={() => {
                                                                    const current = selectedBlock.data.distractors || [];
                                                                    updateBlockData(selectedId!, { distractors: [...current, 'New'] });
                                                                }}
                                                                className="text-[10px] text-accent font-black uppercase"
                                                            >
                                                                + Add
                                                            </button>
                                                        </div>
                                                        <p className="text-[7px] text-gray-600 font-bold uppercase italic">Extra words to confuse the user.</p>
                                                        {(selectedBlock.data.distractors || []).map((opt: string, i: number) => (
                                                            <div key={i} className="flex gap-2 items-center">
                                                                <input
                                                                    type="text"
                                                                    value={opt}
                                                                    onChange={(e) => {
                                                                        const newOpts = [...selectedBlock.data.distractors];
                                                                        newOpts[i] = e.target.value;
                                                                        updateBlockData(selectedBlock.id, { distractors: newOpts });
                                                                    }}
                                                                    className="flex-1 bg-black/20 border border-white/10 rounded-md py-1 px-2 text-[10px] font-bold text-accent outline-none"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const newOpts = [...selectedBlock.data.distractors];
                                                                        newOpts.splice(i, 1);
                                                                        updateBlockData(selectedId!, { distractors: newOpts });
                                                                    }}
                                                                    className="text-red-500 hover:text-red-400 p-1"
                                                                >
                                                                    <Trash2 size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedBlock.type === 'matching' && (
                                                <div className="space-y-4">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Matching Pairs</p>
                                                        <button
                                                            onClick={() => {
                                                                const current = selectedBlock.data.pairs || [];
                                                                updateBlockData(selectedId!, { pairs: [...current, { left: 'Left', right: 'Right' }] });
                                                            }}
                                                            className="text-[10px] text-accent font-black uppercase"
                                                        >
                                                            + Add Pair
                                                        </button>
                                                    </div>
                                                    {(selectedBlock.data.pairs || []).map((pair: any, i: number) => (
                                                        <div key={i} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-white/5">
                                                            <div className="flex-1 space-y-2">
                                                                <input
                                                                    type="text"
                                                                    value={pair.left}
                                                                    onChange={(e) => {
                                                                        const newPairs = [...selectedBlock.data.pairs];
                                                                        newPairs[i] = { ...newPairs[i], left: e.target.value };
                                                                        updateBlockData(selectedBlock.id, { pairs: newPairs });
                                                                    }}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-md py-1.5 px-2 text-[10px] font-bold focus:border-accent outline-none"
                                                                    placeholder="Left text..."
                                                                />
                                                                <input
                                                                    type="text"
                                                                    value={pair.right}
                                                                    onChange={(e) => {
                                                                        const newPairs = [...selectedBlock.data.pairs];
                                                                        newPairs[i] = { ...newPairs[i], right: e.target.value };
                                                                        updateBlockData(selectedBlock.id, { pairs: newPairs });
                                                                    }}
                                                                    className="w-full bg-black/40 border border-white/10 rounded-md py-1.5 px-2 text-[10px] font-bold focus:border-accent outline-none text-accent"
                                                                    placeholder="Right match..."
                                                                />
                                                            </div>
                                                            <button
                                                                onClick={() => {
                                                                    const newPairs = [...selectedBlock.data.pairs];
                                                                    newPairs.splice(i, 1);
                                                                    updateBlockData(selectedId!, { pairs: newPairs });
                                                                }}
                                                                className="text-red-500 hover:text-red-400 p-2 shrink-0 border border-transparent hover:border-red-500/20 rounded-lg"
                                                            >
                                                                <Trash2 size={14} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {selectedBlock.type === 'cloze' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Text with [blanks]</label>
                                                        <textarea
                                                            value={selectedBlock.data.textWithBlanks || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { textWithBlanks: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:border-accent outline-none resize-none"
                                                            placeholder="The [boy|kid] eats an [apple|orange]."
                                                            rows={4}
                                                        />
                                                    </div>
                                                    <div className="bg-accent/10 border border-accent/20 rounded-xl p-3 space-y-1.5">
                                                        <p className="text-[9px] font-black text-accent uppercase tracking-widest">Syntax Guide</p>
                                                        <p className="text-[9px] text-gray-400 leading-relaxed">
                                                            Use <span className="text-white font-bold">[answer]</span> for a single answer blank.
                                                        </p>
                                                        <p className="text-[9px] text-gray-400 leading-relaxed">
                                                            Use <span className="text-white font-bold">[ans1|ans2|ans3]</span> to accept multiple valid answers separated by <span className="text-accent font-bold">|</span>
                                                        </p>
                                                        <div className="border-t border-white/10 pt-1.5 mt-1.5">
                                                            <p className="text-[8px] text-gray-500">Example: <span className="text-white">She is [happy|glad|cheerful] today.</span></p>
                                                        </div>
                                                    </div>

                                                    {/* Show extracted blanks with their accepted answers */}
                                                    {(() => {
                                                        const text = selectedBlock.data.textWithBlanks || '';
                                                        const regex = /\[(.*?)\]/g;
                                                        let match;
                                                        const blanks: { raw: string; answers: string[] }[] = [];
                                                        while ((match = regex.exec(text)) !== null) {
                                                            const answers = match[1].split('|').map((a: string) => a.trim()).filter((a: string) => a.length > 0);
                                                            blanks.push({ raw: match[1], answers });
                                                        }
                                                        if (blanks.length === 0) return null;
                                                        return (
                                                            <div className="space-y-2">
                                                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Detected Blanks ({blanks.length})</p>
                                                                {blanks.map((blank, i) => (
                                                                    <div key={i} className="bg-black/30 border border-white/10 rounded-lg p-2">
                                                                        <p className="text-[8px] text-gray-500 font-bold uppercase mb-1">Blank #{i + 1}</p>
                                                                        <div className="flex flex-wrap gap-1">
                                                                            {blank.answers.map((ans, j) => (
                                                                                <span key={j} className="text-[9px] bg-green-500/20 text-green-400 border border-green-500/20 px-2 py-0.5 rounded-full font-bold">
                                                                                    {ans}
                                                                                </span>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        );
                                                    })()}
                                                </div>
                                            )}

                                            {selectedBlock.type === 'dictation' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Audio URL</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.data.audioUrl || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { audioUrl: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                            placeholder="Paste audio URL (.mp3)..."
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Correct Transcript</label>
                                                        <textarea
                                                            value={selectedBlock.data.correctText || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { correctText: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:border-accent outline-none resize-none"
                                                            placeholder="The quick brown fox"
                                                            rows={2}
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {selectedBlock.type === 'pronunciation' && (
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Target Phrase (to speak)</label>
                                                    <textarea
                                                        value={selectedBlock.data.targetPhrase || ''}
                                                        onChange={(e) => updateBlockData(selectedBlock.id, { targetPhrase: e.target.value })}
                                                        className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:border-accent outline-none resize-none"
                                                        placeholder="Hello world"
                                                        rows={2}
                                                    />
                                                </div>
                                            )}

                                            {selectedBlock.type === 'translation' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Source Text</label>
                                                        <textarea
                                                            value={selectedBlock.data.sourceText || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { sourceText: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:border-accent outline-none resize-none"
                                                            placeholder="Translating phrase..."
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Target Language (Label)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.data.targetLanguage || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { targetLanguage: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                            placeholder="e.g. Spanish"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {selectedBlock.type === 'code_editor' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Instructions</label>
                                                        <textarea
                                                            value={selectedBlock.data.instructions || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { instructions: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:border-accent outline-none resize-none"
                                                            placeholder="Write a function..."
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Initial Code</label>
                                                        <textarea
                                                            value={selectedBlock.data.initialCode || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { initialCode: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[10px] font-mono focus:border-accent outline-none resize-none text-accent/80"
                                                            placeholder="function main() {}"
                                                            rows={4}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Expected Output (substring)</label>
                                                        <input
                                                            type="text"
                                                            value={selectedBlock.data.expectedOutput || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { expectedOutput: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg py-2 px-3 text-[10px] font-bold focus:border-accent outline-none"
                                                            placeholder="Hello World"
                                                        />
                                                    </div>
                                                </div>
                                            )}

                                            {selectedBlock.type === 'story_dialogue' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Narrative / Dialogue Text</label>
                                                        <textarea
                                                            value={selectedBlock.data.dialogueText || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { dialogueText: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:border-accent outline-none resize-none"
                                                            placeholder="Hello, traveller! What brings you here?"
                                                            rows={3}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">User Options</p>
                                                            <button
                                                                onClick={() => {
                                                                    const current = selectedBlock.data.userOptions || [];
                                                                    updateBlockData(selectedId!, { userOptions: [...current, { id: Date.now().toString(), text: 'New Option', isCorrect: false }] });
                                                                }}
                                                                className="text-[10px] text-accent font-black uppercase"
                                                            >
                                                                + Add
                                                            </button>
                                                        </div>
                                                        {(selectedBlock.data.userOptions || []).map((opt: any, i: number) => (
                                                            <div key={opt.id || i} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-white/5">
                                                                <button
                                                                    onClick={() => {
                                                                        const newOpts = [...selectedBlock.data.userOptions];
                                                                        newOpts[i] = { ...newOpts[i], isCorrect: !newOpts[i].isCorrect };
                                                                        updateBlockData(selectedBlock.id, { userOptions: newOpts });
                                                                    }}
                                                                    className={`p-1.5 rounded-lg border flex-shrink-0 transition-colors ${opt.isCorrect ? 'bg-green-500/20 text-green-500 border-green-500/50' : 'bg-gray-800 text-gray-500 border-gray-700'}`}
                                                                >
                                                                    <CheckCircle2 size={12} />
                                                                </button>
                                                                <input
                                                                    type="text"
                                                                    value={opt.text}
                                                                    onChange={(e) => {
                                                                        const newOpts = [...selectedBlock.data.userOptions];
                                                                        newOpts[i] = { ...newOpts[i], text: e.target.value };
                                                                        updateBlockData(selectedBlock.id, { userOptions: newOpts });
                                                                    }}
                                                                    className="flex-1 bg-black/40 border border-white/10 rounded-md py-1.5 px-2 text-[10px] font-bold outline-none focus:border-accent"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const newOpts = [...selectedBlock.data.userOptions];
                                                                        newOpts.splice(i, 1);
                                                                        updateBlockData(selectedId!, { userOptions: newOpts });
                                                                    }}
                                                                    className="text-red-500 hover:text-red-400 p-1"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {selectedBlock.type === 'reading_comp' && (
                                                <div className="space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Reading Passage</label>
                                                        <textarea
                                                            value={selectedBlock.data.storyText || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { storyText: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-xl p-3 text-[10px] font-bold focus:border-accent outline-none resize-none"
                                                            placeholder="Once upon a time..."
                                                            rows={4}
                                                        />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest block">Quiz Question</label>
                                                        <textarea
                                                            value={selectedBlock.data.question || ''}
                                                            onChange={(e) => updateBlockData(selectedBlock.id, { question: e.target.value })}
                                                            className="w-full bg-black/30 border border-white/10 rounded-lg p-2 text-[10px] font-bold focus:border-accent outline-none resize-none"
                                                            placeholder="What happened in the story?"
                                                            rows={2}
                                                        />
                                                    </div>
                                                    <div className="space-y-2 pt-2 border-t border-white/5">
                                                        <div className="flex justify-between items-center">
                                                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Quiz Options</p>
                                                            <button
                                                                onClick={() => {
                                                                    const current = selectedBlock.data.options || [];
                                                                    updateBlockData(selectedId!, { options: [...current, { id: Date.now().toString(), text: 'New Option', isCorrect: false }] });
                                                                }}
                                                                className="text-[10px] text-accent font-black uppercase"
                                                            >
                                                                + Add
                                                            </button>
                                                        </div>
                                                        {(selectedBlock.data.options || []).map((opt: any, i: number) => (
                                                            <div key={opt.id || i} className="flex gap-2 items-center bg-black/20 p-2 rounded-lg border border-white/5">
                                                                <button
                                                                    onClick={() => {
                                                                        const newOpts = [...selectedBlock.data.options];
                                                                        // For single correct answer, we might uncheck others. But let's keep it simple.
                                                                        newOpts[i] = { ...newOpts[i], isCorrect: !newOpts[i].isCorrect };
                                                                        updateBlockData(selectedBlock.id, { options: newOpts });
                                                                    }}
                                                                    className={`p-1.5 rounded-lg border flex-shrink-0 transition-colors ${opt.isCorrect ? 'bg-green-500/20 text-green-500 border-green-500/50' : 'bg-gray-800 text-gray-500 border-gray-700'}`}
                                                                >
                                                                    <CheckCircle2 size={12} />
                                                                </button>
                                                                <input
                                                                    type="text"
                                                                    value={opt.text}
                                                                    onChange={(e) => {
                                                                        const newOpts = [...selectedBlock.data.options];
                                                                        newOpts[i] = { ...newOpts[i], text: e.target.value };
                                                                        updateBlockData(selectedBlock.id, { options: newOpts });
                                                                    }}
                                                                    className="flex-1 bg-black/40 border border-white/10 rounded-md py-1.5 px-2 text-[10px] font-bold outline-none focus:border-accent"
                                                                />
                                                                <button
                                                                    onClick={() => {
                                                                        const newOpts = [...selectedBlock.data.options];
                                                                        newOpts.splice(i, 1);
                                                                        updateSelectedBlocks({ options: newOpts });
                                                                    }}
                                                                    className="text-red-500 hover:text-red-400 p-1"
                                                                >
                                                                    <Trash2 size={14} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            {/* Global Compact Toggles for New Blocks */}
                                            {['word_bank', 'matching', 'cloze', 'dictation', 'listen_tap', 'pronunciation', 'translation', 'story_dialogue', 'reading_comp', 'code_editor'].includes(selectedBlock.type) && (
                                                <div className="mt-4 pt-4 border-t border-white/5">
                                                    <button
                                                        onClick={() => updateSelectedBlocks({ compact: !selectedBlock.data.compact })}
                                                        className={`flex items-center justify-between w-full p-2.5 rounded-lg border transition-all ${selectedBlock.data.compact ? 'bg-accent/10 border-accent/50 text-accent' : 'bg-white/5 border-white/10 text-gray-500'}`}
                                                    >
                                                        <span className="text-[9px] font-black uppercase tracking-widest">Compact Mode</span>
                                                        <div className={`w-2.5 h-2.5 rounded-full shadow-inner ${selectedBlock.data.compact ? 'bg-accent' : 'bg-gray-700'}`}></div>
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Advanced Actions */}
                                        <div className="pt-2 grid grid-cols-2 gap-3">
                                            <button
                                                onClick={() => duplicateBlock(selectedId!)}
                                                className="py-3 bg-accent/10 hover:bg-accent/20 text-accent rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-accent/20 flex items-center justify-center gap-2"
                                            >
                                                <Layout size={14} />
                                                Duplicate
                                            </button>
                                            <button
                                                onClick={() => removeBlock(selectedId!)}
                                                className="py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border border-red-500/20 flex items-center justify-center gap-2"
                                            >
                                                <Trash2 size={14} />
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>
                )}
            </div>

            {/* AI Asset Generator Modal */}
            {
                token && (
                    <AIAssetGenerator
                        isOpen={aiModalOpen}
                        onClose={() => setAiModalOpen(false)}
                        token={token}
                        onAssetGenerated={(asset) => {
                            // Handle layout import
                            if (asset.type === 'layout' && asset.layout) {
                                if (asset.layout.isHtml && asset.layout.content) {
                                    // Full standalone HTML page
                                    setCanvasBg({ color: '#ffffff', url: '' });
                                    const newBlock: BlockData = {
                                        id: 'html_' + Math.random().toString(36).substr(2, 9),
                                        type: 'html',
                                        data: {
                                            content: asset.layout.content,
                                            x: 0,
                                            y: 0,
                                            width: 800,
                                            height: 1200,
                                            rotate: 0,
                                            zIndex: 1,
                                            opacity: 1,
                                            borderRadius: 0,
                                        }
                                    };
                                    setBlocks([newBlock]);
                                    setSelectedIds([]);
                                } else {
                                    // Legacy JSON blocks
                                    if (asset.layout.canvas) {
                                        setCanvasBg(asset.layout.canvas);
                                    }
                                    if (Array.isArray(asset.layout.blocks) && asset.layout.blocks.length > 0) {
                                        setBlocks(asset.layout.blocks);
                                        setSelectedIds([]);
                                    }
                                }
                                setAiModalOpen(false);
                                return;
                            }

                            // Handle image/video assets
                            const id = Math.random().toString(36).substr(2, 9);
                            const blockType = asset.type === 'video' ? 'video' : 'image';
                            const newBlock: BlockData = {
                                id,
                                type: blockType,
                                data: {
                                    url: asset.url,
                                    x: 50,
                                    y: 50,
                                    width: Math.min(asset.width || 400, 500),
                                    height: Math.min(asset.height || 300, 500),
                                    rotate: 0,
                                    zIndex: blocks.length + 1,
                                    opacity: 1,
                                    borderRadius: 16,
                                    borderWidth: 0,
                                    borderColor: '#ffffff',
                                    boxShadow: 'none',
                                    alt: asset.title,
                                    caption: asset.title,
                                    ...(blockType === 'video' ? { autoPlay: false, loop: false, muted: false } : {}),
                                }
                            };
                            setBlocks(prev => [...prev, newBlock]);
                            setSelectedIds([id]);
                            setAiModalOpen(false);
                        }}
                    />
                )
            }
            {/* Import JSON Modal */}
            <AnimatePresence>
                {importModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[10000] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#161930] rounded-2xl border border-white/10 w-full max-w-3xl flex flex-col overflow-hidden shadow-2xl"
                        >
                            <div className="flex items-center justify-between p-6 border-b border-white/10">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-accent">
                                        <Code size={20} />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-black uppercase tracking-tighter">Import Raw Data</h2>
                                        <p className="text-xs text-gray-400 font-bold tracking-widest uppercase">Paste your component JSON here</p>
                                    </div>
                                </div>
                                <button onClick={() => setImportModalOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <div className="p-6 bg-[#0c0e1a]/50 flex-1 flex flex-col min-h-[400px]">
                                <p className="text-xs text-gray-400 mb-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-500 p-3 rounded-xl flex items-start gap-2">
                                    <Info size={16} className="mt-0.5 flex-shrink-0" />
                                    <span>You can paste either a plain array of blocks <code>[{`{...}`}]</code>, or an object with blocks and canvas <code>{`{ blocks: [...], canvas: {...} }`}</code>. This will overwrite the current canvas completely.</span>
                                </p>
                                <textarea
                                    value={importJsonText}
                                    onChange={(e) => setImportJsonText(e.target.value)}
                                    placeholder="Paste your JSON here..."
                                    className="w-full flex-1 bg-[#101328] border border-white/10 rounded-xl p-4 text-sm font-mono text-gray-300 focus:outline-none focus:border-accent/50 focus:ring-1 focus:ring-accent/50 resize-custom-scrollbar min-h-[300px]"
                                    spellCheck={false}
                                />
                            </div>

                            <div className="p-6 border-t border-white/10 flex justify-end gap-3 bg-[#161930]">
                                <button
                                    onClick={() => setImportModalOpen(false)}
                                    className="px-6 py-3 rounded-xl border border-white/10 font-black text-xs uppercase tracking-widest hover:bg-white/5 transition-all w-full sm:w-auto"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleImportJson}
                                    className="px-6 py-3 rounded-xl bg-accent text-white font-black text-xs uppercase tracking-widest hover:bg-orange-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent/20 w-full sm:w-auto"
                                >
                                    <Save size={16} />
                                    Apply Data
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image Cropper Modal */}
            <ImageCropperModal
                isOpen={isCropperOpen}
                imageSrc={cropImageSrc}
                onClose={() => setIsCropperOpen(false)}
                onCropComplete={handleCropComplete}
            />

            {/* Premium Confirmation Dialog for deletions */}
            <PremiumConfirmModal
                isOpen={confirmModal.isOpen}
                onClose={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
                onConfirm={confirmModal.onConfirm}
                title={confirmModal.title}
                description={confirmModal.description}
                isDanger={true}
                confirmText={"Delete"}
                cancelText={"Cancel"}
            />
        </motion.div >
    );
};

export default InteractivePageEditor;
