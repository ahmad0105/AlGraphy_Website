/**
 * AlGraphy Studio — Robust Premium Cursor Engine
 * Handles initialization, smooth tracking, and interactive states.
 */
class PremiumCursor {
    constructor() {
        this.init();
    }

    init() {
        // 1. Check for GSAP availability
        if (!window.gsap) {
            console.warn("GSAP not found. Aborting premium cursor initialization.");
            return;
        }

        // 2. Ensure cursor element exists
        this.cursor = document.querySelector('.custom-cursor');
        if (!this.cursor) {
            this.cursor = document.createElement('div');
            this.cursor.className = 'custom-cursor';
            document.body.appendChild(this.cursor);
        }

        // 3. Setup Movement State
        this.pos = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
        this.mouse = { x: this.pos.x, y: this.pos.y };
        this.speed = 0.15;

        // 4. Register GSAP QuickSetters (High Performance Transforms)
        gsap.set(this.cursor, { xPercent: -50, yPercent: -50 });
        this.xSetter = gsap.quickSetter(this.cursor, "x", "px");
        this.ySetter = gsap.quickSetter(this.cursor, "y", "px");

        // 5. Signal Readiness (CSS will now hide default cursor)
        document.body.classList.add('custom-cursor-active');

        this.bindEvents();
        this.startRenderLoop();
    }

    bindEvents() {
        window.addEventListener("mousemove", (e) => {
            // Adjust for centered dot
            this.mouse.x = e.clientX;
            this.mouse.y = e.clientY;
        });

        // Hover Effect using Event Delegation
        document.addEventListener("mouseover", (e) => {
            const target = e.target.closest('a, button, .nav-item, [onclick], input, select, textarea, .clickable');
            if (target) this.cursor.classList.add('active');
        });

        document.addEventListener("mouseout", (e) => {
            const target = e.target.closest('a, button, .nav-item, [onclick], input, select, textarea, .clickable');
            if (target) this.cursor.classList.remove('active');
        });

        // Click Interaction Logic
        document.addEventListener("mousedown", () => {
            gsap.to(this.cursor, { scale: 0.7, duration: 0.15 });
        });
        document.addEventListener("mouseup", () => {
            gsap.to(this.cursor, { scale: 1, duration: 0.15 });
        });
    }

    startRenderLoop() {
        gsap.ticker.add(() => {
            // Smooth Linear Interpolation
            const dt = 1.0 - Math.pow(1.0 - this.speed, gsap.ticker.deltaRatio());
            
            this.pos.x += (this.mouse.x - this.pos.x) * dt;
            this.pos.y += (this.mouse.y - this.pos.y) * dt;

            this.xSetter(this.pos.x);
            this.ySetter(this.pos.y);
        });
    }
}

// Global Orchestration
(function() {
    const startCursor = () => {
        if (!window.algraphyCursorInstance) {
            window.algraphyCursorInstance = new PremiumCursor();
        }
    };

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', startCursor);
    } else {
        startCursor();
    }
    
    // Fallback: If for some reason DOMContentLoaded is late
    window.addEventListener('load', startCursor);
})();
