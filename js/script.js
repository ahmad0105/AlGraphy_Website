/* ============================================================
   AlGraphy Studio — Main Script
   
   TABLE OF CONTENTS:
   1. INITIALIZATION (Lenis Smooth Scroll)
   2. LOADER & PAGE LOAD LOGIC
   3. CUSTOM CURSOR & PROGRESS BAR
   4. NAVIGATION (Hamburger & Links)
   5. HERO SECTION (Entry Animations)
   6. VIDEO MODAL (Showreel Popup)
   7. SERVICES SECTION (Tabs & Parallax)
   8. PORTFOLIO SECTION (Slide-in & Reveal)
   9. FOOTER SECTION (Magnetic Effects)
   10. MODALS (Project & Contact Details)
   ============================================================ */


/* ===========================================
   1. INITIALIZATION — Lenis Smooth Scroll
   =========================================== */

/**
 * Initialize Lenis for smooth scrolling.
 * Lenis intercepts native scroll for a butter-smooth feel.
 */
const lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    smoothWheel: true,
    orientation: 'vertical',
});

/**
 * Sync GSAP ticker with Lenis for consistent timing and perfect animation synchronization.
 * (This replaces the need for a separate requestAnimationFrame loop)
 */
gsap.ticker.add((time) => {
    lenis.raf(time * 1000);
});
gsap.ticker.lagSmoothing(0);

/**
 * observeElement() — Reusable IntersectionObserver wrapper.
 * Observes an element and runs a callback once when it enters the viewport.
 * @param {Element} element - DOM element to observe.
 * @param {Function} callback - Function to run when element is visible.
 * @param {Object} options - IntersectionObserver options (threshold, rootMargin).
 * @returns {IntersectionObserver} The created observer instance.
 */
function observeElement(element, callback, options = {}) {
    const defaults = { threshold: 0.2, rootMargin: '0px' };
    const opts = { ...defaults, ...options };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                callback(entry.target);
                observer.unobserve(entry.target); // Fire once
            }
        });
    }, opts);
    observer.observe(element);
    return observer;
}

/**
 * observeElementToggle — Fires onEnter when visible and onExit when not.
 * Unlike observeElement, this does NOT unobserve — it keeps watching.
 */
function observeElementToggle(element, onEnter, onExit, options = {}) {
    const defaults = { threshold: 0.5, rootMargin: '0px' };
    const opts = { ...defaults, ...options };
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                onEnter(entry.target);
            } else {
                onExit(entry.target);
            }
        });
    }, opts);
    observer.observe(element);
    return observer;
}

// Stop scrolling until the loader disappears
lenis.stop();
if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
}


/* ===========================================
   2. LOADER & PAGE LOAD
   =========================================== */

/**
 * On page load: fade out the loader, then initialize the site.
 * - Starts Lenis scrolling
 * - Resets scroll position to top
 * - Plays the hero entry animation
 */
window.addEventListener("load", () => {
    const loader = document.getElementById("loader");

    /**
     * initializeSite() — Runs after the loader fades out.
     * Activates smooth scrolling, resets position, and triggers animations.
     */
    const initializeSite = () => {
        lenis.start();
        window.scrollTo(0, 0);
        lenis.scrollTo(0, { immediate: true });
        lenis.resize();
        syncAuthState(); // Synchronize UI with user session
        playInitialAnimations();
    };

    if (loader) {
        // Fade out the loader, then initialize
        gsap.to(loader, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
                loader.remove(); // Completely remove from DOM to prevent accidental reappearance
                initializeSite();
            }
        });
    } else {
        initializeSite();
    }
});

/**
 * syncAuthState() — Header UI synchronization with authentication status.
 */
async function syncAuthState() {
    const guestElements = [
        document.getElementById('guestLoginBtn'),
        document.getElementById('guestSignupBtn'),
        document.getElementById('menuLoginBtn')
    ];
    
    const userElements = [
        document.getElementById('userDashboardBtn'),
        document.getElementById('userHeaderProfile'),
        document.getElementById('menuDashboardBtn'),
        document.getElementById('menuProfileBtn')
    ];

    try {
        const response = await APIService.getProfile();

        if (response.status === 'success') {
            // User is logged in
            guestElements.forEach(el => el?.classList.add('hidden'));
            userElements.forEach(el => el?.classList.remove('hidden'));
            
            // Update header profile details
            const userName = document.getElementById('userHeaderName');
            const userAvatar = document.getElementById('userHeaderAvatar');
            
            if (userName) userName.innerText = response.user.full_name;
            if (userAvatar && response.user.profile_image) {
                userAvatar.src = response.user.profile_image;
            }
        } else {
            // Guest mode
            guestElements.forEach(el => el?.classList.remove('hidden'));
            userElements.forEach(el => el?.classList.add('hidden'));
        }
    } catch (err) {
        // Fail silently and default to guest mode if API is unreachable
        guestElements.forEach(el => el?.classList.remove('hidden'));
        userElements.forEach(el => el?.classList.add('hidden'));
        console.warn("Auth sync failed: Backend currently unreachable.");
    }
}


