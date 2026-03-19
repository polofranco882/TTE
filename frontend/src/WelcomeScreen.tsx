import { motion } from 'framer-motion';
import { BookOpen, Star, GraduationCap, ChevronRight } from 'lucide-react';

interface WelcomeScreenProps {
  onStartLearning: () => void;
}

const WelcomeScreen = ({ onStartLearning }: WelcomeScreenProps) => {
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
            <img src="/brand-logo-512.png" alt="TTE Logo" className="w-24 h-24 object-contain" />
          </div>
        </motion.div>

        {/* Hero Section */}
        <h1 className="text-5xl md:text-8xl font-black text-white mb-8 tracking-tighter leading-[0.9] uppercase drop-shadow-2xl">
          <span className="text-sm md:text-xl font-bold tracking-[0.5em] text-accent/80 mb-4 block animate-pulse">Welcome to the</span>
          <span className="bg-clip-text text-transparent bg-gradient-to-br from-white via-white to-white/40">TTE ESOL</span> <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-orange-400 to-orange-600">
            English Academy
          </span>
        </h1>
        
        <p className="text-lg md:text-xl text-gray-400 mb-12 font-medium max-w-xl mx-auto leading-relaxed border-l-2 border-accent/30 pl-6 italic">
          "Your English journey starts here. Explore interactive materials, enhance your skills, and master the language with our premium platform."
        </p>

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
            { title: "Interactive Books", desc: "Engaging reading experience with AI.", icon: <BookOpen size={24} /> },
            { title: "Expert Content", desc: "Curated for all levels by professionals.", icon: <Star size={24} /> },
            { title: "Fast Progress", desc: "Adaptive platform for rapid growth.", icon: <GraduationCap size={24} /> }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              whileHover={{ y: -5, backgroundColor: 'rgba(255,255,255,0.08)' }}
              transition={{ delay: 0.5 + (i * 0.1) }}
              className="bg-white/[0.03] backdrop-blur-md border border-white/10 p-8 rounded-[2rem] transition-all text-left group"
            >
              <div className="bg-accent/20 w-12 h-12 rounded-xl flex items-center justify-center text-accent mb-6 group-hover:scale-110 transition-transform">{feature.icon}</div>
              <h3 className="text-white font-black text-xl mb-2 tracking-tight">{feature.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
