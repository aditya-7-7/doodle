import { StyledSlider } from '../ui/StyledSlider';

// preset stroke sizes
const STROKE_PRESETS = [4, 8, 12, 20, 32];

interface BrushSettingsProps {
    strokeWidth: number;
    setStrokeWidth: (width: number) => void;
}

// brush stroke size settings popover content
// extracted from toolbar for better modularity
export function BrushSettingsContent({ strokeWidth, setStrokeWidth }: BrushSettingsProps) {
    return (
        <>
            <div className="text-sm text-gray-500 mb-3">
                Stroke Size
            </div>

            {/* Slider with value display */}
            <div className="flex items-center gap-3 mb-3">
                <StyledSlider value={strokeWidth} onChange={setStrokeWidth} min={1} max={32} />
                <span className="text-sm font-semibold text-indigo-500 w-11 text-right">
                    {strokeWidth}px
                </span>
            </div>

            {/* Preset buttons */}
            <div className="flex items-center justify-between gap-2">
                {STROKE_PRESETS.map(size => (
                    <button
                        key={size}
                        onClick={() => setStrokeWidth(size)}
                        className={`w-8 h-8 rounded-full bg-gray-100 cursor-pointer flex items-center justify-center ${strokeWidth === size ? 'ring-2 ring-indigo-400' : ''
                            }`}
                    >
                        <div
                            className="rounded-full bg-gray-800"
                            style={{ width: Math.min(size, 20), height: Math.min(size, 20) }}
                        />
                    </button>
                ))}
            </div>
        </>
    );
}
