import { socketService } from './socketService';
import { SocketEvents, Point } from '../types';

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

    // Get scale factor (canvas internal size / display size)
    // This scales stroke widths to appear consistent regardless of display size
    public getScaleFactor(): number {
        if (!this.canvas) return 1;
        const displayWidth = this.canvas.getBoundingClientRect().width;
        if (displayWidth === 0) return 1;
        return this.canvas.width / displayWidth;
    }

    // Convert pixel to normalized coordinates (0-1)
    public normalizePoint(x: number, y: number): Point {
        if (!this.canvas) return { x: 0, y: 0 };
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (x - rect.left) / rect.width,
            y: (y - rect.top) / rect.height,
        };
    }

    // Convert normalized to pixel coordinates
    public denormalizePoint(x: number, y: number): Point {
        if (!this.canvas) return { x: 0, y: 0 };
        return {
            x: x * this.canvas.width,
            y: y * this.canvas.height,
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

    // Erase at position (normalized coords)
    public erase(x: number, y: number, size: number = 20): void {
        if (!this.ctx || !this.canvas) return;

        const point = this.denormalizePoint(x, y);
        const scaledSize = size * this.getScaleFactor();
        this.ctx.fillStyle = 'white';
        this.ctx.fillRect(point.x - scaledSize / 2, point.y - scaledSize / 2, scaledSize, scaledSize);
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
        this.ctx.beginPath();

        switch (type) {
            case 'rect':
                const rectWidth = end.x - start.x;
                const rectHeight = end.y - start.y;
                if (fill) {
                    this.ctx.fillStyle = fill;
                    this.ctx.fillRect(start.x, start.y, rectWidth, rectHeight);
                }
                this.ctx.strokeRect(start.x, start.y, rectWidth, rectHeight);
                break;

            case 'circle':
                const radius = Math.sqrt(
                    Math.pow(end.x - start.x, 2) + Math.pow(end.y - start.y, 2)
                );
                this.ctx.arc(start.x, start.y, radius, 0, Math.PI * 2);
                if (fill) {
                    this.ctx.fillStyle = fill;
                    this.ctx.fill();
                }
                this.ctx.stroke();
                break;

            case 'triangle':
                // Draw equilateral-ish triangle from start to end
                const midX = (start.x + end.x) / 2;
                this.ctx.moveTo(midX, start.y); // Top
                this.ctx.lineTo(end.x, end.y); // Bottom right
                this.ctx.lineTo(start.x, end.y); // Bottom left
                this.ctx.closePath();
                if (fill) {
                    this.ctx.fillStyle = fill;
                    this.ctx.fill();
                }
                this.ctx.stroke();
                break;

            case 'diamond':
                // Draw diamond from start to end
                const centerX = (start.x + end.x) / 2;
                const centerY = (start.y + end.y) / 2;
                this.ctx.moveTo(centerX, start.y); // Top
                this.ctx.lineTo(end.x, centerY); // Right
                this.ctx.lineTo(centerX, end.y); // Bottom
                this.ctx.lineTo(start.x, centerY); // Left
                this.ctx.closePath();
                if (fill) {
                    this.ctx.fillStyle = fill;
                    this.ctx.fill();
                }
                this.ctx.stroke();
                break;
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

    // Batch and send draw command
    public sendDrawCommand(command: number[]): void {
        this.batchedCommands.push(command);

        if (this.batchTimeout === null) {
            this.batchTimeout = window.setTimeout(() => {
                if (this.batchedCommands.length > 0) {
                    socketService.emit(SocketEvents.DRAW_STROKE, {
                        commands: this.batchedCommands,
                    });
                    this.batchedCommands = [];
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
