import { useState, useCallback } from 'react';
import { timing } from '../theme';

interface UseCopyToClipboardReturn {
    copied: boolean;
    copyToClipboard: (text: string) => Promise<boolean>;
}

/**
 * Reusable hook for copying text to clipboard
 * Used in RoomPage (share link) and PrivacyPopover (password copy)
 * 
 * @param feedbackDuration - How long to show "copied" state (default: 2000ms)
 * @returns { copied, copyToClipboard }
 */
export function useCopyToClipboard(feedbackDuration = timing.copyFeedback): UseCopyToClipboardReturn {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);

            // Reset after feedback duration
            setTimeout(() => setCopied(false), feedbackDuration);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }, [feedbackDuration]);

    return { copied, copyToClipboard };
}
