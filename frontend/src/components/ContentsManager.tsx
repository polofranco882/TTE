import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X, Plus, Trash2, Layout, ChevronLeft, GripVertical,
    BookOpen, FileText, Loader2, Eye, EyeOff, FileUp
} from 'lucide-react';
import type {
    DragEndEvent,
    DragStartEvent,
} from '@dnd-kit/core';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
    useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { restrictToVerticalAxis, restrictToWindowEdges } from '@dnd-kit/modifiers';
import InteractivePageEditor from './InteractivePageEditor';
import type { BlockData } from './BlockRenderer';
import PdfImporterModal from './PdfImporterModal';

interface ContentMeta {
    id: number;
    book_id: number;
    title: string;
    type: 'chapter' | 'topic';
    page_number?: string;
    order_index: number;
    parent_id: number | null;
    is_active: boolean;
}

interface ContentsManagerProps {
    isOpen: boolean;
    onClose: () => void;
    bookId: number;
    bookTitle: string;
    token: string;
    onNotify: (msg: string, type: 'success' | 'error' | 'info') => void;
}

const API = (import.meta as any).env?.VITE_API_URL || '';

const ContentsManager: React.FC<ContentsManagerProps> = ({
    isOpen, onClose, bookId, bookTitle, token, onNotify
}) => {
    const [items, setItems] = useState<ContentMeta[]>([]);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState<number | null>(null);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [editingContent, setEditingContent] = useState<string>('');
    const [addingItem, setAddingItem] = useState(false);
    const [pdfModalOpen, setPdfModalOpen] = useState(false);

    // Bulk delete state
    const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletingList, setDeletingList] = useState<ContentMeta[]>([]);

    // Toggle active/inactive
    const handleToggleActive = async (item: ContentMeta) => {
        setSaving(item.id);
        try {
            const res = await fetch(`${API}/api/books/${bookId}/contents/${item.id}/toggle`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: data.is_active } : i));
                onNotify(`${item.type === 'chapter' ? 'Chapter' : 'Topic'} ${data.is_active ? 'activated' : 'deactivated'}`, 'success');
            }
        } catch (err) {
            console.error(err);
            onNotify('Failed to toggle visibility', 'error');
        } finally {
            setSaving(null);
        }
    };

    // Fetch lightweight metadata only
    const fetchItems = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`${API}/api/books/${bookId}/contents-meta`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setItems(data);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    }, [bookId, token]);

    useEffect(() => {
        if (isOpen && bookId) {
            fetchItems();
        }
        if (!isOpen) {
            setEditingIndex(null);
            setEditingContent('');
            setSelectedIds(new Set());
        }
    }, [isOpen, bookId, fetchItems]);

    // Add new item
    const handleAdd = async (type: 'chapter' | 'topic') => {
        setAddingItem(true);
        try {
            const res = await fetch(`${API}/api/books/${bookId}/contents/add`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: type === 'chapter' ? 'New Chapter' : 'New Topic',
                    type,
                    content: '',
                    page_number: ''
                })
            });
            if (res.ok) {
                const newItem = await res.json();
                setItems(prev => [...prev, {
                    id: newItem.id,
                    book_id: newItem.book_id,
                    title: newItem.title,
                    type: newItem.type,
                    page_number: newItem.page_number,
                    order_index: newItem.order_index,
                    parent_id: newItem.parent_id || null,
                    is_active: true
                }]);
                onNotify(`${type === 'chapter' ? 'Chapter' : 'Topic'} added`, 'success');
            }
        } catch (err) {
            onNotify('Error adding item', 'error');
        } finally {
            setAddingItem(false);
        }
    };

    // Update single item field
    const handleUpdate = async (item: ContentMeta, field: string, value: any) => {
        // Update locally immediately
        setItems(prev => prev.map(i => i.id === item.id ? { ...i, [field]: value } : i));

        setSaving(item.id);
        try {
            await fetch(`${API}/api/books/${bookId}/contents/${item.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ [field]: value })
            });
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(null);
        }
    };

    // Single/Bulk Delete Modal triggers
    const triggerDelete = (item?: ContentMeta) => {
        if (item) {
            setDeletingList([item]); // Single delete via modal
        } else {
            setDeletingList(items.filter(i => selectedIds.has(i.id))); // Bulk
        }
        setShowDeleteModal(true);
    };

    const confirmDelete = async () => {
        if (deletingList.length === 0) return;

        try {
            if (deletingList.length === 1) {
                // Delete single
                const item = deletingList[0];
                const res = await fetch(`${API}/api/books/${bookId}/contents/${item.id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (res.ok) {
                    setItems(prev => prev.filter(i => i.id !== item.id));
                    onNotify('Item deleted', 'success');
                }
            } else {
                // Bulk delete
                const ids = deletingList.map(i => i.id);
                const res = await fetch(`${API}/api/books/${bookId}/contents-batch-delete`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ ids })
                });

                if (res.ok) {
                    const data = await res.json();
                    setItems(prev => prev.filter(i => !ids.includes(i.id)));
                    onNotify(`${data.count || ids.length} items deleted`, 'success');
                }
            }

            // Cleanup selection
            setSelectedIds(new Set());
        } catch (err) {
            onNotify('Error deleting item(s)', 'error');
        } finally {
            setShowDeleteModal(false);
            setDeletingList([]);
        }
    };

    // Selection logic
    const handleSelectToggle = (id: number) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === items.length && items.length > 0) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(i => i.id)));
        }
    };

    // Open visual editor for a specific item
    const handleOpenEditor = async (item: ContentMeta, idx: number) => {
        // Fetch the full content for this item
        try {
            const res = await fetch(`${API}/api/books/${bookId}/contents/${item.id}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (res.ok) {
                const full = await res.json();
                setEditingContent(full.content || '');
                setEditingIndex(idx);
            }
        } catch (err) {
            onNotify('Error loading content', 'error');
        }
    };

    // Save visual content back
    const handleSaveVisualContent = async (data: { canvas: any; blocks: BlockData[] }) => {
        if (editingIndex === null) return;
        const item = items[editingIndex];
        const content = JSON.stringify(data);

        try {
            await fetch(`${API}/api/books/${bookId}/contents/${item.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ content })
            });
            onNotify('Visual content saved', 'success');
        } catch (err) {
            onNotify('Error saving content', 'error');
        }
        setEditingIndex(null);
        setEditingContent('');
    };

    // Drag & Drop Sensors
    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
    );

    const handleDragStart = (event: DragStartEvent) => {
        // We could use this to store state during drag if needed
        console.log("Dragging started for item:", event.active.id);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        // Logic remains same...

        if (over && active.id !== over.id) {
            const oldIndex = items.findIndex(i => i.id === active.id);
            const newIndex = items.findIndex(i => i.id === over.id);

            const newItems = arrayMove(items, oldIndex, newIndex);
            
            // Recalculate order_index and parent_id
            // Logic: A topic's parent is the nearest preceding chapter
            let currentChapterId: number | null = null;
            const updatedItems = newItems.map((item, idx) => {
                if (item.type === 'chapter') {
                    currentChapterId = item.id;
                    return { ...item, order_index: idx, parent_id: null };
                } else {
                    return { ...item, order_index: idx, parent_id: currentChapterId };
                }
            });

            setItems(updatedItems);

            // Persist to backend
            try {
                await fetch(`${API}/api/books/${bookId}/contents-reorder`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ 
                        order: updatedItems.map(i => ({ 
                            id: i.id, 
                            order_index: i.order_index,
                            parent_id: i.parent_id 
                        })) 
                    })
                });
                onNotify('Order updated successfully', 'success');
            } catch (err) {
                onNotify('Failed to sync order with server', 'error');
            }
        }
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-y-0 right-0 z-[9000] flex flex-col bg-[#0a0c1a] transition-all duration-300"
                style={{ left: 'var(--sidebar-width)' }}
            >
                {/* Header */}
                <div className="flex flex-col sm:flex-row items-center justify-between px-4 md:px-6 py-4 bg-[#0f1129] border-b border-white/10 gap-4">
                    <div className="flex items-center gap-4 w-full sm:w-auto">
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-all flex-shrink-0"
                        >
                            <ChevronLeft size={18} />
                        </button>
                        <div className="min-w-0">
                            <h2 className="text-white font-bold text-lg truncate whitespace-normal sm:whitespace-nowrap">{bookTitle}</h2>
                            <p className="text-gray-500 text-xs hidden sm:block">Manage Contents — {items.length} items</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2 w-full sm:w-auto relative">
                        {/* Bulk Delete Floating Button */}
                        <AnimatePresence>
                            {selectedIds.size > 0 && (
                                <motion.div
                                    initial={{ opacity: 0, x: 20, scale: 0.9 }}
                                    animate={{ opacity: 1, x: 0, scale: 1 }}
                                    exit={{ opacity: 0, x: 10, scale: 0.9 }}
                                    className="flex items-center gap-2 sm:mr-2 border-r border-white/10 pr-4"
                                >
                                    <span className="text-[10px] font-bold text-red-400 uppercase tracking-widest hidden sm:inline">{selectedIds.size} selected</span>
                                    <button
                                        onClick={() => triggerDelete()}
                                        className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-all flex items-center gap-1.5 shadow-lg shadow-red-500/10"
                                    >
                                        <Trash2 size={14} />
                                        <span className="text-xs font-bold hidden sm:inline">Delete</span>
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="flex flex-wrap justify-center gap-2">
                            <button
                                onClick={() => setPdfModalOpen(true)}
                                className="px-3 md:px-4 py-2 rounded-xl bg-blue-500/20 text-blue-400 text-xs font-bold hover:bg-blue-500 hover:text-white transition-all flex items-center gap-2 border border-blue-500/20"
                            >
                                <FileUp size={14} />
                                <span className="hidden sm:inline">Import PDF</span>
                            </button>
                            <button
                                onClick={() => handleAdd('chapter')}
                                disabled={addingItem}
                                className="px-3 md:px-4 py-2 rounded-xl bg-accent/20 text-accent text-xs font-bold hover:bg-accent hover:text-white transition-all flex items-center gap-2 border border-accent/20"
                            >
                                <Plus size={14} />
                                <span className="hidden sm:inline">Chapter</span>
                            </button>
                            <button
                                onClick={() => handleAdd('topic')}
                                disabled={addingItem}
                                className="px-3 md:px-4 py-2 rounded-xl bg-purple-500/20 text-purple-400 text-xs font-bold hover:bg-purple-500 hover:text-white transition-all flex items-center gap-2 border border-purple-500/20"
                            >
                                <Plus size={14} />
                                <span className="hidden sm:inline">Topic</span>
                            </button>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 rounded-xl bg-white/5 hover:bg-red-500/20 text-gray-400 hover:text-red-400 transition-all ml-auto sm:ml-0"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                {/* Contents List */}
                <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                    {loading ? (
                        <div className="flex items-center justify-center py-20">
                            <Loader2 size={24} className="animate-spin text-accent" />
                            <span className="ml-3 text-gray-400 text-sm">Loading contents...</span>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                            <BookOpen size={48} className="mb-4 opacity-30" />
                            <p className="text-sm font-bold">No contents yet</p>
                            <p className="text-xs mt-1">Add chapters and topics to get started</p>
                        </div>
                    ) : (
                        <div className="max-w-3xl mx-auto space-y-2">
                            {/* Select All Header */}
                            <div className="flex items-center gap-4 px-4 py-2 mb-2 bg-white/5 rounded-xl border border-white/10">
                                <label className="flex items-center justify-center cursor-pointer w-5 h-5">
                                    <input 
                                        type="checkbox" 
                                        checked={selectedIds.size === items.length && items.length > 0}
                                        onChange={handleSelectAll}
                                        className="appearance-none w-4 h-4 border-2 border-gray-500 rounded-sm checked:bg-accent checked:border-accent transition-all cursor-pointer relative after:content-['✓'] after:absolute after:text-[10px] after:text-white after:font-bold after:left-[2px] after:top-[0px] after:opacity-0 checked:after:opacity-100"
                                    />
                                </label>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest cursor-pointer" onClick={handleSelectAll}>
                                    {selectedIds.size === items.length && items.length > 0 ? 'Deselect All' : 'Select All'}
                                </span>
                            </div>

                            <DndContext
                                sensors={sensors}
                                collisionDetection={closestCenter}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                                modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
                            >
                                <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
                                    {items.map((item, idx) => (
                                        <SortableItem 
                                            key={item.id}
                                            item={item}
                                            idx={idx}
                                            items={items}
                                            setItems={setItems}
                                            selectedIds={selectedIds}
                                            handleSelectToggle={handleSelectToggle}
                                            handleUpdate={handleUpdate}
                                            handleOpenEditor={handleOpenEditor}
                                            handleToggleActive={handleToggleActive}
                                            triggerDelete={triggerDelete}
                                            saving={saving}
                                        />
                                    ))}
                                </SortableContext>
                            </DndContext>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* Visual Editor */}
            <InteractivePageEditor
                isOpen={editingIndex !== null}
                onClose={() => { setEditingIndex(null); setEditingContent(''); }}
                title={editingIndex !== null ? items[editingIndex]?.title || '' : ''}
                initialData={(() => {
                    if (!editingContent) return { blocks: [] };
                    if (editingContent.startsWith('{')) {
                        try { return JSON.parse(editingContent); } catch { return { blocks: [] }; }
                    }
                    if (editingContent.startsWith('[')) {
                        try { return { blocks: JSON.parse(editingContent) }; } catch { return { blocks: [] }; }
                    }
                    return { blocks: [] };
                })()}
                onSave={handleSaveVisualContent}
                token={token}
            />
            <PdfImporterModal
                isOpen={pdfModalOpen}
                onClose={() => setPdfModalOpen(false)}
                bookId={bookId}
                token={token}
                onSuccess={() => {
                    fetchItems();
                }}
                onNotify={onNotify}
            />
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[9999] bg-[#0a0c1a]/80 backdrop-blur-md flex items-center justify-center p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.95, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            exit={{ scale: 0.95, y: 20 }}
                            className="bg-[#161930] rounded-[2rem] border border-white/10 p-6 md:p-8 max-w-md w-[95vw] shadow-2xl relative overflow-hidden"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                            
                            <div className="flex justify-center mb-6">
                                <div className="p-4 bg-red-500/20 rounded-full text-red-500">
                                    <Trash2 size={32} />
                                </div>
                            </div>
                            
                            <h3 className="text-2xl font-black text-white text-center mb-2">Delete Contents?</h3>
                            
                            <div className="text-gray-400 text-center text-sm mb-8 space-y-2">
                                <p>This action cannot be undone. Are you sure you want to permanently delete:</p>
                                {deletingList.length === 1 ? (
                                    <p className="font-bold text-white bg-white/5 py-2 px-4 rounded-xl border border-white/10 mt-4 break-words">
                                        {deletingList[0].type.toUpperCase()}: {deletingList[0].title || 'Untitled'}
                                    </p>
                                ) : (
                                    <p className="font-black text-red-400 text-lg mt-4 bg-red-500/10 py-2 rounded-xl border border-red-500/20">
                                        {deletingList.length} items selected
                                    </p>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowDeleteModal(false);
                                        setDeletingList([]);
                                    }}
                                    className="flex-1 px-6 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold transition-all"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-black shadow-lg shadow-red-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    Delete Now
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </AnimatePresence>
    );
};

const SortableItem = ({ 
    item, idx, setItems, selectedIds, 
    handleSelectToggle, handleUpdate, handleOpenEditor, 
    handleToggleActive, triggerDelete, saving 
}: any) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id: item.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 20 : 1,
    };

    return (
        <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50' : ''}>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.01 }}
                className={`group flex items-center gap-3 p-3 rounded-xl border transition-all ${item.is_active === false ? 'opacity-50' : ''} ${item.type === 'chapter'
                    ? 'bg-accent/5 border-accent/20 hover:border-accent/40'
                    : 'bg-white/[0.03] border-white/10 hover:border-white/20 ml-6'
                    }`}
            >
                {/* Checkbox */}
                <label className="flex items-center justify-center cursor-pointer min-w-5 h-5 ml-1">
                    <input
                        type="checkbox"
                        checked={selectedIds.has(item.id)}
                        onChange={() => handleSelectToggle(item.id)}
                        className="appearance-none w-4 h-4 border-2 border-gray-600 rounded-sm bg-transparent checked:bg-red-500 checked:border-red-500 transition-all cursor-pointer relative after:content-['✓'] after:absolute after:text-[10px] after:text-white after:font-bold after:left-[2px] after:top-[0px] after:opacity-0 checked:after:opacity-100"
                    />
                </label>

                {/* Grip */}
                <div 
                    {...attributes} 
                    {...listeners}
                    className="text-gray-600 cursor-grab opacity-30 hover:opacity-100 transition-opacity p-1"
                >
                    <GripVertical size={14} />
                </div>

                {/* Type icon */}
                <div className={`p-1.5 rounded-lg ${item.type === 'chapter' ? 'bg-accent/20 text-accent' : 'bg-purple-500/20 text-purple-400'}`}>
                    {item.type === 'chapter' ? <BookOpen size={14} /> : <FileText size={14} />}
                </div>

                {/* Type selector */}
                <select
                    value={item.type}
                    onChange={(e) => handleUpdate(item, 'type', e.target.value)}
                    className="bg-black/30 text-[10px] font-bold uppercase text-gray-400 border border-white/10 rounded-lg px-2 py-1.5 outline-none"
                >
                    <option value="chapter" className="bg-[#161930]">Chapter</option>
                    <option value="topic" className="bg-[#161930]">Topic</option>
                </select>

                {/* Title */}
                <input
                    type="text"
                    value={item.title}
                    placeholder={item.type === 'chapter' ? 'Chapter title...' : 'Topic title...'}
                    onChange={(e) => setItems((prev: any) => prev.map((i: any) => i.id === item.id ? { ...i, title: e.target.value } : i))}
                    onBlur={(e) => handleUpdate(item, 'title', e.target.value)}
                    className="flex-1 bg-transparent text-sm text-white border-none outline-none placeholder:text-gray-600 font-medium"
                />

                {/* Page number */}
                <input
                    type="text"
                    value={item.page_number || ''}
                    placeholder="#"
                    onChange={(e) => setItems((prev: any) => prev.map((i: any) => i.id === item.id ? { ...i, page_number: e.target.value } : i))}
                    onBlur={(e) => handleUpdate(item, 'page_number', e.target.value)}
                    className="w-12 bg-black/30 text-xs text-gray-400 border border-white/10 rounded-lg px-2 py-1.5 outline-none text-center"
                />

                {/* Visual editor button */}
                <button
                    onClick={() => handleOpenEditor(item, idx)}
                    className="p-2 rounded-lg border bg-white/5 border-white/10 text-gray-400 hover:bg-accent/20 hover:text-accent hover:border-accent/30 transition-all focus:outline-none"
                    title="Open Visual Editor"
                >
                    <Layout size={14} />
                </button>

                {/* Saving indicator */}
                {saving === item.id && (
                    <Loader2 size={12} className="animate-spin text-accent" />
                )}

                {/* Toggle visibility */}
                <button
                    onClick={() => handleToggleActive(item)}
                    className={`p-2 rounded-lg border transition-all ${item.is_active !== false
                        ? 'bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20'
                        : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                        }`}
                    title={item.is_active !== false ? 'Active — Click to hide from users' : 'Inactive — Click to show to users'}
                >
                    {item.is_active !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>

                {/* Delete */}
                <button
                    onClick={() => triggerDelete(item)}
                    className="p-2 rounded-lg text-gray-600 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                    title="Delete Item"
                >
                    <Trash2 size={14} />
                </button>
            </motion.div>
        </div>
    );
};

export default ContentsManager;