/* ===========================================
   3. CUSTOM CURSOR & SCROLL PROGRESS BAR
   =========================================== */

// Instantiate the OOP Custom Cursor

const progressBar = document.querySelector(".scroll-progress-bar");

/**
 * Scroll Progress Bar — Updates width based on Lenis scroll progress.
 */
if (progressBar) {
    lenis.on('scroll', ({ scroll, limit }) => {
        const progress = (scroll / limit) * 100;
        gsap.set(progressBar, { width: `${progress}%` });
    });
}


/* ===========================================
   4. NAVIGATION — Hamburger Menu
   =========================================== */

const menuIcon = document.querySelector(".menu-icon");
const menuOverlay = document.querySelector(".menu-overlay");
const menuLinks = document.querySelectorAll(".menu-links a");
let isMenuOpen = false;

/**
 * Toggle the full-screen menu overlay on hamburger icon click.
 * - Opens: fades in overlay, animates links, stops scrolling.
 * - Closes: fades out overlay, resumes scrolling.
 */
if (menuIcon && menuOverlay) {
    const toggleMenu = (open) => {
        isMenuOpen = open;
        menuIcon.classList.toggle("menu-active", isMenuOpen);

        // Animate overlay visibility
        gsap.to(menuOverlay, {
            opacity: isMenuOpen ? 1 : 0,
            y: isMenuOpen ? 0 : -20,
            pointerEvents: isMenuOpen ? "auto" : "none",
            duration: 0.5,
            ease: "power3.out"
        });

        if (isMenuOpen) {
            // Staggered link reveal
            gsap.fromTo(menuLinks, { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.07, duration: 0.4, delay: 0.2 });
            // Animate Auth Buttons in Menu
            gsap.fromTo(".menu-auth-group", { y: 20, opacity: 0 }, { y: 0, opacity: 1, duration: 0.4, delay: 0.5 });
            lenis.stop(); // Prevent scrolling while menu is open
        } else {
            lenis.start();
        }
    };

    menuIcon.addEventListener("click", () => toggleMenu(!isMenuOpen));

    // Close menu and smooth scroll when a link is clicked
    menuLinks.forEach((link) => {
        link.addEventListener("click", (e) => {
            const targetId = link.getAttribute("href");
            if (targetId && targetId.startsWith("#")) {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    toggleMenu(false); // Close the menu
                    lenis.scrollTo(targetElement, { offset: 0, duration: 1.5 });
                }
            }
        });
    });
}


/* ===========================================
   5. HERO SECTION — Entry Animation
   =========================================== */

/**
 * playInitialAnimations() — Cinematic hero section reveal.
 * - Splits the hero title into individual word spans for animation.
 * - Animates: background video zoom, title words rise + rotate, nav/subtitle/CTA fade in.
 */
