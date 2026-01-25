import { CSSProperties } from 'react';
import { MousePointer2, X } from 'lucide-react';
import { useCanvasStore } from '../../stores';

interface CanvasAreaProps {
    canvasRef: (node: HTMLCanvasElement | null) => void;  // Callback ref
    overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
    containerRef: React.RefObject<HTMLDivElement>;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    textPosition: { x: number; y: number } | null;
    textInput: string;
    setTextInput: (text: string) => void;
    onTextSubmit: () => void;
    onTextCancel: () => void;
}

const styles = {
    canvas: { touchAction: 'none' } as CSSProperties,
    cursorOffset: { transform: 'translate(-4px, -4px)' } as CSSProperties,
    textModalOffset: { transform: 'translate(-50%, -100%)' } as CSSProperties,
};

const bgColor = (c: string): CSSProperties => ({ backgroundColor: c });
const cursorPos = (x: number, y: number): CSSProperties => ({ left: `${x * 100}%`, top: `${y * 100}%`, ...styles.cursorOffset });
const textModalPos = (x: number, y: number): CSSProperties => ({ left: `${x * 100}%`, top: `${y * 100}%`, ...styles.textModalOffset });
const iconColor = (c: string): CSSProperties => ({ color: c, fill: c });

export function CanvasArea({ canvasRef, overlayCanvasRef, containerRef, onPointerDown, onPointerMove, onPointerUp, textPosition, textInput, setTextInput, onTextSubmit, onTextCancel }: CanvasAreaProps) {
    const { remoteCursors } = useCanvasStore();

    return (
        <main className="flex-1 relative overflow-hidden bg-gray-100" ref={containerRef}>
            <canvas ref={canvasRef} width={1920} height={1080} className="absolute inset-0 w-full h-full bg-white shadow-inner cursor-crosshair" style={styles.canvas} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp} />
            <canvas ref={overlayCanvasRef} width={1920} height={1080} className="absolute inset-0 w-full h-full pointer-events-none" style={styles.canvas} />

            {/* Text Input Modal */}
            {textPosition && (
                <div className="absolute z-50 bg-white shadow-xl rounded-lg p-3 border" style={textModalPos(textPosition.x, textPosition.y)}>
                    <div className="flex gap-2">
                        <input type="text" value={textInput} onChange={(e) => setTextInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && onTextSubmit()} placeholder="Enter text..." className="px-3 py-2 border rounded-lg text-sm" autoFocus />
                        <button onClick={onTextSubmit} className="px-3 py-2 bg-indigo-500 text-white rounded-lg text-sm">Add</button>
                        <button onClick={onTextCancel} className="p-2 hover:bg-gray-100 rounded-lg"><X className="w-4 h-4" /></button>
                    </div>
                </div>
            )}

            {/* Remote Cursors */}
            {Array.from(remoteCursors.values()).map((cursor) => (
                <div key={cursor.sessionId} className="absolute pointer-events-none" style={cursorPos(cursor.x, cursor.y)}>
                    <MousePointer2 className="w-5 h-5" style={iconColor(cursor.color)} />
                    <span className="absolute left-5 top-0 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap" style={bgColor(cursor.color)}>{cursor.displayName}</span>
                </div>
            ))}
        </main>
    );
}
