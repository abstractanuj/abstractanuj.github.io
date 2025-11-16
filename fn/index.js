import * as Graph from './components/Graph.js';
import renderControls from './components/Controls.js';
import renderFunctionInput from './components/FunctionInput.js';
import { showModal } from './components/Modal.js';
import { renderAboutPanel } from './components/AboutPanel.js';
import { generateDailySecretFunction, extractVariables, areFunctionsEquivalent, getLocalHint } from './utils/mathHelper.js';

function updateTime() {
    const dateTimeEl = document.getElementById('date-time-info');
    if (dateTimeEl) {
        const now = new Date();
        const timeString = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = now.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
        dateTimeEl.textContent = `${dateString}, ${timeString}`;
    }
}

function fetchWeather() {
    const weatherEl = document.getElementById('weather-info');
    if (!weatherEl) return;

    fetch('https://ipapi.co/json/')
        .then(response => {
            if (!response.ok) throw new Error('Location fetch failed');
            return response.json();
        })
        .then(data => {
            const city = data.city;
            if (city) {
                return fetch(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
            }
            throw new Error('City not found from IP');
        })
        .then(response => {
            if (!response.ok) throw new Error('Weather fetch failed');
            return response.json();
        })
        .then(data => {
            const condition = data.current_condition[0];
            const weatherText = `${condition.weatherDesc[0].value}, ${condition.temp_C}°C`;
            weatherEl.textContent = weatherText;
        })
        .catch(error => {
            console.error('Error fetching weather:', error);
            weatherEl.textContent = 'Weather unavailable';
        });
}


let appState = {
    secretFunction: { expression: '', terms: [] },
    userFunction: '',
    isUserFunctionValid: true,
    variables: {},
    hints: [],
    hintStep: 0,
    isLoadingHint: false,
    gameState: 'playing', // 'playing', 'won_animating', 'won'
    plotMode: 'guess',
    showSecret: true,
    showResult: true,
    difficulty: 'medium',
    showAboutPanel: false,
};

// Make state accessible to D3 zoom handler for redraws
window.appState = appState;

function setState(newState) {
    const oldState = { ...appState };
    appState = { ...appState, ...newState };
    window.appState = appState; // Keep window object in sync
    render(oldState);
}

function render(oldState = {}) {
    Graph.update({
        ...appState,
        secretFunction: appState.secretFunction.expression // Pass only the string to Graph
    });
    renderControls({ ...appState, ...handlers });
    renderFunctionInput({
        value: appState.userFunction,
        isValid: appState.isUserFunctionValid,
        plotMode: appState.plotMode,
        onChange: handlers.onChange,
        onPlotModeChange: handlers.onPlotModeChange
    });
    renderAboutPanel({
        show: appState.showAboutPanel,
        onClose: handlers.onToggleAboutPanel,
    });
    
    if (oldState.gameState !== appState.gameState && appState.gameState === 'won') {
        renderWinModal();
    }
}

function renderWinModal() {
    const content = `
        <p class="mb-4 text-center text-lg font-mono">You've cracked it! Nicely done.</p>
        <p class="mb-6 text-center text-2xl font-bold font-mono bg-gray-100 p-3 border-2 border-border-color">${appState.secretFunction.expression}</p>
        <p class="mt-4 text-center text-sm font-mono">Come back tomorrow for a new puzzle! (Resets at 7 AM IST)</p>
        <p class="mt-6 text-center text-xs font-mono text-text-main/70">Idea inspired by @webgoatguy on YouTube.</p>
    `;
    showModal("Congratulations!", content);
}

function showToast(message) {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast bg-brand-yellow text-text-main font-mono font-bold py-2 px-4 border-2 border-border-color neo-shadow';
    toast.textContent = message;
    toastContainer.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('closing');
        toast.addEventListener('animationend', () => {
            toast.remove();
        });
    }, 2500);
}

