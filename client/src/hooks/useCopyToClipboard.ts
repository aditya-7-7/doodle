import { useState, useCallback } from 'react';
import { timing } from '../theme';

interface UseCopyToClipboardReturn {
    copied: boolean;
    copyToClipboard: (text: string) => Promise<boolean>;
}

// reusable hook for copying text to clipboard
// used in roompage share link and privacypopover password copy
export function useCopyToClipboard(feedbackDuration = timing.copyFeedback): UseCopyToClipboardReturn {
    const [copied, setCopied] = useState(false);

    const copyToClipboard = useCallback(async (text: string): Promise<boolean> => {
        try {
            await navigator.clipboard.writeText(text);
            setCopied(true);

            // reset after feedback duration
            setTimeout(() => setCopied(false), feedbackDuration);
            return true;
        } catch (error) {
            console.error('Failed to copy to clipboard:', error);
            return false;
        }
    }, [feedbackDuration]);

    return { copied, copyToClipboard };
}
