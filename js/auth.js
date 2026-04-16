/**
 * AlGraphy Studio — Authentication Handler
 * 
 * TABLE OF CONTENTS:
 * 1. Logic & Interface Initialization
 * 2. Event Binding (Forms & Tab Switching)
 * 3. UI Navigation Logic (Tab Toggles)
 * 4. Authentication Workflows (Login & Signup)
 * 5. UI Feedback Helpers
 * 
 * @class AuthHandler
 */

class AuthHandler {
    /**
     * 1. Logic & Interface Initialization
     * Maps DOM elements to the class instance.
     */
    constructor() {
        this.loginForm = document.getElementById("loginForm");
        this.signupForm = document.getElementById("signupForm");

        // Tab UI elements mapping
        this.tabs = {
            loginBtn: document.getElementById('showLoginBtn'),
            signupBtn: document.getElementById('showSignupBtn'),
            loginSec: document.getElementById('loginSection'),
            signupSec: document.getElementById('signupSection'),
            switchToSignup: document.getElementById('switchToSignup'),
            switchToLogin: document.getElementById('switchToLogin')
        };

        this.init();
    }

    init() {
        this.bindEvents();
        this.handleInitialHash();
    }

    /**
     * 2. Event Binding
     * Connects UI interactions to logic methods.
     */
    bindEvents() {
        // Form Submission interceptors
        if (this.loginForm) this.loginForm.addEventListener("submit", (e) => this.handleLogin(e));
        if (this.signupForm) this.signupForm.addEventListener("submit", (e) => this.handleSignup(e));

        // Tab Switching logic
        if (this.tabs.loginBtn) this.tabs.loginBtn.addEventListener('click', () => this.showTab('login'));
        if (this.tabs.signupBtn) this.tabs.signupBtn.addEventListener('click', () => this.showTab('signup'));

        // Direct links within sections (e.g. "Don't have an account?")
        if (this.tabs.switchToSignup) {
            this.tabs.switchToSignup.addEventListener('click', (e) => { e.preventDefault(); this.showTab('signup'); });
        }
        if (this.tabs.switchToLogin) {
            this.tabs.switchToLogin.addEventListener('click', (e) => { e.preventDefault(); this.showTab('login'); });
        }
    }

    /**
     * 3. UI Navigation Logic
     * Animates the transition between Login and Signup states.
     * 
     * @param {string} type - 'login' or 'signup'
     */
    showTab(type) {
        if (!this.tabs.loginBtn) return; // Exit if not on a combined auth page

        const isLogin = type === 'login';

        // Toggle active classes for CSS animations
        this.tabs.loginBtn.classList.toggle('active', isLogin);
        this.tabs.signupBtn.classList.toggle('active', !isLogin);
        this.tabs.loginSec.classList.toggle('active', isLogin);
        this.tabs.signupSec.classList.toggle('active', !isLogin);
    }

    /**
     * Check URL hash (e.g. auth#signup) to open the correct tab directly
     */
    handleInitialHash() {
        if (window.location.hash === '#signup') {
            this.showTab('signup');
        }
    }

    /**
     * 4. Authentication Workflows - Login
     * Attempts employee authentication, then falls back to client authentication.
     */
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById("loginEmail").value;
        const password = document.getElementById("loginPassword").value;
        const msgElement = document.getElementById("loginMsg");
        const submitBtn = this.loginForm.querySelector(".submit-btn");

        // Visual feedback
        const originalBtnText = submitBtn.value;
        submitBtn.value = "CONNECTING...";

        const formData = new FormData();
        formData.append('email', email);
        formData.append('password', password);

        // ATTEMPT 1: Internal Employee Portal
        let data = await APIService.login(formData);

        // ATTEMPT 2: Fallback to Client Portal if ATTEMPT 1 fails
        if (data.status !== 'success') {
            const clientData = await APIService.clientLogin(formData);
            if (clientData.status === 'success') {
                data = clientData;
                data.isClient = true;
            }
        }

        // Display outcome message
        this.displayStatus(msgElement, data);

        if (data.status === 'success') {
            // Determine dynamic redirection target (Clean URLs enabled)
            const targetPage = data.isClient ? "dashboard/profile" : "dashboard";
            setTimeout(() => window.location.href = targetPage, 1000);
        }

        submitBtn.value = originalBtnText;
    }

    /**
     * 4. Authentication Workflows - Signup
     * Registers a new client account using the API.
     */
    async handleSignup(e) {
        e.preventDefault();
        const name = document.getElementById("signupName").value;
        const email = document.getElementById("signupEmail").value;
        const password = document.getElementById("signupPassword").value;
        const msgElement = document.getElementById("signupMsg");
        const submitBtn = this.signupForm.querySelector(".submit-btn");

        submitBtn.value = "CREATING...";

        const formData = new FormData();
        formData.append('full_name', name);
        formData.append('email', email);
        formData.append('password', password);

        const data = await APIService.signup(formData);
        this.displayStatus(msgElement, data);

        if (data.status === 'success') {
            // Switch to login tab and pre-fill email on success
            setTimeout(() => {
                if (this.tabs.loginBtn) {
                    this.showTab('login');
                    document.getElementById('loginEmail').value = email;
                } else {
                    window.location.href = "login.html";
                }
            }, 1500);
        }

        submitBtn.value = "SIGN UP";
    }

    /**
     * 5. UI Feedback Helpers
     * Updates message elements with appropriate status styling.
     */
    displayStatus(msgElement, response) {
        msgElement.classList.remove('error', 'success', 'system-error');

        // Differentiate between login fail (error) and server down (system-error)
        const statusClass = response.isSystemError ? 'system-error' : (response.status === 'success' ? 'success' : 'error');
        msgElement.classList.add(statusClass);

        if (response.isSystemError) {
            msgElement.innerHTML = `<i class="fa fa-triangle-exclamation"></i> <b>System Alert:</b> ${response.message}`;
        } else {
            msgElement.innerHTML = response.message;
        }
    }
}

// Global Application Initialization
document.addEventListener("DOMContentLoaded", () => {
    const authApp = new AuthHandler();
    // Supporting UI classes for visual flair
    const appCursor = new CustomCursor();
    const themeAnimator = new ThemeAnimator();
});
