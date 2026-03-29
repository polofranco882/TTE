import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Lock, ArrowRight, Activity, Settings as SettingsIcon, Download } from 'lucide-react';
import AdminDashboard from './AdminDashboard';
import Sidebar from './Sidebar';
import Library from './Library';
import AdminUsers from './AdminUsers';
import AdminBooks from './AdminBooks';
import BookReader from './BookReader';
import Settings from './Settings';
import bgLogin from './assets/final-login-bg.jpg';
import WelcomeScreen from './WelcomeScreen';
import Notification, { type NotificationType } from './components/Notification';
import PublicLanding from './PublicLanding';
import AdminLandingCMS from './AdminLandingCMS';
import AdminTranslations from './AdminTranslations';
import { loadTranslationsFromDB } from './i18n';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from './components/LanguageSwitcher';


// Types

function App() {
  const { t } = useTranslation();
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  // const [books, setBooks] = useState<BookItem[]>([]); // Moved to Library
  const [loading, setLoading] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
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

  // Settings State
  const [settings, setSettings] = useState<{ [key: string]: string }>({});

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, [token]);

    useEffect(() => {
    loadTranslationsFromDB();

    // Listen for global unauthorized events from services/api.ts
    const handleGlobalUnauth = () => handleUnauthorized();
    window.addEventListener('tte:unauthorized', handleGlobalUnauth);
    
    // Check session validity when user returns to the tab
    const handleFocus = () => {
        if (token) {
            fetch('/api/settings', {
                headers: { 'Authorization': `Bearer ${token}` }
            }).then(res => {
                if (res.status === 401) handleUnauthorized();
            }).catch(() => {}); // Ignore offline/network errors
        }
    };
    window.addEventListener('focus', handleFocus);

    return () => {
        window.removeEventListener('tte:unauthorized', handleGlobalUnauth);
        window.removeEventListener('focus', handleFocus);
    };
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
        setActiveTab(['admin', 'manager'].includes(data.user.role) ? 'dashboard' : 'welcome');
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(window.innerWidth >= 1024);
  const [activeTab, setActiveTab] = useState(() => {
    const role = localStorage.getItem('role');
    const token = localStorage.getItem('token');
    if (!token) return 'welcome';
    return (role === 'admin' || role === 'manager') ? 'dashboard' : 'welcome';
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
    setActiveTab('welcome'); // Reset to welcome for next login
    setShowLogin(false); // Reset to public landing
  };

  const handleUnauthorized = () => {
    if (token) { // Only notify if we were previously logged in
        logout();
        showNotification(t('login.error_expired', 'Your session has expired. Please log in again.'), 'error');
    }
  };

  // PWA Install Logic
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const updateViewport = () => {
      const vh = (window.visualViewport ? window.visualViewport.height : window.innerHeight) * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    };
    
    updateViewport();
    window.addEventListener('resize', updateViewport);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', updateViewport);
    }
    
    return () => {
      window.removeEventListener('resize', updateViewport);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', updateViewport);
      }
    };
  }, []);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const installPWA = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
      showNotification('App installed successfully!', 'success');
    }
  };

  const updateSettings = async (newSettings: { [key: string]: string }) => {
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ settings: newSettings })
      });
      if (res.status === 401) {
        handleUnauthorized();
        return;
      }
      if (res.ok) {
        setSettings(newSettings);
        showNotification('Settings updated', 'success');
      } else {
        showNotification('Error updating settings', 'error');
      }
    } catch (err) {
      console.error('Error updating settings:', err);
      showNotification('Connection error', 'error');
    }
  };

  if (!token) {
    if (!showLogin) {
      return <PublicLanding onLoginClick={() => setShowLogin(true)} />;
    }

    return (
      <div className="h-screen-mobile w-full relative bg-[#0a0c10] overflow-y-auto overflow-x-hidden">
        {/* Background Image with Overlay */}
        <div
          className="absolute inset-0 bg-cover bg-center transition-all duration-1000"
          style={{ backgroundImage: `url(${bgLogin})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-br from-primary/95 to-primary/80 backdrop-blur-md"></div>
        </div>

        <Notification
          message={notification.message}
          type={notification.type}
          isVisible={notification.isVisible}
          onClose={closeNotification}
        />

        {/* Floating Animated Elements (Subtle Blur) */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          {/* Subtle Royal Blue Glow */}
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary-light/30 rounded-full blur-[128px]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-secondary/20 rounded-full blur-[128px]"></div>
        </div>

        {/* Scrollable Container */}
        <div className="absolute inset-0 z-10 overflow-y-auto overflow-x-hidden custom-scrollbar">
          <div className="min-h-full flex flex-col items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="bg-surface p-6 sm:p-8 md:p-10 rounded-2xl shadow-premium w-full max-w-[400px] sm:max-w-md border border-black/5 relative"
            >
            <div className="absolute top-6 right-6">
            <LanguageSwitcher />
          </div>

          <button 
             onClick={() => setShowLogin(false)}
             className="absolute top-8 left-6 text-gray-400 hover:text-primary transition-colors flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest"
          >
             <ArrowRight className="w-3 h-3 rotate-180" /> {t('common.back', 'HOME')}
          </button>

          <div className="flex justify-center mb-6">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="p-1 rounded-2xl mt-4"
            >
              {/* TTESOL abstract logo or text */}
              <div className="w-32 h-32 flex items-center justify-center mb-4">
                <img src="/Logo.png" alt="TTESOL Logo" className="w-full h-full object-contain drop-shadow-xl" />
              </div>
            </motion.div>
          </div>

          <div className="text-center mb-8">
            <h1 className="text-3xl font-serif font-bold text-primary mb-2 tracking-tight">{t('login.title', 'Welcome Back')}</h1>
            <p className="text-gray-500 font-sans text-sm">{t('login.subtitle', 'Sign in to your account')}</p>
          </div>

          <form onSubmit={login} className="space-y-5">
            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('login.email', 'Email Address')}</label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-background focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-primary font-medium placeholder-gray-400"
                  placeholder="admin@ttesol.com"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">{t('login.password', 'Password')}</label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full pl-12 pr-4 py-3.5 rounded-xl border border-gray-200 bg-background focus:bg-white focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all outline-none text-primary font-medium placeholder-gray-400"
                  placeholder="password123"
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={loading}
              className="w-full bg-accent hover:bg-accent-dark text-white py-4 rounded-xl font-bold text-sm uppercase tracking-wide shadow-premium hover:shadow-premium-hover transition-all flex items-center justify-center gap-2 group mt-2"
            >
              {loading ? (
                <Activity className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  {t('login.signIn', 'Secure Login')} <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </motion.button>

            {deferredPrompt && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={installPWA}
                type="button"
                className="w-full bg-surface-low hover:bg-gray-200 text-primary py-3 rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2 group mt-2"
              >
                <Download className="w-4 h-4 text-accent" />
                Install App on this device
              </motion.button>
            )}
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100">
            <div className="flex justify-between text-xs font-semibold text-gray-400">
              <span className="hover:text-primary transition-colors cursor-pointer">Admin Access Only</span>
              <span className="hover:text-primary transition-colors cursor-pointer">{t('login.forgotPassword', 'Forgot Password')}</span>
            </div>
          </div>
        </motion.div>
        </div>
        </div>
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
          onUnauthorized={handleUnauthorized}
        />
      );
    }

    if (activeTab === 'welcome') {
      return (
        <WelcomeScreen
          onStartLearning={() => setActiveTab('books')}
          settings={settings}
          userRole={userRole}
          onUpdateSettings={updateSettings}
        />
      );
    }

    if (activeTab === 'dashboard') {
      if (userRole === 'admin' || userRole === 'manager') {
        return <AdminDashboard token={token} onNotify={showNotification} onUnauthorized={handleUnauthorized} />;
      }
      return <Library token={token} userRole={userRole} onNotify={showNotification} onStartReading={setSelectedBookId} onUnauthorized={handleUnauthorized} />;
    }

    if (activeTab === 'books') {
      return <Library token={token} userRole={userRole} onNotify={showNotification} onStartReading={setSelectedBookId} onUnauthorized={handleUnauthorized} />;
    }

    if (activeTab === 'reports' && (userRole === 'admin' || userRole === 'manager')) {
      return <AdminDashboard token={token} onNotify={showNotification} onUnauthorized={handleUnauthorized} />;
    }

    if (activeTab === 'users' && userRole === 'admin') {
      return <AdminUsers token={token} onNotify={showNotification} onUnauthorized={handleUnauthorized} />;
    }

    if (activeTab === 'landing' && userRole === 'admin') {
      return (
        <div className="flex-1 h-full min-h-[700px]">
          <AdminLandingCMS token={token} onNotify={showNotification} onUnauthorized={handleUnauthorized} />
        </div>
      );
    }

    if (activeTab === 'languages' && userRole === 'admin') {
      return (
        <div className="flex-1 h-full min-h-[700px]">
          <AdminTranslations token={token} onNotify={showNotification} onUnauthorized={handleUnauthorized} />
        </div>
      );
    }

    if (activeTab === 'admin-books' && (userRole === 'admin' || userRole === 'manager')) {
      return (
        <div className="p-0 md:p-4 h-full flex flex-col pt-4 md:pt-12">
          <div className="mb-4 md:mb-6 px-2 md:px-0">
            <h2 className="text-xl md:text-3xl font-black text-white tracking-tighter">BOOK MANAGEMENT</h2>
            <p className="text-sm md:text-base text-gray-400">Total control over the catalog, covers, and descriptions.</p>
          </div>
          <div className="flex-1 overflow-hidden min-h-[500px]">
            <AdminBooks token={token} onNotify={showNotification} onUnauthorized={handleUnauthorized} />
          </div>
        </div>
      );
    }

    if (activeTab === 'settings') {
      return <Settings token={token} userRole={userRole} onNotify={showNotification} onUnauthorized={handleUnauthorized} />;
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
    <div className="h-screen-mobile w-full bg-background flex overflow-hidden">
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

      <main className="flex-1 min-w-0 h-[100dvh] overflow-y-auto overflow-x-hidden p-4 pt-16 lg:p-8 flex flex-col relative z-0 transition-all duration-300">
        <div className="max-w-7xl mx-auto w-full flex-1 flex flex-col">
          {renderContent()}
        </div>
      </main>
    </div>
  );
}

export default App;