function playInitialAnimations() {
    const title = document.querySelector(".hero-title");
    if (title) {
        // Split title text into animated word spans
        const lines = title.innerHTML.split(/<br\s*\/?>/i);
        title.innerHTML = lines.map(line => {
            const words = line.trim().split(/\s+/);
            return words.map((word, i) => {
                if (!word) return "";
                const space = (i === words.length - 1) ? "" : "&nbsp;";
                return `<span style="display:inline-block; opacity:0; transform:translateY(100px) rotate(3deg); will-change: transform, opacity;">${word}</span>${space}`;
            }).join("");
        }).join("<br>");
        gsap.set(".hero-title", { opacity: 1 });
    }

    // Timeline: orchestrate all hero animations
    const tl = gsap.timeline();
    tl.from(".hero-bg-video", { scale: 1.2, duration: 2, ease: "power2.out" }, 0)
        .to(".hero-title span", { y: 0, opacity: 1, rotation: 0, duration: 1.2, stagger: 0.08, ease: "power4.out" }, 0.4)
        .fromTo([".nav-bar", ".hero-subtitle", ".cta-button", ".nav-actions"],
            { y: 30, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 1, stagger: 0.1, ease: "power3.out" }, 0.8)
        .to(".hero-stats", { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, 1.2);

    // Animate hero numbers
    setTimeout(() => {
        const stats = document.querySelectorAll('.stat-number');
        stats.forEach(stat => {
            const target = parseInt(stat.getAttribute('data-target'));
            gsap.to(stat, {
                innerHTML: target,
                duration: 2,
                snap: { innerHTML: 1 },
                ease: "power2.out",
                onUpdate: function () {
                    stat.innerHTML = Math.ceil(this.targets()[0].innerHTML);
                }
            });
        });
    }, 1200);
}

/**
 * loadHeroData() — Synchronizes the landing page Hero section with CMS data.
 */
async function loadHeroData() {
    try {
        const data = await APIService.getHero();
        if (data.status === 'success' && data.hero) {
            const h = data.hero;
            
            // 1. Background Video (ID-based targeting)
            const bgVideo = document.getElementById("mainHeroVideo");
            if (bgVideo && h.bg_video) {
                bgVideo.querySelector("source").src = h.bg_video;
                bgVideo.load();
            }

            // 2. Subtitle
            const subtitle = document.getElementById("heroSubtitleText");
            if (subtitle && h.subtitle) subtitle.innerText = h.subtitle;

            // 3. Title (Support both ":" and "\n" for breaks)
            const title = document.getElementById("heroTitleText");
            if (title && h.title) {
                // Convert colon and newlines to <br> for HTML rendering
                title.innerHTML = h.title.replace(/:/g, '<br>').replace(/\n/g, '<br>');
            }

            // 4. Showreel Video
            const srVideo = document.getElementById("mainShowreelVideo");
            if (srVideo && h.showreel_video) {
                srVideo.querySelector("source").src = h.showreel_video;
                srVideo.load();
            }
        }
    } catch (e) {
        console.warn("Dynamic Hero Load Failed: Using default fallback content.", e);
    }
}

// Trigger Hero data load immediately on script execution
loadHeroData();


/* ===========================================
   6. VIDEO MODAL — Showreel Popup
   =========================================== */

const watchBtn = document.querySelector(".cta-button");
const videoModal = document.querySelector(".video-modal");
const showreelVideo = document.querySelector(".showreel-video");

/**
 * toggleVideo() — Open or close the video modal.
 * - Open: zoom-in animation on the video container, fade in background.
 * - Close: zoom-out animation, reset video, fade out background.
 * @param {boolean} open - true to open, false to close.
 */
if (watchBtn && videoModal && showreelVideo) {
    const toggleVideo = (open) => {
        if (open) {
            videoModal.classList.add("active");
            lenis.stop();
            showreelVideo.play();

            // Video container: cinematic zoom-in from center
            gsap.fromTo(".video-container",
                { scale: 0, opacity: 0, x: 0, y: 0, transformOrigin: "center center" },
                { scale: 1, opacity: 1, x: 0, y: 0, duration: 1.2, ease: "expo.out" }
            );

            // Background overlay: fade in
            gsap.fromTo(videoModal,
                { opacity: 0 },
                { opacity: 1, duration: 0.5 }
            );
        } else {
            // Video container: zoom-out
            gsap.to(".video-container", { scale: 0.5, opacity: 0, duration: 0.5, ease: "power3.in" });

            // Background overlay: fade out, then cleanup
            gsap.to(videoModal, {
                opacity: 0,
                duration: 0.5,
                onComplete: () => {
                    videoModal.classList.remove("active");
                    showreelVideo.pause();
                    showreelVideo.currentTime = 0;
                    lenis.start();
                }
            });
        }
    };

    watchBtn.addEventListener("click", () => toggleVideo(true));
    document.querySelector(".close-video")?.addEventListener("click", () => toggleVideo(false));
    document.querySelector(".video-overlay")?.addEventListener("click", () => toggleVideo(false));
}


/* ===========================================
   7. SERVICES SECTION — Tabs & Cards Reveal + Parallax
   =========================================== */

// --- Scroll Reveal ---
const servicesSection = document.querySelector(".services-section");
const tabBtns = document.querySelectorAll(".tab-btn");
const serviceGrids = document.querySelectorAll(".services-grid");

// Trigger entrance animation when scrolling to the services section, and exit when leaving
if (servicesSection) {
    observeElementToggle(servicesSection,
        // onEnter
        () => {
            const activeGrid = document.querySelector(".services-grid:not(.hidden)");
            if (activeGrid) {
                gsap.fromTo(activeGrid.querySelectorAll(".service-card"),
                    { y: 50, opacity: 0 },
                    { y: 0, opacity: 1, duration: 0.8, stagger: 0.15, ease: "power3.out", overwrite: "auto" }
                );
            }
        },
        // onExit
        () => {
            const activeGrid = document.querySelector(".services-grid:not(.hidden)");
            if (activeGrid) {
                gsap.to(activeGrid.querySelectorAll(".service-card"),
                    { y: 50, opacity: 0, duration: 0.5, stagger: 0.1, ease: "power2.in", overwrite: "auto" }
                );
            }
        },
        { threshold: 0.15 } // Lowered threshold because on mobile the section height is huge
    );
}

// --- Tabs Logic ---

tabBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        // Remove active class from all buttons
        tabBtns.forEach(b => b.classList.remove("active"));
        // Add active class to clicked button
        btn.classList.add("active");

        const targetTab = btn.getAttribute("data-tab");

        // Hide all grids
        serviceGrids.forEach(grid => {
            if (grid.id === `tab-${targetTab}`) {
                grid.classList.remove("hidden");
                // Small delay to allow display:block to apply before animating opacity
                setTimeout(() => {
                    grid.classList.add("active");
                    // Re-trigger scroll reveal if needed, or simply let CSS handle opacity
                    gsap.fromTo(grid.querySelectorAll(".service-card"),
                        { y: 50, opacity: 0 },
                        { y: 0, opacity: 1, duration: 0.5, stagger: 0.1, ease: "power2.out" }
                    );
                }, 10);
            } else {
                grid.classList.add("hidden");
                grid.classList.remove("active");
            }
        });
    });
});

