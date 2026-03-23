
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, Search, Check, X, ChevronRight, Shield, KeyRound, Eye, EyeOff } from 'lucide-react';
import { type NotificationType } from './components/Notification';

interface User {
    id: number;
    name: string;
    email: string;
    status: string;
    created_at: string;
}

interface UserBook {
    id: number;
    title: string;
    category: string;
    cover_image?: string;
    assignment_status: 'assigned' | 'inactive';
}

interface AdminUsersProps {
    token: string;
    onNotify: (msg: string, type: NotificationType) => void;
    onUnauthorized: () => void;
}

const AdminUsers = ({ token, onNotify, onUnauthorized }: AdminUsersProps) => {
    const [users, setUsers] = useState<User[]>([]);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [userBooks, setUserBooks] = useState<UserBook[]>([]);
    const [loading, setLoading] = useState(true);
    const [booksLoading, setBooksLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Fetch Users on Mount
    useEffect(() => {
        fetchUsers();
    }, [token]);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 401) {
                onUnauthorized();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            } else {
                onNotify('Failed to load users', 'error');
            }
        } catch (err) {
            onNotify('Connection error', 'error');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    // Fetch Books when a user is selected
    useEffect(() => {
        if (selectedUser) {
            fetchUserBooks(selectedUser.id);
        }
    }, [selectedUser]);

    const fetchUserBooks = async (userId: number) => {
        setBooksLoading(true);
        try {
            const res = await fetch(`/api/admin/users/${userId}/books`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.status === 401) {
                onUnauthorized();
                return;
            }
            if (res.ok) {
                const data = await res.json();
                setUserBooks(data);
            } else {
                onNotify('Failed to load user books', 'error');
            }
        } catch (err) {
            console.error(err);
        } finally {
            setBooksLoading(false);
        }
    };


    const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; bookId: number | null; bookTitle: string; currentStatus: string } | null>(null);

    // Create User State
    const [createModal, setCreateModal] = useState(false);
    const [newUserForm, setNewUserForm] = useState({ name: '', email: '', password: '', role: 'user' });
    const [creating, setCreating] = useState(false);

    const handleCreateUser = async () => {
        if (!newUserForm.name || !newUserForm.email || !newUserForm.password) {
            onNotify('Please fill in all fields', 'error');
            return;
        }
        if (newUserForm.password.length < 4) {
            onNotify('Password must be at least 4 characters', 'error');
            return;
        }

        setCreating(true);
        try {
            const res = await fetch('/api/admin/users/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newUserForm)
            });
            if (res.status === 401) {
                onUnauthorized();
                return;
            }
            if (res.ok) {
                onNotify('User created successfully', 'success');
                setCreateModal(false);
                setNewUserForm({ name: '', email: '', password: '', role: 'user' });
                fetchUsers();
            } else {
                const data = await res.json();
                onNotify(data.message || 'Failed to create user', 'error');
            }
        } catch (error) {
            console.error(error);
            onNotify('Connection error', 'error');
        } finally {
            setCreating(false);
        }
    };

    // Password Reset State
    const [resetModal, setResetModal] = useState<{ isOpen: boolean; userId: number; userName: string } | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [resetting, setResetting] = useState(false);

    const handleResetPassword = async () => {
        if (!resetModal || !newPassword.trim()) return;
        if (newPassword.length < 4) {
            onNotify('Password must be at least 4 characters', 'error');
            return;
        }
        setResetting(true);
        try {
            const res = await fetch(`/api/admin/users/${resetModal.userId}/reset-password`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ newPassword })
            });
            if (res.status === 401) {
                onUnauthorized();
                return;
            }
            if (res.ok) {
                onNotify(`Password reset successfully for ${resetModal.userName}`, 'success');
                setResetModal(null);
                setNewPassword('');
            } else {
                const data = await res.json();
                onNotify(data.message || 'Failed to reset password', 'error');
            }
        } catch (err) {
            console.error(err);
            onNotify('Connection error', 'error');
        } finally {
            setResetting(false);
        }
    };

    // ... fetch functions remain the same ...

    const handleBookClick = (book: UserBook) => {
        setConfirmModal({
            isOpen: true,
            bookId: book.id,
            bookTitle: book.title,
            currentStatus: book.assignment_status
        });
    };

    const confirmAction = async () => {
        if (!confirmModal || !confirmModal.bookId || !selectedUser) return;

        const { bookId, currentStatus } = confirmModal;
        const newStatus = currentStatus === 'assigned' ? 'inactive' : 'assigned';

        // Optimistic UI Update
        setUserBooks(prev => prev.map(b =>
            b.id === bookId ? { ...b, assignment_status: newStatus } : b
        ));

        // Close modal immediately
        setConfirmModal(null);

        try {
            const res = await fetch(`/api/admin/users/${selectedUser.id}/books`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ bookId, status: newStatus })
            });

            if (res.status === 401) {
                onUnauthorized();
                return;
            }

            if (res.ok) {
                onNotify(`Book ${newStatus === 'assigned' ? 'activated' : 'deactivated'}`, 'success');
            } else {
                // Revert on failure
                onNotify('Failed to update book status', 'error');
                fetchUserBooks(selectedUser.id);
            }
        } catch (err) {
            console.error(err);
            onNotify('Connection error', 'error');
            fetchUserBooks(selectedUser.id); // Revert
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex flex-col lg:flex-row h-auto lg:h-[calc(100vh-100px)] gap-6 relative">
            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmModal?.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-premium p-6 max-w-sm w-full border border-gray-100"
                        >
                            <h3 className="text-xl font-bold text-gray-800 mb-2">
                                {confirmModal.currentStatus === 'inactive' ? 'Activate Book' : 'Deactivate Book'}
                            </h3>
                            <p className="text-gray-600 mb-6">
                                {confirmModal.currentStatus === 'inactive'
                                    ? `Do you want to activate "${confirmModal.bookTitle}" for this user?`
                                    : `Do you want to deactivate "${confirmModal.bookTitle}" for this user?`
                                }
                            </p>
                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => setConfirmModal(null)}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={confirmAction}
                                    className={`px-4 py-2 text-white rounded-xl shadow-lg transition-all font-bold ${confirmModal.currentStatus === 'inactive'
                                        ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-green-500/30'
                                        : 'bg-gradient-to-r from-red-500 to-rose-600 shadow-red-500/30'
                                        }`}
                                >
                                    {confirmModal.currentStatus === 'inactive' ? 'Activate' : 'Deactivate'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Create User Modal */}
            <AnimatePresence>
                {createModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => { setCreateModal(false); setNewUserForm({ name: '', email: '', password: '', role: 'user' }); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-premium p-6 max-w-md w-full border border-gray-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-3 bg-accent/10 rounded-xl">
                                    <Users className="w-6 h-6 text-accent" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Create New User</h3>
                                    <p className="text-sm text-gray-500">Add a student, manager or admin.</p>
                                </div>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1.5 block uppercase tracking-wider">Full Name</label>
                                    <input
                                        type="text"
                                        value={newUserForm.name}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                                        placeholder="John Doe"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1.5 block uppercase tracking-wider">Email Address</label>
                                    <input
                                        type="email"
                                        value={newUserForm.email}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, email: e.target.value })}
                                        placeholder="john@example.com"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1.5 block uppercase tracking-wider">Temporary Password</label>
                                    <input
                                        type="text"
                                        value={newUserForm.password}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, password: e.target.value })}
                                        placeholder="At least 4 characters"
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all"
                                    />
                                </div>
                                <div>
                                    <label className="text-xs font-bold text-gray-600 mb-1.5 block uppercase tracking-wider">Role</label>
                                    <select
                                        value={newUserForm.role}
                                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent transition-all bg-white"
                                    >
                                        <option value="user">Student (User)</option>
                                        <option value="manager">Teacher (Manager)</option>
                                        <option value="admin">Administrator (Admin)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => { setCreateModal(false); setNewUserForm({ name: '', email: '', password: '', role: 'user' }); }}
                                    className="px-5 py-2.5 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleCreateUser}
                                    disabled={creating}
                                    className="px-6 py-2.5 text-white rounded-xl shadow-lg transition-all font-bold bg-accent shadow-accent/30 hover:shadow-accent/50 disabled:opacity-50 flex items-center gap-2 text-sm"
                                >
                                    {creating ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Password Reset Modal */}
            <AnimatePresence>
                {resetModal?.isOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
                        onClick={() => { setResetModal(null); setNewPassword(''); }}
                    >
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-2xl shadow-premium p-6 max-w-sm w-full border border-gray-100"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2.5 bg-amber-100 rounded-xl">
                                    <KeyRound className="w-5 h-5 text-amber-600" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-800">Reset Password</h3>
                                    <p className="text-sm text-gray-500">{resetModal.userName}</p>
                                </div>
                            </div>

                            <div className="mb-6">
                                <label className="text-xs font-semibold text-gray-600 mb-1.5 block">New Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && handleResetPassword()}
                                        placeholder="Enter new password..."
                                        autoFocus
                                        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 pr-10"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                {newPassword.length > 0 && newPassword.length < 4 && (
                                    <p className="text-xs text-red-500 mt-1">Minimum 4 characters</p>
                                )}
                            </div>

                            <div className="flex justify-end gap-3">
                                <button
                                    onClick={() => { setResetModal(null); setNewPassword(''); }}
                                    className="px-4 py-2 text-gray-500 hover:bg-gray-100 rounded-xl transition-colors font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleResetPassword}
                                    disabled={resetting || newPassword.length < 4}
                                    className="px-4 py-2 text-white rounded-xl shadow-lg transition-all font-bold bg-gradient-to-r from-amber-500 to-orange-600 shadow-amber-500/30 hover:shadow-amber-500/50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                                >
                                    <KeyRound size={14} />
                                    {resetting ? 'Resetting...' : 'Reset Password'}
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Left Panel: User List */}
            <div className={`w-full lg:w-1/3 min-h-[50vh] lg:min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden ${selectedUser ? 'hidden lg:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Users className="w-5 h-5 text-accent" />
                            User Management
                        </h2>
                        <button
                            onClick={() => setCreateModal(true)}
                            className="flex items-center gap-2 text-xs bg-accent text-white px-3 py-1.5 rounded-xl font-bold hover:bg-orange-500 transition-colors shadow-sm"
                        >
                            + New User
                        </button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-accent/20 focus:border-accent"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-2 space-y-2">
                    {loading ? (
                        <div className="text-center py-10 text-gray-400">Loading users...</div>
                    ) : filteredUsers.length === 0 ? (
                        <div className="text-center py-10 text-gray-400">No users found</div>
                    ) : (
                        filteredUsers.map(user => (
                            <motion.button
                                key={user.id}
                                layout
                                onClick={() => setSelectedUser(user)}
                                className={`w-full text-left p-3 rounded-xl transition-all duration-200 flex items-center justify-between group ${selectedUser?.id === user.id
                                    ? 'bg-accent/10 border-accent/20 border shadow-sm'
                                    : 'hover:bg-gray-50 border border-transparent'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${selectedUser?.id === user.id ? 'bg-accent text-white' : 'bg-gray-100 text-gray-500 group-hover:bg-gray-200'
                                        }`}>
                                        {user.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <p className={`font-semibold text-sm ${selectedUser?.id === user.id ? 'text-accent' : 'text-gray-700'}`}>
                                            {user.name}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate max-w-[150px]">{user.email}</p>
                                    </div>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${selectedUser?.id === user.id ? 'text-accent rotate-90 lg:rotate-0' : ''}`} />
                            </motion.button>
                        ))
                    )}
                </div>
            </div>

            {/* Right Panel: Selected User & Books */}
            <div className={`w-full lg:w-2/3 min-h-[70vh] lg:min-h-0 bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden ${!selectedUser ? 'hidden lg:flex' : 'flex'}`}>
                {!selectedUser ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400 bg-gray-50/30">
                        <Users className="w-16 h-16 mb-4 opacity-20" />
                        <p>Select a user to manage their book access</p>
                    </div>
                ) : (
                    <>
                        <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-white">
                            <div className="flex items-center gap-4">
                                <button onClick={() => setSelectedUser(null)} className="lg:hidden p-2 -ml-2 hover:bg-gray-100 rounded-full">
                                    <ChevronRight className="w-5 h-5 rotate-180" />
                                </button>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-800">{selectedUser.name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-sm text-gray-500">{selectedUser.email}</span>
                                        <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold uppercase rounded-full tracking-wide">
                                            {selectedUser.status}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setResetModal({ isOpen: true, userId: selectedUser.id, userName: selectedUser.name })}
                                    className="flex items-center gap-2 px-4 py-2 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 rounded-xl text-sm font-semibold transition-all"
                                    title="Reset user password"
                                >
                                    <KeyRound size={16} />
                                    Reset Password
                                </button>
                                <div className="text-right hidden sm:block">
                                    <p className="text-xs text-gray-400">Manage Access</p>
                                    <p className="text-sm font-semibold text-accent flex items-center justify-end gap-1">
                                        <Shield className="w-4 h-4" />
                                        Administrator Mode
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-gray-50/30">
                            {booksLoading ? (
                                <div className="text-center py-20 text-gray-400">Loading books...</div>
                            ) : (
                                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                                    {userBooks.map(book => (
                                        <motion.div
                                            key={book.id}
                                            whileHover={{ scale: 1.05 }}
                                            whileTap={{ scale: 0.95 }}
                                            onClick={() => handleBookClick(book)}
                                            className={`relative aspect-[2/3] rounded-xl shadow-premium hover:shadow-premium-hover overflow-hidden cursor-pointer group transition-all duration-300 ${book.assignment_status === 'assigned'
                                                ? 'ring-4 ring-green-500/50'
                                                : 'grayscale opacity-70 hover:opacity-100 hover:grayscale-0'
                                                }`}
                                        >
                                            <img
                                                src={book.cover_image || `/src/assets/book-cover-placeholder.png`}
                                                alt={book.title}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    // Fallback if image fails
                                                    (e.target as HTMLImageElement).src = 'https://placehold.co/200x300?text=No+Cover';
                                                }}
                                            />

                                            {/* Status Badge Overlays */}
                                            <div className="absolute top-2 right-2">
                                                {book.assignment_status === 'assigned' ? (
                                                    <div className="bg-green-500 text-white p-1 rounded-full shadow-lg">
                                                        <Check className="w-4 h-4" />
                                                    </div>
                                                ) : (
                                                    <div className="bg-gray-800/80 text-white p-1 rounded-full shadow-lg backdrop-blur-sm">
                                                        <X className="w-4 h-4" />
                                                    </div>
                                                )}
                                            </div>

                                            {/* Title Overlay on Hover */}
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                                <p className="text-white font-bold text-sm leading-tight mb-1">{book.title}</p>
                                                <p className="text-gray-300 text-[10px] uppercase font-medium tracking-wider">{book.assignment_status === 'assigned' ? 'Active' : 'Inactive'}</p>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default AdminUsers;
