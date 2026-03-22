import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star, GraduationCap, ChevronRight, Edit2, Save, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface WelcomeScreenProps {
  onStartLearning: () => void;
  settings: { [key: string]: string };
  userRole: string | null;
  onUpdateSettings: (newSettings: { [key: string]: string }) => Promise<void>;
}

const WelcomeScreen = ({ onStartLearning, settings, userRole, onUpdateSettings }: WelcomeScreenProps) => {
  const { t } = useTranslation();
  const [isEditing, setIsEditing] = useState(false);
  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    await onUpdateSettings(localSettings);
    setIsEditing(false);
  };

  const isAdmin = userRole === 'admin' || userRole === 'manager';

  const titleTop    = localSettings.welcome_title_top    || 'Welcome to the';
  const titleMain   = localSettings.welcome_title_main   || 'TTESOL';
  const titleAccent = localSettings.welcome_title_accent || 'English Academy';
  const description = localSettings.welcome_description  || 'Start speaking. Start growing. Start today.';

  const f1Title = localSettings.feature1_title || 'Interactive Books';
  const f1Desc  = localSettings.feature1_desc  || 'Engaging reading experience with AI';
  const f2Title = localSettings.feature2_title || 'Expert Content';
  const f2Desc  = localSettings.feature2_desc  || 'Curated for all levels by professionals';
  const f3Title = localSettings.feature3_title || 'Fast Progress';
  const f3Desc  = localSettings.feature3_desc  || 'Personalized lessons for quick success';

  return (
    <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden min-h-screen"
         style={{ background: 'linear-gradient(160deg, var(--color-primary) 0%, var(--color-secondary) 40%, var(--color-primary) 100%)' }}>

      {/* ─── Animated USA flag stripes background ─── */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Diagonal white stripes (USA flag) */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute left-0 right-0 opacity-[0.04]"
            style={{
              top: `${i * 12.5}%`,
              height: i % 2 === 0 ? '7%' : '5.5%',
              background: i % 2 === 0 ? 'white' : '#cc1e1e',
              transform: 'skewY(-3deg)',
            }}
          />
        ))}
        {/* Blue canton (stars field) */}
        <div className="absolute top-0 left-0 w-1/2 h-[38%] opacity-5"
             style={{ background: 'radial-gradient(circle, var(--color-secondary) 0%, transparent 70%)' }} />
        {/* Top radial glow — red */}
        <div className="absolute top-[-15%] right-[-10%] w-[60%] h-[60%] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(180,30,30,0.18) 0%, transparent 70%)' }} />
        {/* Bottom radial glow — navy */}
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full"
             style={{ background: 'radial-gradient(circle, rgba(13,34,96,0.6) 0%, transparent 70%)' }} />
        {/* Subtle star sparkles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full bg-white animate-pulse"
            style={{
              width: `${Math.random() * 2 + 1}px`,
              height: `${Math.random() * 2 + 1}px`,
              top: `${Math.random() * 45}%`,
              left: `${Math.random() * 45}%`,
              opacity: 0.3 + Math.random() * 0.4,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${2 + Math.random() * 3}s`,
            }}
          />
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative z-10 max-w-2xl w-full text-center px-6 py-10"
      >
        {/* ─── Brand Logo ─── */}
        <motion.div
          initial={{ scale: 0.7, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, type: 'spring', damping: 12 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            {/* Outer rotating ring */}
            <div
              className="absolute inset-0 rounded-full animate-spin"
              style={{
                border: '3px solid transparent',
                borderTopColor: '#cc1e1e',
                borderRightColor: 'transparent',
                animationDuration: '8s',
              }}
            />
            {/* Logo shell */}
            <div
              className="relative w-36 h-36 rounded-full flex items-center justify-center shadow-premium"
              style={{
                background: 'linear-gradient(145deg, var(--color-secondary), var(--color-primary))',
                border: '4px solid var(--color-accent)',
                boxShadow: '0 0 32px rgba(204,30,30,0.5), 0 0 64px rgba(13,34,96,0.6)',
              }}
            >
              <img src="/Logo.png" alt="TTESOL Logo" className="w-24 h-auto object-contain drop-shadow-md" />
            </div>
          </div>
        </motion.div>

        {/* ─── Hero Text / Edit Mode ─── */}
        {isEditing ? (
          <div className="space-y-4 mb-8 text-left p-6 rounded-3xl border border-white/10 backdrop-blur-xl"
               style={{ background: 'rgba(13,34,96,0.6)' }}>
            <div>
              <label className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-2">Top Label</label>
              <input value={titleTop}
                onChange={e => setLocalSettings({...localSettings, welcome_title_top: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-red-500" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-2">{t('common.mainTitle', 'Main Title')}</label>
                <input value={titleMain}
                  onChange={e => setLocalSettings({...localSettings, welcome_title_main: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-red-500" />
              </div>
              <div>
                <label className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-2">{t('common.accentTitle', 'Accent Title')}</label>
                <input value={titleAccent}
                  onChange={e => setLocalSettings({...localSettings, welcome_title_accent: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-red-500" />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-red-400 uppercase tracking-widest block mb-2">{t('common.tagline', 'Tagline')}</label>
              <textarea rows={2} value={description}
                onChange={e => setLocalSettings({...localSettings, welcome_description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-red-500 resize-none" />
            </div>
            {/* Feature edit blocks */}
            <div className="pt-4 border-t border-white/10">
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">{t('dashboard.featureCards', 'Feature Cards')}</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { icon: <BookOpen size={14}/>, key: 'feature1', t: f1Title, d: f1Desc },
                  { icon: <Star size={14}/>,     key: 'feature2', t: f2Title, d: f2Desc },
                  { icon: <GraduationCap size={14}/>, key: 'feature3', t: f3Title, d: f3Desc },
                ].map(({icon, key, t, d}) => (
                  <div key={key} className="space-y-2 bg-white/5 p-3 rounded-2xl border border-white/5">
                    <div className="bg-red-800/30 w-7 h-7 rounded-lg flex items-center justify-center text-red-300">{icon}</div>
                    <input placeholder="Title" value={t}
                      onChange={e => setLocalSettings({...localSettings, [`${key}_title`]: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:border-red-500 outline-none" />
                    <textarea placeholder="Desc" rows={2} value={d}
                      onChange={e => setLocalSettings({...localSettings, [`${key}_desc`]: e.target.value})}
                      className="w-full bg-black/30 border border-white/10 rounded-lg px-2 py-1 text-xs text-white focus:border-red-500 outline-none resize-none" />
                  </div>
                ))}
              </div>
            </div>
            <div className="flex gap-2 justify-end pt-2">
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors text-sm">
                <X size={14}/> {t('common.cancel', 'Cancel')}
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-700 hover:bg-red-600 text-white transition-colors font-bold text-sm">
                <Save size={14}/> {t('common.save', 'Save')}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Eyebrow label */}
            <p className="text-xs sm:text-sm font-bold tracking-[0.35em] text-blue-200/80 uppercase mb-2 animate-pulse">
              {titleTop}
            </p>

            {/* Main hero headline */}
            <h1 className="text-6xl sm:text-7xl md:text-8xl font-black uppercase leading-none tracking-tight drop-shadow-2xl mb-1">
              <span className="text-white drop-shadow-[0_2px_8px_rgba(255,255,255,0.3)]">{titleMain}</span>
            </h1>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black uppercase leading-none tracking-tight drop-shadow-2xl mb-6 text-accent"
                style={{ textShadow: '0 2px 16px rgba(204,30,30,0.5)' }}>
              {titleAccent}
            </h2>

            {/* Divider stripe */}
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="h-[2px] w-12 bg-white/30 rounded-full" />
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <div className="h-[2px] flex-1 max-w-[80px] bg-red-600 rounded-full" />
              <Star size={14} className="text-yellow-400 fill-yellow-400" />
              <div className="h-[2px] w-12 bg-white/30 rounded-full" />
            </div>

            {/* Tagline */}
            <p className="text-base sm:text-lg text-blue-100/80 font-medium italic mb-8 max-w-md mx-auto leading-relaxed">
              {description}
            </p>
          </>
        )}

        {/* ─── CTA Button ─── */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 20px 40px rgba(200,30,30,0.45)' }}
          whileTap={{ scale: 0.97 }}
          onClick={onStartLearning}
          className="inline-flex items-center gap-3 text-white font-bold text-lg px-10 py-4 rounded-2xl shadow-premium hover:shadow-premium-hover mx-auto mb-12 group transition-all"
          style={{
            background: 'linear-gradient(135deg, var(--color-accent) 0%, var(--color-accent-dark) 100%)',
            border: '1px solid rgba(255,255,255,0.15)',
          }}
        >
          {t('dashboard.startJourney', 'Start YOUR Journey')}
          <ChevronRight className="group-hover:translate-x-1 transition-transform" size={20} />
        </motion.button>

        {/* ─── Feature Cards ─── */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { title: f1Title, desc: f1Desc, icon: <BookOpen size={22} />, accent: false },
            { title: f2Title, desc: f2Desc, icon: <Star size={22} />,     accent: true  },
            { title: f3Title, desc: f3Desc, icon: <GraduationCap size={22} />, accent: false },
          ].map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 + i * 0.12 }}
              whileHover={{ y: -4 }}
              className="rounded-2xl p-5 text-center"
              style={{
                background: feat.accent
                  ? 'linear-gradient(135deg, var(--color-accent-dark) 0%, var(--color-accent) 100%)'
                  : 'rgba(255,255,255,0.07)',
                border: `1px solid ${feat.accent ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.1)'}`,
                backdropFilter: 'blur(12px)',
              }}
            >
              <div className="flex justify-center mb-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: feat.accent ? 'rgba(255,255,255,0.15)' : 'rgba(200,30,30,0.2)',
                    color: feat.accent ? 'white' : '#e06060',
                  }}
                >
                  {feat.icon}
                </div>
              </div>
              <h3 className="text-white font-black text-sm mb-1 uppercase tracking-wide">{feat.title}</h3>
              <p className="text-xs leading-relaxed" style={{ color: feat.accent ? 'rgba(255,255,255,0.8)' : 'rgba(200,220,255,0.6)' }}>
                {feat.desc}
              </p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Admin Edit Trigger */}
      {isAdmin && !isEditing && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          whileHover={{ opacity: 1 }}
          onClick={() => setIsEditing(true)}
          className="absolute top-6 right-6 flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/70 hover:text-white px-4 py-2 rounded-full border border-white/10 transition-all backdrop-blur-md group z-20"
        >
          <Edit2 size={14} className="group-hover:text-red-400 transition-colors" />
          <span className="text-xs font-bold tracking-widest uppercase">{t('common.edit', 'Edit')}</span>
        </motion.button>
      )}
    </div>
  );
};

export default WelcomeScreen;