// --- Mouse Parallax & Magnetic Effect for Cards ---
const serviceCards = document.querySelectorAll(".service-card");

serviceCards.forEach((card) => {
    const cardBg = card.querySelector(".card-image-bg");

    if (cardBg) {
        // Mouse move: parallax background + magnetic card movement
        card.addEventListener("mousemove", (e) => {
            const rect = card.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;

            // Background parallax (opposite direction)
            gsap.to(cardBg, {
                x: -x * 0.1,
                y: -y * 0.1,
                duration: 0.5,
                ease: "power2.out"
            });

            // Card magnetic attraction
            gsap.to(card, {
                x: x * 0.2,
                y: y * 0.2,
                duration: 0.3,
                ease: "power2.out"
            });
        });

        // Mouse enter: show background with zoom
        card.addEventListener("mouseenter", () => {
            gsap.to(cardBg, {
                opacity: 1,
                scale: 1.1,
                duration: 0.5,
                ease: "power2.out"
            });
        });

        // Mouse leave: reset everything
        card.addEventListener("mouseleave", () => {
            // Reset background
            gsap.to(cardBg, {
                opacity: 0,
                scale: 1,
                x: 0,
                y: 0,
                duration: 0.5,
                ease: "power2.out"
            });

            // Reset card position with elastic bounce
            gsap.to(card, {
                x: 0,
                y: 0,
                duration: 0.8,
                ease: "elastic.out(1, 0.3)"
            });
        });
    }
});


/* ===========================================
   8. PORTFOLIO SECTION — Alternating Slide-in + Text Reveal
   =========================================== */
/**
 * Portfolio Items — Alternating slide-in with clipPath image reveal.
 * - Even items (0, 2) slide from left, odd items (1, 3) slide from right.
 * - Images reveal top-to-bottom via clipPath animation.
 * - Text appears letter-by-letter using splitTextToSpans helper.
 * - All animations reverse when scrolling up (observeElementToggle).
 */
const cinematicPortfolioItems = document.querySelectorAll(".project-item");

/**
 * Helper: Split text content of an element into individual <span> characters.
 * Preserves <br> and other HTML elements.
 */
function splitTextToSpans(el) {
    if (!el) return [];
    const nodes = Array.from(el.childNodes);
    el.innerHTML = '';
    const spans = [];

    nodes.forEach(node => {
        if (node.nodeType === 3) { // Text node
            // Split the text, but filter out pure layout whitespace (newlines, tabs)
            const textContent = node.textContent;

            for (let i = 0; i < textContent.length; i++) {
                const char = textContent[i];
                if (char === ' ') {
                    // Preserve normal spaces as raw text nodes so they collapse naturally
                    el.appendChild(document.createTextNode(' '));
                } else if (char === '\n' || char === '\r' || char === '\t') {
                    // Skip layout breaks entirely to avoid animating invisible gaps
                    continue;
                } else {
                    const span = document.createElement('span');
                    span.textContent = char;
                    span.style.display = 'inline-block';
                    span.style.opacity = '0';
                    el.appendChild(span);
                    spans.push(span);
                }
            }
        } else {
            el.appendChild(node); // Preserve <br> and other elements
        }
    });
    return spans;
}

