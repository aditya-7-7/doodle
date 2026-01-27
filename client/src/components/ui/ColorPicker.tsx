import { Plus } from 'lucide-react';

interface ColorPickerProps {
    value: string;
    onChange: (color: string) => void;
    presets: string[];
    showCustom?: boolean;
    showNone?: boolean;
    onNoneClick?: () => void;
    direction?: 'row' | 'column';
}

/**
 * Reusable Color Picker Component
 * Used in Toolbar (stroke color) and Shape Settings (fill color)
 */
export function ColorPicker({
    value,
    onChange,
    presets,
    showCustom = true,
    showNone = false,
    onNoneClick,
    direction = 'row',
}: ColorPickerProps) {
    const containerClasses = direction === 'row'
        ? 'flex gap-2 flex-wrap items-center'
        : 'flex gap-2 flex-col items-center';

    return (
        <div className={containerClasses}>
            {/* None button (for fill color) */}
            {showNone && (
                <button
                    onClick={onNoneClick}
                    className={`w-6 h-6 rounded-full bg-white cursor-pointer flex items-center justify-center shrink-0 ${value === null ? 'ring-2 ring-indigo-500' : 'ring-2 ring-gray-200'
                        }`}
                    title="No fill"
                >
                    <div className="w-3 h-0.5 bg-gray-400 rotate-45" />
                </button>
            )}

            {/* Preset colors */}
            {presets.map((color) => (
                <button
                    key={color}
                    onClick={() => onChange(color)}
                    className={`w-6 h-6 rounded-full shadow cursor-pointer transition-transform shrink-0 ${value === color ? 'ring-2 ring-indigo-500 scale-110' : 'ring-2 ring-white'
                        }`}
                    style={{ backgroundColor: color }}
                    title={color}
                />
            ))}

            {/* Custom color picker */}
            {showCustom && (
                <label
                    className="w-6 h-6 rounded-full cursor-pointer flex items-center justify-center shadow shrink-0"
                    style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                    title="Custom Color"
                >
                    <Plus className="w-2.5 h-2.5 text-white drop-shadow" />
                    <input
                        type="color"
                        value={value}
                        onChange={(e) => onChange(e.target.value)}
                        className="absolute w-0 h-0 opacity-0 cursor-pointer"
                    />
                </label>
            )}
        </div>
    );
}
