document.addEventListener('DOMContentLoaded', () => {

    // --- Greeting Text Cycler ---
    const greetings = ['Hello', 'नमस्कार', 'வணக்கம்', 'नमस्ते', 'Hola', 'こんにちは'];
    const greetingEl = document.getElementById('greeting-text');
    let greetingIndex = 0;

    if (greetingEl) {
        // Set initial greeting
        greetingEl.textContent = greetings[greetingIndex];
        greetingEl.classList.add('visible');

        setInterval(() => {
            greetingEl.classList.remove('visible'); // Fade out

            setTimeout(() => {
                greetingIndex = (greetingIndex + 1) % greetings.length;
                greetingEl.textContent = greetings[greetingIndex];
                greetingEl.classList.add('visible'); // Fade in
            }, 500); // Wait for fade out to complete
        }, 2500); // Change every 2.5 seconds
    }


    // --- Custom Cursor ---
    const cursorDot = document.querySelector('.cursor-dot');
    const cursorOutline = document.querySelector('.cursor-outline');
    const interactiveElements = document.querySelectorAll('a, button, .portfolio-title-list li');

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
    const sections = document.querySelectorAll('.content-section');
    const navLinks = document.querySelectorAll('.main-nav .nav-link');
    
    const observerOptions = {
      root: null,
      rootMargin: '0px 0px -40% 0px',
      threshold: 0
    };

    const sectionObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const id = entry.target.getAttribute('id');
          navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${id}`) {
              link.classList.add('active');
            }
          });
        }
      });
    }, observerOptions);

    sections.forEach(section => {
      sectionObserver.observe(section);
    });
    
    // --- Smooth Scroll for Navigation ---
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({ behavior: 'smooth' });
            }
        });
    });

    // --- Portfolio Image Collage Interaction ---
    const portfolioTitles = document.querySelectorAll('.portfolio-title-list li');
    const portfolioImages = document.querySelectorAll('.portfolio-image');
    const titleListContainer = document.querySelector('.portfolio-title-list');

    if (portfolioTitles.length > 0) {
        portfolioTitles.forEach(title => {
            title.addEventListener('mouseenter', () => {
                const project = title.dataset.project;
                
                portfolioImages.forEach(image => image.classList.remove('active'));

                const targetImage = document.querySelector(`.portfolio-image[data-project="${project}"]`);
                if (targetImage) {
                    targetImage.classList.add('active');
                }
            });
        });
        
        if (titleListContainer) {
            titleListContainer.addEventListener('mouseleave', () => {
                portfolioImages.forEach(image => image.classList.remove('active'));
            });
        }
    }


    // --- Magical Particle Animation ---
    const canvas = document.getElementById('particle-canvas');
    if (canvas) {
        const ctx = canvas.getContext('2d');
        let particles = [];
        const particleCount = 50;

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
            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', () => {
            resizeCanvas();
            initParticles();
        });

        resizeCanvas();
        initParticles();
        animate();
    }
});