cinematicPortfolioItems.forEach((item, index) => {
    const image = item.querySelector(".project-image");
    const text = item.querySelector(".project-text");
    const title = text ? text.querySelector("h3") : null;
    const desc = text ? text.querySelector("p") : null;

    // Split text into individual character spans
    const titleSpans = splitTextToSpans(title);
    const descSpans = splitTextToSpans(desc);

    // Alternating direction: Even (0, 2) -> from Left, Odd (1, 3) -> from Right
    const xStart = index % 2 === 0 ? -150 : 150;

    // Set initial hidden state
    gsap.set(item, { x: xStart, opacity: 0 });
    if (image) gsap.set(image, { clipPath: "inset(0 0 100% 0)" });
    if (text) gsap.set(text, { opacity: 1 });

    let currentTl = null; // Track item-specific timeline

    // Toggle observer: animate IN on enter, animate OUT (reverse) on exit
    observeElementToggle(item,
        // ON ENTER — Slide in + letter-by-letter text
        () => {
            if (currentTl) currentTl.kill();
            gsap.killTweensOf([item, image, ...titleSpans, ...descSpans]);
            
            currentTl = gsap.timeline();

            // Step 1: Slide entire item in
            currentTl.to(item, {
                x: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power3.out"
            });

            // Step 2: Reveal image top-to-bottom
            if (image) {
                currentTl.to(image, {
                    clipPath: "inset(0 0 0% 0)",
                    duration: 1.2,
                    ease: "power2.out"
                }, "-=0.6");
            }

            // Step 3: Title letters appear one by one
            if (titleSpans.length > 0) {
                currentTl.fromTo(titleSpans, 
                    { opacity: 0 },
                    { 
                        opacity: 1, 
                        duration: 0.05, 
                        stagger: 0.02, 
                        ease: "none",
                        overwrite: "all" 
                    }, 
                    "<0.4"
                );
            }

            // Step 4: Description letters appear in strict sequence
            if (descSpans.length > 0) {
                currentTl.fromTo(descSpans, 
                    { opacity: 0 },
                    { 
                        opacity: 1, 
                        duration: 0.05, 
                        stagger: 0.015, 
                        ease: "none",
                        overwrite: "all" 
                    }, 
                    ">" // Starts immediately after title finishes
                );
            }
        },
        // ON EXIT — Reverse all
        () => {
            if (currentTl) currentTl.kill();
            gsap.killTweensOf([item, image, ...titleSpans, ...descSpans]);
            
            gsap.to(item, {
                x: xStart,
                opacity: 0,
                duration: 0.8,
                ease: "power2.in"
            });
            if (image) gsap.to(image, { clipPath: "inset(0 0 100% 0)", duration: 0.3, ease: "power2.in" });
            
            // Force reset of character spans
            if (titleSpans.length > 0) gsap.set(titleSpans, { opacity: 0 });
            if (descSpans.length > 0) gsap.set(descSpans, { opacity: 0 });
        },
        { threshold: 0.5 }
    );
});


/* ===========================================
   9. FOOTER SECTION — Headline + Rectangle + Magnetic Button
   =========================================== */

/**
 * Footer Headline — Letter-by-letter typing reveal.
 * Splits "READY TO START A PROJECT?" into individual <span> characters.
 * Step 1: Characters appear dimmed in sequence (typing effect).
 * Step 2: Characters brighten to white with a trailing light effect.
 */
const footerHeadline = document.querySelector(".footer-headline h2");
if (footerHeadline) {
    // Reuse splitTextToSpans helper for consistent text splitting
    splitTextToSpans(footerHeadline);

    // Set initial hidden state for letters (use CSS variable)
    const dimColor = getComputedStyle(document.documentElement).getPropertyValue('--border-light').trim();
    gsap.set(".footer-headline h2 span", { opacity: 0, color: dimColor });

    const footerHeadlineContainer = document.querySelector(".footer-headline");
    if (footerHeadlineContainer) {
        observeElement(footerHeadlineContainer, () => {
            const tl = gsap.timeline();

            // Step 1: Typing — letters appear dimmed
            tl.to(".footer-headline h2 span", {
                opacity: 1,
                duration: 0.1,
                stagger: 0.04,
                ease: "none"
            }, 0);

            // Step 2: Trailing light — letters brighten to white (use CSS variable)
            const brightColor = getComputedStyle(document.documentElement).getPropertyValue('--text-primary').trim();
            tl.to(".footer-headline h2 span", {
                color: brightColor,
                duration: 0.2,
                stagger: 0.04,
                ease: "power2.out"
            }, 0.2);
        }, { threshold: 0.2 });
    }
}

/**
 * Footer Rectangle — Animated stroke drawing.
 * The SVG rectangle draws itself when the footer scrolls into view.
 */
