/* ==========================================================================
   DEVELOPER PORTFOLIO - CORE JAVASCRIPT CONTROLLER
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 1. DARK / LIGHT THEME TOGGLE CONTROLLER ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    // Retrieve previous theme preference or default to dark
    const activeTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', activeTheme);
    
    themeToggleBtn.addEventListener('click', () => {
        const currentTheme = htmlElement.getAttribute('data-theme');
        const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
        
        // Apply theme transition animation
        htmlElement.classList.add('theme-transitioning');
        htmlElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
        
        // Remove animation lock helper
        setTimeout(() => {
            htmlElement.classList.remove('theme-transitioning');
        }, 300);
    });

    // --- 2. MOBILE NAVIGATION DRAWER SYSTEM ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const toggleMenu = () => {
        mobileMenuBtn.classList.toggle('open');
        navMenu.classList.toggle('open');
        // Prevent background scrolling when mobile menu is active
        document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
    };
    
    mobileMenuBtn.addEventListener('click', toggleMenu);
    
    // Auto-close menu when navigating
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu.classList.contains('open')) {
                toggleMenu();
            }
        });
    });

    // --- 3. STICKY HEADER SCROLL EVENT ---
    const headerElement = document.getElementById('main-header');
    
    const checkHeaderScroll = () => {
        if (window.scrollY > 50) {
            headerElement.classList.add('scrolled');
        } else {
            headerElement.classList.remove('scrolled');
        }
    };
    
    window.addEventListener('scroll', checkHeaderScroll);
    checkHeaderScroll(); // Run on startup

    // --- 4. TEXT TYPING ANIMATION (HERO) ---
    const typingElement = document.getElementById('typing-text');
    const phrases = [
        "20+ custom WordPress plugins",
        "high-performance systems",
        "scalable web backends",
        "interactive custom UIs",
        "robust database structures"
    ];
    
    let phraseIdx = 0;
    let charIdx = 0;
    let isDeleting = false;
    let typeDelay = 100;
    
    const runTypingLoop = () => {
        const currentPhrase = phrases[phraseIdx];
        
        if (isDeleting) {
            typingElement.textContent = currentPhrase.substring(0, charIdx - 1);
            charIdx--;
            typeDelay = 50; // Speed up deletion
        } else {
            typingElement.textContent = currentPhrase.substring(0, charIdx + 1);
            charIdx++;
            typeDelay = 120; // Natural typing speed
        }
        
        // Handle phrase completion
        if (!isDeleting && charIdx === currentPhrase.length) {
            isDeleting = true;
            typeDelay = 2000; // Hold full phrase
        } else if (isDeleting && charIdx === 0) {
            isDeleting = false;
            phraseIdx = (phraseIdx + 1) % phrases.length;
            typeDelay = 500; // Pause before typing next phrase
        }
        
        setTimeout(runTypingLoop, typeDelay);
    };
    
    if (typingElement) {
        runTypingLoop();
    }

    // --- 5. INTERSECTION OBSERVER SCROLL SPY ---
    const sections = document.querySelectorAll('section');
    
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -60% 0px', // Trigger when section fills the screen center
        threshold: 0
    };
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const id = entry.target.getAttribute('id');
                
                // Remove active classes from all links
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

    // --- 6. PROJECT CATALOG CATEGORY FILTERING ---
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Update active button state
            filterButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const filterCategory = btn.getAttribute('data-filter');
            
            projectCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                if (filterCategory === 'all' || cardCategory === filterCategory) {
                    card.style.display = 'flex';
                    // Animation trigger
                    setTimeout(() => {
                        card.style.opacity = '1';
                        card.style.transform = 'scale(1)';
                    }, 50);
                } else {
                    card.style.opacity = '0';
                    card.style.transform = 'scale(0.95)';
                    // Delay display:none to let fade-out finish
                    setTimeout(() => {
                        card.style.display = 'none';
                    }, 300);
                }
            });
        });
    });

    // --- 7. PREMIUM CONTACT FORM CONTROLLER ---
    const contactForm = document.getElementById('contact-form');
    const formStatus = document.getElementById('form-status');
    const submitBtn = document.getElementById('btn-submit-contact');
    
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Honeypot spam check
            const honeypot = document.getElementById('contact-website').value;
            if (honeypot) {
                console.warn("Spam bot submission blocked.");
                return;
            }
            
            // Basic form fields checking
            const name = document.getElementById('contact-name').value.trim();
            const email = document.getElementById('contact-email').value.trim();
            const subject = document.getElementById('contact-subject').value.trim();
            const message = document.getElementById('contact-message').value.trim();
            
            if (!name || !email || !subject || !message) {
                return; // Let browser validation highlight missing fields
            }
            
            // Visual feedback: Show sending state
            const originalBtnContent = submitBtn.innerHTML;
            submitBtn.disabled = true;
            submitBtn.innerHTML = `
                Sending...
                <svg class="btn-icon animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
            `;
            
            // Create FormData object to send
            const formData = new FormData(contactForm);
            
            // Send AJAX POST Request to backend PHP mailer
            fetch('contact', {
                method: 'POST',
                body: formData
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response error');
                }
                return response.json();
            })
            .then(data => {
                if (data.status === 'success') {
                    // Fade out form elements
                    contactForm.style.opacity = '0';
                    // Show floating glassmorphism success modal
                    setTimeout(() => {
                        formStatus.style.display = 'flex';
                        contactForm.reset();
                    }, 200);
                } else {
                    // Display error message from PHP
                    alert(data.message || 'Something went wrong. Please email me directly at contact@ranantesh.in.');
                }
            })
            .catch(error => {
                console.error('Error submitting form:', error);
                alert('Connection error. Please try again or email me directly at contact@ranantesh.in.');
            })
            .finally(() => {
                // Restore button state
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnContent;
            });
        });
    }

    // --- 7.1 RESET FORM / SEND ANOTHER MESSAGE UX ---
    const resetFormBtn = document.getElementById('btn-reset-form');
    if (resetFormBtn && contactForm && formStatus) {
        resetFormBtn.addEventListener('click', () => {
            // Fade out the success screen
            formStatus.style.opacity = '0';
            setTimeout(() => {
                formStatus.style.display = 'none';
                formStatus.style.opacity = ''; // Reset opacity
                // Fade form back in
                contactForm.style.opacity = '1';
            }, 300);
        });
    }
    
    // Auto-update copyright footer year dynamically
    const yearSpan = document.getElementById('current-year');
    if (yearSpan) {
        yearSpan.textContent = new Date().getFullYear();
    }

    // --- 8. INITIALIZE AOS (ANIMATE ON SCROLL) ---
    if (typeof AOS !== 'undefined') {
        AOS.init({
            once: true,
            offset: 50,
            duration: 800,
            easing: 'ease-out-cubic',
        });
    }

    // --- 9. INITIALIZE VANILLA-TILT ---
    if (typeof VanillaTilt !== 'undefined') {
        // Elements with data-tilt are auto-initialized by the library,
        // but we can ensure everything with data-tilt gets the right default options here too.
        VanillaTilt.init(document.querySelectorAll(".feature-card.glass, .skills-card.glass, .project-card.glass"), {
            max: 15,
            speed: 400,
            glare: true,
            "max-glare": 0.2,
        });
    }
});

