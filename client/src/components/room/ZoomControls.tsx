import { Plus, Minus, Square } from 'lucide-react';
import { useZoomControls } from '../../hooks/useZoomControls';

interface ZoomControlsProps {
    zoom: number;
    panX: number;
    panY: number;
    containerRef: React.RefObject<HTMLDivElement>;
    setZoom: (zoom: number) => void;
    setPan: (panX: number, panY: number) => void;
    resetView: () => void;
    zoomMin: number;
    zoomMax: number;
    zoomStep: number;
}

/**
 * Zoom Controls Panel
 * Extracted from CanvasArea, now using useZoomControls hook for logic
 */
export function ZoomControls({
    zoom,
    panX,
    panY,
    containerRef,
    setZoom,
    setPan,
    resetView,
    zoomMin,
    zoomMax,
    zoomStep,
}: ZoomControlsProps) {
    // Use the zoom controls hook for zoom logic
    const { handleZoomIn, handleZoomOut } = useZoomControls({
        zoom,
        panX,
        panY,
        containerRef,
        setZoom,
        setPan,
        zoomMin,
        zoomMax,
        zoomStep,
    });

    const buttonClasses = "p-2 bg-white border-none rounded-md cursor-pointer flex items-center justify-center transition-colors hover:bg-gray-100";

    return (
        <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-lg p-2 flex flex-col gap-1">
            {/* Zoom In */}
            <button
                onClick={handleZoomIn}
                className={buttonClasses}
                title="Zoom In"
            >
                <Plus className="w-5 h-5 text-gray-700" />
            </button>

            {/* Center/Reset */}
            <button
                onClick={resetView}
                className={buttonClasses}
                title="Center Canvas (Reset Zoom & Pan)"
            >
                <Square className="w-5 h-5 text-gray-700" />
            </button>

            {/* Zoom Out */}
            <button
                onClick={handleZoomOut}
                className={buttonClasses}
                title="Zoom Out"
            >
                <Minus className="w-5 h-5 text-gray-700" />
            </button>
        </div>
    );
}
