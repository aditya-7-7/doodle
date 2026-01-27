import { useState } from 'react';
import { Pencil, Eraser, Square, Minus, Type, Undo2, Redo2, Trash2, Plus, Globe, User } from 'lucide-react';
import { useCanvasStore } from '../../stores';
import { COLORS } from '../../types';
import { BrushSettingsContent } from '../toolbar/BrushSettings';
import { ShapeSettingsContent } from '../toolbar/ShapeSettings';
import { TextSettingsContent } from '../toolbar/TextSettings';

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

// Floating popover with position option
const Popover = ({ show, onClose, children, position = 'top' }: { show: boolean; onClose: () => void; children: React.ReactNode; position?: 'top' | 'bottom' }) => {
    if (!show) return null;
    const positionClass = position === 'bottom' ? 'bottom-0' : 'top-0';
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div className={`absolute left-full ml-3 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-[200px] ${positionClass}`}>
                {children}
            </div>
        </>
    );
};

// Divider - thin horizontal line separator
const Divider = () => <hr className="w-[70%] h-0 border-0 border-t border-gray-200 m-0 p-0" />;

// ToolButton component
const ToolButton = ({ children, active, onClick, title, variant = 'default' }: {
    children: React.ReactNode; active?: boolean; onClick: () => void; title: string; variant?: 'default' | 'indigo' | 'red';
}) => {
    const baseClasses = "w-[30px] h-[30px] min-w-[30px] min-h-[30px] max-w-[30px] max-h-[30px] rounded-md flex items-center justify-center border-none cursor-pointer transition-colors shrink-0";

    let stateClasses = "bg-transparent text-gray-600";
    if (active) {
        stateClasses = "bg-indigo-100 text-indigo-600";
    } else if (variant === 'indigo') {
        stateClasses = "text-indigo-500 hover:bg-indigo-50";
    } else if (variant === 'red') {
        stateClasses = "text-red-500 hover:bg-red-50";
    } else {
        stateClasses = "text-gray-600 hover:bg-gray-100";
    }

    return (
        <button className={`${baseClasses} ${stateClasses}`} onClick={onClick} title={title}>
            {children}
        </button>
    );
};

