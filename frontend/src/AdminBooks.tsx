import { useState, useEffect } from 'react';
import { BookOpen, Search, Edit3, Plus, Activity, ChevronUp, ChevronDown, GripVertical, Save } from 'lucide-react';
import { type NotificationType } from './components/Notification';
import EditBookModal from './components/EditBookModal';

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
    sort_order?: number;
}

interface AdminBooksProps {
    token: string;
    onNotify: (msg: string, type: NotificationType) => void;
}

const AdminBooks = ({ token, onNotify }: AdminBooksProps) => {
    const [books, setBooks] = useState<BookItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);
    const [orderChanged, setOrderChanged] = useState(false);
    const [savingOrder, setSavingOrder] = useState(false);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/books', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                const data = await res.json();
                setBooks(data);
                setOrderChanged(false);
            } else {
                onNotify('Failed to load books', 'error');
            }
        } catch (err) {
            console.error(err);
            onNotify('Connection error', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBooks();
    }, [token]);

    const handleEditClick = (book: BookItem) => {
        setSelectedBook(book);
        setIsEditModalOpen(true);
    };

    const moveBook = (index: number, direction: 'up' | 'down') => {
        const newBooks = [...books];
        const targetIndex = direction === 'up' ? index - 1 : index + 1;
        if (targetIndex < 0 || targetIndex >= newBooks.length) return;
        [newBooks[index], newBooks[targetIndex]] = [newBooks[targetIndex], newBooks[index]];
        setBooks(newBooks);
        setOrderChanged(true);
    };

    const saveOrder = async () => {
        setSavingOrder(true);
        try {
            const order = books.map((b, i) => ({ id: b.id, sort_order: i + 1 }));
            const res = await fetch('/api/books/reorder', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ order })
            });
            if (res.ok) {
                onNotify('Order saved successfully! Library now reflects this order.', 'success');
                setOrderChanged(false);
                fetchBooks();
            } else {
                onNotify('Failed to save order', 'error');
            }
        } catch (err) {
            console.error(err);
            onNotify('Connection error', 'error');
        } finally {
            setSavingOrder(false);
        }
    };

    const filteredBooks = searchTerm
        ? books.filter(b =>
            b.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            b.category.toLowerCase().includes(searchTerm.toLowerCase())
        )
        : books;

    return (
        <div className="space-y-6 flex flex-col h-full">
            {/* Header / Actions */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
                <div className="relative w-full sm:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search books..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                    />
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
                    {orderChanged && (
                        <button
                            onClick={saveOrder}
                            disabled={savingOrder}
                            className="flex justify-center items-center gap-2 w-full sm:w-auto px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-green-500/20 transition-all"
                        >
                            {savingOrder ? (
                                <Activity className="w-4 h-4 animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            SAVE ORDER
                        </button>
                    )}
                    <button
                        disabled
                        className="flex justify-center items-center gap-2 w-full sm:w-auto px-6 py-2.5 bg-accent/10 text-accent rounded-xl font-bold text-sm border border-accent/20 cursor-not-allowed opacity-50"
                    >
                        <Plus size={18} />
                        NUEVO LIBRO
                    </button>
                </div>
            </div>

            {orderChanged && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-2.5 text-xs text-amber-700 font-bold flex items-center gap-2">
                    <GripVertical size={14} />
                    Use the arrows to reorder books, then click SAVE ORDER to apply the order in Library.
                </div>
            )}

            {/* Books Table/List */}
            <div className="flex-1 overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 uppercase text-[10px] font-black tracking-[0.15em] border-b border-gray-100">
                            <tr>
                                <th className="px-3 py-4 w-10">Order</th>
                                <th className="px-4 py-4">#</th>
                                <th className="px-6 py-4">Cover</th>
                                <th className="px-6 py-4">Book</th>
                                <th className="px-6 py-4">Category</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                                        <Activity className="w-8 h-8 animate-spin mx-auto mb-2 opacity-20 text-accent" />
                                        Loading catalog...
                                    </td>
                                </tr>
                            ) : filteredBooks.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-20 text-center text-gray-400">
                                        No books found
                                    </td>
                                </tr>
                            ) : (
                                filteredBooks.map((book, index) => (
                                    <tr key={book.id} className="hover:bg-gray-50/50 transition-colors group">
                                        {/* Reorder arrows */}
                                        <td className="px-3 py-4">
                                            <div className="flex flex-col gap-0.5">
                                                <button
                                                    onClick={() => moveBook(index, 'up')}
                                                    disabled={index === 0 || !!searchTerm}
                                                    className="p-0.5 text-gray-300 hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                                    title="Move up"
                                                >
                                                    <ChevronUp size={14} />
                                                </button>
                                                <button
                                                    onClick={() => moveBook(index, 'down')}
                                                    disabled={index === filteredBooks.length - 1 || !!searchTerm}
                                                    className="p-0.5 text-gray-300 hover:text-accent disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
                                                    title="Move down"
                                                >
                                                    <ChevronDown size={14} />
                                                </button>
                                            </div>
                                        </td>
                                        <td className="px-4 py-4">
                                            <span className="text-xs font-black text-gray-400 bg-gray-100 rounded-full w-6 h-6 flex items-center justify-center">
                                                {index + 1}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="w-12 h-16 rounded-lg bg-gray-100 overflow-hidden shadow-sm border border-gray-200">
                                                {book.cover_image ? (
                                                    <img src={book.cover_image} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                                        <BookOpen size={20} />
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-bold text-gray-800 block">{book.title}</span>
                                            <span className="text-xs text-gray-400 line-clamp-1 max-w-[250px]">{book.details || 'No details configured'}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-[10px] font-bold uppercase tracking-wider">
                                                {book.category}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${book.status === 'active'
                                                ? 'bg-green-100 text-green-700'
                                                : 'bg-red-100 text-red-700'
                                                }`}>
                                                {book.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button
                                                onClick={() => handleEditClick(book)}
                                                className="p-2.5 rounded-xl bg-accent text-white shadow-lg shadow-accent/20 hover:scale-110 active:scale-95 transition-all"
                                            >
                                                <Edit3 size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <EditBookModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                book={selectedBook}
                token={token}
                onSuccess={fetchBooks}
                onNotify={onNotify}
            />
        </div>
    );
};

export default AdminBooks;
