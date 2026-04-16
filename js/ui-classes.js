/**
 * AlGraphy Studio — UI Enhancements Classes (Powered by GSAP)
 * 
 * TABLE OF CONTENTS:
 * 1. CustomCursor (Interactive mouse follow effect)
 * 2. ThemeAnimator (Form field micro-interactions)
 * 
 * @package AlGraphy\UI
 */

/**
 * 1. CustomCursor
 * Creates and orchestrates the dot-following mouse effect.
 * Implements sophisticated boundary detection and hover scaling.
 */
class CustomCursor {
    constructor(cursorSelector = ".custom-cursor") {
        this.cursor = document.querySelector(cursorSelector);
        
        // Strict device detection: 
        // 1. Must support 'fine' pointer (mouse/stylus)
        // 2. Must NOT match mouse-less/touch-only patterns
        // 3. Screen width check as defensive measure
        this.isTouchDevice = window.matchMedia("(pointer: coarse)").matches;
        this.isMouseDevice = window.matchMedia("(pointer: fine)").matches && !this.isTouchDevice && window.innerWidth >= 1024;

        if (this.cursor && this.isMouseDevice) {
            this.init();
        } else if (this.cursor) {
            this.cursor.remove(); // Clean up from DOM on mobile
        }
    }

    init() {
        this.bindMovement();
        this.bindWindowBoundaries();
        this.bindHoverEffects();
        
        // Add active class to body for cursor: none styling, 
        // but the dot itself remains opacity:0 from CSS initially.
        document.body.classList.add("custom-cursor-active");
        console.log("Custom Cursor: Optimized for Precise Devices");
    }

    bindMovement() {
        window.addEventListener("mousemove", (e) => {
            // Move cursor and ensure it's visible while moving
            gsap.to(this.cursor, {
                x: e.clientX,
                y: e.clientY,
                opacity: 1, 
                duration: 0.1,
                ease: "power2.out",
                overwrite: "auto"
            });
        });
    }

    bindWindowBoundaries() {
        // Hide dot when mouse leaves the actual browser viewport
        document.addEventListener("mouseleave", () => {
            gsap.to(this.cursor, { opacity: 0, duration: 0.3, overwrite: "auto" });
        });
        
        // Show only when it enters again
        document.addEventListener("mouseenter", () => {
            gsap.to(this.cursor, { opacity: 1, duration: 0.3, overwrite: "auto" });
        });
    }

    bindHoverEffects() {
        // Use event delegation for better performance and dynamic element support
        document.addEventListener("mouseover", (e) => {
            const target = e.target.closest("a, button, input, textarea, .menu-icon, .service-card, .project-item, .magnetic-wrap, .nav-item, [role='button']");
            if (target) {
                this.cursor.classList.add("hovered");
            }
        });

        document.addEventListener("mouseout", (e) => {
            const target = e.target.closest("a, button, input, textarea, .menu-icon, .service-card, .project-item, .magnetic-wrap, .nav-item, [role='button']");
            if (target) {
                this.cursor.classList.remove("hovered");
            }
        });
    }
}

/**
 * Auto-Initialization Bootstrapper
 * Globally activates the custom cursor if the element is present in the DOM.
 */
document.addEventListener("DOMContentLoaded", () => {
    if (document.querySelector(".custom-cursor") && !window.appCursorInstance) {
        window.appCursorInstance = new CustomCursor();
    }

    // --- Global Logout Orchestrator ---
    const logoutBtn = document.getElementById('logoutBtn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async (e) => {
            e.preventDefault();
            
            // Visual feedback
            logoutBtn.style.opacity = '0.5';
            logoutBtn.style.pointerEvents = 'none';

            try {
                // Call backend session destruction
                if (typeof APIService !== 'undefined' && typeof APIService.logout === 'function') {
                    await APIService.logout();
                }
                
                // Clear any local storage if used (bonus security)
                localStorage.removeItem('user_data');
                
                // Redirect to login portal
                window.location.href = 'auth';
            } catch (err) {
                console.error("Logout Failure:", err);
                window.location.href = 'auth'; // Fallback redirect
            }
        });
    }
});

/**
 * 2. ThemeAnimator
 * Handles dynamic focus and blur animations for form components.
 * Enhances the premium feel through CSS Variable synchronization and GSAP.
 */
class ThemeAnimator {
    constructor() {
        this.initInputAnimations();
    }

    /**
     * Finds and animates form groups for a reactive UI experience
     */
    initInputAnimations() {
        const formGroups = document.querySelectorAll('.form-group');
        
        formGroups.forEach(group => {
            const input = group.querySelector('input');
            const label = group.querySelector('h3');
            
            if (!input) return;

            // FOCUS EVENT: Orchestrate glowing entrance
            input.addEventListener('focus', () => {
                const primaryColor = getComputedStyle(document.documentElement).getPropertyValue('--primary').trim() || '#dc2726';
                
                if(label) gsap.to(label, { color: primaryColor, duration: 0.3 });
                gsap.to(input, { 
                    borderColor: primaryColor, 
                    boxShadow: `0 0 15px rgba(220, 39, 38, 0.4)`, 
                    duration: 0.3 
                });
            });

            // BLUR EVENT: Graceful return to base state
            input.addEventListener('blur', () => {
                const defaultLabelColor = '#ffffff'; 
                const defaultBorderColor = 'rgba(255,255,255,0.1)';
                
                if(label) gsap.to(label, { color: defaultLabelColor, duration: 0.3 });
                gsap.to(input, { 
                    borderColor: defaultBorderColor, 
                    boxShadow: `none`, 
                    duration: 0.3 
                });
            });
        });
    }
}
