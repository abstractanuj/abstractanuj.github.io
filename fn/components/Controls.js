const container = document.getElementById('controls-container');
let state = { isOpen: false }; // Panel-specific state, start closed

function render(props) {
    const {
        variables, hints, isLoadingHint, isCheckDisabled, showSecret, showResult, difficulty,
        onSliderChange, onResetPuzzle, onRevealAnswer, onGetHint, onCheckAnswer,
        onToggleShowSecret, onToggleShowResult, onChangeDifficulty
    } = props;

    const variablesHTML = Object.entries(variables).map(([name, variable]) => `
        <div key="${name}">
            <label for="${name}" class="flex justify-between items-center text-text-main font-mono mb-2">
                <span>${name}</span>
                <span class="bg-white px-2 py-0.5 border-2 border-border-color">${variable.value.toFixed(2)}</span>
            </label>
            <input
                data-name="${name}"
                type="range"
                min="${variable.min}"
                max="${variable.max}"
                step="0.01"
                value="${variable.value}"
                class="w-full h-3 rounded-none appearance-none cursor-pointer styled-slider slider-input"
            />
        </div>
    `).join('');
    
    const difficultyLevels = ['easy', 'medium', 'hard'];
    const difficultyHTML = difficultyLevels.map(level => `
        <label class="flex items-center space-x-2 cursor-pointer capitalize font-mono">
            <input type="radio" name="difficulty" value="${level}" class="accent-brand-blue" ${difficulty === level ? 'checked' : ''}>
            <span>${level}</span>
        </label>
    `).join('');

    const openIcon = `<path stroke-linecap="round" stroke-linejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />`;
    const closeIcon = `<path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" />`;

    const hintListHTML = hints.map(hint => `<li class="text-sm animate-fade-in-down">${hint}</li>`).join('');

    container.innerHTML = `
        <button id="toggle-controls-btn" class="fixed top-4 right-4 md:top-6 md:right-6 z-30 bg-brand-yellow p-2 border-2 border-border-color neo-shadow neo-button text-text-main" aria-label="${state.isOpen ? 'Close controls' : 'Open controls'}">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="2.5" stroke="currentColor" class="w-6 h-6">
                ${state.isOpen ? closeIcon : openIcon}
            </svg>
        </button>
        <div class="fixed top-0 right-0 h-dvh bg-bg-main border-l-2 border-border-color z-20 w-full max-w-sm md:w-80 transform transition-transform duration-300 ease-in-out ${state.isOpen ? 'translate-x-0' : 'translate-x-full'}">
            <div class="p-4 pt-20 md:p-6 md:pt-24 overflow-y-auto h-full flex flex-col space-y-8 font-mono">
                <div class="space-y-4">
                    <h2 class="font-sans text-xl font-extrabold text-text-main">Actions</h2>
                    <button id="reset-puzzle-btn" class="w-full text-white font-bold py-2 px-4 border-2 border-border-color neo-shadow neo-button bg-brand-blue">Reset Puzzle</button>
                    <button id="reveal-answer-btn" class="w-full text-text-main font-bold py-2 px-4 border-2 border-border-color neo-shadow neo-button bg-brand-yellow">Reveal</button>
                    <button id="get-hint-btn" class="w-full text-text-main font-bold py-2 px-4 border-2 border-border-color neo-shadow neo-button bg-brand-yellow">Hint</button>
                    <button id="check-answer-btn" class="w-full text-white font-bold py-2 px-4 border-2 border-border-color neo-shadow neo-button bg-brand-green ${isCheckDisabled ? 'opacity-50 cursor-not-allowed' : ''}" ${isCheckDisabled ? 'disabled' : ''}>Check</button>
                </div>

                <div class="border-t-2 border-border-color pt-6 space-y-4">
                    <h2 class="font-sans text-xl font-extrabold text-text-main">Difficulty</h2>
                    <div class="flex justify-around items-center text-text-main">
                        ${difficultyHTML}
                    </div>
                </div>
                
                <div class="border-t-2 border-border-color pt-6 space-y-4">
                     <h2 class="font-sans text-xl font-extrabold text-text-main">Display</h2>
                     <div class="space-y-4">
                        <label id="toggle-secret-label" class="flex items-center justify-between cursor-pointer">
                            <span class="font-bold">Secret Func</span>
                            <div class="relative w-12 h-6 border-2 border-border-color flex items-center p-0.5 ${showSecret ? 'bg-brand-blue justify-end' : 'bg-white justify-start'}">
                                <div class="w-4 h-4 ${showSecret ? 'bg-white' : 'bg-border-color'}"></div>
                            </div>
                        </label>
                        <label id="toggle-result-label" class="flex items-center justify-between cursor-pointer">
                            <span class="font-bold">Result Func</span>
                            <div class="relative w-12 h-6 border-2 border-border-color flex items-center p-0.5 ${showResult ? 'bg-brand-red justify-end' : 'bg-white justify-start'}">
                                <div class="w-4 h-4 ${showResult ? 'bg-white' : 'bg-border-color'}"></div>
                            </div>
                        </label>
                     </div>
                </div>

                ${hints.length > 0 || isLoadingHint ? `
                <div class="border-t-2 border-border-color pt-6">
                    <div class="p-3 bg-white border-2 border-border-color">
                        <h3 class="font-sans text-md font-extrabold text-brand-blue mb-2">Hints</h3>
                        <ul class="space-y-3 list-disc list-inside">
                            ${hintListHTML}
                        </ul>
                        ${isLoadingHint ? `<p class="text-center text-text-light mt-2">...</p>` : ''}
                    </div>
                </div>` : ''}
                
                ${Object.keys(variables).length > 0 ? `
                    <div class="border-t-2 border-border-color pt-6">
                         <h2 class="font-sans text-xl font-extrabold text-text-main mb-4">Parameters</h2>
                         <div class="space-y-6">
                            ${variablesHTML}
                         </div>
                    </div>` : ''}
            </div>
        </div>
    `;

    // Add event listeners
    document.getElementById('toggle-controls-btn').addEventListener('click', () => {
        state.isOpen = !state.isOpen;
        render(props); // Re-render to reflect open/close state
    });

    document.getElementById('reset-puzzle-btn').addEventListener('click', onResetPuzzle);
    document.getElementById('reveal-answer-btn').addEventListener('click', onRevealAnswer);
    document.getElementById('get-hint-btn').addEventListener('click', onGetHint);
    document.getElementById('check-answer-btn').addEventListener('click', onCheckAnswer);
    document.getElementById('toggle-secret-label').addEventListener('click', onToggleShowSecret);
    document.getElementById('toggle-result-label').addEventListener('click', onToggleShowResult);
    
    document.querySelectorAll('.slider-input').forEach(slider => {
        slider.addEventListener('input', (e) => onSliderChange(e.target.dataset.name, parseFloat(e.target.value)));
    });
    
    document.querySelectorAll('input[name="difficulty"]').forEach(radio => {
        radio.addEventListener('change', (e) => onChangeDifficulty(e.target.value));
    });
}

export default render;