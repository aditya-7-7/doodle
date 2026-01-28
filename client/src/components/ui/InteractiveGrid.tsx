"use client";
import React, { useState, useEffect, CSSProperties } from "react";
import { motion } from "motion/react";

// typed style constants
const fadeGradient: CSSProperties = { background: "radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(255,255,255,0.5) 80%, white 95%)" };
const gridStyle = (cols: number, rows: number, cellSize: number): CSSProperties => ({
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, ${cellSize}px)`,
    gridTemplateRows: `repeat(${rows}, ${cellSize}px)`,
});

const CELL_SIZE = 25;
const COLORS = ["#93c5fd", "#f9a8d4", "#86efac", "#fde047", "#fca5a5", "#d8b4fe", "#a5b4fc", "#c4b5fd"];
const randomColor = () => COLORS[Math.floor(Math.random() * COLORS.length)];

// grid cell with hover animation
const Cell = React.memo(() => {
    const [hovered, setHovered] = useState(false);
    const [color, setColor] = useState("");

    return (
        <motion.div
            className="border-r border-b border-slate-200/60"
            onMouseEnter={() => { setHovered(true); setColor(randomColor()); }}
            onMouseLeave={() => setHovered(false)}
            animate={{ backgroundColor: hovered ? color : "rgba(227,229,227,0)" }}
            transition={{ duration: hovered ? 0 : 0.2, ease: "easeOut" }}
        />
    );
});
Cell.displayName = "Cell";

// main grid component
export const Boxes = React.memo(({ className }: { className?: string }) => {
    const [grid, setGrid] = useState({ cols: 0, rows: 0 });

    useEffect(() => {
        const resize = () => setGrid({
            cols: Math.ceil(window.innerWidth / CELL_SIZE) + 1,
            rows: Math.ceil(window.innerHeight / CELL_SIZE) + 1,
        });
        resize();
        window.addEventListener("resize", resize);
        return () => window.removeEventListener("resize", resize);
    }, []);

    if (!grid.cols) return null;

    return (
        <div className={`fixed inset-0 z-[5] ${className || ''}`}>
            {/* Grid container */}
            <div
                className="absolute inset-0 w-full h-full"
                style={gridStyle(grid.cols, grid.rows, CELL_SIZE)}
            >
                {Array.from({ length: grid.cols * grid.rows }, (_, i) => <Cell key={i} />)}
            </div>

            {/* Fade mask - ON TOP of grid to fade edges/corners */}
            <div
                className="absolute inset-0 pointer-events-none z-10"
                style={fadeGradient}
            />
        </div>
    );
});
Boxes.displayName = "Boxes";
