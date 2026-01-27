import { socketService } from './socketService';
import { SocketEvents, Point } from '../types';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '../constants';

class CanvasService {
    private static instance: CanvasService;
    private canvas: HTMLCanvasElement | null = null;
    private ctx: CanvasRenderingContext2D | null = null;

    // Batching for network efficiency
    private batchedCommands: number[][] = [];
    private batchTimeout: number | null = null;
    private readonly BATCH_DELAY = 50; // ms

    // Pending operations queue - for when canvas isn't ready yet
    private pendingCallbacks: (() => void)[] = [];
    private isReady = false;

    private constructor() { }

    public static getInstance(): CanvasService {
        if (!CanvasService.instance) {
            CanvasService.instance = new CanvasService();
        }
        return CanvasService.instance;
    }

    // Initialize canvas
    public setCanvas(canvas: HTMLCanvasElement): void {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        if (this.ctx) {
            this.ctx.lineCap = 'round';
            this.ctx.lineJoin = 'round';
        }
        this.isReady = true;
        // Execute any pending callbacks
        while (this.pendingCallbacks.length > 0) {
            const cb = this.pendingCallbacks.shift();
            cb?.();
        }
    }

    // Queue callback for when canvas is ready, or execute immediately if ready
    public whenReady(callback: () => void): void {
        if (this.isReady && this.canvas && this.ctx) {
            callback();
        } else {
            this.pendingCallbacks.push(callback);
        }
    }

    // Reset state (call when leaving a room)
    public reset(): void {
        this.canvas = null;
        this.ctx = null;
        this.isReady = false;
        this.pendingCallbacks = [];
        this.batchedCommands = [];
        if (this.batchTimeout !== null) {
            clearTimeout(this.batchTimeout);
            this.batchTimeout = null;
        }
    }

    public getCanvas(): HTMLCanvasElement | null {
        return this.canvas;
    }

    public getContext(): CanvasRenderingContext2D | null {
        return this.ctx;
    }

    // Get scale factor - always 1 since we use fixed resolution with CSS scaling
    public getScaleFactor(): number {
        return 1;
    }

    // Convert screen pixel to normalized coordinates (0-1) accounting for zoom/pan
    // Fixed canvas is 8000x8000
    // containerRect should be from the parent container, NOT the transformed canvas
    public normalizePoint(x: number, y: number, zoom: number = 1, panX: number = 0, panY: number = 0, containerRect?: DOMRect): Point {
        if (!this.canvas) return { x: 0, y: 0 };

        // Use container rect if provided, otherwise fall back to canvas rect
        // Container rect is needed because canvas.getBoundingClientRect() includes CSS transforms
        const rect = containerRect || this.canvas.getBoundingClientRect();

        // Reverse the viewport transform: screen → canvas → normalized
        // Canvas transform is: translate(panX, panY) scale(zoom)
        // So reverse: (screen - rect.left - panX) / zoom
        const canvasX = (x - rect.left - panX) / zoom;
        const canvasY = (y - rect.top - panY) / zoom;

        return {
            x: canvasX / CANVAS_WIDTH,
            y: canvasY / CANVAS_HEIGHT,
        };
    }

    // Convert normalized to canvas pixel coordinates (using constants)
    public denormalizePoint(x: number, y: number): Point {
        return {
            x: x * CANVAS_WIDTH,
            y: y * CANVAS_HEIGHT,
        };
    }

    // Draw a line segment (normalized coords)
    public drawLine(
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        color: string,
        width: number
    ): void {
        if (!this.ctx || !this.canvas) return;

        // Denormalize
        const start = this.denormalizePoint(startX, startY);
        const end = this.denormalizePoint(endX, endY);

        // Scale width for display
        const scaledWidth = width * this.getScaleFactor();

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = scaledWidth;
        this.ctx.stroke();
    }

    // Erase at position (normalized coords) - circular eraser
    public erase(x: number, y: number, size: number = 20): void {
        if (!this.ctx || !this.canvas) return;

        const point = this.denormalizePoint(x, y);
        const radius = (size * this.getScaleFactor()) / 2;

        this.ctx.beginPath();
        this.ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
        this.ctx.fillStyle = 'white';
        this.ctx.fill();
    }

    // Erase line between two points (for smooth continuous erasing)
    public eraseLine(x1: number, y1: number, x2: number, y2: number, size: number = 20): void {
        if (!this.ctx || !this.canvas) return;

        const start = this.denormalizePoint(x1, y1);
        const end = this.denormalizePoint(x2, y2);
        const scaledSize = size * this.getScaleFactor();

        this.ctx.beginPath();
        this.ctx.moveTo(start.x, start.y);
        this.ctx.lineTo(end.x, end.y);
        this.ctx.lineCap = 'round';
        this.ctx.lineJoin = 'round';
        this.ctx.strokeStyle = 'white';
        this.ctx.lineWidth = scaledSize;
        this.ctx.stroke();
    }

