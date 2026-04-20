/**
 * AlGraphy Studio — Global JS Configuration
 * 
 * Centralized settings for API endpoints, timing, and feature switches.
 * This makes it extremely fast to switch from Localhost to Production.
 */

const CONFIG = {
    // 1. API Routing
    API: {
        BASE_URL: window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? `${window.location.protocol}//${window.location.hostname}/algraphy/algraphybackend/public/api`
            : `${window.location.protocol}//${window.location.hostname}/algraphybackend/public/api`,
        ENDPOINTS: {
            LOGIN: '/login',
            LOGOUT: '/logout',
            CLIENT_LOGIN: '/client/login',
            CLIENT_SIGNUP: '/client/signup',
            PROFILE: '/client/profile',
            PROFILE_UPDATE: '/client/profile/update',
            FINANCIALS: '/reports/financials',
            HERO: '/site/hero',
            HERO_UPDATE: '/site/hero/update',
            SERVICES: '/services/data',
            SERVICES_ADD: '/services/add',
            SERVICES_UPDATE: '/services/update',
            SERVICES_DELETE: '/services/delete',
            SERVICES_CAT_ADD: '/services/category/add',
            SERVICES_CAT_UPDATE: '/services/category/update',
            SERVICES_CAT_DELETE: '/services/category/delete',
            PROJECTS: '/projects/data',
            PROJECTS_ADD: '/projects/add',
            PROJECTS_RECENT: '/projects/recent',
            PROJECTS_STATS: '/projects/stats',
            PROJECTS_UPDATE: '/projects/update',
            PROJECTS_DELETE: '/projects/delete',
            PROJECTS_SETTINGS: '/projects/settings/update',
            CLIENTS: '/clients/data',
            CLIENTS_ADD: '/clients/add',
            CLIENTS_UPDATE: '/clients/update',
            CLIENTS_DELETE: '/clients/delete',
            EMPLOYEES: '/employees/data',
            EMPLOYEES_ADD: '/employees/add',
            EMPLOYEES_UPDATE: '/employees/update',
            EMPLOYEES_DELETE: '/employees/delete',
            LEADS_DATA: '/leads/data',
            LEADS_STATUS: '/leads/status',
            LEADS_SUBMIT: '/leads/submit',
            STATS: '/stats/master',
            STATS_ASSIGN: '/stats/assign',
            STATS_DELETE: '/stats/assignments/delete',
            STATS_GET_ASSIGNMENTS: '/stats/assignments/get',
            FOOTER: '/site/footer/data',
            FOOTER_ADD: '/site/footer/add',
            FOOTER_UPDATE: '/site/footer/update',
            FOOTER_DELETE: '/site/footer/delete'
        }
    },

    // 2. UI Configuration
    UI: {
        MODAL_ANIMATION_SPEED: 0.5, // Seconds
        TOAST_DURATION: 3000,      // Milliseconds
        DEBUG_MODE: false
    },

    // 3. Environment Details
    ENV: {
        VERSION: '2.0.0-OOP',
        CREATION_YEAR: 2026
    }
};

// Freeze object to prevent accidental runtime modification
Object.freeze(CONFIG);
