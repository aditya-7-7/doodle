import { Pencil, Eraser, Minus, Square, Circle, Triangle, Diamond, Type } from 'lucide-react';
import { ShapeType } from '../types';

// Tool definitions
export const DRAWING_TOOLS = [
    { id: 'brush', icon: Pencil, title: 'Brush', hasPopover: false },
    { id: 'eraser', icon: Eraser, title: 'Eraser', hasPopover: false },
    { id: 'line', icon: Minus, title: 'Line', hasPopover: false, iconTransform: 'rotate(-45deg)' },
    { id: 'shapes', icon: Square, title: 'Shapes', hasPopover: true },
    { id: 'text', icon: Type, title: 'Text', hasPopover: true },
] as const;

// Shape type configurations
export const SHAPE_TYPES: Array<{ type: ShapeType; icon: typeof Square; label: string }> = [
    { type: 'rect', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
    { type: 'triangle', icon: Triangle, label: 'Triangle' },
    { type: 'diamond', icon: Diamond, label: 'Diamond' },
];

// Preset stroke sizes
export const STROKE_PRESETS = [4, 8, 12, 20, 32] as const;

// Font size range
export const FONT_SIZE_MIN = 12;
export const FONT_SIZE_MAX = 72;
