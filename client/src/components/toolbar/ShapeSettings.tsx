import { Square, Circle, Triangle, Diamond, X, Plus } from 'lucide-react';
import { COLORS, ShapeType } from '../../types';

interface ShapeSettingsProps {
    currentShape: ShapeType;
    setCurrentShape: (shape: ShapeType) => void;
    fillColor: string | null;
    setFillColor: (color: string | null) => void;
}

// Only shapes that appear in the shape picker (not 'line' - that's a separate tool)
type PickerShapeType = Exclude<ShapeType, 'line'>;
const SHAPE_TYPES: PickerShapeType[] = ['rect', 'circle', 'triangle', 'diamond'];
const SHAPE_ICONS: Record<PickerShapeType, React.ElementType> = {
    rect: Square,
    circle: Circle,
    triangle: Triangle,
    diamond: Diamond,
};

/**
 * Shape settings popover content - shape type and fill color
 * Extracted from Toolbar for better modularity
 */
export function ShapeSettingsContent({ currentShape, setCurrentShape, fillColor, setFillColor }: ShapeSettingsProps) {
    return (
        <>
            {/* Shape Type */}
            <div className="text-sm text-gray-500 mb-2">
                Shape Type
            </div>
            <div className="flex gap-1 mb-3">
                {SHAPE_TYPES.map(shape => {
                    const Icon = SHAPE_ICONS[shape];
                    const isActive = currentShape === shape;
                    return (
                        <button
                            key={shape}
                            onClick={() => setCurrentShape(shape)}
                            className={`p-2 rounded-lg border-none cursor-pointer ${isActive ? 'bg-indigo-100 text-indigo-600' : 'bg-transparent text-gray-700'
                                }`}
                        >
                            <Icon className="w-5 h-5" />
                        </button>
                    );
                })}
            </div>

            {/* Fill Color */}
            <div className="text-sm text-gray-500 mb-2">
                Fill Color
            </div>
            <div className="flex gap-2 flex-wrap items-center">
                {/* No fill button */}
                <button
                    onClick={() => setFillColor(null)}
                    className={`w-6 h-6 rounded-full bg-white cursor-pointer flex items-center justify-center ${fillColor === null ? 'ring-2 ring-indigo-500' : 'ring-2 ring-gray-200'
                        }`}
                >
                    <X className="w-3 h-3 text-gray-400" />
                </button>

                {/* Preset colors */}
                {COLORS.slice(0, 6).map(c => (
                    <button
                        key={c}
                        onClick={() => setFillColor(c)}
                        className={`w-6 h-6 rounded-full cursor-pointer shadow ${fillColor === c ? 'ring-2 ring-indigo-500' : 'ring-2 ring-white'
                            }`}
                        style={{ backgroundColor: c }}
                    />
                ))}

                {/* Custom color picker */}
                <label
                    className="w-6 h-6 rounded-full cursor-pointer flex items-center justify-center shadow"
                    style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                    title="Custom Fill Color"
                >
                    <Plus className="w-2.5 h-2.5 text-white drop-shadow" />
                    <input
                        type="color"
                        value={fillColor || '#000000'}
                        onChange={(e) => setFillColor(e.target.value)}
                        className="absolute w-0 h-0 opacity-0 cursor-pointer"
                    />
                </label>
            </div>
        </>
    );
}
