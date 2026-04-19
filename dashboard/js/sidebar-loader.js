/**
 * AlGraphy Studio — Dynamic Sidebar Loader
 * 
 * This script fetches the centralized sidebar component and injects it into the page.
 * It also automatically handles the 'active' state based on the current URL.
 */

document.addEventListener("DOMContentLoaded", () => {
    const placeholder = document.getElementById('sidebar-placeholder');
    if (!placeholder) return;

    // 1. Fetch the sidebar component (Relative path)
    fetch('components/sidebar.html')
        .then(response => response.text())
        .then(html => {
            placeholder.innerHTML = html;
            
            // 2. Highlight Active Page
            highlightActivePage();
            
            // 3. Re-bind Logout Event (since the button was just added to DOM)
            bindLogoutEvent();
        })
        .catch(err => console.error("Critical: Sidebar failed to load.", err));

    /**
     * Detect current filename and match it with sidebar data-page attributes.
     */
    function highlightActivePage() {
        const path = window.location.pathname;
        let page = path.split("/").filter(Boolean).pop(); // Handle trailing slashes cleanly
        
        // If we are at /dashboard/ or /dashboard, default to 'index' active state
        if (!page || page === 'index.html' || page === 'dashboard') page = 'index';
        
        const navItems = document.querySelectorAll('.nav-item[data-page]');
        navItems.forEach(item => {
            if (item.getAttribute('data-page') === page) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    }

    /**
     * Logic for session termination.
     */
    function bindLogoutEvent() {
        const logoutBtn = document.getElementById("logoutBtn");
        if (logoutBtn) {
            logoutBtn.addEventListener("click", async (e) => {
                e.preventDefault();
                try {
                    // APIService is assumed to be globally available in the host HTML
                    if (typeof APIService !== 'undefined') {
                        await APIService.logout();
                    }
                    window.location.href = "../auth";
                } catch (err) {
                    console.error("Logout error:", err);
                    window.location.href = "../auth";
                }
            });
        }
    }
});
