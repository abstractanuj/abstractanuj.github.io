const container = document.getElementById('about-panel-container');

export function renderAboutPanel(props) {
    const { show, onClose } = props;

    if (!show) {
        container.innerHTML = '';
        return;
    }

    const content = `
        <p class="mb-4 text-base font-mono">This is f(Chaukhat),!</p>
        <p class="mb-4 text-sm font-mono">Thanks @webgoatguy</p>
        <ul class="list-disc list-inside space-y-2 mb-6 text-sm font-mono">
            <li>Your goal is to guess the <span class="font-bold text-brand-blue">secret blue function</span>.</li>
            <li>Type your guess in the input bar to plot it in <span class="font-bold text-brand-red">red</span>.</li>
            <li>Use the <b class="font-mono">S-f</b> mode to see the difference between the secret (S) and your function (f). Try to make the difference zero!</li>
            <li>Once your red line perfectly matches the blue one, hit 'Check'.</li>
        </ul>
    `;

    container.innerHTML = `
        <div class="absolute bottom-20 left-1/2 w-11/12 max-w-lg bg-bg-main border-2 border-border-color neo-shadow p-4 md:p-6 z-20 about-panel-enter">
            <div class="flex justify-between items-start mb-2">
                <h2 class="text-xl font-extrabold text-text-main font-sans">How to Play</h2>
                <button id="about-panel-close-btn" class="text-text-main text-3xl leading-none font-bold hover:text-brand-red">&times;</button>
            </div>
            <div>
                ${content}
            </div>
        </div>
    `;

    document.getElementById('about-panel-close-btn').addEventListener('click', onClose);
}
