import { X } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface TextInputModalProps {
    position: { x: number; y: number } | null;
    value: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
    zoom: number;
    panX: number;
    panY: number;
}

// text input modal
// extracted from CanvasArea for better modularity
export function TextInputModal({
    position,
    value,
    onChange,
    onSubmit,
    onCancel,
    zoom,
    panX,
    panY,
}: TextInputModalProps) {
    if (!position) return null;

    // convert normalized canvas coordinates 0 to 1 to screen pixel position
    const CANVAS_SIZE = 8000;
    const canvasX = position.x * CANVAS_SIZE;
    const canvasY = position.y * CANVAS_SIZE;
    const screenX = canvasX * zoom + panX;
    const screenY = canvasY * zoom + panY;

    // modal dimensions
    const modalWidth = 250;
    const modalHeight = 50;

    // position above and centered on click point
    const left = screenX - modalWidth / 2;
    const top = screenY - modalHeight - 10; // 10px above click

    return (
        <div
            className="absolute z-50 bg-white shadow-lg rounded-xl p-3 border border-gray-200"
            style={{ left: `${left}px`, top: `${top}px` }}
        >
            <div className="flex gap-2 items-center">
                <Input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && onSubmit()}
                    placeholder="Enter text..."
                    autoFocus
                    className="w-[220px]"
                />

                <Button variant="primary" gradient="indigo" onClick={onSubmit}>
                    Add
                </Button>

                <button
                    onClick={onCancel}
                    className="p-2 bg-transparent border-none rounded-lg cursor-pointer flex items-center justify-center transition-colors hover:bg-gray-100"
                >
                    <X className="w-[18px] h-[18px] text-gray-500" />
                </button>
            </div>
        </div>
    );
}
