/* ============================================================
   AlGraphy Studio — Main Script
   Ordered by page appearance:
   1. Initialization (Lenis, Helpers)
   2. Loader & Page Load
   3. Custom Cursor & Scroll Progress Bar
   4. Navigation (Hamburger Menu)
   5. Hero Section (Entry Animation)
   6. Video Modal (Showreel)
   7. Services Section (Cards Reveal + Mouse Parallax)
   8. Portfolio Section (Alternating Slide-in + Text Reveal)
   9. Footer Section (Headline Letters + Rectangle Draw + Magnetic Button)
   10. Contact Modal
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
 * raf() — Recursive animation frame loop.
 * Continuously updates Lenis on every frame.
 */
function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
}
requestAnimationFrame(raf);

/**
 * Sync GSAP ticker with Lenis for consistent timing.
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
        playInitialAnimations();
    };

    if (loader) {
        // Fade out the loader, then initialize
        gsap.to(loader, {
            opacity: 0,
            duration: 0.8,
            ease: "power2.inOut",
            onComplete: () => {
                loader.style.display = "none";
                initializeSite();
            }
        });
    } else {
        initializeSite();
    }
});


/* ===========================================
   3. CUSTOM CURSOR & SCROLL PROGRESS BAR
   =========================================== */

const cursor = document.querySelector(".custom-cursor");
const progressBar = document.querySelector(".scroll-progress-bar");

// Only enable custom cursor on devices with a mouse (not touch)
const isMouseDevice = window.matchMedia("(pointer: fine)").matches;

if (cursor && isMouseDevice) {

    /**
     * Track mouse position and move the custom cursor with GSAP.
     */
    window.addEventListener("mousemove", (e) => {
        gsap.to(cursor, {
            x: e.clientX,
            y: e.clientY,
            opacity: 1,
            duration: 0.1,
            ease: "power2.out"
        });
    });

    /**
     * Hide cursor when the mouse leaves the browser window.
     */
    document.addEventListener("mouseleave", () => {
        gsap.to(cursor, { opacity: 0, duration: 0.3 });
    });

    /**
     * Show cursor when the mouse re-enters the browser window.
     */
    document.addEventListener("mouseenter", () => {
        gsap.to(cursor, { opacity: 1, duration: 0.3 });
    });

    /**
     * Expand cursor on hover over interactive elements.
     */
    const hovers = document.querySelectorAll("a, button, .menu-icon, .service-card, .project-item, .magnetic-wrap");
    hovers.forEach(el => {
        el.addEventListener("mouseenter", () => cursor.classList.add("hovered"));
        el.addEventListener("mouseleave", () => cursor.classList.remove("hovered"));
    });
} else if (cursor) {
    // Hide custom cursor on touch devices
    cursor.style.display = "none";
}

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
    menuIcon.addEventListener("click", () => {
        isMenuOpen = !isMenuOpen;
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
            lenis.stop(); // Prevent scrolling while menu is open
        } else {
            lenis.start();
        }
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
            return line.trim().split(/\s+/).map(word => {
                if (!word) return "";
                return `<span style="display:inline-block; opacity:0; transform:translateY(100px) rotate(3deg); will-change: transform, opacity;">${word}&nbsp;</span>`;
            }).join("");
        }).join("<br>");
        gsap.set(".hero-title", { opacity: 1 });
    }

    // Timeline: orchestrate all hero animations
    const tl = gsap.timeline();
    tl.from(".hero-bg-video", { scale: 1.2, duration: 2, ease: "power2.out" }, 0)
        .to(".hero-title span", { y: 0, opacity: 1, rotation: 0, duration: 1.2, stagger: 0.08, ease: "power4.out" }, 0.4)
        .fromTo([".nav-bar", ".hero-subtitle", ".cta-button"],
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
                onUpdate: function() {
                    stat.innerHTML = Math.ceil(this.targets()[0].innerHTML);
                }
            });
        });
    }, 1200);
}


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
   7. SERVICES SECTION — Cards Reveal + Mouse Parallax
   =========================================== */