const footerRect = document.querySelector(".footer-rect");
if (footerRect) {
    const totalLength = footerRect.getTotalLength();

    // Set initial state: stroke fully hidden
    gsap.set(footerRect, {
        strokeDasharray: totalLength,
        strokeDashoffset: totalLength
    });

    const footerContent = document.querySelector(".footer-content");
    if (footerContent) {
        observeElement(footerContent, () => {
            gsap.to(footerRect, {
                strokeDashoffset: 0,
                duration: 3,
                ease: "power1.inOut"
            });
        }, { threshold: 0.1 });
    }
}

/**
 * Footer Magnetic Button — "LET'S TALK" button with magnetic attraction.
 * The button follows the mouse within its wrapper area.
 * On mouse leave, it snaps back with an elastic bounce.
 */
const magWrap = document.querySelector(".magnetic-wrap");
const magBtn = document.querySelector(".magnetic-btn");

if (magWrap && magBtn) {
    // Mouse move: button follows cursor
    magWrap.addEventListener("mousemove", (e) => {
        const rect = magWrap.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        gsap.to(magBtn, { x: x * 0.4, y: y * 0.4, duration: 0.3, ease: "power2.out" });
    });

    // Mouse leave: snap back to center with bounce
    magWrap.addEventListener("mouseleave", () => {
        gsap.to(magBtn, { x: 0, y: 0, duration: 0.8, ease: "elastic.out(1, 0.3)" });
    });
}


/* ===========================================
   10. PROJECT DETAILS MODAL
   =========================================== */

// Database for Projects loaded from backend
const projectsDB = window.algraphyProjects || [];

const projectModal = document.querySelector(".project-modal");
const projectContainer = document.querySelector(".project-modal-container");
const projectContent = document.getElementById("project-modal-content");
const closeProjectBtn = document.querySelector(".close-project");
const projectBtns = document.querySelectorAll(".magnetic-project-btn[data-project-id]");

/**
 * Open Project Modal and populate data
 */
const openProjectModal = (projectId) => {
    const project = projectsDB.find(p => p.ID == projectId);
    if (!project) return;
    
    let featuresArray = [];
    try {
        featuresArray = typeof project.Key_Features === 'string' ? JSON.parse(project.Key_Features) : (project.Key_Features || []);
        if(!Array.isArray(featuresArray)) featuresArray = [];
    } catch(e) {}

    // Inject HTML
    projectContent.innerHTML = `
        <img src="${project.Main_Image || 'Assets/image/Aura.png'}" alt="${project.Project_name}" class="modal-hero-image">
        
        <div class="modal-details">
            <div class="modal-header">
                <h3 class="modal-title">${project.Project_name}</h3>
                <div class="modal-meta">
                    <span>${project.Service_Category || 'General'}</span>
                    <span>${project.Start_Date || '-'} — ${project.End_Date || '-'}</span>
                </div>
            </div>

            <p class="modal-description">${project.Description || ''}</p>

            <div class="modal-features">
                <h4>Key Features</h4>
                <ul>
                    ${featuresArray.map(f => `<li>${f}</li>`).join('')}
                </ul>
            </div>

            <div class="modal-gallery">
                ${(project.gallery || []).map(img => `
                    <div class="gallery-item">
                        <img src="${img}" alt="Gallery image" loading="lazy">
                    </div>
                `).join('')}
            </div>

            <div class="modal-cta">
                <button class="submit-btn trigger-contact">DISCUSS SIMILAR PROJECT</button>
            </div>
        </div>
    `;

    // Bind new contact button
    const triggerContactBtn = projectContent.querySelector(".trigger-contact");
    triggerContactBtn.addEventListener("click", () => {
        closeProjectModalFunc(() => {
            // Open Contact Modal after Project Modal closes
            if (window.openContactModal) {
                window.openContactModal();
            } else if (magBtn) {
                magBtn.click(); // Trigger click on existing Let's Talk button
            }
        });
    });

    // Show Modal
    projectContainer.setAttribute("data-lenis-prevent", "true");
    projectModal.classList.add("active");
    lenis.stop();

    // Reset scroll inside modal
    projectContainer.scrollTop = 0;

    // Animate container in
    gsap.fromTo(projectContainer,
        { scaleY: 0, opacity: 0 },
        { scaleY: 1, opacity: 1, duration: 0.6, ease: "power2.out" }
    );

    // Fade in content
    gsap.fromTo(projectContent,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.4, delay: 0.3 }
    );
};

/**
 * Close Project Modal
 */
const closeProjectModalFunc = (callback) => {
    gsap.to(projectContainer, {
        scaleY: 0,
        opacity: 0,
        duration: 0.4,
        ease: "power2.in",
        onComplete: () => {
            projectModal.classList.remove("active");
            lenis.start();
            if (callback && typeof callback === 'function') callback();
        }
    });
};

