import { CSSProperties, useState } from 'react';
import { Pencil, Eraser, Square, Circle, Minus, Type, Undo2, Redo2, Trash2, X, Plus, Triangle, Diamond } from 'lucide-react';
import { useCanvasStore } from '../../stores';
import { COLORS, ShapeType } from '../../types';

interface ToolbarProps {
    onUndo: () => void;
    onRedo: () => void;
    onUndoPersonal: () => void;
    onRedoPersonal: () => void;
    onClear: () => void;
    fillColor: string | null;
    setFillColor: (color: string | null) => void;
    fontSize: number;
    setFontSize: (size: number) => void;
}

const bgColor = (c: string): CSSProperties => ({ backgroundColor: c });

// Tool button component
const ToolButton = ({ icon, active, onClick, title, color = 'gray' }: {
    icon: React.ReactNode; active?: boolean; onClick: () => void; title: string; color?: 'gray' | 'indigo' | 'red'
}) => {
    const colors = {
        gray: active ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100 text-gray-600',
        indigo: 'hover:bg-indigo-50 text-indigo-500',
        red: 'hover:bg-red-50 text-red-500'
    };
    return (
        <button onClick={onClick} className={`p-2 rounded-lg transition-colors ${colors[color]}`} title={title}>
            {icon}
        </button>
    );
};

// Floating popover that appears next to element
const Popover = ({ show, onClose, children }: { show: boolean; onClose: () => void; children: React.ReactNode }) => {
    if (!show) return null;
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className="absolute left-full top-0 ml-3 bg-white rounded-xl shadow-xl border p-4 z-50 min-w-[200px]">
                {children}
            </div>
        </>
    );
};

// Divider line
const Divider = () => <div className="w-full h-px bg-gray-100 my-0.5" />;

