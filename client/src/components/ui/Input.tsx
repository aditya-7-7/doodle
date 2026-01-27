import { CSSProperties, forwardRef } from 'react';
import { colors, radius, spacing, timing } from '../../theme';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    fullWidth?: boolean;
}

/**
 * Styled Input Component
 * Consistent input styling across the app
 */
export const Input = forwardRef<HTMLInputElement, InputProps>(
    ({ fullWidth = false, style, ...props }, ref) => {
        const baseStyles: CSSProperties = {
            padding: `${spacing[3]}px ${spacing[3]}px`,
            border: `2px solid ${colors.gray[200]}`,
            borderRadius: radius.lg,
            fontSize: 14,
            outline: 'none',
            backgroundColor: colors.white,
            color: colors.gray[800],
            transition: `border-color ${timing.fast}ms, box-shadow ${timing.fast}ms`,
            width: fullWidth ? '100%' : 'auto',
            ...style,
        };

        const handleFocus = (e: React.FocusEvent<HTMLInputElement>) => {
            e.target.style.borderColor = colors.indigo[400];
            e.target.style.boxShadow = `0 0 0 3px rgba(129, 140, 248, 0.2)`;
            props.onFocus?.(e);
        };

        const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
            e.target.style.borderColor = colors.gray[200];
            e.target.style.boxShadow = 'none';
            props.onBlur?.(e);
        };

        return (
            <input
                ref={ref}
                style={baseStyles}
                onFocus={handleFocus}
                onBlur={handleBlur}
                {...props}
            />
        );
    }
);

Input.displayName = 'Input';
