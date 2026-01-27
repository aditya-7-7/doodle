import { CSSProperties, ReactNode } from 'react';
import { useHoverEffect } from '../../hooks/useHoverEffect';
import { colors, gradients, radius, shadow, timing, spacing } from '../../theme';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
    children: ReactNode;
    onClick?: () => void;
    variant?: ButtonVariant;
    size?: ButtonSize;
    disabled?: boolean;
    title?: string;
    style?: CSSProperties;
    className?: string;
    gradient?: 'indigo' | 'green' | 'none';
}

/**
 * Reusable Button Component
 * Used throughout RoomHeader, Toolbar, CanvasArea
 */
export function Button({
    children,
    onClick,
    variant = 'primary',
    size = 'md',
    disabled = false,
    title,
    style,
    className,
    gradient = 'none',
}: ButtonProps) {
    const { hoverProps, hoverStyles } = useHoverEffect('lift');

    const baseStyles: CSSProperties = {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing[2],
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: `all ${timing.fast}ms ease`,
        fontWeight: 500,
        opacity: disabled ? 0.5 : 1,
    };

    // Size variants
    let sizeStyles: CSSProperties = {};
    switch (size) {
        case 'sm':
            sizeStyles = {
                padding: `${spacing[2]}px ${spacing[3]}px`,
                fontSize: 12,
                borderRadius: radius.md,
            };
            break;
        case 'md':
            sizeStyles = {
                padding: `${spacing[2]}px ${spacing[3]}px`,
                fontSize: 14,
                borderRadius: radius.lg,
            };
            break;
        case 'lg':
            sizeStyles = {
                padding: `${spacing[3]}px ${spacing[4]}px`,
                fontSize: 14,
                borderRadius: radius.lg,
            };
            break;
    }

    // Variant styles
    let variantStyles: CSSProperties = {};
    let boxShadow = 'none';
    let hoverShadow = 'none';

    switch (variant) {
        case 'primary':
            if (gradient === 'indigo') {
                variantStyles = {
                    background: gradients.primaryIndigo,
                    color: colors.white,
                };
                boxShadow = shadow.indigo;
                hoverShadow = shadow.indigoHover;
            } else if (gradient === 'green') {
                variantStyles = {
                    background: gradients.primaryGreen,
                    color: colors.white,
                };
                boxShadow = shadow.green;
                hoverShadow = shadow.greenHover;
            } else {
                variantStyles = {
                    background: colors.indigo[500],
                    color: colors.white,
                };
                boxShadow = shadow.indigo;
                hoverShadow = shadow.indigoHover;
            }
            break;

        case 'secondary':
            variantStyles = {
                background: colors.transparent,
                color: colors.gray[600],
            };
            break;

        case 'danger':
            variantStyles = {
                background: colors.transparent,
                color: colors.red[500],
            };
            break;

        case 'ghost':
            variantStyles = {
                background: colors.transparent,
                color: colors.gray[600],
            };
            break;
    }

    const combinedStyles: CSSProperties = {
        ...baseStyles,
        ...sizeStyles,
        ...variantStyles,
        boxShadow: boxShadow,
        ...hoverStyles,
        ...style,
    };

    // Update shadow on hover for primary variant
    if (hoverStyles.transform && variant === 'primary') {
        combinedStyles.boxShadow = hoverShadow;
    }

    return (
        <button
            style={combinedStyles}
            onClick={onClick}
            disabled={disabled}
            title={title}
            className={className}
            {...hoverProps}
        >
            {children}
        </button>
    );
}
