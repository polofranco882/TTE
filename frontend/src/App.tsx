import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Book, User, Lock, ArrowRight, Activity, Settings as SettingsIcon } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import Sidebar from './Sidebar';
import Library from './Library';
import AdminUsers from './AdminUsers';
import AdminBooks from './AdminBooks';
import BookReader from './BookReader';
import Settings from './Settings';
import loginBg from './assets/final-login-bg.jpg';
import Notification, { type NotificationType } from './components/Notification';


// Types

function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [books, setBooks] = useState<BookItem[]>([]); // Moved to Library
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(localStorage.getItem('role'));

  // Notification State
  const [notification, setNotification] = useState<{ message: string; type: NotificationType; isVisible: boolean }>({
    message: '',
    type: 'info',
    isVisible: false
  });

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type, isVisible: true });
  };

  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Effect to handle initial redirects or checks can go here
  useEffect(() => {
    // Optional: Check token validity
  }, [token]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showNotification('Please enter both email and password.', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        setToken(data.token);
        setUserRole(data.user.role);
        localStorage.setItem('token', data.token);
        localStorage.setItem('role', data.user.role);
        // Set default tab based on role
        setActiveTab(['admin', 'manager'].includes(data.user.role) ? 'dashboard' : 'books');
        showNotification('Welcome back! Login successful.', 'success');
      } else {
        if (res.status === 401) {
          showNotification('Access Denied: Incorrect email or password.', 'error');
        } else {
          showNotification(data.message || 'Login failed', 'error');
        }
      }
    } catch (err) {
      console.error(err);
      showNotification('Connection error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  // Sidebar State
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState(() => {
    const role = localStorage.getItem('role');
    return (role === 'admin' || role === 'manager') ? 'dashboard' : 'books';
  });
  const [selectedBookId, setSelectedBookId] = useState<number | null>(null);

  // When the user clicks a sidebar tab, exit the BookReader too
  const handleTabChange = (tab: string) => {
    setSelectedBookId(null);
    setActiveTab(tab);
  };

  const logout = () => {
    setToken(null);
    setUserRole(null);
    localStorage.removeItem('token');
    localStorage.removeItem('role');
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${loginBg})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-[#161930]/90 to-[#161930]/70 backdrop-blur-sm"></div>
        </div>

        <Notification
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={closeNotification}
        />

        {/* Floating Animated Elements */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {[...Array(5)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ y: 1000, opacity: 0, rotate: 0 }}
              animate={{
                y: -100,
                opacity: [0, 0.5, 0],
                rotate: 360
              }}
              transition={{
                duration: 15 + Math.random() * 10,
                repeat: Infinity,
                ease: "linear",
                delay: i * 2
              }}
              className="absolute text-white/10"
              style={{ left: `${10 + Math.random() * 80}%` }}
            >
              <Book size={40 + Math.random() * 60} />
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="bg-white/10 backdrop-blur-xl p-10 rounded-3xl shadow-2xl w-full max-w-md border border-white/20 relative z-10"
        >
          <div className="flex justify-center mb-8">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="p-0 rounded-full shadow-2xl border-4 border-white/20 overflow-hidden bg-white"
            >
              <img src="/brand-logo-512.png" alt="TTE Logo" className="w-24 h-24 object-contain" />
            </motion.div>
          </div>

          <div className="text-center mb-10">
            <h1 className="text-4xl font-black text-white mb-2 tracking-tighter drop-shadow-2xl">TRAILS TO ENGLISH</h1>
            <p className="text-gray-300 font-medium">Plataforma interactiva de aprendizaje.</p>
          </div>

          <form onSubmit={login} className="space-y-6">
            <div className="space-y-2">
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/10 bg-black/20 focus:bg-black/40 focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all outline-none text-white placeholder-gray-500"
                  placeholder="usuario@tte.com"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-accent transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-xl border border-white/10 bg-black/20 focus:bg-black/40 focus:border-accent focus:ring-4 focus:ring-accent/20 transition-all outline-none text-white placeholder-gray-500"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-accent to-orange-500 text-white py-4 rounded-xl font-bold text-lg shadow-xl shadow-accent/30 hover:shadow-accent/50 transition-all flex items-center justify-center gap-2 group"
            >
              {loading ? (
                <Activity className="w-6 h-6 animate-spin" />
              ) : (
                <>
                  Start Learning <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-8 pt-6 border-t border-white/10">
            <div className="flex justify-between text-xs text-gray-400">
              <span className="hover:text-white transition-colors cursor-pointer">Admin Access</span>
              <span className="hover:text-white transition-colors cursor-pointer">Forgot Password?</span>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Render content based on role and active tab
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex justify-center py-20 h-full items-center">
          <Activity className="w-10 h-10 text-accent animate-spin" />
        </div>
      );
    }

    if (selectedBookId) {
      return (
        <BookReader
          bookId={selectedBookId}
          token={token}
          sidebarOpen={isSidebarOpen}
          onBack={() => setSelectedBookId(null)}
          onNotify={showNotification}
        />
      );
    }

    if (activeTab === 'dashboard') {
      if (userRole === 'admin' || userRole === 'manager') {
        return <AdminDashboard token={token} onNotify={showNotification} />;
      }
      // User default for 'dashboard' (if they somehow get here) is Library
      return <Library token={token} userRole={userRole} onNotify={showNotification} onStartReading={setSelectedBookId} />;
    }

    if (activeTab === 'books') {
      return <Library token={token} userRole={userRole} onNotify={showNotification} onStartReading={setSelectedBookId} />;
    }

    if (activeTab === 'reports' && (userRole === 'admin' || userRole === 'manager')) {
      return <AdminDashboard token={token} onNotify={showNotification} />;
    }

    if (activeTab === 'users' && userRole === 'admin') {
      return <AdminUsers token={token} onNotify={showNotification} />;
    }

    if (activeTab === 'admin-books' && (userRole === 'admin' || userRole === 'manager')) {
      return (
        <div className="p-0 md:p-4 h-full flex flex-col pt-4 md:pt-12">
          <div className="mb-4 md:mb-6 px-2 md:px-0">
            <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter">BOOK MANAGEMENT</h2>
            <p className="text-sm md:text-base text-gray-400">Total control over the catalog, covers, and descriptions.</p>
          </div>
          <div className="flex-1 overflow-hidden min-h-[500px]">
            <AdminBooks token={token} onNotify={showNotification} />
          </div>
        </div>
      );
    }

    if (activeTab === 'settings') {
      return <Settings token={token} userRole={userRole} onNotify={showNotification} />;
    }

    return (
      <div className="flex flex-col items-center justify-center h-[50vh] text-gray-400">
        <SettingsIcon size={48} className="mb-4 opacity-50" />
        <h2 className="text-xl font-semibold">Under Construction</h2>
        <p>This module is currently being developed.</p>
      </div>
    );
  };


  return (
    <div className="min-h-screen bg-background flex">
      <style>{`
        :root {
          --sidebar-width: 0px;
        }
        @media (min-width: 1024px) {
          :root {
            --sidebar-width: ${isSidebarOpen ? '288px' : '96px'};
          }
        }
      `}</style>
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={closeNotification}
      />
      <Sidebar
        userRole={userRole}
        onLogout={logout}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
        activeTab={activeTab}
        setActiveTab={handleTabChange}
      />

      <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden p-4 pt-16 lg:p-8 flex flex-col relative z-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
