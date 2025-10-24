
document.addEventListener('DOMContentLoaded', () => {

    const isMobile = window.matchMedia('(max-width: 768px)').matches;
    const hasFinePointer = window.matchMedia('(pointer: fine)').matches;

    // --- Hero Greeting Cycler ---
    const greetings = ["Hello, I'm", "नमस्कार, मैं हूँ", "வணக்கம், நான்", "नमस्ते, मैं हूँ", "Hola, soy", "こんにちは、私は"];
    const heroGreetingEl = document.getElementById('hero-greeting');
    if (heroGreetingEl) {
        let greetingIndex = 0;
        const cycleGreeting = () => {
            heroGreetingEl.classList.remove('visible');
            setTimeout(() => {
                greetingIndex = (greetingIndex + 1) % greetings.length;
                heroGreetingEl.textContent = greetings[greetingIndex];
                heroGreetingEl.classList.add('visible');
            }, 400); // Wait for fade out
        };
        
        // Initial greeting
        heroGreetingEl.textContent = greetings[greetingIndex];
        // Use a small timeout to ensure the transition is applied on load
        setTimeout(() => heroGreetingEl.classList.add('visible'), 100); 

        setInterval(cycleGreeting, 2000); // Change every 2 seconds
    }

    // --- Custom Cursor ---
    if (hasFinePointer) {
        document.body.classList.add('cursor-active');
        const cursorDot = document.querySelector('.cursor-dot');
        const cursorOutline = document.querySelector('.cursor-outline');
        const interactiveElements = document.querySelectorAll('a, button, .portfolio-item-new');

        let mouse = { x: -100, y: -100 };
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        const moveCursor = () => {
            const posX = mouse.x;
            const posY = mouse.y;

            cursorDot.style.left = `${posX}px`;
            cursorDot.style.top = `${posY}px`;

            cursorOutline.animate({
                left: `${posX}px`,
                top: `${posY}px`
            }, { duration: 500, fill: 'forwards' });

            requestAnimationFrame(moveCursor);
        };
        moveCursor();

        interactiveElements.forEach(el => {
            el.addEventListener('mouseenter', () => {
                cursorOutline.classList.add('hover');
            });
            el.addEventListener('mouseleave', () => {
                cursorOutline.classList.remove('hover');
            });
        });
    }

    // --- Reveal on Scroll ---
    const revealElements = document.querySelectorAll('.reveal');
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                 // Optionally remove to re-trigger animation on scroll up
                 // entry.target.classList.remove('visible'); 
            }
        });
    }, {
        root: null,
        threshold: 0.1,
    });

    revealElements.forEach(el => {
        revealObserver.observe(el);
    });

    // --- Active Nav Link on Scroll (Scrollspy) ---
    const sections = document.querySelectorAll('.content-section, .site-footer');
    const heroNavLinks = document.querySelectorAll('.hero-nav .nav-link');
    
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      let lastActiveId = '';
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          lastActiveId = entry.target.getAttribute('id');
        }
      });

      heroNavLinks.forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        if (href === `#${lastActiveId}`) {
          link.classList.add('active');
        }
      });
    }, observerOptions);

    sections.forEach(section => {
      sectionObserver.observe(section);
    });
    
    // --- Smooth Scroll for Navigation ---
    heroNavLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- Inline Content Logic (Fetched Content for Other Projects) ---
    const inlineContentLinks = document.querySelectorAll('a[data-inline-content]');
    let activeFetchedContainer = null;

    const closeInlineContent = (container) => {
        if (container) {
            container.classList.remove('visible');
            container.removeAttribute('data-current-content');
            // Clear content after the transition for a cleaner close
            setTimeout(() => {
                container.innerHTML = '';
            }, 700);
        }
    };

    const openInlineContent = async (link) => {
        const contentUrl = link.dataset.inlineContent;
        const targetSelector = link.dataset.inlineTarget;
        const targetContainer = document.querySelector(targetSelector);

        if (!targetContainer) {
            console.error('Inline content target not found:', targetSelector);
            return;
        }

        // If another container is open, close it first.
        if (activeFetchedContainer && activeFetchedContainer !== targetContainer) {
            closeInlineContent(activeFetchedContainer);
        }
        
        // If clicking the link for the currently open content, close it.
        if (targetContainer.dataset.currentContent === contentUrl && targetContainer.classList.contains('visible')) {
            closeInlineContent(targetContainer);
            activeFetchedContainer = null;
            return;
        }

        // Show loading state and scroll to container
        targetContainer.innerHTML = '<p style="text-align: center; padding: 2rem 0;">Loading...</p>';
        targetContainer.classList.add('visible');
        setTimeout(() => {
             targetContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100); // Short delay to allow container to start expanding
        activeFetchedContainer = targetContainer;

        try {
            const response = await fetch(contentUrl);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            const htmlText = await response.text();
            
            const parser = new DOMParser();
            const doc = parser.parseFromString(htmlText, 'text/html');
            const mainContent = doc.querySelector('.main-content');
            
            if (mainContent) {
                targetContainer.innerHTML = mainContent.outerHTML;
                targetContainer.dataset.currentContent = contentUrl;
            } else {
                throw new Error('Could not find main content in fetched file.');
            }
        } catch (error) {
            targetContainer.innerHTML = `<p style="text-align: center; padding: 2rem 0;">Sorry, there was an error loading the project. Please try again later.</p>`;
            console.error('Inline Content Fetch Error:', error);
        }
    };

    inlineContentLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            openInlineContent(link);
        });
    });

    // --- Portfolio Modal Logic ---
    const portfolioItems = document.querySelectorAll('.portfolio-item-new');
    const modalOverlay = document.getElementById('portfolio-modal-overlay');
    const modalContent = document.getElementById('portfolio-modal-content');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalTitle = document.getElementById('modal-title');
    const modalDescription = document.getElementById('modal-description');
    const modalImageGrid = document.getElementById('modal-image-grid');
    let lastActiveElement;

    const portfolioProjects = {
        'dispenser-carton': {
            title: 'Trapezoidal Prism Tetra Pak for Juice',
            description: 'A compact and functional 200ml Juice Tetra Pak. Designed as part of IIP coursework for Design Thinking. It has a rather unqiue structure to grab attention on Shelf captalised with its premium look and pricing.',
            images: [
                { src: 'https://raw.githubusercontent.com/abstractanuj/abstractanuj.github.io/refs/heads/main/img/design/si.png', alt: 'Dieline with graphic' },
                { src: 'https://raw.githubusercontent.com/abstractanuj/abstractanuj.github.io/refs/heads/main/img/design/si%20pr.png', alt: 'Prototype' }
            ]
        },
        'hexagonal-carton': {
            title: 'Two Juices in one Pak',
            description: 'Yes, you can drink two different juices from one pak! Submission to coursework.',
            images: [
                 { src: 'https://raw.githubusercontent.com/abstractanuj/abstractanuj.github.io/refs/heads/main/img/design/pico.jpg', alt: 'Prototype' }
            ]
        },
        'cosmetic-box': {
            title: 'Hexagonl and comfy Pak',
            description: 'A shot at premium packaging for Juice pak.',
            images: [
                { src: 'https://raw.githubusercontent.com/abstractanuj/abstractanuj.github.io/refs/heads/main/img/design/lych.jpg', alt: 'Dieline with graphic' }
            ]
        }
    };

    const openModal = (projectId) => {
        const projectData = portfolioProjects[projectId];
        if (!projectData) return;

        lastActiveElement = document.activeElement;

        modalTitle.textContent = projectData.title;
        modalDescription.textContent = projectData.description;

        modalImageGrid.innerHTML = projectData.images.map(img => `
            <div class="image-wrapper">
                <img src="${img.src}" alt="${img.alt}" loading="lazy">
            </div>
        `).join('');

        document.body.classList.add('modal-open');
        modalOverlay.classList.add('visible');
        modalCloseBtn.focus();
    };

    const closeModal = () => {
        document.body.classList.remove('modal-open');
        modalOverlay.classList.remove('visible');
        modalImageGrid.innerHTML = ''; // Clear images
        if (lastActiveElement) {
            lastActiveElement.focus();
        }
    };

    portfolioItems.forEach(item => {
        item.addEventListener('click', () => {
            const projectId = item.dataset.projectId;
            openModal(projectId);
        });
        item.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                const projectId = item.dataset.projectId;
                openModal(projectId);
            }
        });
    });

    modalCloseBtn.addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            closeModal();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modalOverlay.classList.contains('visible')) {
            closeModal();
        }
        if (e.key === 'Tab' && modalOverlay.classList.contains('visible')) {
            // Basic focus trapping
            const focusableElements = modalContent.querySelectorAll('button');
            const firstElement = focusableElements[0];
            const lastElement = focusableElements[focusableElements.length - 1];

            if (e.shiftKey) { // Shift + Tab
                if (document.activeElement === firstElement) {
                    lastElement.focus();
                    e.preventDefault();
                }
            } else { // Tab
                if (document.activeElement === lastElement) {
                    firstElement.focus();
                    e.preventDefault();
                }
            }
        }
    });


    // --- Magical Particle Animation (Desktop Only) ---
    const canvas = document.getElementById('particle-canvas');
    if (canvas && !isMobile) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const particleCount = 50;
        let animationFrameId;
        let isAnimatingParticles = false;
        let mouse = { x: -100, y: -100 };
        
        window.addEventListener('mousemove', (e) => {
            mouse.x = e.clientX;
            mouse.y = e.clientY;
        });

        const resizeCanvas = () => {
            canvas.width = canvas.offsetWidth;
            canvas.height = canvas.offsetHeight;
        };

        class Particle {
            constructor() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.vx = (Math.random() - 0.5) * 0.3;
                this.vy = (Math.random() - 0.5) * 0.3;
                this.radius = Math.random() * 1.5 + 0.5;
                this.alpha = Math.random() * 0.5 + 0.2;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > canvas.width) this.vx *= -1;
                if (this.y < 0 || this.y > canvas.height) this.vy *= -1;

                // Mouse interaction
                const dx = this.x - mouse.x;
                const dy = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 100) {
                    this.x += dx / dist * 0.5;
                    this.y += dy / dist * 0.5;
                }
            }

            draw() {
                const accentColor = getComputedStyle(document.documentElement).getPropertyValue('--color-accent').trim();
                ctx.fillStyle = accentColor;
                ctx.globalAlpha = this.alpha;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            for (let i = 0; i < particleCount; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };
        
        const particleObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!isAnimatingParticles) {
                        isAnimatingParticles = true;
                        animate();
                    }
                } else {
                    if (isAnimatingParticles) {
                        isAnimatingParticles = false;
                        cancelAnimationFrame(animationFrameId);
                    }
                }
            });
        }, { threshold: 0 });

        particleObserver.observe(canvas);

        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticles();
        });

        resizeCanvas();
        initParticles();
    }
});