const handlers = {
    onChange: (newFunc) => {
        const sanitizedFunc = newFunc.replace(/^(y|f\(x\))\s*=\s*/i, '');
        let isValid = true;
        let extractedVars = [];

        if (sanitizedFunc.trim()) {
            try {
                window.math.parse(sanitizedFunc).compile(); 
                extractedVars = extractVariables(sanitizedFunc);
            } catch (error) {
                console.error("Parsing error:", error);
                isValid = false;
            }
        }
        
        const newVariables = {};
        extractedVars.forEach(v => {
            newVariables[v] = appState.variables[v] || { value: 1, min: -10, max: 10 };
        });

        setState({ 
            userFunction: sanitizedFunc, 
            variables: isValid ? newVariables : {},
            isUserFunctionValid: isValid 
        });
    },
    onSliderChange: (name, value) => {
        const newVariables = { ...appState.variables, [name]: { ...appState.variables[name], value } };
        setState({ variables: newVariables });
    },
    onPlotModeChange: (mode) => {
        setState({ plotMode: mode });
    },
    onResetPuzzle: () => {
        setState({
            userFunction: '',
            variables: {},
            hints: [],
            hintStep: 0,
            gameState: 'playing', // In case they reset after winning
            plotMode: 'guess',
            showSecret: true,
            showResult: true,
        });
    },
    onRevealAnswer: () => {
        const secret = appState.secretFunction.expression;
        setState({ 
            plotMode: 'guess', 
            userFunction: secret,
            showSecret: true,
            showResult: true
        });
        handlers.onChange(secret); // This will parse variables if any
    },
    onGetHint: () => {
        const newHint = getLocalHint(appState.secretFunction, appState.hintStep);
        if (newHint) {
            setState({
                hints: [...appState.hints, newHint],
                hintStep: appState.hintStep + 1,
            });
        }
    },
    onCheckAnswer: () => {
        if (!appState.isUserFunctionValid) {
            showToast("Your function has a syntax error.");
            return;
        }
        if (appState.plotMode !== 'guess') {
            showToast("Switch to 'y =' mode to check your answer.");
            return;
        }
        const scope = Object.entries(appState.variables).reduce((acc, [name, variable]) => {
            acc[name] = variable.value;
            return acc;
        }, {});

        if (areFunctionsEquivalent(appState.userFunction, appState.secretFunction.expression, scope)) {
            setState({ gameState: 'won_animating' });
            setTimeout(() => {
                setState({ gameState: 'won' });
            }, 1000); 
        } else {
            const checkButton = document.getElementById('check-answer-btn');
            if (checkButton) {
                checkButton.classList.add('shake');
                setTimeout(() => checkButton.classList.remove('shake'), 600);
            }
        }
    },
    onToggleShowSecret: () => {
        setState({ showSecret: !appState.showSecret });
    },
    onToggleShowResult: () => {
        setState({ showResult: !appState.showResult });
    },
    onChangeDifficulty: (newDifficulty) => {
        startNewGame(newDifficulty);
    },
    onToggleAboutPanel: () => {
        setState({ showAboutPanel: !appState.showAboutPanel });
    },
    get isCheckDisabled() {
        return appState.plotMode !== 'guess' || !appState.isUserFunctionValid || appState.userFunction.trim() === '';
    }
};

function startNewGame(difficulty = appState.difficulty) {
    const newSecret = generateDailySecretFunction(difficulty);
    setState({
        secretFunction: newSecret,
        userFunction: '',
        variables: {},
        hints: [],
        hintStep: 0,
        gameState: 'playing',
        plotMode: 'guess',
        showSecret: true,
        showResult: true,
        difficulty: difficulty,
    });
}

function initializeApp() {
    Graph.init({
        ...appState,
        secretFunction: appState.secretFunction.expression
    });
    
    document.getElementById('about-btn').addEventListener('click', handlers.onToggleAboutPanel);

    if (!localStorage.getItem('chaukhat_visited')) {
        appState.showAboutPanel = true;
        localStorage.setItem('chaukhat_visited', 'true');
    }
    
    updateTime();
    fetchWeather();
    setInterval(updateTime, 30000); // Update every 30 seconds

    startNewGame(appState.difficulty); // Start the game immediately with the daily puzzle
}

document.addEventListener('DOMContentLoaded', initializeApp);