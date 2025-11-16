const modeLabels = {
    'guess': { label: 'y =', title: 'Plot your guess directly.' },
    'subtract': { label: 'S-f', title: 'Plot the difference: Secret - Guess' },
    'add': { label: 'S+f', title: 'Plot the sum: Secret + Guess' },
    'multiply': { label: 'S*f', title: 'Plot the product: Secret * Guess' },
    'divide': { label: 'S/f', title: 'Plot the quotient: Secret / Guess' },
};

const container = document.getElementById('function-input-container');

// Helper to auto-resize textarea
function autoGrow(element) {
    element.style.height = 'auto'; // Reset height
    // Set height to scroll height, but with a max
    const newHeight = Math.min(element.scrollHeight, 120); // Max height of ~3-4 lines
    element.style.height = `${newHeight}px`;
}


function render(props) {
    const { value, isValid, plotMode, onChange, onPlotModeChange } = props;

    const inputId = 'function-input';
    const activeElement = document.activeElement;
    const isInputFocused = activeElement && activeElement.id === inputId;
    let selectionStart, selectionEnd;

    if (isInputFocused) {
        selectionStart = activeElement.selectionStart;
        selectionEnd = activeElement.selectionEnd;
    }

    const modeButtonsHTML = (Object.keys(modeLabels)).map(mode => {
        const isActive = plotMode === mode;
        return `
            <button
                data-mode="${mode}"
                title="${modeLabels[mode].title}"
                class="mode-select-btn px-2 py-1 md:px-3 md:py-1.5 text-xs md:text-sm font-bold font-mono border-2 border-border-color neo-button neo-shadow ${isActive ? 'bg-brand-blue text-white' : 'bg-white text-text-main'}"
            >
                ${modeLabels[mode].label}
            </button>
        `
    }).join('');
    
    const invalidClass = isValid ? '' : 'input-invalid';

    container.innerHTML = `
        <div class="flex items-start space-x-2 bg-white border-2 border-border-color p-2 w-full max-w-2xl relative neo-shadow ${invalidClass} transition-all duration-200">
            <div class="flex items-center shrink-0 space-x-1 md:space-x-2">
                ${modeButtonsHTML}
            </div>
            <div class="w-0.5 self-stretch bg-border-color"></div>
            <textarea
                id="${inputId}"
                rows="1"
                placeholder="Type your function here..."
                autocomplete="off"
                spellcheck="false"
                class="w-full p-1 md:p-2 bg-transparent focus:outline-none font-mono text-base md:text-lg tracking-wider text-text-main placeholder-text-main/50 resize-none overflow-y-auto"
            >${value}</textarea>
        </div>
    `;

    const textareaElement = document.getElementById(inputId);

    // Trigger auto-grow on initial render
    autoGrow(textareaElement);

    textareaElement.addEventListener('input', (e) => {
        onChange(e.target.value);
        autoGrow(e.target);
    });
    
    // Restore focus and cursor position
    if (isInputFocused) {
        textareaElement.focus();
        textareaElement.setSelectionRange(selectionStart, selectionEnd);
    }

    document.querySelectorAll('.mode-select-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            onPlotModeChange(btn.dataset.mode);
        });
    });
}

export default render;