interface StyledSliderProps {
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
}

/**
 * Custom styled range slider with purple/indigo theme
 * Extracted for reuse across Toolbar popovers
 */
export function StyledSlider({ value, onChange, min, max }: StyledSliderProps) {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
        <div className="relative flex-1 h-6 flex items-center">
            {/* Track background */}
            <div className="absolute w-full h-1.5 rounded-sm bg-gray-200" />
            {/* Track fill */}
            <div
                className="absolute h-1.5 rounded-sm bg-gradient-to-r from-indigo-400 to-purple-500 transition-all duration-100"
                style={{ width: `${percentage}%` }}
            />
            {/* Input */}
            <input
                type="range"
                min={min}
                max={max}
                value={value}
                onChange={(e) => onChange(Number(e.target.value))}
                className="styled-slider relative w-full h-6 bg-transparent cursor-pointer z-10 appearance-none"
            />
            <style>{`
                .styled-slider::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    width: 18px; height: 18px; border-radius: 50%;
                    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
                    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
                    cursor: pointer; border: 2px solid white;
                    transition: transform 0.15s ease, box-shadow 0.15s ease;
                }
                .styled-slider::-webkit-slider-thumb:hover { transform: scale(1.15); box-shadow: 0 3px 10px rgba(99, 102, 241, 0.5); }
                .styled-slider::-webkit-slider-thumb:active { transform: scale(1.1); }
                .styled-slider::-moz-range-thumb {
                    width: 18px; height: 18px; border-radius: 50%;
                    background: linear-gradient(135deg, #818cf8 0%, #6366f1 100%);
                    box-shadow: 0 2px 6px rgba(99, 102, 241, 0.4);
                    cursor: pointer; border: 2px solid white;
                }
                .styled-slider::-moz-range-thumb:hover { transform: scale(1.15); }
                .styled-slider::-moz-range-track { background: transparent; }
            `}</style>
        </div>
    );
}
