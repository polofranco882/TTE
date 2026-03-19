import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { type NotificationType } from './Notification';
import ContentsManager from './ContentsManager';
import { X, Save, Image as ImageIcon, BookOpen, Type, AlignLeft, Plus } from 'lucide-react';

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

interface EditBookModalProps {
    isOpen: boolean;
    onClose: () => void;
    book: BookItem | null;
    token: string;
    onSuccess: () => void;
    onNotify: (msg: string, type: NotificationType) => void;
}

const EditBookModal = ({ isOpen, onClose, book, token, onSuccess, onNotify }: EditBookModalProps) => {
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        status: 'active' as 'active' | 'inactive',
        description: '',
        details: '',
        cover_image: '',
        rating: '',
        reading_time: '',
        publisher: '',
        isbn: '',
        publication_date: ''
    });
    const [loading, setLoading] = useState(false);
    const [contentsOpen, setContentsOpen] = useState(false);

    useEffect(() => {
        if (book) {
            setFormData({
                title: book.title || '',
                category: book.category || '',
                status: book.status || 'active',
                description: book.description || '',
                details: book.details || '',
                cover_image: book.cover_image || '',
                rating: book.rating || '',
                reading_time: book.reading_time || '',
                publisher: book.publisher || '',
                isbn: book.isbn || '',
                publication_date: book.publication_date || ''
            });
        }
    }, [book, isOpen]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!book) return;

        setLoading(true);
        try {
            const res = await fetch(`/api/books/${book.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                onNotify('Book updated successfully', 'success');
                onSuccess();
                onClose();
            } else {
                const data = await res.json();
                onNotify(data.message || 'Failed to update book', 'error');
            }
        } catch (err) {
            console.error(err);
            onNotify('Connection error', 'error');
        } finally {
            setLoading(false);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />

                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-[95vw] max-w-2xl bg-[#161930]/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
                    >
                        {/* Header */}
                        <div className="p-4 md:p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="bg-accent p-2 rounded-xl shadow-lg shadow-accent/20">
                                    <ImageIcon size={20} className="text-white" />
                                </div>
                                <h3 className="text-xl font-bold text-white uppercase tracking-wider">Edit Book</h3>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 rounded-xl hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        {/* Form Body */}
                        <form onSubmit={handleSave} className="p-6 space-y-6 overflow-y-auto overflow-x-hidden custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Title */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex justify-between">
                                        Title
                                        <span className={formData.title.length > 50 ? 'text-red-400' : 'text-accent'}>
                                            {formData.title.length}/50
                                        </span>
                                    </label>
                                    <div className="relative group">
                                        <Type size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent transition-colors" />
                                        <input
                                            type="text"
                                            name="title"
                                            value={formData.title}
                                            onChange={handleChange}
                                            maxLength={50}
                                            className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-accent/50 focus:bg-white/10 transition-all font-medium"
                                            placeholder="Book Title"
                                            required
                                        />
                                    </div>
                                </div>

                                {/* Category */}
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Category</label>
                                    <select
                                        name="category"
                                        value={formData.category}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-accent/50 focus:bg-white/10 transition-all font-medium"
                                        required
                                    >
                                        <option value="English" className="bg-[#161930]">English</option>
                                        <option value="Advanced" className="bg-[#161930]">Advanced</option>
                                        <option value="Basic" className="bg-[#161930]">Basic</option>
                                        <option value="General" className="bg-[#161930]">General</option>
                                    </select>
                                </div>
                            </div>

                            {/* Advanced Metadata Group */}
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-2">Reading Metadata</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Rating (e.g., 4.8)</label>
                                        <input
                                            type="text"
                                            name="rating"
                                            value={formData.rating}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-accent/50 transition-all text-sm"
                                            placeholder="4.9"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Reading Time (e.g., 2h 15m)</label>
                                        <input
                                            type="text"
                                            name="reading_time"
                                            value={formData.reading_time}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-accent/50 transition-all text-sm"
                                            placeholder="2h 30m"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Details (Visual Short Desc) */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex justify-between">
                                    Short Detail (For Card)
                                    <span className={formData.details.length > 100 ? 'text-red-400' : 'text-accent'}>
                                        {formData.details.length}/100
                                    </span>
                                </label>
                                <div className="relative group">
                                    <AlignLeft size={18} className="absolute left-4 top-3.5 text-gray-400 group-focus-within:text-accent transition-colors" />
                                    <textarea
                                        name="details"
                                        value={formData.details}
                                        onChange={handleChange}
                                        maxLength={100}
                                        rows={2}
                                        className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-accent/50 focus:bg-white/10 transition-all font-medium resize-none"
                                        placeholder="e.g., Advanced grammar and vocabulary course..."
                                    />
                                </div>
                            </div>

                            {/* Full Description */}
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex justify-between">
                                    Full Description
                                    <span className={formData.description.length > 500 ? 'text-red-400' : 'text-accent'}>
                                        {formData.description.length}/500
                                    </span>
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    maxLength={500}
                                    rows={4}
                                    className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-accent/50 focus:bg-white/10 transition-all font-medium resize-none text-sm"
                                    placeholder="Detailed description of the book's content..."
                                />
                            </div>

                            {/* Publisher & ISBN Group */}
                            <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                                <p className="text-[10px] font-black text-accent uppercase tracking-[0.2em] mb-2">Editorial Information</p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Publisher</label>
                                        <input
                                            type="text"
                                            name="publisher"
                                            value={formData.publisher}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-accent/50 transition-all text-sm"
                                            placeholder="TTE Global Education"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">ISBN</label>
                                        <input
                                            type="text"
                                            name="isbn"
                                            value={formData.isbn}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-accent/50 transition-all text-sm"
                                            placeholder="978-..."
                                        />
                                    </div>
                                    <div className="space-y-2 md:col-span-2">
                                        <label className="text-[10px] font-bold text-gray-500 uppercase">Publication Date (e.g., March 2026)</label>
                                        <input
                                            type="text"
                                            name="publication_date"
                                            value={formData.publication_date}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-accent/50 transition-all text-sm"
                                            placeholder="January 2024"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Cover Image URL & Upload */}
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Cover Image</label>
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <div className="relative group flex-1">
                                            <ImageIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-accent transition-colors" />
                                            <input
                                                type="text"
                                                name="cover_image"
                                                value={formData.cover_image}
                                                onChange={handleChange}
                                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white outline-none focus:border-accent/50 focus:bg-white/10 transition-all font-medium text-sm"
                                                placeholder="Image URL or Base64..."
                                            />
                                        </div>
                                        <label className="cursor-pointer bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl px-4 py-3 flex items-center justify-center gap-2 text-white font-bold text-sm transition-all hover:border-accent/50">
                                            <Plus size={18} />
                                            UPLOAD FILE
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) {
                                                        const reader = new FileReader();
                                                        reader.onloadend = () => {
                                                            setFormData(prev => ({ ...prev, cover_image: reader.result as string }));
                                                        };
                                                        reader.readAsDataURL(file);
                                                    }
                                                }}
                                            />
                                        </label>
                                    </div>
                                    <p className="text-[10px] text-gray-500 italic">You can paste a URL or upload an image directly (Base64).</p>
                                </div>
                            </div>

                            {/* Status */}
                            <div className="flex items-center gap-4 py-2">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Status:</span>
                                <div className="flex gap-2">
                                    {(['active', 'inactive'] as const).map(s => (
                                        <button
                                            key={s}
                                            type="button"
                                            onClick={() => setFormData(p => ({ ...p, status: s }))}
                                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all border ${formData.status === s
                                                ? (s === 'active' ? 'bg-green-500/20 text-green-400 border-green-500/50 shadow-lg shadow-green-500/10' : 'bg-red-500/20 text-red-400 border-red-500/50 shadow-lg shadow-red-500/10')
                                                : 'bg-white/5 text-gray-500 border-white/10 hover:bg-white/10'
                                                }`}
                                        >
                                            {s.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Manage Contents Button */}
                            <button
                                type="button"
                                onClick={() => setContentsOpen(true)}
                                className="w-full p-4 rounded-2xl bg-gradient-to-r from-accent/10 to-purple-500/10 border border-accent/20 hover:border-accent/40 transition-all flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-accent/20 rounded-xl group-hover:scale-110 transition-transform">
                                        <BookOpen size={18} className="text-accent" />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-white font-bold text-sm">Manage Contents</p>
                                        <p className="text-gray-500 text-[10px]">Add, edit, and organize chapters and topics</p>
                                    </div>
                                </div>
                                <span className="text-accent text-xs font-bold uppercase tracking-widest">Open →</span>
                            </button>

                            {/* Preview (Small) */}
                            {formData.cover_image && (
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between gap-4">
                                    <div className="flex items-center gap-4">
                                        <img
                                            src={formData.cover_image}
                                            alt="Preview"
                                            className="w-16 h-24 object-cover rounded-lg shadow-xl"
                                            onError={(e) => (e.currentTarget.style.display = 'none')}
                                        />
                                        <div>
                                            <p className="text-white font-bold">{formData.title || 'Book Title'}</p>
                                            <p className="text-gray-400 text-xs mt-1">Cover preview</p>
                                        </div>
                                    </div>
                                    <button
                                        type="button"
                                        onClick={() => setFormData(prev => ({ ...prev, cover_image: '' }))}
                                        className="p-2 rounded-lg hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all"
                                    >
                                        <X size={18} />
                                    </button>
                                </div>
                            )}

                            {/* Footer / Submit */}
                            <div className="pt-4 flex flex-col-reverse sm:flex-row gap-4">
                                <button
                                    type="button"
                                    onClick={onClose}
                                    className="w-full sm:flex-1 px-6 py-4 rounded-2xl font-bold text-gray-400 hover:bg-white/5 transition-all outline-none border border-transparent hover:border-white/10"
                                >
                                    CANCEL
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full sm:flex-2 bg-accent hover:bg-orange-500 text-white px-10 py-4 rounded-2xl font-bold shadow-xl shadow-accent/20 transition-all flex items-center justify-center gap-2 group border border-white/10"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            SAVE CHANGES
                                            <Save size={20} className="group-hover:scale-110 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
            {book && (
                <ContentsManager
                    isOpen={contentsOpen}
                    onClose={() => setContentsOpen(false)}
                    bookId={book.id}
                    bookTitle={book.title}
                    token={token}
                    onNotify={onNotify}
                />
            )}
        </AnimatePresence>
    );
};

export default EditBookModal;
