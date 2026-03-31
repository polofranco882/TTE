import { useState, useEffect } from 'react';
import type { RefObject } from 'react';

interface UseSmartFocusOptions {
    disabled?: boolean;
}

/**
 * useSmartBlockFocus
 * Automatically handles focus state and smooth scrolling for complex interactive blocks,
 * ensuring that inputs are clearly visible, especially on mobile when the virtual keyboard appears.
 */
export function useSmartBlockFocus(containerRef: RefObject<HTMLElement | null>, options: UseSmartFocusOptions = {}) {
    const { disabled = false } = options;
    const [isFocused, setIsFocused] = useState(false);

    useEffect(() => {
        if (disabled) return;
        const container = containerRef.current;
        if (!container) return;

        let scrollTimeout: ReturnType<typeof setTimeout>;

        const handleFocusIn = (e: FocusEvent) => {
            const target = e.target as HTMLElement;
            if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
                setIsFocused(true);
                
                // Allow the virtual keyboard to smoothly animate up on mobile devices (~300-400ms)
                clearTimeout(scrollTimeout);
                scrollTimeout = setTimeout(() => {
                    if (containerRef.current) {
                        try {
                            const isMobile = window.innerWidth <= 768;
                            // On mobile, block:'center' keeps it safely away from the keyboard and top nav bars.
                            // On desktop, 'nearest' prevents jarring jumps if it's already visible.
                            containerRef.current.scrollIntoView({ 
                                behavior: 'smooth', 
                                block: isMobile ? 'center' : 'nearest',
                                inline: 'nearest'
                            });
                        } catch (err) {
                            // Fallback for older browsers
                            console.warn("Smart Scroll Failed", err);
                        }
                    }
                }, 350); 
            }
        };

        const handleFocusOut = (e: FocusEvent) => {
            // Check if the new focused element is still inside our container
            // e.relatedTarget is the element receiving focus
            if (!container.contains(e.relatedTarget as Node)) {
                setIsFocused(false);
            }
        };

        // Use focusin / focusout as they bubble up from inputs to the container
        container.addEventListener('focusin', handleFocusIn);
        container.addEventListener('focusout', handleFocusOut);

        return () => {
            clearTimeout(scrollTimeout);
            container.removeEventListener('focusin', handleFocusIn);
            container.removeEventListener('focusout', handleFocusOut);
        };
    }, [containerRef, disabled]);

    return { isFocused };
}