// Event Listeners for Opening
projectBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-project-id");
        openProjectModal(id);
    });
});

// Event Listeners for Closing
if (closeProjectBtn) closeProjectBtn.addEventListener("click", () => closeProjectModalFunc());
const projectOverlay = document.querySelector(".project-overlay");
if (projectOverlay) projectOverlay.addEventListener("click", () => closeProjectModalFunc());


/* ===========================================
   11. CONTACT MODAL — Cinematic Reveal
   =========================================== */

const contactModal = document.querySelector(".contact-modal");
const closeContact = document.querySelector(".close-contact");
const contactContainer = document.querySelector(".contact-container");

/**
 * Contact Modal — Open/Close with cinematic vertical expansion.
 */
window.openContactModal = () => {
    if (!contactModal) return;
    contactModal.classList.add("active");
    lenis.stop(); // Prevent scrolling while modal is open

    // Allow native scroll inside the container (important for mobile/tablet)
    if (contactContainer) {
        contactContainer.setAttribute("data-lenis-prevent", "true");
        contactContainer.scrollTop = 0;
    }

    // Container: vertical expansion reveal
    gsap.fromTo(contactContainer,
        { scaleY: 0, opacity: 0 },
        {
            scaleY: 1,
            opacity: 1,
            duration: 0.6,
            ease: "power2.out"
        }
    );

    // Form content: staggered fade-in
    gsap.fromTo(".contact-form > *, .contact-container h2",
        { y: 20, opacity: 0 },
        {
            y: 0,
            opacity: 1,
            duration: 0.4,
            stagger: 0.1,
            delay: 0.3
        }
    );
};

if (contactModal && magBtn) {
    // Open Modal from main Let's Talk button
    magBtn.addEventListener("click", window.openContactModal);

    /**
     * closeModal() — Collapse the contact modal with reverse animation.
     */
    const closeModal = () => {
        gsap.to(contactContainer, {
            scaleY: 0,
            opacity: 0,
            duration: 0.4,
            ease: "power2.in",
            onComplete: () => {
                contactModal.classList.remove("active");
                if (contactContainer) contactContainer.removeAttribute("data-lenis-prevent");
                lenis.start(); // Resume scrolling
            }
        });
    };

    if (closeContact) {
        closeContact.addEventListener("click", closeModal);
    }

    // Close on overlay click
    const overlay = contactModal.querySelector(".contact-overlay");
    if (overlay) {
        overlay.addEventListener("click", closeModal);
    }
}

// Bind Contact Modal to new Service Card Buttons and Footer Link
const contactTriggers = document.querySelectorAll(".card-contact-btn, .footer-contact-trigger");
contactTriggers.forEach(btn => {
    btn.addEventListener("click", (e) => {
        e.preventDefault();
        e.stopPropagation(); // prevent triggering other card effects if any
        if (window.openContactModal) {
            window.openContactModal();
        }
    });
});

// --- Custom Alert System ---
window.showAlert = (title, message, isError = false) => {
    const alertModal = document.getElementById('customAlert');
    const alertOverlay = document.getElementById('customAlertOverlay');
    const alertTitle = document.getElementById('customAlertTitle');
    const alertMsg = document.getElementById('customAlertMessage');
    const alertIcon = alertModal.querySelector('.alert-icon');

    if (!alertModal) return;

    alertTitle.innerText = title;
    alertMsg.innerText = message;
    
    if (isError) {
        alertIcon.className = 'fa fa-exclamation-circle alert-icon';
        alertIcon.style.color = '#ff4d4d';
    } else {
        alertIcon.className = 'fa fa-check-circle alert-icon';
        alertIcon.style.color = 'var(--primary)';
    }

    alertModal.classList.add('active');
    alertOverlay.classList.add('active');
};

document.getElementById('closeAlertBtn')?.addEventListener('click', () => {
    document.getElementById('customAlert').classList.remove('active');
    document.getElementById('customAlertOverlay').classList.remove('active');
});