// Color button
const ColorButton = ({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) => (
    <button
        className={`w-[22px] h-[22px] min-w-[22px] min-h-[22px] max-w-[22px] max-h-[22px] aspect-square rounded-full shadow cursor-pointer transition-transform shrink-0 ${selected ? 'ring-2 ring-indigo-500 scale-110' : 'ring-2 ring-white hover:scale-110'
            }`}
        style={{ backgroundColor: color }}
        onClick={onClick}
    />
);

export function Toolbar({ onUndo, onRedo, onUndoPersonal, onRedoPersonal, onClear, fillColor, setFillColor, fontSize, setFontSize }: ToolbarProps) {
    const { currentTool, currentShape, strokeColor, strokeWidth, setCurrentTool, setCurrentShape, setStrokeColor, setStrokeWidth } = useCanvasStore();
    const [activePopover, setActivePopover] = useState<string | null>(null);

    const togglePopover = (name: string) => setActivePopover(activePopover === name ? null : name);
    const closePopover = () => setActivePopover(null);

    const UndoRedoIcon = ({ icon: Icon, indicator: Indicator, color }: { icon: typeof Undo2; indicator: typeof User | typeof Globe; color?: string }) => (
        <div className="relative flex items-center justify-center">
            <Icon className="w-4 h-4" />
            <Indicator className="w-[7px] h-[7px] absolute -top-[3px] -right-[5px]" style={{ color: color || 'currentColor' }} />
        </div>
    );

    return (
        <aside className="w-12 bg-white border-r border-gray-200 flex flex-col items-center py-2 gap-1.5">
            {/* Drawing Tools */}
            <ToolButton active={currentTool === 'brush'} onClick={() => setCurrentTool('brush')} title="Brush">
                <Pencil className="w-4 h-4" />
            </ToolButton>
            <ToolButton active={currentTool === 'eraser'} onClick={() => setCurrentTool('eraser')} title="Eraser">
                <Eraser className="w-4 h-4" />
            </ToolButton>
            <ToolButton active={currentTool === 'line'} onClick={() => setCurrentTool('line')} title="Line">
                <Minus className="w-4 h-4 -rotate-45" />
            </ToolButton>

            {/* Shapes */}
            <div className="relative">
                <ToolButton active={currentTool === 'shapes'} onClick={() => { setCurrentTool('shapes'); togglePopover('shapes'); }} title="Shapes">
                    <Square className="w-4 h-4" />
                </ToolButton>
                <Popover show={activePopover === 'shapes'} onClose={closePopover}>
                    <ShapeSettingsContent
                        currentShape={currentShape}
                        setCurrentShape={setCurrentShape}
                        fillColor={fillColor}
                        setFillColor={setFillColor}
                    />
                </Popover>
            </div>

            {/* Text */}
            <div className="relative">
                <ToolButton active={currentTool === 'text'} onClick={() => { setCurrentTool('text'); togglePopover('text'); }} title="Text">
                    <Type className="w-4 h-4" />
                </ToolButton>
                <Popover show={activePopover === 'text'} onClose={closePopover}>
                    <TextSettingsContent fontSize={fontSize} setFontSize={setFontSize} />
                </Popover>
            </div>

            <Divider />

            {/* Personal Undo/Redo */}
            <ToolButton onClick={onUndoPersonal} title="Undo My Actions" variant="indigo">
                <UndoRedoIcon icon={Undo2} indicator={User} />
            </ToolButton>
            <ToolButton onClick={onRedoPersonal} title="Redo My Actions" variant="indigo">
                <UndoRedoIcon icon={Redo2} indicator={User} />
            </ToolButton>

            <Divider />

            {/* Global Undo/Redo */}
            <ToolButton onClick={onUndo} title="Undo All Actions">
                <UndoRedoIcon icon={Undo2} indicator={Globe} color="#6b7280" />
            </ToolButton>
            <ToolButton onClick={onRedo} title="Redo All Actions">
                <UndoRedoIcon icon={Redo2} indicator={Globe} color="#6b7280" />
            </ToolButton>

            <Divider />

            {/* Clear */}
            <ToolButton onClick={onClear} title="Clear Canvas" variant="red">
                <Trash2 className="w-4 h-4" />
            </ToolButton>

            <Divider />

            {/* Stroke Size */}
            <div className="relative flex flex-col items-center gap-0.5">
                <button
                    onClick={() => togglePopover('stroke')}
                    className="w-[26px] h-[26px] min-w-[26px] min-h-[26px] rounded-full border border-gray-300 bg-white cursor-pointer flex items-center justify-center"
                    title={`Stroke: ${strokeWidth}px`}
                >
                    <div
                        className="rounded-full bg-gray-700"
                        style={{ width: Math.min(strokeWidth, 12), height: Math.min(strokeWidth, 12), minWidth: 3, minHeight: 3 }}
                    />
                </button>
                <span className="text-[9px] text-gray-500">{strokeWidth}px</span>
                <Popover show={activePopover === 'stroke'} onClose={closePopover}>
                    <BrushSettingsContent strokeWidth={strokeWidth} setStrokeWidth={setStrokeWidth} />
                </Popover>
            </div>

            <Divider />

            {/* Colors */}
            <div className="flex flex-col items-center gap-2">
                {COLORS.slice(0, 5).map(c => (
                    <ColorButton key={c} color={c} selected={strokeColor === c} onClick={() => setStrokeColor(c)} />
                ))}
            </div>

            {/* Color picker */}
            <div className="relative">
                <label
                    className="w-[22px] h-[22px] min-w-[22px] min-h-[22px] max-w-[22px] max-h-[22px] aspect-square rounded-full cursor-pointer flex items-center justify-center shrink-0"
                    style={{ background: 'conic-gradient(red, yellow, lime, aqua, blue, magenta, red)' }}
                    title="Custom Color"
                >
                    <Plus className="w-2.5 h-2.5 text-white drop-shadow" />
                    <input
                        type="color"
                        value={strokeColor}
                        onChange={(e) => setStrokeColor(e.target.value)}
                        className="absolute w-0 h-0 opacity-0 cursor-pointer"
                    />
                </label>
            </div>
        </aside>
    );
}
