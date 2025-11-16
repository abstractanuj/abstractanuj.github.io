
import React from 'react';
import { GameState } from '../types';

interface GameEndModalProps {
    secretFunctionExpression: string;
    onNewGame: () => void;
}

const GameEndModal: React.FC<GameEndModalProps> = ({ secretFunctionExpression, onNewGame }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className={`relative w-full max-w-md p-6 rounded-lg shadow-2xl text-center transform transition-all bg-[#E9F0EA] border border-[#629D66]`}>
                <h2 className={`text-3xl font-bold text-[#264028]`}>Congratulations!</h2>
                <div className={`text-[#264028] mt-4`}>
                    <p className="text-lg">You found the secret function:</p>
                    <p className="font-mono text-xl bg-[#F0F4F0]/50 rounded-md p-2 my-2 inline-block">{secretFunctionExpression}</p>
                </div>
                <button
                    onClick={onNewGame}
                    className={`mt-6 w-full bg-[#629D66] hover:bg-[#528555] text-white font-bold py-3 px-4 rounded-md transition-colors duration-200 text-lg shadow-md hover:shadow-lg`}
                >
                    Play Again
                </button>
            </div>
        </div>
    );
};

export default GameEndModal;
