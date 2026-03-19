import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Star, GraduationCap, ChevronRight, Edit2, Save, X } from 'lucide-react';

interface WelcomeScreenProps {
  onStartLearning: () => void;
  settings: { [key: string]: string };
  userRole: string | null;
  onUpdateSettings: (newSettings: { [key: string]: string }) => Promise<void>;
}

const WelcomeScreen = ({ onStartLearning, settings, userRole, onUpdateSettings }: WelcomeScreenProps) => {
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

  const titleTop = localSettings.welcome_title_top || 'Welcome to the';
  const titleMain = localSettings.welcome_title_main || 'TTESOL';
  const titleAccent = localSettings.welcome_title_accent || 'English Academy';
  const description = localSettings.welcome_description || 'Your English journey starts here...';

  const f1Title = localSettings.feature1_title || 'Interactive Books';
  const f1Desc = localSettings.feature1_desc || 'Engaging reading experience with AI.';
  const f2Title = localSettings.feature2_title || 'Expert Content';
  const f2Desc = localSettings.feature2_desc || 'Curated for all levels by professionals.';
  const f3Title = localSettings.feature3_title || 'Fast Progress';
  const f3Desc = localSettings.feature3_desc || 'Adaptive platform for rapid growth.';

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center relative overflow-hidden bg-[#0a0c10]">
      {/* Premium Background Effects */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-accent/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-orange-600/10 rounded-full blur-[120px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-3xl w-full"
      >
        {/* Brand Logo Header */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex justify-center mb-10"
        >
          <div className="p-1 rounded-full bg-white shadow-2xl shadow-accent/20 border-4 border-white/10 ring-8 ring-accent/5">
            <img src="/brand-logo-512.png" alt="TTESOL Logo" className="w-24 h-24 object-contain" />
          </div>
        </motion.div>

        {/* Hero Section */}
        {isEditing ? (
          <div className="space-y-4 mb-10 text-left bg-white/5 p-6 rounded-3xl border border-white/10 backdrop-blur-xl">
            <div>
              <label className="text-xs font-bold text-accent uppercase tracking-widest block mb-2">Top Title</label>
              <input 
                value={titleTop}
                onChange={e => setLocalSettings({...localSettings, welcome_title_top: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-accent"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-accent uppercase tracking-widest block mb-2">Main Title</label>
                <input 
                  value={titleMain}
                  onChange={e => setLocalSettings({...localSettings, welcome_title_main: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-accent uppercase tracking-widest block mb-2">Accent Title</label>
                <input 
                  value={titleAccent}
                  onChange={e => setLocalSettings({...localSettings, welcome_title_accent: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-accent"
                />
              </div>
            </div>
            <div>
              <label className="text-xs font-bold text-accent uppercase tracking-widest block mb-2">Description</label>
              <textarea 
                rows={3}
                value={description}
                onChange={e => setLocalSettings({...localSettings, welcome_description: e.target.value})}
                className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white outline-none focus:border-accent resize-none"
              />
            </div>

            {/* Features Edit Section */}
            <div className="pt-4 border-t border-white/10 mt-4">
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-4">Features Section</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="bg-accent/20 w-8 h-8 rounded-lg flex items-center justify-center text-accent mb-2"><BookOpen size={16} /></div>
                  <input placeholder="Title 1" value={f1Title} onChange={e => setLocalSettings({...localSettings, feature1_title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-accent outline-none" />
                  <textarea placeholder="Description 1" rows={2} value={f1Desc} onChange={e => setLocalSettings({...localSettings, feature1_desc: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent outline-none resize-none" />
                </div>
                <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="bg-orange-500/20 w-8 h-8 rounded-lg flex items-center justify-center text-orange-500 mb-2"><Star size={16} /></div>
                  <input placeholder="Title 2" value={f2Title} onChange={e => setLocalSettings({...localSettings, feature2_title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-accent outline-none" />
                  <textarea placeholder="Description 2" rows={2} value={f2Desc} onChange={e => setLocalSettings({...localSettings, feature2_desc: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent outline-none resize-none" />
                </div>
                <div className="space-y-3 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="bg-blue-500/20 w-8 h-8 rounded-lg flex items-center justify-center text-blue-500 mb-2"><GraduationCap size={16} /></div>
                  <input placeholder="Title 3" value={f3Title} onChange={e => setLocalSettings({...localSettings, feature3_title: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-sm text-white focus:border-accent outline-none" />
                  <textarea placeholder="Description 3" rows={2} value={f3Desc} onChange={e => setLocalSettings({...localSettings, feature3_desc: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white focus:border-accent outline-none resize-none" />
                </div>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-4 border-t border-white/5 mt-4">
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 text-white hover:bg-white/20 transition-colors">
                <X size={16} /> Cancel
              </button>
              <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-accent text-white hover:bg-accent/80 transition-colors font-bold">
                <Save size={16} /> Save Changes
              </button>
            </div>
          </div>
        ) : (
          <>
            <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] uppercase drop-shadow-2xl">
              <span className="text-sm md:text-xl font-bold tracking-[0.5em] text-accent/80 mb-4 block animate-pulse">{titleTop}</span>
              <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40">{titleMain}</span> <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-orange-400 to-orange-600">
                {titleAccent}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 mb-12 font-medium max-w-xl mx-auto leading-relaxed border-l-2 border-accent/30 pl-6 italic">
              "{description}"
            </p>
          </>
        )}

        {/* Call to action */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: "0 20px 25px -5px rgb(252 144 57 / 0.3)" }}
          whileTap={{ scale: 0.95 }}
          onClick={onStartLearning}
          className="bg-gradient-to-r from-accent to-orange-600 text-white px-10 py-5 rounded-2xl font-bold text-xl shadow-2xl shadow-accent/20 flex items-center gap-3 group mx-auto"
        >
          Start My Journey
          <ChevronRight className="group-hover:translate-x-1 transition-transform" />
        </motion.button>

        {/* Stats or Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-20">
          {[
            { title: f1Title, desc: f1Desc, icon: <BookOpen size={24} />, color: 'accent' },
            { title: f2Title, desc: f2Desc, icon: <Star size={24} />, color: 'orange-500' },
            { title: f3Title, desc: f3Desc, icon: <GraduationCap size={24} />, color: 'blue-500' }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.08)' }}
              transition={{ delay: 0.5 + (i * 0.1) }}
              className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-8 rounded-[2rem] transition-all text-left group"
            >
              <div className={`bg-${feature.color}/20 w-12 h-12 rounded-xl flex items-center justify-center text-${feature.color} mb-6 group-hover:scale-110 transition-transform`}>{feature.icon}</div>
              <h3 className="text-white font-black text-xl mb-2 tracking-tight line-clamp-1">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed line-clamp-2">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Admin Edit Trigger */}
      {isAdmin && !isEditing && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={() => setIsEditing(true)}
          className="absolute top-8 right-8 flex items-center gap-2 bg-white/5 hover:bg-white/10 text-white/50 hover:text-white px-4 py-2 rounded-full border border-white/10 transition-all backdrop-blur-md group"
        >
          <Edit2 size={16} className="group-hover:text-accent transition-colors" />
          <span className="text-xs font-bold tracking-widest uppercase">Edit Content</span>
        </motion.button>
      )}
    </div>
  );
};

export default WelcomeScreen;
