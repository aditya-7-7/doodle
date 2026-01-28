import { useState, useCallback } from 'react';
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

// Popover with dynamic positioning - receives top position as CSS variable
interface PopoverProps {
    show: boolean;
    onClose: () => void;
    children: React.ReactNode;
    topPosition: number;
}

const Popover = ({ show, onClose, children, topPosition }: PopoverProps) => {
    if (!show) return null;
    return (
        <>
            <div className="fixed inset-0 z-40" onClick={onClose} />
            <div
                className="fixed left-14 md:left-12 bg-white rounded-xl shadow-lg border border-gray-200 p-4 z-50 min-w-[200px] -translate-y-1/2"
                style={{ top: topPosition }}
            >
                {children}
            </div>
        </>
    );
};

// divider thin horizontal line separator
const Divider = () => <hr className="w-[70%] h-0 border-0 border-t border-gray-200 m-0 p-0" />;

// tool button component
const ToolButton = ({ children, active, onClick, title, variant = 'default' }: {
    children: React.ReactNode; active?: boolean; onClick: (e: React.MouseEvent) => void; title: string; variant?: 'default' | 'indigo' | 'red';
}) => {
    const baseClasses = "w-9 h-9 min-w-9 min-h-9 md:w-[30px] md:h-[30px] md:min-w-[30px] md:min-h-[30px] rounded-md flex items-center justify-center border-none cursor-pointer transition-colors shrink-0";

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

// color button
const ColorButton = ({ color, selected, onClick }: { color: string; selected: boolean; onClick: () => void }) => (
    <button
        className={`w-7 h-7 min-w-7 min-h-7 md:w-[22px] md:h-[22px] md:min-w-[22px] md:min-h-[22px] aspect-square rounded-full shadow cursor-pointer transition-transform shrink-0 ${selected ? 'ring-2 ring-indigo-500 scale-110' : 'ring-2 ring-white hover:scale-110'
            }`}
        style={{ backgroundColor: color }}
        onClick={onClick}
    />
);

export function Toolbar({ onUndo, onRedo, onUndoPersonal, onRedoPersonal, onClear, fillColor, setFillColor, fontSize, setFontSize }: ToolbarProps) {
    const { currentTool, currentShape, strokeColor, strokeWidth, setCurrentTool, setCurrentShape, setStrokeColor, setStrokeWidth } = useCanvasStore();
    const [activePopover, setActivePopover] = useState<string | null>(null);
    const [popoverPosition, setPopoverPosition] = useState<number>(0);

    // Toggle popover and calculate position based on clicked element
    const togglePopover = useCallback((name: string, event: React.MouseEvent) => {
        if (activePopover === name) {
            setActivePopover(null);
        } else {
            // Get the button's vertical center position
            const button = event.currentTarget as HTMLElement;
            const rect = button.getBoundingClientRect();
            const buttonCenter = rect.top + rect.height / 2;
            setPopoverPosition(buttonCenter);
            setActivePopover(name);
        }
    }, [activePopover]);

    const closePopover = useCallback(() => {
        setActivePopover(null);
    }, []);

    const UndoRedoIcon = ({ icon: Icon, indicator: Indicator, color }: { icon: typeof Undo2; indicator: typeof User | typeof Globe; color?: string }) => (
        <div className="relative flex items-center justify-center">
            <Icon className="w-5 h-5 md:w-4 md:h-4" />
            <Indicator className="w-2 h-2 md:w-[7px] md:h-[7px] absolute -top-[3px] -right-[5px]" style={{ color: color || 'currentColor' }} />
        </div>
    );

    return (
        <aside className="w-14 md:w-12 bg-white border-r border-gray-200 flex flex-col items-center py-2 gap-2 md:gap-1.5 max-h-[calc(100vh-4rem)] md:max-h-screen overflow-y-auto overflow-x-visible">
            {/* Drawing Tools */}
            <ToolButton active={currentTool === 'brush'} onClick={() => setCurrentTool('brush')} title="Brush">
                <Pencil className="w-5 h-5 md:w-4 md:h-4" />
            </ToolButton>
            <ToolButton active={currentTool === 'eraser'} onClick={() => setCurrentTool('eraser')} title="Eraser">
                <Eraser className="w-5 h-5 md:w-4 md:h-4" />
            </ToolButton>
            <ToolButton active={currentTool === 'line'} onClick={() => setCurrentTool('line')} title="Line">
                <Minus className="w-5 h-5 md:w-4 md:h-4 -rotate-45" />
            </ToolButton>

            {/* Shapes */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <ToolButton active={currentTool === 'shapes'} onClick={(e) => { setCurrentTool('shapes'); togglePopover('shapes', e); }} title="Shapes">
                    <Square className="w-5 h-5 md:w-4 md:h-4" />
                </ToolButton>
                <Popover show={activePopover === 'shapes'} onClose={closePopover} topPosition={popoverPosition}>
                    <ShapeSettingsContent
                        currentShape={currentShape}
                        setCurrentShape={setCurrentShape}
                        fillColor={fillColor}
                        setFillColor={setFillColor}
                    />
                </Popover>
            </div>

            {/* Text */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
                <ToolButton active={currentTool === 'text'} onClick={(e) => { setCurrentTool('text'); togglePopover('text', e); }} title="Text">
                    <Type className="w-5 h-5 md:w-4 md:h-4" />
                </ToolButton>
                <Popover show={activePopover === 'text'} onClose={closePopover} topPosition={popoverPosition}>
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
                <Trash2 className="w-5 h-5 md:w-4 md:h-4" />
            </ToolButton>

            <Divider />

            {/* Stroke Size */}
            <div className="relative flex flex-col items-center gap-0.5" onClick={(e) => e.stopPropagation()}>
                <button
                    onClick={(e) => togglePopover('stroke', e)}
                    className="w-8 h-8 min-w-8 min-h-8 md:w-[26px] md:h-[26px] md:min-w-[26px] md:min-h-[26px] rounded-full border border-gray-300 bg-white cursor-pointer flex items-center justify-center"
                    title={`Stroke: ${strokeWidth}px`}
                >
                    <div
                        className="rounded-full bg-gray-700"
                        style={{ width: Math.min(strokeWidth, 12), height: Math.min(strokeWidth, 12), minWidth: 3, minHeight: 3 }}
                    />
                </button>
                <span className="text-[9px] text-gray-500">{strokeWidth}px</span>
                <Popover show={activePopover === 'stroke'} onClose={closePopover} topPosition={popoverPosition}>
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