    // Clear entire canvas
    public clear(): void {
        if (!this.ctx || !this.canvas) return;
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    // Draw shape (normalized coords)
    public drawShape(
        type: 'rect' | 'circle' | 'line' | 'triangle' | 'diamond',
        startX: number,
        startY: number,
        endX: number,
        endY: number,
        color: string,
        width: number,
        fill?: string
    ): void {
        if (!this.ctx || !this.canvas) return;

        const start = this.denormalizePoint(startX, startY);
        const end = this.denormalizePoint(endX, endY);
        const scaledWidth = width * this.getScaleFactor();

        this.ctx.strokeStyle = color;
        this.ctx.lineWidth = scaledWidth;

        // Helper to apply fill and stroke
        const applyFillAndStroke = () => {
            if (fill) {
                this.ctx!.fillStyle = fill;
                this.ctx!.fill();
            }
            this.ctx!.stroke();
        };

        switch (type) {
            case 'rect': {
                const w = end.x - start.x;
                const h = end.y - start.y;
                if (fill) {
                    this.ctx.fillStyle = fill;
                    this.ctx.fillRect(start.x, start.y, w, h);
                }
                this.ctx.strokeRect(start.x, start.y, w, h);
                break;
            }
            case 'circle': {
                const radius = Math.sqrt(Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2));
                this.ctx.beginPath();
                this.ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
                applyFillAndStroke();
                break;
            }
            case 'triangle': {
                const midX = (start.x + end.x) / 2;
                this.ctx.beginPath();
                this.ctx.moveTo(midX, start.y);
                this.ctx.lineTo(end.x, end.y);
                this.ctx.lineTo(start.x, end.y);
                this.ctx.closePath();
                applyFillAndStroke();
                break;
            }
            case 'diamond': {
                const centerX = (start.x + end.x) / 2;
                const centerY = (start.y + end.y) / 2;
                this.ctx.beginPath();
                this.ctx.moveTo(centerX, start.y);
                this.ctx.lineTo(end.x, centerY);
                this.ctx.lineTo(centerX, end.y);
                this.ctx.lineTo(start.x, centerY);
                this.ctx.closePath();
                applyFillAndStroke();
                break;
            }
            case 'line': {
                this.ctx.beginPath();
                this.ctx.moveTo(start.x, start.y);
                this.ctx.lineTo(end.x, end.y);
                this.ctx.stroke();
                break;
            }
        }
    }

    // Draw text (normalized coords)
    public drawText(
        text: string,
        x: number,
        y: number,
        fontSize: number,
        color: string
    ): void {
        if (!this.ctx || !this.canvas) return;

        const point = this.denormalizePoint(x, y);
        const scaledFontSize = fontSize * this.getScaleFactor();
        this.ctx.font = `${scaledFontSize}px Inter, sans-serif`;
        this.ctx.fillStyle = color;
        this.ctx.fillText(text, point.x, point.y);
    }

    private currentBatchColor: string | undefined; // Added for batching color

    // Batch and send draw command
    public sendDrawCommand(command: number[], color?: string): void {
        this.batchedCommands.push(command);

        // Store current color for this batch
        if (color && !this.currentBatchColor) {
            this.currentBatchColor = color;
        }

        if (this.batchTimeout === null) {
            this.batchTimeout = window.setTimeout(() => {
                if (this.batchedCommands.length > 0) {
                    socketService.emit(SocketEvents.DRAW_STROKE, {
                        commands: this.batchedCommands,
                        color: this.currentBatchColor, // Send actual color for custom colors
                    });
                    this.batchedCommands = [];
                    this.currentBatchColor = undefined;
                }
                this.batchTimeout = null;
            }, this.BATCH_DELAY);
        }
    }

    // Get canvas as data URL (for snapshots)
    public toDataURL(): string | null {
        return this.canvas?.toDataURL('image/png') || null;
    }

    // Load image onto canvas
    public loadImage(dataUrl: string): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.ctx || !this.canvas) {
                reject(new Error('Canvas not initialized'));
                return;
            }

            const img = new Image();
            img.onload = () => {
                this.ctx!.drawImage(img, 0, 0);
                resolve();
            };
            img.onerror = reject;
            img.src = dataUrl;
        });
    }
}

export const canvasService = CanvasService.getInstance();
