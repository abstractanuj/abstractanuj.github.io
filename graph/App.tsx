

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { generateSecretFunction } from './services/functionGenerator';
import { SecretFunction, Slider, GameState, Point } from './types';
import { ALLOWED_FUNCTIONS, DEFAULT_X_DOMAIN, NUM_POINTS, CHECK_PRECISION } from './constants';
import Controls from './components/Controls';
import Graph from './components/Graph';
import WelcomeModal from './components/WelcomeModal';
import GameEndModal from './components/GameEndModal';

// Math.js is loaded from CDN
declare const math: any;

const MIN_X_DOMAIN_RANGE = 0.1;
const MAX_X_DOMAIN_RANGE = 1000;

const preprocessExpression = (expr: string): string => {
    if (!expr) return '';
    // 1. 2x -> 2*x, 2( -> 2*(
    let processed = expr.replace(/(\d+(?:\.\d+)?)(\s*)([a-zA-Z(])/g, '$1 * $3');
    // 2. )x -> )*x, )2 -> )*2, )( -> )*(
    processed = processed.replace(/(\))(\s*)([a-zA-Z\d(])/g, '$1 * $3');
    // 3. x( -> x*(, sin(x)cos(x) -> sin(x)*cos(x) (via rule 2)
    processed = processed.replace(/([a-zA-Z])(\s*)(\()/g, '$1 * $3');
    return processed;
};

const App: React.FC = () => {
    const [secretFunction, setSecretFunction] = useState<SecretFunction | null>(null);
    const [userGuess, setUserGuess] = useState<string>('x');
    const [sliders, setSliders] = useState<Slider[]>([]);
    const [gameState, setGameState] = useState<GameState>(GameState.Playing);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [xDomain, setXDomain] = useState<[number, number]>(DEFAULT_X_DOMAIN);
    const [isPanelOpen, setIsPanelOpen] = useState<boolean>(true);
    const [showWelcome, setShowWelcome] = useState<boolean>(true);

    const handleNewGame = useCallback(() => {
        const newFunc = generateSecretFunction();
        setSecretFunction(newFunc);
        setUserGuess('x');
        setSliders([]);
        setGameState(GameState.Playing);
        setErrorMessage('');
        setXDomain(DEFAULT_X_DOMAIN);
        setIsPanelOpen(true);
    }, []);

    useEffect(() => {
        handleNewGame();
    }, [handleNewGame]);

    const processedUserGuess = useMemo(() => preprocessExpression(userGuess), [userGuess]);

    useEffect(() => {
        if (!processedUserGuess) {
            if (sliders.length > 0) setSliders([]);
            return;
        }
        try {
            const node = math.parse(processedUserGuess);
            const symbols = node.filter((n: any) => n.isSymbolNode && !ALLOWED_FUNCTIONS.includes(n.name) && n.name !== 'x').map((n: any) => n.name);
            const uniqueSymbols = [...new Set(symbols)];

            setSliders(prevSliders => {
                const currentSymbolNames = new Set(uniqueSymbols);
                const prevSliderNames = new Set(prevSliders.map(s => s.name));

                if (currentSymbolNames.size === prevSliderNames.size && [...currentSymbolNames].every(name => prevSliderNames.has(name))) {
                    return prevSliders;
                }

                return uniqueSymbols.map((name: string) => {
                    const existing = prevSliders.find(s => s.name === name);
                    return existing || { name, value: 1, min: -10, max: 10, step: 0.1 };
                });
            });
        } catch (e) {
            // Ignore parsing errors while typing
        }
    }, [processedUserGuess, sliders.length]);


    const compiledUserFunction = useMemo(() => {
        if (!processedUserGuess) return null;
        try {
            const node = math.parse(processedUserGuess);
            const compiled = node.compile();
            if (errorMessage && !errorMessage.startsWith('Not quite!')) {
                setErrorMessage('');
            }
            return compiled;
        } catch (e) {
            // FIX: The caught error `e` is of type `unknown`. Handle it by converting to a string.
            if (e instanceof Error) {
                setErrorMessage(e.message);
            } else {
                setErrorMessage(String(e));
            }
            return null;
        }
    }, [processedUserGuess, errorMessage]);

    const { graphData, yDomain } = useMemo<{ graphData: Point[], yDomain: [number | 'auto', number | 'auto'] }>(() => {
        if (!secretFunction) return { graphData: [], yDomain: ['auto', 'auto'] };

        const points: Point[] = [];
        const step = (xDomain[1] - xDomain[0]) / NUM_POINTS;

        const scope: { [key: string]: number } = {};
        sliders.forEach(s => { scope[s.name] = s.value; });

        for (let i = 0; i <= NUM_POINTS; i++) {
            const x = xDomain[0] + i * step;
            scope.x = x;
            
            let secretY: number | null = null;
            try {
                secretY = secretFunction.evaluate(x);
                if (!isFinite(secretY)) secretY = null;
            } catch (e) {
                secretY = null;
            }

            let userY: number | null = null;
            if (compiledUserFunction) {
                try {
                    userY = compiledUserFunction.evaluate(scope);
                    if (!isFinite(userY)) userY = null;
                } catch (e) {
                    userY = null;
                }
            }
            points.push({ x, secretY, userY });
        }

        const visibleSecretY = points.map(p => p.secretY).filter(y => y !== null && isFinite(y)) as number[];
        let calculatedYDomain: [number | 'auto', number | 'auto'] = ['auto', 'auto'];

        if (visibleSecretY.length >= 2) {
            let minY = Math.min(...visibleSecretY);
            let maxY = Math.max(...visibleSecretY);

            if (minY === maxY) {
                minY -= 1;
                maxY += 1;
            }
            const range = maxY - minY;
            const padding = range === 0 ? 1 : range * 0.15;
            calculatedYDomain = [minY - padding, maxY + padding];
        }
        
        const [min, max] = calculatedYDomain;
        if (typeof min !== 'number' || typeof max !== 'number') {
            return { graphData: points, yDomain: calculatedYDomain };
        }

        const yRange = max - min;
        const asymptoteThreshold = yRange > 0 ? yRange * 3 : 1000;

        const processedPoints = points.map((currentPoint, i) => {
            if (i === 0) return currentPoint;
        
            const prevPoint = points[i - 1];
            const newPoint = { ...currentPoint };
        
            // Check for asymptote in secret function
            if (
                prevPoint.secretY !== null &&
                newPoint.secretY !== null &&
                Math.abs(newPoint.secretY - prevPoint.secretY) > asymptoteThreshold &&
                Math.sign(newPoint.secretY) !== Math.sign(prevPoint.secretY)
            ) {
                newPoint.secretY = null;
            }
        
            // Check for asymptote in user function
            if (
                prevPoint.userY !== null &&
                newPoint.userY !== null &&
                Math.abs(newPoint.userY - prevPoint.userY) > asymptoteThreshold &&
                Math.sign(newPoint.userY) !== Math.sign(prevPoint.userY)
            ) {
                newPoint.userY = null;
            }
        
            return newPoint;
        });

        return { graphData: processedPoints, yDomain: calculatedYDomain };
    }, [secretFunction, compiledUserFunction, sliders, xDomain]);

    const handleCheckAnswer = () => {
        if (!secretFunction || !compiledUserFunction) return;

        const scope: { [key: string]: number } = {};
        sliders.forEach(s => { scope[s.name] = s.value; });

        let totalError = 0;
        const checkPoints = 1000;
        const checkDomain: [number, number] = [-25, 25];
        const step = (checkDomain[1] - checkDomain[0]) / checkPoints;

        for (let i = 0; i <= checkPoints; i++) {
            const x = checkDomain[0] + i * step;
            scope.x = x;

            try {
                const secretY = secretFunction.evaluate(x);
                const userY = compiledUserFunction.evaluate(scope);

                if (!isFinite(secretY) && !isFinite(userY)) continue;
                if (!isFinite(secretY) || !isFinite(userY)) {
                    totalError = Infinity;
                    break;
                }

                const diff = secretY - userY;
                totalError += diff * diff;
            } catch (e) {
                totalError = Infinity;
                break;
            }
        }

        const rmse = Math.sqrt(totalError / checkPoints);
        if (rmse < CHECK_PRECISION) {
            setGameState(GameState.Won);
        } else {
            setErrorMessage(`Not quite! Try to get a closer match. (Error: ${rmse.toFixed(4)})`);
        }
    };

    const handleRevealAnswer = () => {
        setGameState(GameState.Revealed);
    };
    
    const handleZoom = useCallback((factor: number) => {
        const range = xDomain[1] - xDomain[0];
        const mid = (xDomain[0] + xDomain[1]) / 2;
        const newRange = range * factor;

        if (newRange < MIN_X_DOMAIN_RANGE || newRange > MAX_X_DOMAIN_RANGE) {
            return;
        }

        setXDomain([mid - newRange / 2, mid + newRange / 2]);
    }, [xDomain]);
    
    const handlePan = useCallback((offset: number) => {
        setXDomain([xDomain[0] + offset, xDomain[1] + offset]);
    }, [xDomain]);
    
    const handleResetView = useCallback(() => {
        setXDomain(DEFAULT_X_DOMAIN);
    }, []);

    const handleUserGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setUserGuess(e.target.value);
        if (errorMessage) {
            setErrorMessage('');
        }
    };

    if (!secretFunction) {
        return <div className="flex items-center justify-center h-screen bg-[#F0F4F0]">Loading...</div>;
    }

    return (
        <div className="relative min-h-screen bg-[#F0F4F0] text-[#264028] overflow-hidden">
             {showWelcome && <WelcomeModal onClose={() => setShowWelcome(false)} />}
             {gameState === GameState.Won && (
                <GameEndModal 
                    secretFunctionExpression={secretFunction.expression} 
                    onNewGame={handleNewGame} 
                />
             )}
             <Controls 
                sliders={sliders}
                setSliders={setSliders}
                handleNewGame={handleNewGame}
                handleCheckAnswer={handleCheckAnswer}
                handleRevealAnswer={handleRevealAnswer}
                gameState={gameState}
                handleZoom={handleZoom}
                handlePan={(offsetFactor) => handlePan((xDomain[1] - xDomain[0]) * offsetFactor)}
                handleResetView={handleResetView}
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
            />
            
            {!isPanelOpen && (
                <button
                    onClick={() => setIsPanelOpen(true)}
                    aria-label="Open controls"
                    className="absolute top-4 left-4 z-30 p-2 rounded-md bg-[#E9F0EA]/50 hover:bg-[#E9F0EA] transition-all"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="4" y1="21" x2="4" y2="14"></line>
                        <line x1="4" y1="10" x2="4" y2="3"></line>
                        <line x1="12" y1="21" x2="12" y2="12"></line>
                        <line x1="12" y1="8" x2="12" y2="3"></line>
                        <line x1="20" y1="21" x2="20" y2="16"></line>
                        <line x1="20" y1="12" x2="20" y2="3"></line>
                        <line x1="1" y1="14" x2="7" y2="14"></line>
                        <line x1="9" y1="8" x2="15" y2="8"></line>
                        <line x1="17" y1="16" x2="23" y2="16"></line>
                    </svg>
                </button>
            )}

            <main className={`transition-transform duration-300 ease-in-out ${isPanelOpen ? 'md:translate-x-80 lg:translate-x-96' : 'translate-x-0'}`}>
                <div className="flex flex-col h-screen p-4 md:p-8 pt-16 md:pt-8">
                    <h1 className="text-center text-4xl md:text-5xl font-bold text-[#264028] mb-4 tracking-wide">Chaukhat</h1>
                    <Graph 
                        data={graphData}
                        xDomain={xDomain}
                        yDomain={yDomain}
                        handlePan={handlePan}
                        handleZoom={handleZoom}
                    />
                    <div className="w-full max-w-2xl mx-auto mt-4">
                        {gameState === GameState.Revealed && (
                            <div className="text-center p-3 mb-4 bg-[#fdfaf5] border-2 border-[#9D8362] rounded-lg shadow-sm">
                                <p className="text-base text-[#264028]">
                                    The secret function was: <code className="font-semibold">{secretFunction.expression}</code>
                                </p>
                                <p className="text-sm text-gray-600">
                                    Try typing it in the box below to see how it matches!
                                </p>
                            </div>
                        )}
                        <div className="flex items-center gap-2">
                             <label htmlFor="function-input" className="text-2xl font-bold">
                                y =
                            </label>
                            <input
                                type="text"
                                id="function-input"
                                value={userGuess}
                                onChange={handleUserGuessChange}
                                className={`flex-grow bg-transparent border-b-2 ${errorMessage ? 'border-red-500' : 'border-[#9D8362]'} p-2 text-xl focus:ring-0 focus:border-[#627C9D] focus:outline-none transition-colors`}
                                placeholder="e.g., a * x^2 + b * sin(x)"
                            />
                        </div>
                         {errorMessage && <p className="text-red-500 text-sm mt-2 text-center">{errorMessage}</p>}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default App;