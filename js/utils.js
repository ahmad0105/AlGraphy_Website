/**
 * AlGraphy Studio — Core Utility Library
 * 
 * Centralized reusable functions for common tasks across the platform.
 * This acts as an internal 'library' to keep other scripts lean.
 */

const Utils = {
    /**
     * Formatting: Currency with regional support
     */
    formatCurrency: (amount, currency = 'USD') => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
        }).format(amount);
    },

    /**
     * Formatting: Date standardizer
     */
    formatDate: (dateStr) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        return new Date(dateStr).toLocaleDateString(undefined, options);
    },

    /**
     * Security: HTML Escape to prevent XSS in dynamic renders
     */
    escapeHTML: (str) => {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    },

    /**
     * Optimization: Debounce function for high-frequency events (resize, scroll)
     */
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    },

    /**
     * State Management: Get Query Param
     */
    getQueryParam: (name) => {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(name);
    }
};

// Freeze utility to prevent runtime pollution
Object.freeze(Utils);
