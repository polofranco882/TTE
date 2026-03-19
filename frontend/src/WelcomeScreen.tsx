import { motion } from 'framer-motion';
import { BookOpen, Star, GraduationCap, ChevronRight } from 'lucide-react';

interface WelcomeScreenProps {
  onStartLearning: () => void;
}

const WelcomeScreen = ({ onStartLearning }: WelcomeScreenProps) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="max-w-3xl w-full"
      >
        {/* Decorative elements */}
        <div className="flex justify-center mb-8 gap-4">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
            className="p-3 bg-accent/10 rounded-2xl text-accent"
          >
            <GraduationCap size={32} />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
            className="p-3 bg-orange-500/10 rounded-2xl text-orange-500"
          >
            <Star size={32} />
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, type: "spring", stiffness: 200 }}
            className="p-3 bg-blue-500/10 rounded-2xl text-blue-500"
          >
            <BookOpen size={32} />
          </motion.div>
        </div>

        {/* Hero Section */}
        <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight">
          Welcome to the <br />
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-accent via-orange-400 to-orange-600">
            TTE ESOL English Academy
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-400 mb-12 font-medium max-w-2xl mx-auto leading-relaxed">
          Your English journey starts here. Explore interactive materials, enhance your skills, and master the language with our premium platform.
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
            { title: "Interactive Books", desc: "Engaging reading experience.", icon: <BookOpen size={20} /> },
            { title: "Expert Content", desc: "Curated for all levels.", icon: <Star size={20} /> },
            { title: "Fast Progress", desc: "Interactive exercises for growth.", icon: <GraduationCap size={20} /> }
          ].map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1 + (i * 0.2) }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 p-6 rounded-2xl hover:bg-white/10 transition-colors text-left"
            >
              <div className="text-accent mb-4">{feature.icon}</div>
              <h3 className="text-white font-bold text-lg mb-1">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default WelcomeScreen;
