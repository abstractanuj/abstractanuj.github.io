
import React from 'react';

interface WelcomeModalProps {
    onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="relative w-full max-w-lg p-8 bg-[#E9F0EA] rounded-lg shadow-2xl transform transition-all animate-fade-in border-2 border-[#9D8362]">
                <button 
                    onClick={onClose} 
                    aria-label="Close welcome message"
                    className="absolute top-4 right-4 p-2 rounded-full text-[#264028] hover:bg-[#C5D1C6] transition-colors"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>
                <h1 className="text-3xl font-bold text-[#264028] text-center mb-4">Welcome to Chaukhat!</h1>
                <p className="text-center text-lg text-[#264028] mb-6">
                    Can you guess the secret mathematical function?
                </p>
                <div className="space-y-6 text-base text-[#264028]">
                    <div>
                        <h2 className="text-2xl font-bold text-[#264028] mb-2">Goal</h2>
                        <p>
                           Match your <span className="text-[#627C9D] font-semibold">blue line</span> to the secret <span className="text-[#264028] font-semibold">dashed line</span>.
                        </p>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-[#264028] mb-2">How to Play</h2>
                        <p>
                            Type a function in the input box at the bottom. You can use variables like 'a', 'b', and 'c' to create sliders and fine-tune your guess!
                        </p>
                    </div>
                </div>
                 <button
                    onClick={onClose}
                    className="mt-8 w-full bg-[#627C9D] hover:bg-[#526681] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 text-lg"
                >
                    Let's Go!
                </button>
            </div>
            <style>{`
                @keyframes fade-in {
                    from { opacity: 0; transform: scale(0.95); }
                    to { opacity: 1; transform: scale(1); }
                }
                .animate-fade-in {
                    animation: fade-in 0.3s ease-out forwards;
                }
            `}</style>
        </div>
    );
};

export default WelcomeModal;
