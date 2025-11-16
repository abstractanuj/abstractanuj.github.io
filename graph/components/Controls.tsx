
import React from 'react';
import { Slider, GameState } from '../types';
import { ALLOWED_FUNCTIONS } from '../constants';

interface ControlsProps {
    sliders: Slider[];
    setSliders: (sliders: Slider[]) => void;
    handleNewGame: () => void;
    handleCheckAnswer: () => void;
    handleRevealAnswer: () => void;
    gameState: GameState;
    handleZoom: (factor: number) => void;
    handlePan: (offset: number) => void;
    handleResetView: () => void;
    isOpen: boolean;
    onClose: () => void;
}

const Controls: React.FC<ControlsProps> = ({
    sliders,
    setSliders,
    handleNewGame,
    handleCheckAnswer,
    handleRevealAnswer,
    gameState,
    handleZoom,
    handlePan,
    handleResetView,
    isOpen,
    onClose
}) => {
    
    const handleSliderChange = (name: string, value: string) => {
        const newSliders = sliders.map(s => s.name === name ? { ...s, value: parseFloat(value) } : s);
        setSliders(newSliders);
    };

    return (
        <aside className={`fixed top-0 left-0 z-40 w-80 lg:w-96 h-full bg-[#E9F0EA] p-4 overflow-y-auto transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-[#264028] tracking-tight">Controls</h2>
                <button onClick={onClose} aria-label="Close controls" className="p-2 rounded-md hover:bg-[#C5D1C6]">
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
            </div>
            
            <div className="space-y-6">
                <button
                    onClick={handleNewGame}
                    className="w-full bg-[#627C9D] hover:bg-[#526681] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 text-lg"
                >
                    New Game
                </button>
                
                <div className="flex justify-center space-x-2 border-t border-b border-[#C5D1C6] py-4">
                    <button onClick={() => handlePan(-0.2)} aria-label="Pan Left" className="bg-[#C5D1C6] hover:bg-[#B5C1B6] text-[#264028] p-2 rounded-md transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <button onClick={() => handleZoom(0.8)} className="bg-[#C5D1C6] hover:bg-[#B5C1B6] text-[#264028] px-3 py-2 rounded-md transition-colors text-sm">Zoom In</button>
                    <button onClick={() => handleResetView()} className="bg-[#C5D1C6] hover:bg-[#B5C1B6] text-[#264028] px-3 py-2 rounded-md transition-colors text-sm">Reset</button>
                    <button onClick={() => handleZoom(1.25)} className="bg-[#C5D1C6] hover:bg-[#B5C1B6] text-[#264028] px-3 py-2 rounded-md transition-colors text-sm">Zoom Out</button>
                    <button onClick={() => handlePan(0.2)} aria-label="Pan Right" className="bg-[#C5D1C6] hover:bg-[#B5C1B6] text-[#264028] p-2 rounded-md transition-colors">
                       <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                        </svg>
                    </button>
                </div>
                
                {sliders.length > 0 && (
                    <div>
                         <h3 className="text-xl font-bold text-[#264028] border-b border-[#C5D1C6] pb-2 mb-3">Parameters</h3>
                         <div className="space-y-3">
                            {sliders.map(slider => (
                                <div key={slider.name}>
                                    <label htmlFor={`slider-${slider.name}`} className="flex justify-between text-sm font-medium text-[#264028]">
                                        <span>{slider.name}</span>
                                        <span>{slider.value.toFixed(2)}</span>
                                    </label>
                                    <input
                                        type="range"
                                        id={`slider-${slider.name}`}
                                        min={slider.min}
                                        max={slider.max}
                                        step={slider.step}
                                        value={slider.value}
                                        onChange={(e) => handleSliderChange(slider.name, e.target.value)}
                                        className="w-full h-2 bg-[#C5D1C6] rounded-lg appearance-none cursor-pointer slider-thumb"
                                        style={{'--thumb-color': '#9D6299'} as React.CSSProperties}
                                    />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 pt-2">
                    <button
                        onClick={handleCheckAnswer}
                        disabled={gameState !== GameState.Playing}
                        className="w-full bg-[#627C9D] hover:bg-[#526681] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
                    >
                        Check Answer
                    </button>
                    <button
                        onClick={handleRevealAnswer}
                        disabled={gameState !== GameState.Playing}
                        className="w-full bg-[#9D8362] hover:bg-[#816c52] disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
                    >
                        Reveal Answer
                    </button>
                </div>

                <div className="pt-4 border-t border-[#C5D1C6]">
                     <h3 className="text-xl font-bold text-[#264028] mb-3">How to Play</h3>
                    <ul className="list-disc list-inside text-sm text-[#264028] space-y-2">
                        <li>The dark dashed line is the secret function.</li>
                        <li>Type a function to plot the orange line.</li>
                        <li>Use variables (e.g., 'a', 'b') to create sliders.</li>
                        <li>Match the orange line to the dark line and click "Check Answer".</li>
                    </ul>
                    <h4 className="text-lg font-semibold text-[#264028] mt-4 mb-2">Operators</h4>
                    <p><code className="text-sm bg-[#F0F4F0] p-1 rounded">+ - * / ^</code></p>
                    <h4 className="text-lg font-semibold text-[#264028] mt-4 mb-2">Functions & Constants</h4>
                    <p className="text-sm text-gray-600 font-mono break-words">
                        {ALLOWED_FUNCTIONS.join(', ')}
                    </p>
                </div>
            </div>
            <style>{`
                .slider-thumb::-webkit-slider-thumb {
                    -webkit-appearance: none;
                    appearance: none;
                    width: 16px;
                    height: 16px;
                    background: var(--thumb-color);
                    cursor: pointer;
                    border-radius: 50%;
                }
                .slider-thumb::-moz-range-thumb {
                    width: 16px;
                    height: 16px;
                    background: var(--thumb-color);
                    cursor: pointer;
                    border-radius: 50%;
                }
            `}</style>
        </aside>
    );
};

export default Controls;