export function Toolbar({ onUndo, onRedo, onUndoPersonal, onRedoPersonal, onClear, fillColor, setFillColor, fontSize, setFontSize }: ToolbarProps) {
    const { currentTool, currentShape, strokeColor, strokeWidth, setCurrentTool, setCurrentShape, setStrokeColor, setStrokeWidth } = useCanvasStore();

    const [activePopover, setActivePopover] = useState<string | null>(null);

    const togglePopover = (name: string) => setActivePopover(activePopover === name ? null : name);
    const closePopover = () => setActivePopover(null);

    return (
        <aside className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-2">
            {/* Drawing Tools */}
            <ToolButton icon={<Pencil className="w-5 h-5" />} active={currentTool === 'brush'} onClick={() => setCurrentTool('brush')} title="Brush" />
            <ToolButton icon={<Eraser className="w-5 h-5" />} active={currentTool === 'eraser'} onClick={() => setCurrentTool('eraser')} title="Eraser" />
            <ToolButton icon={<Minus className="w-5 h-5" />} active={currentTool === 'line'} onClick={() => setCurrentTool('line')} title="Line" />

            {/* Shapes with popover (rect, circle, triangle, diamond) */}
            <div className="relative">
                <ToolButton icon={<Square className="w-5 h-5" />} active={currentTool === 'shapes'} onClick={() => { setCurrentTool('shapes'); togglePopover('shapes'); }} title="Shapes" />
                <Popover show={activePopover === 'shapes'} onClose={closePopover}>
                    <div className="text-sm text-gray-500 mb-2">Shape Type</div>
                    <div className="flex gap-1 mb-3">
                        {(['rect', 'circle', 'triangle', 'diamond'] as ShapeType[]).map(s => (
                            <button key={s} onClick={() => setCurrentShape(s)} className={`p-2 rounded-lg ${currentShape === s ? 'bg-indigo-100 text-indigo-600' : 'hover:bg-gray-100'}`} title={s}>
                                {s === 'rect' && <Square className="w-5 h-5" />}
                                {s === 'circle' && <Circle className="w-5 h-5" />}
                                {s === 'triangle' && <Triangle className="w-5 h-5" />}
                                {s === 'diamond' && <Diamond className="w-5 h-5" />}
                            </button>
                        ))}
                    </div>
                    <div className="text-sm text-gray-500 mb-2">Fill Color</div>
                    <div className="flex gap-1.5 flex-wrap">
                        <button onClick={() => setFillColor(null)} className={`w-7 h-7 rounded border-2 flex items-center justify-center ${fillColor === null ? 'border-indigo-500' : 'border-gray-200'}`}><X className="w-4 h-4 text-gray-400" /></button>
                        {COLORS.slice(0, 6).map(c => <button key={c} onClick={() => setFillColor(c)} className={`w-7 h-7 rounded border-2 ${fillColor === c ? 'border-indigo-500' : 'border-transparent'}`} style={bgColor(c)} />)}
                    </div>
                </Popover>
            </div>

            {/* Text with popover */}
            <div className="relative">
                <ToolButton icon={<Type className="w-5 h-5" />} active={currentTool === 'text'} onClick={() => { setCurrentTool('text'); togglePopover('text'); }} title="Text" />
                <Popover show={activePopover === 'text'} onClose={closePopover}>
                    <div className="text-sm text-gray-500 mb-2">Font Size</div>
                    <div className="flex items-center gap-3">
                        <input type="range" min="12" max="72" value={fontSize} onChange={(e) => setFontSize(Number(e.target.value))} className="flex-1 accent-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600 w-10">{fontSize}px</span>
                    </div>
                </Popover>
            </div>

            <Divider />

            {/* Personal Undo/Redo */}
            <ToolButton icon={<Undo2 className="w-5 h-5" />} onClick={onUndoPersonal} title="Undo (My)" color="indigo" />
            <ToolButton icon={<Redo2 className="w-5 h-5" />} onClick={onRedoPersonal} title="Redo (My)" color="indigo" />

            <Divider />

            {/* Global Undo/Redo */}
            <ToolButton icon={<Undo2 className="w-5 h-5" />} onClick={onUndo} title="Undo (All)" />
            <ToolButton icon={<Redo2 className="w-5 h-5" />} onClick={onRedo} title="Redo (All)" />

            <Divider />

            {/* Clear */}
            <ToolButton icon={<Trash2 className="w-5 h-5" />} onClick={onClear} title="Clear" color="red" />

            <div className="flex-1" />

            {/* Stroke Size with popover */}
            <div className="relative">
                <button onClick={() => togglePopover('stroke')} className="w-9 h-9 rounded-lg border border-gray-200 hover:border-gray-300 flex flex-col items-center justify-center" title={`Stroke: ${strokeWidth}px`}>
                    <div className="rounded-full bg-gray-700" style={{ width: Math.min(strokeWidth, 12), height: Math.min(strokeWidth, 12), minWidth: 3, minHeight: 3 }} />
                    <span className="text-[8px] text-gray-500">{strokeWidth}</span>
                </button>
                <Popover show={activePopover === 'stroke'} onClose={closePopover}>
                    <div className="text-sm text-gray-500 mb-2">Stroke Size</div>
                    <div className="flex items-center gap-3 mb-3">
                        <input type="range" min="1" max="32" value={strokeWidth} onChange={(e) => setStrokeWidth(Number(e.target.value))} className="flex-1 accent-indigo-500" />
                        <span className="text-sm font-medium text-indigo-600 w-10">{strokeWidth}px</span>
                    </div>
                    <div className="flex justify-between">
                        {[2, 6, 12, 20, 32].map(size => (
                            <button key={size} onClick={() => setStrokeWidth(size)} className={`rounded-full bg-gray-700 hover:bg-indigo-500 transition-colors ${strokeWidth === size ? 'ring-2 ring-indigo-400' : ''}`} style={{ width: Math.min(size, 20), height: Math.min(size, 20) }} />
                        ))}
                    </div>
                </Popover>
            </div>

            <Divider />

            {/* Colors */}
            <div className="flex flex-col gap-1 items-center py-1">
                {COLORS.slice(0, 5).map(c => (
                    <button key={c} onClick={() => setStrokeColor(c)} className={`w-6 h-6 rounded-full border-2 transition-transform ${strokeColor === c ? 'border-indigo-500 scale-110' : 'border-white shadow-sm hover:scale-105'}`} style={bgColor(c)} />
                ))}
                {/* Color picker with popover */}
                <div className="relative">
                    <button onClick={() => togglePopover('color')} className="w-6 h-6 rounded-full flex items-center justify-center hover:scale-105 transition-transform" style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }} title="Custom">
                        <Plus className="w-3 h-3 text-white drop-shadow" />
                    </button>
                    <Popover show={activePopover === 'color'} onClose={closePopover}>
                        <div className="text-sm text-gray-500 mb-2">Custom Color</div>
                        <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-full h-24 rounded-lg cursor-pointer" />
                        <div className="text-xs text-gray-500 mt-2 text-center font-mono">{strokeColor}</div>
                    </Popover>
                </div>
            </div>
        </aside>
    );
}
