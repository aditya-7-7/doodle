import { CSSProperties } from 'react';
import { MousePointer2 } from 'lucide-react';
import { useCanvasStore } from '../../stores';
import { useViewport } from '../../contexts';
import { CANVAS_SIZE, ZOOM_MIN, ZOOM_MAX, ZOOM_STEP } from '../../constants';
import { TextInputModal } from './TextInputModal';
import { ZoomControls } from './ZoomControls';

interface CanvasAreaProps {
    canvasRef: (node: HTMLCanvasElement | null) => void;  // callback ref
    overlayCanvasRef: React.RefObject<HTMLCanvasElement>;
    containerRef: React.RefObject<HTMLDivElement>;
    onPointerDown: (e: React.PointerEvent) => void;
    onPointerMove: (e: React.PointerEvent) => void;
    onPointerUp: (e: React.PointerEvent) => void;
    onWheel: (e: React.WheelEvent) => void;
    textPosition: { x: number; y: number } | null;
    textInput: string;
    setTextInput: (text: string) => void;
    onTextSubmit: () => void;
    onTextCancel: () => void;
    isPanning: boolean;
}

const styles = {
    canvas: { touchAction: 'none' } as CSSProperties,
    cursorOffset: { transform: 'translate(-4px, -4px)' } as CSSProperties,
};

// convert normalized canvas coordinates 0 to 1 to screen pixel position for cursors
const cursorPos = (x: number, y: number, zoom: number, panX: number, panY: number): CSSProperties => {
    // convert normalized 0 to 1 to canvas pixels
    const canvasX = x * CANVAS_SIZE;
    const canvasY = y * CANVAS_SIZE;

    // apply viewport transform to get screen position
    const screenX = canvasX * zoom + panX;
    const screenY = canvasY * zoom + panY;

    return {
        left: `${screenX}px`,
        top: `${screenY}px`,
        ...styles.cursorOffset
    };
};

const iconColor = (c: string): CSSProperties => ({ color: c, fill: c });
const bgColor = (c: string): CSSProperties => ({ backgroundColor: c });

export function CanvasArea({
    canvasRef,
    overlayCanvasRef,
    containerRef,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    onWheel,
    textPosition,
    textInput,
    setTextInput,
    onTextSubmit,
    onTextCancel,
    isPanning
}: CanvasAreaProps) {
    const { remoteCursors } = useCanvasStore();
    const { zoom, panX, panY, setZoom, setPan, resetView } = useViewport();

    // css transform for infinite canvas with zoom and pan
    const canvasTransform = {
        transform: `translate(${panX}px, ${panY}px) scale(${zoom})`,
        transformOrigin: '0 0',
    };

    // cursor style uses grabbing hand when panning
    const cursorStyle = isPanning ? 'grabbing' : 'crosshair';

    return (
        <main className="flex-1 relative overflow-hidden bg-white" ref={containerRef}>
            <canvas
                ref={canvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="absolute bg-white"
                style={{ ...styles.canvas, ...canvasTransform, cursor: cursorStyle }}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onWheel={onWheel}
            />
            <canvas
                ref={overlayCanvasRef}
                width={CANVAS_SIZE}
                height={CANVAS_SIZE}
                className="absolute pointer-events-none bg-transparent"
                style={{ ...styles.canvas, ...canvasTransform, cursor: cursorStyle }}
                onWheel={onWheel}
            />

            {/* Text Input Modal */}
            <TextInputModal
                position={textPosition}
                value={textInput}
                onChange={setTextInput}
                onSubmit={onTextSubmit}
                onCancel={onTextCancel}
                zoom={zoom}
                panX={panX}
                panY={panY}
            />

            {/* Remote Cursors */}
            {Array.from(remoteCursors.values()).map((cursor) => (
                <div key={cursor.sessionId} className="absolute pointer-events-none" style={cursorPos(cursor.x, cursor.y, zoom, panX, panY)}>
                    <MousePointer2 className="w-5 h-5" style={iconColor(cursor.color)} />
                    <span className="absolute left-5 top-0 px-2 py-0.5 rounded text-xs text-white whitespace-nowrap" style={bgColor(cursor.color)}>{cursor.displayName}</span>
                </div>
            ))}

            {/* Zoom Controls */}
            <ZoomControls
                zoom={zoom}
                panX={panX}
                panY={panY}
                containerRef={containerRef}
                setZoom={setZoom}
                setPan={setPan}
                resetView={resetView}
                zoomMin={ZOOM_MIN}
                zoomMax={ZOOM_MAX}
                zoomStep={ZOOM_STEP}
            />
        </main>
    );
}
