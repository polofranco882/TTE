import React, { useState, useRef } from 'react';
import ReactCrop, { type Crop, type PixelCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Crop as CropIcon, Check } from 'lucide-react';
import { getCroppedImg } from '../utils/cropImage';

interface ImageCropperModalProps {
    isOpen: boolean;
    imageSrc: string;
    onClose: () => void;
    onCropComplete: (croppedImageBase64: string) => void;
}

const ImageCropperModal: React.FC<ImageCropperModalProps> = ({ isOpen, imageSrc, onClose, onCropComplete }) => {
    const [crop, setCrop] = useState<Crop>();
    const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const imgRef = useRef<HTMLImageElement>(null);

    const handleSave = async () => {
        if (!completedCrop || !completedCrop.width || !completedCrop.height || !imgRef.current) {
            onClose();
            return;
        }

        setIsProcessing(true);
        try {
            // Calculate actual pixel crop based on the natural image size vs displayed size
            const scaleX = imgRef.current.naturalWidth / imgRef.current.width;
            const scaleY = imgRef.current.naturalHeight / imgRef.current.height;

            const pixelCrop = {
                x: completedCrop.x * scaleX,
                y: completedCrop.y * scaleY,
                width: completedCrop.width * scaleX,
                height: completedCrop.height * scaleY,
            };

            const croppedImage = await getCroppedImg(imageSrc, pixelCrop);
            onCropComplete(croppedImage);
        } catch (e) {
            console.error("Failed to crop image", e);
        }
        setIsProcessing(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
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
                    className="bg-[#161930] rounded-2xl border border-white/10 w-full max-w-4xl flex flex-col overflow-hidden shadow-2xl h-[85vh]"
                >
                    <div className="flex items-center justify-between p-4 border-b border-white/10 shrink-0">
                        <div className="flex items-center gap-2">
                            <CropIcon className="text-accent" size={20} />
                            <h2 className="text-base font-black uppercase tracking-tighter text-white">Crop Image (Free-form)</h2>
                        </div>
                        <button onClick={onClose} className="p-1.5 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white">
                            <X size={18} />
                        </button>
                    </div>

                    <div className="flex-1 bg-black flex items-center justify-center overflow-auto p-4 custom-scrollbar relative">
                        <ReactCrop
                            crop={crop}
                            onChange={(c) => setCrop(c)}
                            onComplete={(c) => setCompletedCrop(c)}
                            className="max-h-full"
                        >
                            <img
                                ref={imgRef}
                                src={imageSrc}
                                alt="Crop target"
                                className="max-w-full max-h-[70vh] object-contain border border-white/10"
                            />
                        </ReactCrop>
                    </div>

                    <div className="p-4 border-t border-white/10 shrink-0 bg-[#0c0e1a]">
                        <div className="flex justify-between items-center text-xs text-gray-400 font-bold uppercase tracking-widest px-2 mb-2">
                            <span>Select the area to keep by dragging the corners or edges.</span>
                        </div>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={onClose}
                                disabled={isProcessing}
                                className="px-5 py-2.5 rounded-xl border border-white/10 font-bold text-xs uppercase hover:bg-white/5 transition-all text-gray-300"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isProcessing || !completedCrop?.width || !completedCrop?.height}
                                className="px-5 py-2.5 rounded-xl bg-accent text-white font-bold text-xs uppercase hover:bg-orange-500 transition-all flex items-center justify-center gap-2 shadow-xl shadow-accent/20 disabled:opacity-50 disabled:hover:bg-accent"
                            >
                                {isProcessing ? (
                                    <span className="animate-pulse">Processing...</span>
                                ) : (
                                    <>
                                        <Check size={16} />
                                        Apply Crop
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default ImageCropperModal;
