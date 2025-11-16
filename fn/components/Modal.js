const modalContainer = document.getElementById('modal-container');

function createMemphisPattern() {
    const colors = ['#FFCC00', '#FF2D55', '#0055FF', '#34C759'];
    const patterns = [
        // Squiggle
        `<path d="M10 80 Q 20 10, 30 80 T 50 80" stroke="${colors[0]}" fill="none" stroke-width="4"/>`,
        // Circle
        `<circle cx="80" cy="20" r="10" fill="${colors[1]}"/>`,
        // Triangle
        `<polygon points="50,50 70,70 30,70" fill="${colors[2]}"/>`,
        // Cross
        `<path d="M15 15 L 25 25 M 25 15 L 15 25" stroke="${colors[3]}" stroke-width="4"/>`
    ];
    
    const svg = `
        <svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
            ${patterns[Math.floor(Math.random() * patterns.length)]}
            ${patterns[Math.floor(Math.random() * patterns.length)]}
        </svg>
    `;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}


export function showModal(title, contentHTML, onClose) {
    modalContainer.innerHTML = `
        <div id="modal-backdrop" class="fixed inset-0 bg-brand-yellow/80 z-40 flex items-center justify-center p-4 modal-enter" style="background-image: ${createMemphisPattern()}; background-size: 100px 100px;">
            <div id="modal-content" class="bg-bg-main rounded-none border-2 border-border-color neo-shadow p-6 md:p-8 w-full max-w-sm md:max-w-md max-h-[90vh] overflow-y-auto modal-content-enter">
                <div class="flex justify-between items-start mb-4">
                    <h2 class="text-2xl font-extrabold text-text-main">${title}</h2>
                    <button id="modal-close-btn" class="text-text-main text-4xl leading-none font-bold hover:text-brand-red">&times;</button>
                </div>
                <div>
                    ${contentHTML}
                </div>
            </div>
        </div>
    `;

    const closeModal = () => {
        hideModal();
        if (onClose) onClose();
    };

    document.getElementById('modal-backdrop').addEventListener('click', closeModal);
    document.getElementById('modal-content').addEventListener('click', (e) => e.stopPropagation());
    document.getElementById('modal-close-btn').addEventListener('click', closeModal);
}

export function hideModal() {
    modalContainer.innerHTML = '';
}