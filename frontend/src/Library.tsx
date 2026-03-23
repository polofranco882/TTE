import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Search, Filter, Star, Edit3 } from 'lucide-react';
import { type NotificationType } from './components/Notification';
import EditBookModal from './components/EditBookModal';
import { useTranslation } from 'react-i18next';
// Loading from src/assets as requested
import bgLogin from './assets/final-login-bg.png';

interface BookItem {
    id: number;
    title: string;
    category: string;
    status: 'active' | 'inactive';
    cover_image?: string;
    description?: string;
    details?: string;
    assignment_status?: string;
}

const Library = ({ token, userRole, onNotify, onStartReading, onUnauthorized }: { 
    token: string; 
    userRole: string | null; 
    onNotify: (msg: string, type: NotificationType) => void; 
    onStartReading: (bookId: number) => void;
    onUnauthorized: () => void;
}) => {
    const { t } = useTranslation();
    const [books, setBooks] = useState<BookItem[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal State
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<BookItem | null>(null);

    const fetchBooks = () => {
        setLoading(true);
        fetch('/api/books', {
            headers: { Authorization: `Bearer ${token}` }
        })
            .then(res => {
                if (res.status === 401) {
                    onUnauthorized();
                    throw new Error('Unauthorized');
                }
                return res.json();
            })
            .then(data => {
                // Filter only active books for the library view unless admin
                const isStaff = userRole === 'admin' || userRole === 'manager';
                const filteredBooks = isStaff ? data : data.filter((b: BookItem) => b.status === 'active');
                setBooks(filteredBooks);
                setLoading(false);
            })
            .catch(err => {
                if (err.message !== 'Unauthorized') {
                    console.error(err);
                    onNotify('Failed to load library', 'error');
                }
                setLoading(false);
            });
    };

    useEffect(() => {
        // Log View Event
        logEvent('view_library');
        fetchBooks();
    }, [token, userRole]);

    const logEvent = (action: string, metadata?: any) => {
        // Fire and forget logging
        fetch('/api/auth/log', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ action, metadata })
        }).then(res => {
            if (res.status === 401) onUnauthorized();
        }).catch(console.error);
    };

    const handleBookClick = (book: BookItem) => {
        logEvent('click_book', { book_id: book.id, title: book.title });
        onStartReading(book.id);
    };

    const handleEditClick = (e: React.MouseEvent, book: BookItem) => {
        e.stopPropagation();
        setSelectedBook(book);
        setIsEditModalOpen(true);
    };

    const container = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const item = {
        hidden: { y: 20, opacity: 0 },
        show: { y: 0, opacity: 1 }
    };

    return (
        <div className="relative min-h-screen overflow-hidden">
            {/* Animated Background */}
            <div className="absolute inset-0 z-0 bg-gradient-to-br from-primary via-secondary to-primary-light">
                <div className="absolute inset-0 opacity-10 bg-cover bg-center animate-pulse-slow" style={{ backgroundImage: `url(${bgLogin})` }}></div>
                {/* Floating particles omitted for brevity in replace, keeping the concept */}
            </div>

            <div className="relative z-10 p-4 md:p-8 lg:p-12">
                {/* Header with Search and Filter */}
                <div className="flex flex-col xl:flex-row justify-between items-end gap-8 mb-16">
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-full xl:w-auto text-center xl:text-left"
                    >
                        <div className="flex items-center gap-3 mb-4 justify-center xl:justify-start">
                            <div className="h-1 w-12 bg-accent rounded-full"></div>
                            <span className="text-accent uppercase tracking-[0.3em] text-xs md:text-sm font-bold">{t('books.library.portal', 'Educational Portal')}</span>
                        </div>
                        <h1 className="text-5xl md:text-7xl font-serif font-bold text-white mb-4 tracking-tighter drop-shadow-2xl">
                            {t('books.library.title', 'LIBRARY')}
                        </h1>
                        <p className="text-gray-400 max-w-lg text-base md:text-lg font-light mx-auto xl:mx-0">
                            {t('books.library.subtitle', 'Dive into a world of knowledge. Select a book to start your journey.')}
                        </p>
                    </motion.div>

                    <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto bg-white/5 backdrop-blur-md p-2 rounded-2xl border border-white/10">
                        <div className="relative flex-1 sm:w-80">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder={t('common.search', 'Search...')}
                                className="w-full pl-12 pr-4 py-3 rounded-xl bg-transparent text-white placeholder-gray-500 focus:bg-white/5 transition-all outline-none"
                            />
                        </div>
                        <button className="p-3 rounded-xl hover:bg-white/10 text-white transition-colors border-t sm:border-t-0 sm:border-l border-white/10 flex justify-center">
                            <Filter size={20} />
                        </button>
                    </div>
                </div>

                {/* Books Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 max-w-[1200px] mx-auto">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-[500px] bg-white/5 rounded-3xl animate-pulse border border-white/5"></div>
                        ))}
                    </div>
                ) : (
                    <motion.div
                        variants={container}
                        initial="hidden"
                        animate="show"
                        className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-10 perspective-1000 max-w-[1200px] mx-auto pb-20"
                    >
                        {books.map((book) => (
                            <motion.div
                                key={book.id}
                                variants={item}
                                whileHover={{
                                    y: -10,
                                    scale: 1.01,
                                    transition: { duration: 0.4, ease: "easeOut" }
                                }}
                                className={`group relative bg-white/5 backdrop-blur-md rounded-3xl shadow-premium hover:shadow-premium-hover transition-all duration-500 overflow-hidden border border-white/10 flex flex-col sm:flex-row h-auto sm:h-[350px] md:h-[400px] lg:h-[420px] ${book.status === 'inactive' ? 'opacity-60 grayscale' : ''}`}
                            >
                                {/* Admin Edit Badge */}
                                {(userRole === 'admin' || userRole === 'manager') && (
                                    <button
                                        onClick={(e) => handleEditClick(e, book)}
                                        className="absolute top-6 right-6 z-30 p-3 rounded-2xl bg-white/10 hover:bg-white text-white hover:text-primary transition-all shadow-xl backdrop-blur-md border border-white/20"
                                    >
                                        <Edit3 size={20} />
                                    </button>
                                )}

                                {/* Cover Image */}
                                <div className="relative w-full sm:w-[180px] md:w-[220px] lg:w-[240px] flex-shrink-0 h-[300px] sm:h-full overflow-hidden p-4 sm:p-6 flex justify-center items-center bg-gradient-to-b sm:bg-gradient-to-r from-white/10 to-transparent border-b sm:border-b-0 sm:border-r border-white/5">
                                    <div className="relative w-full h-full max-h-[250px] sm:max-h-full aspect-[2/3] rounded-xl overflow-hidden shadow-2xl transform transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-1">
                                        {book.cover_image ? (
                                            <img
                                                src={book.cover_image}
                                                alt={book.title}
                                                className="w-full h-full object-contain"
                                            />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-800 to-gray-900 text-gray-600">
                                                <BookOpen size={48} />
                                            </div>
                                        )}
                                        <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/20 to-white/0 skew-x-12 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000"></div>
                                    </div>
 
                                    <div className="absolute top-4 left-4 sm:top-6 sm:left-6 bg-accent/90 backdrop-blur-md px-4 py-1.5 rounded-full text-[10px] md:text-xs font-black text-white shadow-xl border border-white/20 z-20 uppercase tracking-widest">
                                        {book.category}
                                    </div>
                                </div>

                                {/* Content */}
                                <div className="p-6 md:p-8 flex-1 flex flex-col justify-center bg-gradient-to-b from-transparent to-primary/80">
                                    <div className="mb-6 md:mb-8 text-center md:text-left">
                                        <h3 className="text-2xl md:text-3xl font-serif font-bold text-white mb-3 line-clamp-2 leading-tight drop-shadow-md">{book.title}</h3>
                                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 text-xs md:text-sm text-gray-400">
                                            <span className="flex items-center gap-1.5"><Star size={14} className="text-yellow-400 fill-yellow-400" /> 4.9 Rating</span>
                                            {book.status === 'inactive' && <span className="text-red-400 font-bold uppercase tracking-widest text-[10px]">Inactive</span>}
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <p className="text-gray-300 text-sm md:text-base line-clamp-3 mb-6 hidden md:block">
                                            {book.details || "Experience our award-winning interactive learning platform. Master new skills with hands-on exercises and real-world examples."}
                                        </p>

                                        <button
                                            onClick={() => handleBookClick(book)}
                                            className="w-full bg-accent text-white font-bold py-3 md:py-4 rounded-xl shadow-premium hover:shadow-premium-hover hover:bg-accent-dark transition-all duration-300 flex items-center justify-center gap-2 group-hover:tracking-wider text-sm md:text-base tracking-wide"
                                        >
                                            {t('books.startReading', 'START READING')}
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </div>

            <EditBookModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                book={selectedBook}
                token={token}
                onSuccess={fetchBooks}
                onNotify={onNotify}
            />
        </div >
    );
};

export default Library;
