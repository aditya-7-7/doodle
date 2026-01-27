import { StyledSlider } from '../ui/StyledSlider';

interface TextSettingsProps {
    fontSize: number;
    setFontSize: (size: number) => void;
}

/**
 * Text tool font size settings popover content
 * Extracted from Toolbar for better modularity
 */
export function TextSettingsContent({ fontSize, setFontSize }: TextSettingsProps) {
    return (
        <>
            <div className="text-sm text-gray-500 mb-3">
                Font Size
            </div>
            <div className="flex items-center gap-3">
                <StyledSlider value={fontSize} onChange={setFontSize} min={12} max={72} />
                <span className="text-sm font-semibold text-indigo-500 w-11 text-right">
                    {fontSize}px
                </span>
            </div>
        </>
    );
}
