import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileUp, Loader2 } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
// Require worker for Vite/modern environments
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.mjs',
    import.meta.url
).toString();

interface PdfImporterModalProps {
    isOpen: boolean;
    onClose: () => void;
    bookId: number;
    token: string;
    onSuccess: () => void;
    onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const API = (import.meta as any).env?.VITE_API_URL || '';
const DESIGN_WIDTH = 1350;

const PdfImporterModal: React.FC<PdfImporterModalProps> = ({
    isOpen, onClose, bookId, token, onSuccess, onNotify
}) => {
    const [file, setFile] = useState<File | null>(null);
    const [importing, setImporting] = useState(false);
    const [progress, setProgress] = useState(0);
    const [total, setTotal] = useState(0);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFile(e.target.files[0]);
        }
    };

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const handleImport = async () => {
        if (!file) return;
        setImporting(true);
        setProgress(0);
        setTotal(0);

        try {
            const arrayBuffer = await file.arrayBuffer();
            const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

            const numPages = pdf.numPages;
            setTotal(numPages);

            for (let i = 1; i <= numPages; i++) {
                setProgress(i);
                const page = await pdf.getPage(i);

                // Calculate scale to match DESIGN_WIDTH (1350px)
                const unscaledViewport = page.getViewport({ scale: 1 });
                const scale = DESIGN_WIDTH / unscaledViewport.width;
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                if (!context) throw new Error("Could not get canvas context");

                canvas.width = viewport.width;
                canvas.height = viewport.height;

                // @ts-ignore - The types for pdfjs-dist sometimes mismatch the actual expected properties
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;

                // Extract base64 (JPEG for smaller size, quality 0.8)
                const base64Image = canvas.toDataURL('image/jpeg', 0.8);

                // Add chapter to backend
                const title = `Page ${i}`;
                const contentObj = {
                    canvas: { color: 'transparent', url: base64Image },
                    blocks: []
                };

                const res = await fetch(`${API}/api/books/${bookId}/contents/add`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: title,
                        type: 'chapter',
                        content: JSON.stringify(contentObj),
                        page_number: i.toString()
                    })
                });

                if (!res.ok) {
                    throw new Error(`Failed to save page ${i}`);
                }

                // Slight delay to prevent flooding the server
                await delay(300);
            }

            onNotify(`Successfully imported ${numPages} pages!`, 'success');
            onSuccess();
            onClose();

        } catch (error) {
            console.error(error);
            onNotify('Error importing PDF. Ensure it is a valid PDF.', 'error');
        } finally {
            setImporting(false);
            setFile(null);
            setProgress(0);
            setTotal(0);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={!importing ? onClose : undefined}
                    className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                />

                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-md bg-[#161930]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 flex flex-col items-center text-center"
                >
                    <button
                        onClick={!importing ? onClose : undefined}
                        disabled={importing}
                        className="absolute right-4 top-4 p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all disabled:opacity-50"
                    >
                        <X size={20} />
                    </button>

                    <div className="w-16 h-16 bg-accent/20 rounded-full flex items-center justify-center mb-4 text-accent">
                        <FileUp size={32} />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2">Import from PDF</h3>
                    <p className="text-xs text-gray-400 mb-6">
                        Upload a PDF document. It will be automatically converted into individual interactive pages (Chapters) for your flipbook.
                    </p>

                    {!importing ? (
                        <>
                            <input
                                type="file"
                                accept="application/pdf"
                                className="hidden"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                            />

                            {!file ? (
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="w-full py-4 border-2 border-dashed border-white/20 rounded-2xl text-gray-400 hover:border-accent hover:text-accent font-bold transition-all flex flex-col items-center justify-center gap-2"
                                >
                                    <span>Select PDF File</span>
                                    <span className="text-[10px] font-normal opacity-50">Local processing (No large servers uploads)</span>
                                </button>
                            ) : (
                                <div className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl mb-4">
                                    <div className="flex flex-col items-start truncate">
                                        <span className="text-white font-bold text-sm truncate max-w-[220px]">{file.name}</span>
                                        <span className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</span>
                                    </div>
                                    <button
                                        onClick={() => setFile(null)}
                                        className="text-red-400 p-1 hover:bg-red-400/20 rounded-lg"
                                    >
                                        <X size={16} />
                                    </button>
                                </div>
                            )}

                            <button
                                onClick={handleImport}
                                disabled={!file}
                                className="mt-4 w-full bg-accent hover:bg-orange-500 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-accent/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                START IMPORT
                            </button>
                        </>
                    ) : (
                        <div className="w-full flex flex-col items-center space-y-4">
                            <div className="text-accent">
                                <Loader2 size={40} className="animate-spin" />
                            </div>
                            <div className="w-full space-y-2">
                                <div className="flex justify-between text-xs font-bold text-white">
                                    <span>Processing pages...</span>
                                    <span>{progress} / {total}</span>
                                </div>
                                <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-accent transition-all duration-300"
                                        style={{ width: `${total ? (progress / total) * 100 : 0}%` }}
                                    />
                                </div>
                            </div>
                            <p className="text-[10px] text-gray-500 italic">Please do not close this window...</p>
                        </div>
                    )}
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default PdfImporterModal;
