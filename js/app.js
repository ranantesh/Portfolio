/* ==========================================================================
   SAAS BOOKING PLATFORM - CORE JAVASCRIPT CONTROLLER
   With GeoIP Automatic Country Detection (India INR ₹ vs Global USD $)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- 0. WELCOME PRELOADER SCREEN CONTROLLER (3.5 SECONDS) ---
    const preloader = document.getElementById('welcome-preloader');
    const progressBar = document.getElementById('preloader-progress-bar');
    const statusText = document.getElementById('preloader-status');

    if (preloader) {
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            if (progressBar) progressBar.style.width = Math.min(progress, 100) + '%';

            if (progress === 25 && statusText) {
                statusText.textContent = 'Loading Core SaaS Engine...';
            } else if (progress === 55 && statusText) {
                statusText.textContent = 'Preparing Architecture & Services...';
            } else if (progress === 85 && statusText) {
                statusText.textContent = 'System Ready...';
            } else if (progress >= 100) {
                clearInterval(interval);
                if (statusText) statusText.textContent = 'Welcome to Ranantesh!';
                setTimeout(() => {
                    preloader.classList.add('fade-out');
                    setTimeout(() => {
                        if (preloader.parentNode) preloader.remove();
                    }, 600);
                }, 300);
            }
        }, 175);
    }

    // --- 1. DARK / LIGHT THEME TOGGLE CONTROLLER ---
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;
    
    const activeTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', activeTheme);
    
    if (themeToggleBtn) {
        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = htmlElement.getAttribute('data-theme');
            const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
            
            htmlElement.classList.add('theme-transitioning');
            htmlElement.setAttribute('data-theme', nextTheme);
            localStorage.setItem('theme', nextTheme);
            
            setTimeout(() => {
                htmlElement.classList.remove('theme-transitioning');
            }, 300);
        });
    }

    // --- 2. MOBILE NAVIGATION DRAWER SYSTEM ---
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navMenu = document.getElementById('nav-menu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    const toggleMenu = () => {
        if (mobileMenuBtn && navMenu) {
            mobileMenuBtn.classList.toggle('open');
            navMenu.classList.toggle('open');
            document.body.style.overflow = navMenu.classList.contains('open') ? 'hidden' : '';
        }
    };
    
    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', toggleMenu);
    }
    
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            if (navMenu && navMenu.classList.contains('open')) {
                toggleMenu();
            }
        });
    });

    // --- 3. STICKY HEADER SCROLL EVENT ---
    const headerElement = document.getElementById('main-header');
    
    const checkHeaderScroll = () => {
        if (headerElement) {
            if (window.scrollY > 50) {
                headerElement.classList.add('scrolled');
            } else {
                headerElement.classList.remove('scrolled');
            }
        }
    };
    
    window.addEventListener('scroll', checkHeaderScroll);
    checkHeaderScroll();

    // --- 4. HERO TYPING ANIMATION (8 VERTICALS) ---
    const typingElement = document.getElementById('typing-text');
    if (typingElement) {
        const phrases = [
            "High-Converting Websites",
            "Scalable E-Commerce Platforms",
            "10-30 Min Quick Commerce Systems",
            "Custom REST & GraphQL APIs",
            "High-Performance WordPress Plugins",
            "Native & Cross-Platform Mobile Apps",
            "Automated CRM Solutions",
            "WhatsApp Marketing & Bot Automation",
            "24/7 AI Customer Support Bots"
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
                typeDelay = 40;
            } else {
                typingElement.textContent = currentPhrase.substring(0, charIdx + 1);
                charIdx++;
                typeDelay = 100;
            }
            
            if (!isDeleting && charIdx === currentPhrase.length) {
                isDeleting = true;
                typeDelay = 2200;
            } else if (isDeleting && charIdx === 0) {
                isDeleting = false;
                phraseIdx = (phraseIdx + 1) % phrases.length;
                typeDelay = 400;
            }
            
            setTimeout(runTypingLoop, typeDelay);
        };
        
        setTimeout(runTypingLoop, 1000);
    }

    // ==========================================================================
    // 5. GEO-LOCATION & CURRENCY CONTROLLER (INR ₹ vs USD $)
    // ==========================================================================
    let activeCurrency = 'INR'; // Default to INR or auto-detected

    const currencyToggleBtn = document.getElementById('currency-toggle');

    const updateCurrencyUI = () => {
        const flagEl = document.getElementById('currency-flag');
        const codeEl = document.getElementById('currency-code');
        if (flagEl && codeEl) {
            flagEl.textContent = activeCurrency === 'INR' ? '🇮🇳' : '🌍';
            codeEl.textContent = activeCurrency === 'INR' ? 'INR (₹)' : 'USD ($)';
        }

        // Update Estimator Addon Chip labels & data-price attributes
        document.querySelectorAll('.addon-chip').forEach(chip => {
            const label = activeCurrency === 'INR' ? chip.dataset.labelInr : chip.dataset.labelUsd;
            if (label) chip.textContent = label;
        });

        // Re-render Service Catalog with active currency
        const activeTabBtn = document.querySelector('.service-tab-btn.active');
        const categoryKey = activeTabBtn ? activeTabBtn.dataset.category : 'website';
        renderPricingGrid(categoryKey);

        // Re-calculate Estimator Scope with active currency
        updateEstimate();
    };

    const initGeoLocation = () => {
        const savedCurrency = localStorage.getItem('currency_preference');
        if (savedCurrency === 'INR' || savedCurrency === 'USD') {
            activeCurrency = savedCurrency;
            updateCurrencyUI();
            return;
        }

        // 1. Instant TimeZone Check (India timezone detection)
        try {
            const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
            if (tz && (tz.includes('Kolkata') || tz.includes('Calcutta') || tz.includes('Asia/Colombo') || tz.includes('Asia/Kathmandu'))) {
                activeCurrency = 'INR';
                updateCurrencyUI();
            }
        } catch (e) {}

        // 2. Async GeoIP API for 100% accurate location check
        fetch('https://ipapi.co/json/')
            .then(res => res.json())
            .then(data => {
                if (data && data.country_code) {
                    activeCurrency = data.country_code === 'IN' ? 'INR' : 'USD';
                    localStorage.setItem('currency_preference', activeCurrency);
                    updateCurrencyUI();
                }
            })
            .catch(err => {
                console.log('GeoIP fallback engaged.');
            });
    };

    if (currencyToggleBtn) {
        currencyToggleBtn.addEventListener('click', () => {
            activeCurrency = activeCurrency === 'USD' ? 'INR' : 'USD';
            localStorage.setItem('currency_preference', activeCurrency);
            updateCurrencyUI();
        });
    }

    // ==========================================================================
    // 6. 8 SERVICE VERTICALS CATALOG DATA & PRICING ENGINE
    // ==========================================================================
    const serviceData = {
        'website': {
            title: "Website Development",
            subtitle: "Custom business websites, high-converting landing pages & web apps built for performance and SEO.",
            basePriceUSD: 499,
            basePriceINR: 14999,
            tiers: [
                { name: "Starter Landing Page", priceUSD: "$499", priceINR: "₹14,999", desc: "1-3 Page High-Converting Landing Page with responsive design & lead capture.", features: ["Custom UI/UX Design", "Mobile & Speed Optimized", "Contact Form & Lead Capture", "Basic SEO & Analytics", "7 Days Launch"] },
                { name: "Business Pro Web App", priceUSD: "$1,199", priceINR: "₹34,999", desc: "Multi-page corporate website or dynamic web portal with CMS integration.", features: ["Up to 10 Custom Pages", "Headless/WordPress CMS", "Interactive Booking/Forms", "Speed Index 95+", "Full SEO Package", "14 Days Launch"], popular: true },
                { name: "Enterprise Custom Platform", priceUSD: "$2,499+", priceINR: "₹74,999+", desc: "Bespoke SaaS platform, custom backend architecture & custom animations.", features: ["Full-Stack Custom Code", "Database & API Architecture", "User Auth & Client Portal", "Stripe/Razorpay Integration", "Priority Support", "Dedicated Project Manager"] }
            ]
        },
        'ecommerce': {
            title: "E-Commerce Solutions",
            subtitle: "Custom WooCommerce, Shopify & Headless stores optimized for high conversion rates and seamless payments.",
            basePriceUSD: 799,
            basePriceINR: 24999,
            tiers: [
                { name: "Essential Store", priceUSD: "$799", priceINR: "₹24,999", desc: "Turnkey e-commerce store with catalog setup and payment gateway.", features: ["Shopify / WooCommerce Setup", "Up to 50 Products", "Payment Gateway Integration", "Inventory Management", "10 Days Delivery"] },
                { name: "Growth E-Commerce", priceUSD: "$1,899", priceINR: "₹54,999", desc: "Custom designed storefront with abandoned cart recovery & analytics.", features: ["Custom Theme Design", "Unlimited Products & Categories", "Automated Email & WhatsApp Alerts", "Multi-Currency Support", "Advanced Analytics", "18 Days Delivery"], popular: true },
                { name: "Headless E-Commerce", priceUSD: "$3,499+", priceINR: "₹1,14,999+", desc: "Sub-second load times using Next.js/React frontend with Shopify/Woo backend.", features: ["Headless Frontend Architecture", "Custom Checkout Workflow", "ERP & Warehouse API Sync", "Global CDN & PWA Support", "VIP Maintenance"] }
            ]
        },
        'quickcommerce': {
            title: "Quick Commerce Systems",
            subtitle: "Hyperlocal 10-30 min delivery platforms, live order tracking, rider app sync & inventory automation.",
            basePriceUSD: 1499,
            basePriceINR: 49999,
            tiers: [
                { name: "Express Store App", priceUSD: "$1,499", priceINR: "₹49,999", desc: "Fast order app for single-darkstore hyperlocal delivery.", features: ["Order App & Web Portal", "Live Order Status Sync", "Payment Gateway & COD", "Push Notifications", "14 Days Delivery"] },
                { name: "Multi-Store Quick Engine", priceUSD: "$2,999", priceINR: "₹99,999", desc: "Complete Quick Commerce ecosystem with Store Manager & Rider Tracking.", features: ["Customer App + Rider App", "Live GPS Delivery Tracking", "Dark Store Inventory Auto-Sync", "Automated Dispatch Routing", "21 Days Delivery"], popular: true },
                { name: "Enterprise Q-Commerce", priceUSD: "$5,499+", priceINR: "₹1,89,999+", desc: "Full scale Zepto/Blinkit clone setup with multi-city hub management.", features: ["Multi-Hub Admin Console", "Rider Payout & Batching System", "Real-Time Inventory Lock", "Custom Analytics Dashboard", "SLA Guarantee"] }
            ]
        },
        'api': {
            title: "API Development & Integration",
            subtitle: "Secure RESTful & GraphQL APIs, microservices, payment gateways & third-party webhook integrations.",
            basePriceUSD: 599,
            basePriceINR: 17999,
            tiers: [
                { name: "API Integration Pack", priceUSD: "$599", priceINR: "₹17,999", desc: "Connect payment gateways, CRMs, or third-party SaaS APIs into your website.", features: ["Third-Party API Connector", "Payment Gateway Webhooks", "OAuth2 Authentication", "Error Logging & Retry", "5 Days Delivery"] },
                { name: "Custom REST/GraphQL API", priceUSD: "$1,499", priceINR: "₹44,999", desc: "Bespoke API backend with secure endpoint documentation & rate limiting.", features: ["PostgreSQL/MySQL Database", "JWT Token Auth & Security", "Swagger API Docs", "Rate Limiting & Caching", "12 Days Delivery"], popular: true },
                { name: "Enterprise Microservices", priceUSD: "$2,999+", priceINR: "₹89,999+", desc: "Scalable cloud API infrastructure built for heavy traffic and high availability.", features: ["Microservices Architecture", "Redis Caching & Queue Worker", "Docker Containerization", "CI/CD Deployment", "SLA & Monitoring"] }
            ]
        },
        'plugin': {
            title: "WordPress Plugin Development",
            subtitle: "Custom Gutenberg blocks, WooCommerce payment gateways, API add-ons & plugin store publishing.",
            basePriceUSD: 499,
            basePriceINR: 14999,
            tiers: [
                { name: "Custom Utility Plugin", priceUSD: "$499", priceINR: "₹14,999", desc: "Add custom functionality or shortcodes without bloat.", features: ["Lightweight Clean PHP", "Admin Settings Panel", "WooCommerce Hook Support", "Theme Compatibility", "5 Days Delivery"] },
                { name: "WooCommerce Add-On / Payment", priceUSD: "$999", priceINR: "₹29,999", desc: "Custom checkout gateway, shipping calculator, or product customizer plugin.", features: ["WooCommerce Core API Sync", "Custom Checkout Fields", "Secure Payment Webhooks", "Auto Updates Support", "10 Days Delivery"], popular: true },
                { name: "SaaS Plugin & Licensing Engine", priceUSD: "$1,999+", priceINR: "₹59,999+", desc: "Full plugin packaged for commercial sale with license key activation server.", features: ["License Validation Server", "Gutenberg Block Suite", "Freemium Upgrade Flow", "Envato/CodeCanyon Ready", "VIP Support"] }
            ]
        },
        'mobile': {
            title: "Mobile Apps Development",
            subtitle: "Native iOS & Android mobile apps built with React Native / Flutter with smooth 60fps animations.",
            basePriceUSD: 1299,
            basePriceINR: 39999,
            tiers: [
                { name: "MVP Mobile App", priceUSD: "$1,299", priceINR: "₹39,999", desc: "Single-platform MVP app with core features and API backend connection.", features: ["iOS or Android App", "Clean Modern UI", "Push Notifications", "App Store Submission", "14 Days Delivery"] },
                { name: "Cross-Platform Pro App", priceUSD: "$2,699", priceINR: "₹79,999", desc: "Dual platform iOS + Android app with offline storage & authentication.", features: ["Flutter / React Native Codebase", "Social & Biometric Auth", "In-App Purchases / Payments", "Real-Time Push Alerts", "21 Days Delivery"], popular: true },
                { name: "Enterprise Super App", priceUSD: "$4,999+", priceINR: "₹1,49,999+", desc: "Full featured mobile ecosystem with chat, live tracking & offline sync.", features: ["Custom Native Modules", "Real-Time WebSocket Sync", "Biometric Security", "Dedicated Backend", "Store Listing Management"] }
            ]
        },
        'crm': {
            title: "CRM Solutions",
            subtitle: "Bespoke CRM platforms, sales pipeline tracking, customer management & lead automation.",
            basePriceUSD: 999,
            basePriceINR: 29999,
            tiers: [
                { name: "Starter CRM Dashboard", priceUSD: "$999", priceINR: "₹29,999", desc: "Lead capture & status pipeline dashboard for small business teams.", features: ["Lead Kanban Board", "Contact History Logs", "Team Access Permissions", "Email Lead Alerts", "10 Days Delivery"] },
                { name: "Automated Sales CRM", priceUSD: "$2,199", priceINR: "₹64,999", desc: "Advanced CRM with automated follow-ups, analytics & invoice generator.", features: ["Multi-Stage Sales Pipelines", "Automated WhatsApp & Email Follow-ups", "Invoice & Quote Builder", "Custom Reporting Charts", "18 Days Delivery"], popular: true },
                { name: "Enterprise Custom CRM", priceUSD: "$3,999+", priceINR: "₹1,19,999+", desc: "Tailored enterprise CRM built for high volume teams with VoIP & AI insights.", features: ["Custom Workflow Automations", "Role-Based Access Control", "AI Lead Scoring Engine", "Telephony & VoIP Integration", "Custom Database Sync"] }
            ]
        },
        'whatsapp': {
            title: "Custom WhatsApp Marketing Solutions",
            subtitle: "WhatsApp Cloud API integration, broadcast campaign engine, automated chatbots & order alerts.",
            basePriceUSD: 699,
            basePriceINR: 19999,
            tiers: [
                { name: "WhatsApp Alert System", priceUSD: "$699", priceINR: "₹19,999", desc: "Automated order confirmation, booking reminders & OTP verification via WhatsApp.", features: ["Official Cloud API Setup", "WooCommerce/Shopify Hook", "Instant Order Reminders", "Template Message Approval", "7 Days Delivery"] },
                { name: "Chatbot & Broadcast Platform", priceUSD: "$1,599", priceINR: "₹44,999", desc: "Interactive conversational chatbot with bulk campaign broadcasting console.", features: ["Automated Conversational Bot", "Bulk WhatsApp Campaign Manager", "Interactive Buttons & Lists", "Contact Tagging & List Sync", "14 Days Delivery"], popular: true },
                { name: "Enterprise WhatsApp CRM", priceUSD: "$2,999+", priceINR: "₹89,999+", desc: "Multi-agent team inbox, live chat routing & automated WhatsApp sales engine.", features: ["Multi-Agent Shared Inbox", "AI Automated Bot Responses", "Custom Webhook Integrations", "Analytics & Conversion Metrics", "VIP Setup Support"] }
            ]
        },
        'aisupport': {
            title: "AI Customer Support Build",
            subtitle: "Custom AI chatbots, RAG knowledge-base agents & 24/7 automated customer support across Web, WhatsApp & CRM.",
            basePriceUSD: 699,
            basePriceINR: 19999,
            tiers: [
                { name: "Starter AI Support Bot", priceUSD: "$699", priceINR: "₹19,999", desc: "Single-channel AI web widget trained on your FAQs and support documentation.", features: ["Web Chat Widget Integration", "FAQ & Knowledge Base Auto-Reply", "Up to 1,000 Conversations/mo", "Basic Analytics Dashboard", "7 Days Delivery"] },
                { name: "Pro RAG Knowledge Agent", priceUSD: "$1,799", priceINR: "₹49,999", desc: "Advanced RAG vector agent trained on custom PDFs, docs & database with human escalation.", features: ["RAG Vector Database Search", "Multi-Channel (Web + WhatsApp)", "Human Handoff Escalation Flow", "Custom Tone & Prompt Engineering", "14 Days Delivery"], popular: true },
                { name: "Enterprise AI Swarm Agent", priceUSD: "$3,499+", priceINR: "₹99,999+", desc: "Full-scale autonomous AI agent integrated with your CRM, APIs, and voice/telephony.", features: ["Autonomous Multi-Agent Workflow", "Custom CRM & Database API Actions", "Voice / Telephony Support Agent", "SLA & Fine-Tuned Model Hosting", "Dedicated AI Architect Support"] }
            ]
        }
    };

    // Render Pricing Grid based on Active Tab & Active Currency
    const renderPricingGrid = (categoryKey) => {
        const gridContainer = document.getElementById('pricing-grid-container');
        if (!gridContainer || !serviceData[categoryKey]) return;

        const catData = serviceData[categoryKey];
        let html = '';

        catData.tiers.forEach(tier => {
            const isPopular = tier.popular ? 'popular' : '';
            const popularBadge = tier.popular ? '<span class="popular-badge">Most Popular</span>' : '';
            const tierPrice = activeCurrency === 'INR' ? tier.priceINR : tier.priceUSD;

            html += `
                <div class="pricing-card ${isPopular}">
                    ${popularBadge}
                    <div class="pricing-header">
                        <div class="pricing-tier">${tier.name}</div>
                        <div class="pricing-desc">${tier.desc}</div>
                        <div class="pricing-price">${tierPrice} <span>/ project</span></div>
                    </div>
                    <ul class="pricing-features">
                        ${tier.features.map(f => `
                            <li>
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                ${f}
                            </li>
                        `).join('')}
                    </ul>
                    <button class="btn ${tier.popular ? 'btn-primary' : 'btn-secondary'} btn-book-tier" 
                            data-service="${catData.title}" 
                            data-tier="${tier.name}" 
                            data-price="${tierPrice}">
                        Book This Package
                    </button>
                </div>
            `;
        });

        gridContainer.innerHTML = html;

        // Attach Click Listeners to newly rendered Book buttons
        document.querySelectorAll('.btn-book-tier').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const service = e.currentTarget.dataset.service;
                const tier = e.currentTarget.dataset.tier;
                const price = e.currentTarget.dataset.price;
                openWizardWithData(service, tier, price);
            });
        });
    };

    // Tab Switcher Listener
    const tabButtons = document.querySelectorAll('.service-tab-btn');
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const category = btn.dataset.category;
            renderPricingGrid(category);
        });
    });

    // ==========================================================================
    // 7. DYNAMIC PROJECT SCOPE & COST ESTIMATOR ENGINE
    // ==========================================================================
    const estCategorySelect = document.getElementById('est-category');
    const estTierSelect = document.getElementById('est-tier');
    const estTimelineSelect = document.getElementById('est-timeline');
    const estDisplayPrice = document.getElementById('est-price-display');
    const estDisplayTimeline = document.getElementById('est-timeline-display');
    const addonChips = document.querySelectorAll('.addon-chip');

    const updateEstimate = () => {
        if (!estCategorySelect || !estDisplayPrice) return;

        const catKey = estCategorySelect.value;
        const baseCost = serviceData[catKey] 
            ? (activeCurrency === 'INR' ? serviceData[catKey].basePriceINR : serviceData[catKey].basePriceUSD) 
            : (activeCurrency === 'INR' ? 14999 : 499);

        let multiplier = 1.0;
        if (estTierSelect && estTierSelect.value === 'growth') multiplier = 1.8;
        if (estTierSelect && estTierSelect.value === 'enterprise') multiplier = 3.5;

        let timelineMult = 1.0;
        if (estTimelineSelect && estTimelineSelect.value === 'rush') timelineMult = 1.25;
        if (estTimelineSelect && estTimelineSelect.value === 'flexible') timelineMult = 0.9;

        // Addons calculation
        let addonCost = 0;
        let selectedAddonsList = [];
        addonChips.forEach(chip => {
            if (chip.classList.contains('selected')) {
                const addVal = activeCurrency === 'INR' 
                    ? parseInt(chip.dataset.priceInr || '4999', 10) 
                    : parseInt(chip.dataset.priceUsd || '150', 10);
                addonCost += addVal;
                selectedAddonsList.push(chip.dataset.name);
            }
        });

        const minEstimate = Math.round((baseCost * multiplier * timelineMult) + addonCost);
        const maxEstimate = Math.round(minEstimate * 1.25);

        const sym = activeCurrency === 'INR' ? '₹' : '$';
        estDisplayPrice.textContent = `${sym}${minEstimate.toLocaleString()} - ${sym}${maxEstimate.toLocaleString()}`;

        let timelineText = "Estimated Delivery: 2-3 Weeks";
        if (estTimelineSelect && estTimelineSelect.value === 'rush') timelineText = "⚡ Express Launch: 7-10 Days";
        if (estTimelineSelect && estTimelineSelect.value === 'flexible') timelineText = "📅 Standard Schedule: 3-4 Weeks";
        if (estDisplayTimeline) estDisplayTimeline.textContent = timelineText;
    };

    if (estCategorySelect) {
        estCategorySelect.addEventListener('change', updateEstimate);
    }
    if (estTierSelect) {
        estTierSelect.addEventListener('change', updateEstimate);
    }
    if (estTimelineSelect) {
        estTimelineSelect.addEventListener('change', updateEstimate);
    }

    addonChips.forEach(chip => {
        chip.addEventListener('click', () => {
            chip.classList.toggle('selected');
            updateEstimate();
        });
    });

    const btnBookEstimate = document.getElementById('btn-book-estimate');
    if (btnBookEstimate) {
        btnBookEstimate.addEventListener('click', () => {
            const catKey = estCategorySelect ? estCategorySelect.value : 'website';
            const catTitle = serviceData[catKey] ? serviceData[catKey].title : 'Website Development';
            const tierName = estTierSelect ? estTierSelect.options[estTierSelect.selectedIndex].text : 'Custom Scope';
            const priceEst = estDisplayPrice ? estDisplayPrice.textContent : (activeCurrency === 'INR' ? '₹14,999+' : '$499+');
            
            let selectedAddonNames = [];
            addonChips.forEach(chip => {
                if (chip.classList.contains('selected')) {
                    selectedAddonNames.push(chip.dataset.name);
                }
            });

            openWizardWithData(catTitle, tierName, priceEst, selectedAddonNames.join(', '));
        });
    }

    // Initialize GeoLocation & Location Currency Trigger
    initGeoLocation();

    // ==========================================================================
    // 8. MULTI-STEP SAAS BOOKING WIZARD MODAL CONTROLLER
    // ==========================================================================
    const wizardModal = document.getElementById('wizard-modal');
    const wizardCloseBtn = document.getElementById('wizard-modal-close');
    const wizardForm = document.getElementById('wizard-booking-form');

    let currentStep = 1;
    const totalSteps = 4;

    const openWizardWithData = (serviceTitle, packageTier, priceCost, addonsText = '') => {
        if (!wizardModal) return;

        document.getElementById('wiz-service').value = serviceTitle || 'Website Development';
        document.getElementById('wiz-package').value = packageTier || 'Standard Package';
        document.getElementById('wiz-cost').value = priceCost || (activeCurrency === 'INR' ? '₹14,999' : '$499');
        if (document.getElementById('wiz-addons')) {
            document.getElementById('wiz-addons').value = addonsText;
        }

        if (document.getElementById('summary-service-display')) {
            document.getElementById('summary-service-display').textContent = serviceTitle;
        }
        if (document.getElementById('summary-package-display')) {
            document.getElementById('summary-package-display').textContent = packageTier;
        }
        if (document.getElementById('summary-cost-display')) {
            document.getElementById('summary-cost-display').textContent = priceCost;
        }

        const dateInput = document.getElementById('wiz-date');
        if (dateInput) {
            const today = new Date().toISOString().split('T')[0];
            dateInput.min = today;
            if (!dateInput.value) dateInput.value = today;
        }

        goToStep(1);
        wizardModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
    };

    const closeWizard = () => {
        if (wizardModal) {
            wizardModal.classList.add('hidden');
            document.body.style.overflow = '';
        }
    };

    if (wizardCloseBtn) {
        wizardCloseBtn.addEventListener('click', closeWizard);
    }

    if (wizardModal) {
        wizardModal.addEventListener('click', (e) => {
            if (e.target === wizardModal) closeWizard();
        });
    }

    const goToStep = (stepNum) => {
        currentStep = stepNum;

        for (let i = 1; i <= totalSteps; i++) {
            const stepEl = document.getElementById(`wizard-step-${i}`);
            if (stepEl) stepEl.classList.add('hidden');

            const nodeEl = document.getElementById(`node-step-${i}`);
            if (nodeEl) {
                nodeEl.classList.remove('active', 'completed');
                if (i < currentStep) nodeEl.classList.add('completed');
                if (i === currentStep) nodeEl.classList.add('active');
            }
        }

        const currentStepEl = document.getElementById(`wizard-step-${currentStep}`);
        if (currentStepEl) currentStepEl.classList.remove('hidden');

        const progressBar = document.getElementById('wizard-progress-bar');
        if (progressBar) {
            const percentage = ((currentStep - 1) / (totalSteps - 1)) * 100;
            progressBar.style.width = `${percentage}%`;
        }
    };

    const btnStep1Next = document.getElementById('btn-step1-next');
    if (btnStep1Next) {
        btnStep1Next.addEventListener('click', () => goToStep(2));
    }

    const btnStep2Next = document.getElementById('btn-step2-next');
    if (btnStep2Next) {
        btnStep2Next.addEventListener('click', () => {
            const dateVal = document.getElementById('wiz-date').value;
            const timeVal = document.getElementById('wiz-time').value;

            if (!dateVal || !timeVal) {
                alert("Please select a valid consultation date and time slot.");
                return;
            }
            goToStep(3);
        });
    }

    const timeSlotBtns = document.querySelectorAll('.time-slot-btn');
    timeSlotBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            timeSlotBtns.forEach(b => b.classList.remove('selected'));
            btn.classList.add('selected');
            document.getElementById('wiz-time').value = btn.dataset.time;
        });
    });

    const btnStep2Back = document.getElementById('btn-step2-back');
    if (btnStep2Back) btnStep2Back.addEventListener('click', () => goToStep(1));

    const btnStep3Back = document.getElementById('btn-step3-back');
    if (btnStep3Back) btnStep3Back.addEventListener('click', () => goToStep(2));

    document.querySelectorAll('.open-wizard-trigger').forEach(trigger => {
        trigger.addEventListener('click', (e) => {
            e.preventDefault();
            const service = trigger.dataset.service || 'Website Development';
            const defaultCost = activeCurrency === 'INR' ? '₹14,999' : '$499';
            openWizardWithData(service, 'Consultation Call', defaultCost);
        });
    });

    if (wizardForm) {
        wizardForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const submitBtn = document.getElementById('btn-step3-submit');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.textContent = 'Processing Booking...';
            }

            const formData = new FormData(wizardForm);

            fetch('booking.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Confirm & Book Consultation';
                }

                if (data.status === 'success') {
                    const refCode = data.booking_ref || 'REF-84920';
                    document.getElementById('confirm-ref-code').textContent = refCode;
                    document.getElementById('confirm-service-name').textContent = data.service || formData.get('service_category');
                    document.getElementById('confirm-datetime').textContent = data.datetime || (formData.get('date') + ' at ' + formData.get('time'));

                    const clientName = formData.get('name');
                    const serviceCat = formData.get('service_category');
                    const calTitle = encodeURIComponent(`Consultation: ${serviceCat} with Ranantesh`);
                    const calDetails = encodeURIComponent(`Booking Reference: ${refCode}\nClient: ${clientName}\nService: ${serviceCat}`);
                    const gCalUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${calTitle}&details=${calDetails}`;
                    
                    const btnGCal = document.getElementById('btn-add-gcal');
                    if (btnGCal) btnGCal.href = gCalUrl;

                    const phoneNum = formData.get('phone') || '918170982777';
                    const cleanPhone = phoneNum.replace(/[^0-9]/g, '');
                    const targetPhone = cleanPhone.length > 5 ? cleanPhone : '918170982777';
                    const waText = encodeURIComponent(`Hi Ranantesh, I booked a ${serviceCat} consultation (Ref: ${refCode}). My preferred date is ${formData.get('date')} at ${formData.get('time')}.`);
                    const waUrl = `https://wa.me/${targetPhone}?text=${waText}`;

                    const btnWA = document.getElementById('btn-confirm-wa');
                    if (btnWA) btnWA.href = waUrl;

                    goToStep(4);
                } else {
                    alert(data.message || 'Error processing booking. Please try again.');
                }
            })
            .catch(err => {
                console.error(err);
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Confirm & Book Consultation';
                }
                alert("Network error connecting to booking server. Please try again or WhatsApp directly.");
            });
        });
    }

    // ==========================================================================
    // 9. CLIENT PORTAL BOOKING STATUS LOOKUP MODAL
    // ==========================================================================
    const lookupModal = document.getElementById('lookup-modal');
    const btnOpenLookup = document.getElementById('btn-open-lookup');
    const closeLookupBtn = document.getElementById('lookup-modal-close');
    const lookupForm = document.getElementById('lookup-form');
    const lookupResultBox = document.getElementById('lookup-result');

    if (btnOpenLookup && lookupModal) {
        btnOpenLookup.addEventListener('click', (e) => {
            e.preventDefault();
            lookupModal.classList.remove('hidden');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeLookupBtn && lookupModal) {
        closeLookupBtn.addEventListener('click', () => {
            lookupModal.classList.add('hidden');
            document.body.style.overflow = '';
        });
    }

    if (lookupModal) {
        lookupModal.addEventListener('click', (e) => {
            if (e.target === lookupModal) {
                lookupModal.classList.add('hidden');
                document.body.style.overflow = '';
            }
        });
    }

    if (lookupForm) {
        lookupForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const refInput = document.getElementById('lookup-input').value.trim();
            if (!refInput) return;

            lookupResultBox.innerHTML = '<div style="text-align:center; padding: 20px; color: var(--text-secondary);">Searching database...</div>';

            fetch(`booking.php?action=lookup&ref=${encodeURIComponent(refInput)}`)
                .then(res => res.json())
                .then(data => {
                    if (data.status === 'success' && data.booking) {
                        const b = data.booking;
                        const statusClass = b.status === 'Completed' ? 'background: rgba(16,185,129,0.15); color: #34d399;' : 'background: rgba(245,158,11,0.15); color: #fbbf24;';
                        
                        lookupResultBox.innerHTML = `
                            <div class="confirmation-card" style="margin-top: 15px;">
                                <div style="font-size: 0.8rem; color: var(--text-tertiary); font-weight: 600;">BOOKING FOUND</div>
                                <div class="ref-code-badge">${b.booking_ref || 'REF-ACTIVE'}</div>
                                <h4 style="color: var(--text-primary); margin: 8px 0;">${b.name}</h4>
                                <div style="font-size: 0.9rem; color: var(--accent-primary); font-weight: 600;">${b.service_category} (${b.package_tier})</div>
                                <div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 6px;">📅 ${b.booking_date} at ${b.booking_time}</div>
                                <div style="margin-top: 12px;">
                                    <span style="padding: 4px 14px; border-radius: 20px; font-size: 0.8rem; font-weight: 700; text-transform: uppercase; ${statusClass}">
                                        Status: ${b.status}
                                    </span>
                                </div>
                            </div>
                        `;
                    } else {
                        lookupResultBox.innerHTML = `<div style="text-align:center; padding: 20px; color: #f87171;">No active booking found matching "${refInput}".</div>`;
                    }
                })
                .catch(err => {
                    lookupResultBox.innerHTML = `<div style="text-align:center; padding: 20px; color: #f87171;">Error connecting to lookup server.</div>`;
                });
        });
    }

    // ==========================================================================
    // 12. CONTACT FORM & LEGAL COMPLIANCE MODALS
    // ==========================================================================
    const contactForm = document.getElementById('contact-form');
    const contactResponseBox = document.getElementById('contact-response');

    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-contact-submit');
            if (btn) btn.disabled = true;
            contactResponseBox.innerHTML = '<div style="color: var(--accent-primary);">Processing your message...</div>';

            const formData = new FormData(contactForm);

            fetch('contact.php', {
                method: 'POST',
                body: formData
            })
            .then(res => res.json())
            .then(data => {
                if (btn) btn.disabled = false;
                if (data.status === 'success') {
                    contactResponseBox.innerHTML = `<div style="color: #34d399; font-weight: 600;">${data.message}</div>`;
                    contactForm.reset();
                } else {
                    contactResponseBox.innerHTML = `<div style="color: #f87171;">${data.message || 'Submission error. Please try again.'}</div>`;
                }
            })
            .catch(() => {
                if (btn) btn.disabled = false;
                contactResponseBox.innerHTML = '<div style="color: #f87171;">Server error. Please email directly to contact@ranantesh.in</div>';
            });
        });
    }

    // Modal Helper Function
    const setupModalEvents = (triggerId, modalId, closeId) => {
        const trigger = document.getElementById(triggerId);
        const modal = document.getElementById(modalId);
        const closeBtn = document.getElementById(closeId);

        if (trigger && modal) {
            trigger.addEventListener('click', (e) => {
                e.preventDefault();
                modal.classList.remove('hidden');
            });
        }

        if (closeBtn && modal) {
            closeBtn.addEventListener('click', () => modal.classList.add('hidden'));
        }

        if (modal) {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) modal.classList.add('hidden');
            });
        }
    };

    setupModalEvents('btn-open-terms', 'terms-modal', 'terms-modal-close');
    setupModalEvents('btn-open-refund', 'refund-modal', 'refund-modal-close');
    setupModalEvents('btn-open-privacy', 'privacy-modal', 'privacy-modal-close');

});
