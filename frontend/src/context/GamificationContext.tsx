import React, { createContext, useContext, useState, useEffect } from 'react';

interface GamificationState {
    hearts: number;
    maxHearts: number;
    xp: number;
    streak: number;
    addXp: (amount: number) => void;
    subtractHeart: () => void;
    refillHearts: () => void;
    incrementStreak: () => void;
    infiniteHearts: boolean;
    setInfiniteHearts: (val: boolean) => void;
}

const GamificationContext = createContext<GamificationState | undefined>(undefined);

export const GamificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Basic local state for demo purposes (ideally mapped to backend)
    const [hearts, setHearts] = useState(() => parseInt(localStorage.getItem('gami_hearts') || '5'));
    const maxHearts = 5;
    const [xp, setXp] = useState(() => parseInt(localStorage.getItem('gami_xp') || '0'));
    const [streak, setStreak] = useState(() => parseInt(localStorage.getItem('gami_streak') || '0'));
    const [infiniteHearts, setInfiniteHearts] = useState(() => localStorage.getItem('gami_infinite') === 'true');

    useEffect(() => {
        localStorage.setItem('gami_hearts', hearts.toString());
        localStorage.setItem('gami_xp', xp.toString());
        localStorage.setItem('gami_streak', streak.toString());
        localStorage.setItem('gami_infinite', infiniteHearts.toString());
    }, [hearts, xp, streak, infiniteHearts]);

    const addXp = (amount: number) => setXp(prev => prev + amount);

    const subtractHeart = () => {
        if (infiniteHearts) return;
        setHearts(prev => {
            const newHearts = Math.max(0, prev - 1);
            return newHearts;
        });
    };

    const refillHearts = () => setHearts(maxHearts);
    const incrementStreak = () => setStreak(prev => prev + 1);

    return (
        <GamificationContext.Provider value={{
            hearts, maxHearts, xp, streak, infiniteHearts,
            addXp, subtractHeart, refillHearts, incrementStreak, setInfiniteHearts
        }}>
            {children}
        </GamificationContext.Provider>
    );
};

export const useGamification = () => {
    const context = useContext(GamificationContext);
    if (context === undefined) {
        throw new Error('useGamification must be used within a GamificationProvider');
    }
    return context;
};