// Contact Form Submission Handler (Lead Generation)
const contactForm = document.querySelector('.contact-form');
if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const phone = document.getElementById('phone').value.trim();
        const email = document.getElementById('email').value.trim();

        // 1. Phone Validation (Numbers and + only)
        const phoneRegex = /^[0-9+]+$/;
        if (!phoneRegex.test(phone)) {
            window.showAlert('Invalid Phone', 'Please use only digits and the "+" symbol for your phone number.', true);
            return;
        }

        // 2. Email Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            window.showAlert('Invalid Email', 'Please provide a valid email address so we can reach you.', true);
            return;
        }

        const submitBtn = contactForm.querySelector('.submit-btn');
        const originalText = submitBtn.innerText;
        submitBtn.innerText = 'Sending...';
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('name', document.getElementById('name').value);
        formData.append('phone', phone);
        formData.append('email', email);
        formData.append('date', document.getElementById('date').value);
        formData.append('time', document.getElementById('time').value);

        try {
            const res = await APIService.submitLead(formData);
            if (res.status === 'success') {
                window.showAlert(res.title || 'Success', res.message);
                contactForm.reset();
                const closeBtn = document.querySelector('.close-contact');
                if (closeBtn) closeBtn.click();
            } else {
                const detailMsg = res.details ? `\nDetails: ${res.details}` : '';
                window.showAlert('Oops!', (res.message || 'Something went wrong.') + detailMsg, true);
            }
        } catch (err) {
            console.error('Lead submission failed:', err);
            window.showAlert('Error', 'Critical system error. Please try again later.', true);
        } finally {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }
    });
}

// Smooth scroll for all anchor links (including logo)
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        // Only if not in menu (already handled there)
        if (this.closest('.menu-overlay')) return;

        const targetId = this.getAttribute('href');
        if (targetId && targetId !== '#') {
            e.preventDefault();
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                lenis.scrollTo(targetElement, { offset: 0, duration: 1.5 });
            }
        }
    });
});

/* ===========================================
   DYNAMIC ENERGY LINE (Draw on Scroll)
   =========================================== */

// variables to save the length and position of the line
let globalPathLength = 0;
let lineStartY = 0;
let lineEndY = 0;

function drawConnectionLine() {
    const svg = document.getElementById('global-line-svg');
    const path = document.getElementById('dynamic-path');

    // 1. the start and end elements
    const startElem = document.querySelector('.hero-section');
    const projects = document.querySelectorAll('.portfolio-section');
    const endElem = projects[projects.length - 1];

    if (startElem && endElem && svg && path) {
        // update the svg height to match the actual page height
        svg.style.height = document.body.scrollHeight + 'px';

        const startRect = startElem.getBoundingClientRect();
        const endRect = endElem.getBoundingClientRect();
        const scrollTop = window.scrollY || document.documentElement.scrollTop;

        // the start and end positions
        const x1 = startRect.left + (startRect.width / 2);
        const y1 = startRect.bottom + scrollTop;
        const x2 = endRect.left + (endRect.width / 2);
        const y2 = endRect.bottom + scrollTop;

        // save the y positions to use them in the scroll calculation
        lineStartY = y1;
        lineEndY = y2;

        // calculate the curve path
        const curveOffset = Math.abs(y2 - y1) / 2;
        const d = `M ${x1} ${y1} 
                   C ${x1} ${y1 + curveOffset}, 
                     ${x2} ${y2 - curveOffset}, 
                     ${x2} ${y2}`;

        path.setAttribute('d', d);

        // 1. calculate the total length of the line
        globalPathLength = path.getTotalLength();

        // 2. set the line to be hidden and shown
        path.style.strokeDasharray = globalPathLength;
        path.style.strokeDashoffset = globalPathLength; // hide the line completely at the beginning

        // update the line draw based on the current scroll position
        updateLineDraw();
    }
}

// the function responsible for drawing the line with the scroll
function updateLineDraw() {
    const path = document.getElementById('dynamic-path');
    if (!path || globalPathLength === 0) return;

    // scroll position
    const scrollY = window.scrollY;
    const windowHeight = window.innerHeight;

    // when the line start to draw
    const drawStart = lineStartY - (windowHeight / 2.5);

    // when the line end to draw
    const drawEnd = lineEndY - (windowHeight / 2.5);

    // calculate the progress of the line
    let progress = (scrollY - drawStart) / (drawEnd - drawStart);
    progress = Math.max(0, Math.min(1, progress)); // prevent the progress from exceeding 0 or 1

    // apply the progress to the line
    path.style.strokeDashoffset = globalPathLength - (globalPathLength * progress);
}

// 1. draw the line when the page load
window.addEventListener('load', () => {
    drawConnectionLine();
    setTimeout(drawConnectionLine, 2500);
});

// 2. observe the changes in the screen
const resizeObserver = new ResizeObserver(() => {
    drawConnectionLine();
});
resizeObserver.observe(document.body);

// 3. connect the line draw to the lenis scroll
if (typeof lenis !== 'undefined') {
    lenis.on('scroll', updateLineDraw);
} else {
    // fallback code in case lenis didn't work
    window.addEventListener('scroll', updateLineDraw);
}



