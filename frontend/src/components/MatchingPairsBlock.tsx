import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, RefreshCcw } from 'lucide-react';

interface Pair {
    left: string;
    right: string;
    id: string; // Unique ID to match left and right
}

interface MatchingPairsBlockProps {
    data: {
        pairs?: { left: string, right: string }[];
        compact?: boolean;
    };
    onComplete?: (isCorrect: boolean) => void;
    isAdmin?: boolean;
}

const MatchingPairsBlock: React.FC<MatchingPairsBlockProps> = ({ data, onComplete }) => {
    // We shuffle left side and right side independently
    const [leftItems, setLeftItems] = useState<Pair[]>([]);
    const [rightItems, setRightItems] = useState<Pair[]>([]);

    const [selectedLeft, setSelectedLeft] = useState<string | null>(null);
    const [selectedRight, setSelectedRight] = useState<string | null>(null);

    const [matchedPairs, setMatchedPairs] = useState<string[]>([]);
    const [errorState, setErrorState] = useState<boolean>(false); // Flash red on mistake

    useEffect(() => {
        const initialPairs = (data.pairs && data.pairs.length > 0)
            ? data.pairs
            : [{ left: 'A', right: '1' }, { left: 'B', right: '2' }]; // Default

        const generatedItems: Pair[] = initialPairs.map((p, i) => ({
            left: p.left,
            right: p.right,
            id: `pair_${i}`
        }));

        const shuffle = (array: any[]) => {
            let currentIndex = array.length, randomIndex;
            while (currentIndex > 0) {
                randomIndex = Math.floor(Math.random() * currentIndex);
                currentIndex--;
                [array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
            }
            return array;
        };

        // Complete independent shuffles ensuring no accidental alignment when possible
        setLeftItems(shuffle([...generatedItems]));

        let shuffledRight = shuffle([...generatedItems]);
        // If they ended up identical (and length > 1), shuffle again just in case
        if (shuffledRight.length > 1 && shuffledRight.every((item, i) => item.id === leftItems[i]?.id)) {
            shuffledRight = shuffle([...generatedItems]);
        }
        setRightItems(shuffledRight);

        setMatchedPairs([]);
        setSelectedLeft(null);
        setSelectedRight(null);
    }, [data.pairs]);

    const handleLeftClick = (id: string) => {
        if (matchedPairs.includes(id) || errorState) return;

        if (selectedLeft === id) {
            setSelectedLeft(null); // Toggle off
        } else {
            setSelectedLeft(id);
            if (selectedRight) validateMatch(id, selectedRight);
        }
    };

    const handleRightClick = (id: string) => {
        if (matchedPairs.includes(id) || errorState) return;

        if (selectedRight === id) {
            setSelectedRight(null); // Toggle off
        } else {
            setSelectedRight(id);
            if (selectedLeft) validateMatch(selectedLeft, id);
        }
    };

    const validateMatch = (leftId: string, rightId: string) => {
        if (leftId === rightId) {
            // Match success
            setMatchedPairs([...matchedPairs, leftId]);
            setSelectedLeft(null);
            setSelectedRight(null);

            // Check if all matched
            if (matchedPairs.length + 1 === leftItems.length) {
                onComplete?.(true);
            }
        } else {
            // Match fail
            setErrorState(true);
            onComplete?.(false); // Emit error to decrease hearts via FooterView
            setTimeout(() => {
                setErrorState(false);
                setSelectedLeft(null);
                setSelectedRight(null);
            }, 800); // UI shake/red delay
        }
    };

    const reset = () => {
        // Reuse same shuffle internally
        const shuffle = (array: any[]) => array.sort(() => Math.random() - 0.5);
        setLeftItems(shuffle([...leftItems]));
        setRightItems(shuffle([...rightItems]));
        setMatchedPairs([]);
        setSelectedLeft(null);
        setSelectedRight(null);
    };

    const isComplete = matchedPairs.length === leftItems.length && leftItems.length > 0;

    return (
        <div className={`w-full h-full flex flex-col overflow-y-auto custom-scrollbar ${data.compact ? 'p-1 gap-1' : 'p-3 gap-3'} bg-[#161930] border border-white/5 rounded-[2rem] shadow-xl`}>
            {/* Header */}
            <div className="text-center mb-2">
                <p className={`text-[10px] uppercase font-black tracking-widest text-[#a855f7] mb-1`}>Tap the Pairs</p>
                <h3 className={`${data.compact ? 'text-xs' : 'text-sm'} font-black text-white leading-tight`}>Match the items</h3>
            </div>

            {/* Interaction Grid */}
            <div className="flex-1 flex gap-2 sm:gap-4 px-2">
                {/* Left Column */}
                <div className="flex-1 flex flex-col gap-2">
                    {leftItems.map((item) => {
                        const isMatched = matchedPairs.includes(item.id);
                        const isSelected = selectedLeft === item.id;
                        const hasError = errorState && isSelected;

                        return (
                            <motion.button
                                key={`l-${item.id}`}
                                onClick={() => handleLeftClick(item.id)}
                                disabled={isMatched}
                                animate={
                                    hasError ? { x: [-5, 5, -5, 5, 0], backgroundColor: '#ef4444' } :
                                        isSelected ? { scale: 0.95, borderColor: '#a855f7', backgroundColor: '#a855f720' } :
                                            isMatched ? { scale: 0.9, opacity: 0.5, backgroundColor: '#22c55e20', borderColor: '#22c55e50' } :
                                                { scale: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }
                                }
                                transition={{ duration: hasError ? 0.3 : 0.2 }}
                                className={`w-full ${data.compact ? 'p-1.5 text-[10px]' : 'p-3 text-sm'} text-white font-bold rounded-xl border-2 transition-colors text-center shadow-lg cursor-pointer`}
                            >
                                {item.left}
                            </motion.button>
                        );
                    })}
                </div>

                {/* Right Column */}
                <div className="flex-1 flex flex-col gap-2">
                    {rightItems.map((item) => {
                        const isMatched = matchedPairs.includes(item.id);
                        const isSelected = selectedRight === item.id;
                        const hasError = errorState && isSelected;

                        return (
                            <motion.button
                                key={`r-${item.id}`}
                                onClick={() => handleRightClick(item.id)}
                                disabled={isMatched}
                                animate={
                                    hasError ? { x: [-5, 5, -5, 5, 0], backgroundColor: '#ef4444' } :
                                        isSelected ? { scale: 0.95, borderColor: '#a855f7', backgroundColor: '#a855f720' } :
                                            isMatched ? { scale: 0.9, opacity: 0.5, backgroundColor: '#22c55e20', borderColor: '#22c55e50' } :
                                                { scale: 1, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }
                                }
                                transition={{ duration: hasError ? 0.3 : 0.2 }}
                                className={`w-full ${data.compact ? 'p-1.5 text-[10px]' : 'p-3 text-sm'} text-white font-bold rounded-xl border-2 transition-colors text-center shadow-lg cursor-pointer`}
                            >
                                {item.right}
                            </motion.button>
                        );
                    })}
                </div>
            </div>

            {/* Actions & Feedback */}
            <div className={`flex flex-col mt-auto ${data.compact ? 'gap-1' : 'gap-2'} px-2`}>
                <div className="flex gap-2">
                    <button
                        onClick={reset}
                        className={`p-2 bg-white/5 border border-white/10 rounded-xl text-gray-400 hover:text-white transition-all`}
                        title="Reset"
                    >
                        <RefreshCcw size={data.compact ? 12 : 16} />
                    </button>
                    {isComplete && (
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex-1 rounded-xl bg-green-500 font-black text-white flex items-center justify-center gap-2 p-2 uppercase tracking-widest text-xs shadow-lg shadow-green-500/20"
                        >
                            <CheckCircle2 size={16} /> PERFECT!
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default MatchingPairsBlock;