const serviceCards = document.querySelectorAll(".service-card");

/**
 * Service Cards Scroll Reveal (IntersectionObserver).
 * Center card appears first, then the two side cards follow.
 */
if (serviceCards.length >= 3) {
    // Set initial hidden state
    gsap.set(serviceCards[1], { y: 100, opacity: 0 });
    gsap.set([serviceCards[0], serviceCards[2]], { y: 150, opacity: 0 });

    const servicesGrid = document.querySelector(".services-grid");
    if (servicesGrid) {
        observeElement(servicesGrid, () => {
            const tl = gsap.timeline();
            tl.to(serviceCards[1], {
                y: 0, opacity: 1, duration: 0.8, ease: "power3.out"
            })
                .to([serviceCards[0], serviceCards[2]], {
                    y: 0, opacity: 1, duration: 0.8, ease: "power3.out"
                }, "-=0.5");
        }, { threshold: 0.1 });
    }
}

/**
 * Service Cards Mouse Parallax & Magnetic Effect.
 * - Background image follows mouse in reverse direction (parallax).
 * - Card itself moves toward the mouse (magnetic attraction).
 * - On hover: background image fades in with zoom.
 * - On leave: everything resets smoothly.
 */
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
            node.textContent.split('').forEach(char => {
                if (char === ' ') {
                    el.appendChild(document.createTextNode(' '));
                } else {
                    const span = document.createElement('span');
                    span.textContent = char;
                    span.style.display = 'inline-block';
                    span.style.opacity = '0';
                    el.appendChild(span);
                    spans.push(span);
                }
            });
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

    // Toggle observer: animate IN on enter, animate OUT (reverse) on exit
    observeElementToggle(item,
        // ON ENTER — Slide in + letter-by-letter text
        () => {
            gsap.killTweensOf([item, image, ...titleSpans, ...descSpans]);
            const tl = gsap.timeline();

            // Step 1: Slide entire item in
            tl.to(item, {
                x: 0,
                opacity: 1,
                duration: 1.2,
                ease: "power3.out"
            });

            // Step 2: Reveal image top-to-bottom
            if (image) {
                tl.to(image, {
                    clipPath: "inset(0 0 0% 0)",
                    duration: 1.2,
                    ease: "power2.out"
                }, "-=0.6");
            }

            // Step 3: Title letters appear one by one
            if (titleSpans.length > 0) {
                tl.to(titleSpans, {
                    opacity: 1,
                    duration: 0.05,
                    stagger: 0.03,
                    ease: "none"
                }, "-=0.8");
            }

            // Step 4: Description letters appear one by one
            if (descSpans.length > 0) {
                tl.to(descSpans, {
                    opacity: 1,
                    duration: 0.05,
                    stagger: 0.02,
                    ease: "none"
                }, "-=0.4");
            }
        },
        // ON EXIT — Reverse all
        () => {
            gsap.killTweensOf([item, image, ...titleSpans, ...descSpans]);
            gsap.to(item, {
                x: xStart,
                opacity: 0,
                duration: 0.8,
                ease: "power2.in"
            });
            if (image) gsap.to(image, { clipPath: "inset(0 0 100% 0)", duration: 0.3, ease: "power2.in" });
            // Reset all character spans
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
   10. CONTACT MODAL — Cinematic Reveal
   =========================================== */

const contactModal = document.querySelector(".contact-modal");
const closeContact = document.querySelector(".close-contact");
const contactContainer = document.querySelector(".contact-container");

/**
 * Contact Modal — Open/Close with cinematic vertical expansion.
 * - Open: scaleY expands from 0 to 1, form fields fade in with stagger.
 * - Close: scaleY collapses back to 0.
 */
if (contactModal && magBtn) {
    // Open Modal
    magBtn.addEventListener("click", () => {
        contactModal.classList.add("active");
        lenis.stop(); // Prevent scrolling while modal is open

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
    });

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