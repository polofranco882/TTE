import { motion } from 'framer-motion';

interface PremiumLoaderProps {
    size?: 'sm' | 'md' | 'lg';
    color?: string;
    className?: string;
}

const PremiumLoader = ({ size = 'md', color = 'var(--color-accent)', className = '' }: PremiumLoaderProps) => {
    const dimensions = {
        sm: { width: 20, height: 24, perspective: 100 },
        md: { width: 40, height: 48, perspective: 200 },
        lg: { width: 80, height: 96, perspective: 400 },
    };

    const d = dimensions[size];

    return (
        <div 
            className={`relative flex items-center justify-center ${className}`}
            style={{ perspective: d.perspective * 2 }}
        >
            <div 
                className="relative"
                style={{ 
                    width: d.width * 2, 
                    height: d.height,
                    transformStyle: 'preserve-3d'
                }}
            >
                {/* Left Page (Fixed) */}
                <div 
                    className="absolute left-0 top-0 bg-white border border-gray-100 rounded-l-md"
                    style={{ 
                        width: d.width, 
                        height: d.height,
                        transformOrigin: 'right center',
                        boxShadow: 'inset -5px 0 10px rgba(0,0,0,0.05)'
                    }}
                >
                    <div className="w-full h-full p-1 sm:p-2 space-y-1">
                        <div className="h-0.5 w-3/4 bg-gray-100 rounded-full" />
                        <div className="h-0.5 w-full bg-gray-100 rounded-full" />
                        <div className="h-0.5 w-1/2 bg-gray-100 rounded-full" />
                    </div>
                </div>

                {/* Right Page (Fixed) */}
                <div 
                    className="absolute right-0 top-0 bg-white border border-gray-100 rounded-r-md"
                    style={{ 
                        width: d.width, 
                        height: d.height,
                        transformOrigin: 'left center',
                        boxShadow: 'inset 5px 0 10px rgba(0,0,0,0.05)'
                    }}
                >
                    <div className="w-full h-full p-1 sm:p-2 space-y-1">
                        <div className="h-0.5 w-full bg-gray-100 rounded-full" />
                        <div className="h-0.5 w-3/4 bg-gray-100 rounded-full" />
                        <div className="h-0.5 w-2/3 bg-gray-100 rounded-full" />
                    </div>
                </div>

                {/* Flipping Page */}
                <motion.div
                    className="absolute right-0 top-0 bg-white border border-gray-100 z-10"
                    style={{ 
                        width: d.width, 
                        height: d.height,
                        transformOrigin: 'left center',
                        backfaceVisibility: 'visible',
                    }}
                    animate={{ 
                        rotateY: [0, -180] 
                    }}
                    transition={{ 
                        duration: 0.8, 
                        repeat: Infinity, 
                        ease: "easeInOut"
                    }}
                >
                    {/* Content on front and back of flipping page */}
                    <div className="w-full h-full p-1 sm:p-2 space-y-1 bg-white">
                         <div className="h-0.5 w-full bg-gray-200 rounded-full" />
                         <div className="h-0.5 w-1/2 bg-gray-200 rounded-full" />
                    </div>
                </motion.div>

                {/* Book Cover (Subtle) */}
                <div 
                    className="absolute -inset-1 border-2 rounded-lg -z-10"
                    style={{ borderColor: color, opacity: 0.2 }}
                />
            </div>
        </div>
    );
};

export default PremiumLoader;
