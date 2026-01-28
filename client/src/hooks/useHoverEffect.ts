import { useState, CSSProperties } from 'react';

export type HoverEffectType = 'lift' | 'background' | 'scale' | 'none';

interface HoverEffectOptions {
    type?: HoverEffectType;
    backgroundColor?: string;
    hoverBackgroundColor?: string;
    liftAmount?: number;
    scaleAmount?: number;
}

interface HoverEffectReturn {
    isHovered: boolean;
    hoverProps: {
        onMouseEnter: () => void;
        onMouseLeave: () => void;
    };
    hoverStyles: CSSProperties;
}

// reusable hover effect hook
// eliminates repeated onmouseenter onmouseleave handlers
export function useHoverEffect(options: HoverEffectType | HoverEffectOptions = 'none'): HoverEffectReturn {
    const [isHovered, setIsHovered] = useState(false);

    // normalize options
    const opts: HoverEffectOptions = typeof options === 'string'
        ? { type: options }
        : options;

    const {
        type = 'none',
        backgroundColor = 'transparent',
        hoverBackgroundColor,
        liftAmount = 1,
        scaleAmount = 1.1,
    } = opts;

    const hoverProps = {
        onMouseEnter: () => setIsHovered(true),
        onMouseLeave: () => setIsHovered(false),
    };

    let hoverStyles: CSSProperties = {};

    if (isHovered) {
        switch (type) {
            case 'lift':
                hoverStyles = {
                    transform: `translateY(-${liftAmount}px)`,
                };
                break;

            case 'background':
                hoverStyles = {
                    backgroundColor: hoverBackgroundColor || '#f3f4f6',
                };
                break;

            case 'scale':
                hoverStyles = {
                    transform: `scale(${scaleAmount})`,
                };
                break;

            case 'none':
            default:
                break;
        }
    } else {
        // reset styles when not hovered
        switch (type) {
            case 'lift':
                hoverStyles = {
                    transform: 'translateY(0)',
                };
                break;

            case 'background':
                hoverStyles = {
                    backgroundColor,
                };
                break;

            case 'scale':
                hoverStyles = {
                    transform: 'scale(1)',
                };
                break;
        }
    }

    return {
        isHovered,
        hoverProps,
        hoverStyles,
    };
}
