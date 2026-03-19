import React, { useRef, useEffect, useCallback, useState } from 'react';

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
}

type ColorPickerTarget = 'fore' | 'hilite' | null;

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange }) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const [colorTarget, setColorTarget] = useState<ColorPickerTarget>(null);
    const [foreColor, setForeColor] = useState('#ffffff');
    const [hiliteColor, setHiliteColor] = useState('#facc15');
    const isInternalUpdate = useRef(false);

    // Sync external value → editor (avoid cursor jumping)
    useEffect(() => {
        const el = editorRef.current;
        if (!el) return;
        if (!isInternalUpdate.current && el.innerHTML !== value) {
            el.innerHTML = value || '';
        }
        isInternalUpdate.current = false;
    }, [value]);

    const exec = useCallback((cmd: string, val?: string) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, val);
        isInternalUpdate.current = true;
        onChange(editorRef.current?.innerHTML || '');
    }, [onChange]);

    const handleInput = () => {
        isInternalUpdate.current = true;
        onChange(editorRef.current?.innerHTML || '');
    };

    const applyBlock = (tag: string) => exec('formatBlock', tag);
    const applyFontName = (font: string) => {
        editorRef.current?.focus();
        document.execCommand('fontName', false, font);
        handleInput();
    };

    const applyFontSize = (size: string) => {
        editorRef.current?.focus();
        // execCommand('fontSize') only supports 1-7. 
        // We use a high-level hack: apply size 7, then find the <font> tags and replace with <span style="font-size: ...">
        document.execCommand('fontSize', false, '7');
        const fontTags = editorRef.current?.querySelectorAll('font[size="7"]');
        fontTags?.forEach(font => {
            const span = document.createElement('span');
            span.style.fontSize = `${size}px`;
            span.innerHTML = font.innerHTML;
            font.parentNode?.replaceChild(span, font);
        });
        handleInput();
    };

    const isActive = (cmd: string) => {
        try { return document.queryCommandState(cmd); } catch { return false; }
    };

    const ToolBtn = ({
        onClick, title, active, children
    }: { onClick: () => void; title: string; active?: boolean; children: React.ReactNode }) => (
        <button
            onMouseDown={(e) => { e.preventDefault(); onClick(); }}
            title={title}
            className={`w-7 h-7 rounded flex items-center justify-center text-[11px] font-bold transition-all select-none
                ${active ? 'bg-accent text-white shadow-inner' : 'text-gray-300 hover:bg-white/10 hover:text-white'}`}
        >
            {children}
        </button>
    );

    const Divider = () => <div className="w-px h-5 bg-white/10 mx-0.5 shrink-0" />;

    return (
        <div className="flex flex-col border border-white/10 rounded-xl overflow-hidden bg-black/30">

            {/* ── TOOLBAR ── */}
            <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 bg-white/5 border-b border-white/10">

                {/* Paragraph style */}
                <select
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => { editorRef.current?.focus(); applyBlock(e.target.value); e.target.value = 'p'; }}
                    defaultValue="p"
                    className="h-6 bg-black/40 border border-white/10 rounded text-[10px] font-bold text-gray-300 px-1 mr-0.5 outline-none cursor-pointer hover:border-accent"
                >
                    <option value="p">Párrafo</option>
                    <option value="h1">Título 1</option>
                    <option value="h2">Título 2</option>
                    <option value="h3">Título 3</option>
                    <option value="h4">Título 4</option>
                    <option value="blockquote">Cita</option>
                    <option value="pre">Código</option>
                </select>

                {/* Font Family */}
                <select
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => { applyFontName(e.target.value); e.target.value = 'default'; }}
                    defaultValue="default"
                    className="h-6 bg-black/40 border border-white/10 rounded text-[10px] font-bold text-gray-300 px-1 mr-0.5 outline-none cursor-pointer hover:border-accent"
                >
                    <option value="default" disabled>Font</option>
                    <optgroup label="Sans Serif">
                        <option value="Inter, sans-serif">Inter</option>
                        <option value="Montserrat, sans-serif">Montserrat</option>
                        <option value="Arial, Helvetica, sans-serif">Arial</option>
                        <option value="Verdana, sans-serif">Verdana</option>
                    </optgroup>
                    <optgroup label="Serif">
                        <option value="'Playfair Display', serif">Playfair Display</option>
                        <option value="Georgia, serif">Georgia</option>
                        <option value="'Times New Roman', serif">Times New Roman</option>
                    </optgroup>
                    <optgroup label="Monospace">
                        <option value="'Courier New', monospace">Courier New</option>
                    </optgroup>
                </select>

                {/* Font size */}
                <select
                    onMouseDown={(e) => e.stopPropagation()}
                    onChange={(e) => { applyFontSize(e.target.value); e.target.value = '12'; }}
                    defaultValue="12"
                    className="h-6 bg-black/40 border border-white/10 rounded text-[10px] font-bold text-gray-300 px-1 mr-0.5 outline-none cursor-pointer hover:border-accent"
                >
                    {[8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 28, 32, 36, 48, 60, 72].map(size => (
                        <option key={size} value={size}>{size}px</option>
                    ))}
                </select>

                <Divider />

                {/* Bold, Italic, Underline, Strike */}
                <ToolBtn onClick={() => exec('bold')} title="Negrita (Ctrl+B)" active={isActive('bold')}>
                    <strong>B</strong>
                </ToolBtn>
                <ToolBtn onClick={() => exec('italic')} title="Cursiva (Ctrl+I)" active={isActive('italic')}>
                    <em>I</em>
                </ToolBtn>
                <ToolBtn onClick={() => exec('underline')} title="Subrayado (Ctrl+U)" active={isActive('underline')}>
                    <span className="underline">U</span>
                </ToolBtn>
                <ToolBtn onClick={() => exec('strikeThrough')} title="Tachado" active={isActive('strikeThrough')}>
                    <span className="line-through">S</span>
                </ToolBtn>

                <Divider />

                {/* Alignment */}
                <ToolBtn onClick={() => exec('justifyLeft')} title="Alinear izquierda">
                    <svg viewBox="0 0 16 16" width="12" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="1" /><rect x="1" y="6" width="9" height="1.5" rx="1" /><rect x="1" y="10" width="14" height="1.5" rx="1" /><rect x="1" y="14" width="9" height="1.5" rx="1" /></svg>
                </ToolBtn>
                <ToolBtn onClick={() => exec('justifyCenter')} title="Centrar">
                    <svg viewBox="0 0 16 16" width="12" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="1" /><rect x="3.5" y="6" width="9" height="1.5" rx="1" /><rect x="1" y="10" width="14" height="1.5" rx="1" /><rect x="3.5" y="14" width="9" height="1.5" rx="1" /></svg>
                </ToolBtn>
                <ToolBtn onClick={() => exec('justifyRight')} title="Alinear derecha">
                    <svg viewBox="0 0 16 16" width="12" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="1" /><rect x="6" y="6" width="9" height="1.5" rx="1" /><rect x="1" y="10" width="14" height="1.5" rx="1" /><rect x="6" y="14" width="9" height="1.5" rx="1" /></svg>
                </ToolBtn>
                <ToolBtn onClick={() => exec('justifyFull')} title="Justificar">
                    <svg viewBox="0 0 16 16" width="12" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="1" /><rect x="1" y="6" width="14" height="1.5" rx="1" /><rect x="1" y="10" width="14" height="1.5" rx="1" /><rect x="1" y="14" width="14" height="1.5" rx="1" /></svg>
                </ToolBtn>

                <Divider />

                {/* Lists */}
                <ToolBtn onClick={() => exec('insertUnorderedList')} title="Lista con viñetas">
                    <svg viewBox="0 0 16 16" width="12" fill="currentColor"><circle cx="2" cy="4" r="1.5" /><rect x="5" y="3" width="10" height="2" rx="1" /><circle cx="2" cy="8" r="1.5" /><rect x="5" y="7" width="10" height="2" rx="1" /><circle cx="2" cy="12" r="1.5" /><rect x="5" y="11" width="10" height="2" rx="1" /></svg>
                </ToolBtn>
                <ToolBtn onClick={() => exec('insertOrderedList')} title="Lista numerada">
                    <svg viewBox="0 0 16 16" width="12" fill="currentColor"><text x="0" y="5" fontSize="5" fontWeight="bold">1.</text><rect x="5" y="3" width="10" height="2" rx="1" /><text x="0" y="9.5" fontSize="5" fontWeight="bold">2.</text><rect x="5" y="7" width="10" height="2" rx="1" /><text x="0" y="14" fontSize="5" fontWeight="bold">3.</text><rect x="5" y="11" width="10" height="2" rx="1" /></svg>
                </ToolBtn>

                {/* Indent */}
                <ToolBtn onClick={() => exec('indent')} title="Aumentar sangría">
                    <svg viewBox="0 0 16 16" width="12" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="1" /><rect x="5" y="6" width="10" height="1.5" rx="1" /><rect x="5" y="10" width="10" height="1.5" rx="1" /><rect x="1" y="14" width="14" height="1.5" rx="1" /><polygon points="1,6 1,11 4,8.5" /></svg>
                </ToolBtn>
                <ToolBtn onClick={() => exec('outdent')} title="Disminuir sangría">
                    <svg viewBox="0 0 16 16" width="12" fill="currentColor"><rect x="1" y="2" width="14" height="1.5" rx="1" /><rect x="5" y="6" width="10" height="1.5" rx="1" /><rect x="5" y="10" width="10" height="1.5" rx="1" /><rect x="1" y="14" width="14" height="1.5" rx="1" /><polygon points="4,6 4,11 1,8.5" /></svg>
                </ToolBtn>

                <Divider />

                {/* Text color */}
                <div className="relative">
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setColorTarget(colorTarget === 'fore' ? null : 'fore'); }}
                        title="Color de texto"
                        className="flex flex-col items-center justify-center w-7 h-7 rounded hover:bg-white/10 transition-all"
                    >
                        <span className="text-[11px] font-black text-white leading-none">A</span>
                        <span className="w-5 h-1 rounded-full mt-px" style={{ backgroundColor: foreColor }} />
                    </button>
                    {colorTarget === 'fore' && (
                        <div className="absolute top-9 left-0 z-50 bg-[#1a1f35] border border-white/20 rounded-xl p-3 shadow-2xl">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Color de texto</p>
                            <input type="color" value={foreColor}
                                onChange={(e) => {
                                    setForeColor(e.target.value);
                                    exec('foreColor', e.target.value);
                                }}
                                className="w-28 h-10 cursor-pointer rounded-lg bg-transparent border-0"
                            />
                            <div className="grid grid-cols-8 gap-1 mt-2">
                                {['#ffffff', '#f87171', '#fb923c', '#facc15', '#4ade80', '#60a5fa', '#a78bfa', '#f472b6',
                                    '#000000', '#dc2626', '#ea580c', '#ca8a04', '#16a34a', '#2563eb', '#7c3aed', '#db2777'].map(c => (
                                        <button key={c} onMouseDown={(e) => { e.preventDefault(); setForeColor(c); exec('foreColor', c); }}
                                            className="w-5 h-5 rounded-full border-2 border-white/10 hover:scale-110 transition-transform"
                                            style={{ backgroundColor: c }} />
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Highlight color */}
                <div className="relative">
                    <button
                        onMouseDown={(e) => { e.preventDefault(); setColorTarget(colorTarget === 'hilite' ? null : 'hilite'); }}
                        title="Color de resaltado"
                        className="flex flex-col items-center justify-center w-7 h-7 rounded hover:bg-white/10 transition-all"
                    >
                        <svg viewBox="0 0 14 14" width="12" fill="currentColor" className="text-yellow-400">
                            <path d="M9.5 1.5l3 3-7 7H2.5v-3l7-7z" opacity="0.8" />
                            <rect x="0" y="12" width="14" height="2" rx="1" />
                        </svg>
                        <span className="w-5 h-1 rounded-full mt-px" style={{ backgroundColor: hiliteColor }} />
                    </button>
                    {colorTarget === 'hilite' && (
                        <div className="absolute top-9 left-0 z-50 bg-[#1a1f35] border border-white/20 rounded-xl p-3 shadow-2xl">
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest mb-2">Resaltado</p>
                            <input type="color" value={hiliteColor}
                                onChange={(e) => {
                                    setHiliteColor(e.target.value);
                                    exec('hiliteColor', e.target.value);
                                }}
                                className="w-28 h-10 cursor-pointer rounded-lg bg-transparent border-0"
                            />
                            <div className="grid grid-cols-8 gap-1 mt-2">
                                {['transparent', '#fef08a', '#bbf7d0', '#bfdbfe', '#fecaca', '#e9d5ff', '#fed7aa', '#f9a8d4',
                                    '#d97706', '#15803d', '#1d4ed8', '#b91c1c', '#6d28d9', '#0891b2', '#be185d', '#374151'].map(c => (
                                        <button key={c} onMouseDown={(e) => { e.preventDefault(); setHiliteColor(c); exec('hiliteColor', c); }}
                                            className={`w-5 h-5 rounded-full border-2 hover:scale-110 transition-transform ${c === 'transparent' ? 'border-white/20' : 'border-white/10'}`}
                                            style={{ backgroundColor: c === 'transparent' ? undefined : c }}
                                        >
                                            {c === 'transparent' && <span className="text-[8px] text-white/50">∅</span>}
                                        </button>
                                    ))}
                            </div>
                        </div>
                    )}
                </div>

                <Divider />

                {/* Superscript / Subscript */}
                <ToolBtn onClick={() => exec('superscript')} title="Superíndice">
                    x<sup className="text-[8px]">2</sup>
                </ToolBtn>
                <ToolBtn onClick={() => exec('subscript')} title="Subíndice">
                    x<sub className="text-[8px]">2</sub>
                </ToolBtn>

                {/* Link */}
                <ToolBtn
                    onClick={() => {
                        const url = prompt('URL del enlace:');
                        if (url) exec('createLink', url);
                    }}
                    title="Insertar enlace"
                >
                    🔗
                </ToolBtn>
                <ToolBtn onClick={() => exec('unlink')} title="Eliminar enlace">
                    🔗<span className="text-red-400 -ml-1 text-[8px]">✕</span>
                </ToolBtn>

                <Divider />

                {/* Horizontal rule */}
                <ToolBtn onClick={() => exec('insertHorizontalRule')} title="Línea horizontal">—</ToolBtn>

                {/* Clear formatting */}
                <ToolBtn onClick={() => exec('removeFormat')} title="Limpiar formato">
                    <svg viewBox="0 0 16 16" width="12" fill="currentColor"><path d="M3 2l10 12M5 2h8l-3 5h3l-5 7" /><line x1="1" y1="14" x2="6" y2="14" strokeWidth="2" stroke="currentColor" /></svg>
                </ToolBtn>

                {/* Undo / redo */}
                <Divider />
                <ToolBtn onClick={() => exec('undo')} title="Deshacer (Ctrl+Z)">↩</ToolBtn>
                <ToolBtn onClick={() => exec('redo')} title="Rehacer (Ctrl+Y)">↪</ToolBtn>
            </div>

            {/* ── EDITOR AREA ── */}
            <div
                ref={editorRef}
                contentEditable
                suppressContentEditableWarning
                onInput={handleInput}
                onMouseDown={() => setColorTarget(null)}
                spellCheck={false}
                className="min-h-[120px] max-h-[320px] overflow-y-auto p-3 text-sm text-white outline-none
                    prose prose-invert max-w-none custom-scrollbar
                    [&_h1]:text-2xl [&_h1]:font-black [&_h1]:mb-2
                    [&_h2]:text-xl [&_h2]:font-bold [&_h2]:mb-2
                    [&_h3]:text-lg [&_h3]:font-bold [&_h3]:mb-1
                    [&_h4]:text-base [&_h4]:font-bold
                    [&_blockquote]:border-l-4 [&_blockquote]:border-accent [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-gray-400
                    [&_pre]:bg-black/40 [&_pre]:p-2 [&_pre]:rounded [&_pre]:text-xs [&_pre]:font-mono
                    [&_a]:text-accent [&_a]:underline
                    [&_ul]:list-disc [&_ul]:pl-5
                    [&_ol]:list-decimal [&_ol]:pl-5
                    [&_li]:mb-0.5
                    [&_hr]:border-white/20 [&_hr]:my-2"
                style={{ wordBreak: 'break-word' }}
            />
        </div>
    );
};

export default RichTextEditor;
