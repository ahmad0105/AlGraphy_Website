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
            ? `${window.location.protocol}//${window.location.hostname}/algraphy/algraphybackend/public`
            : `${window.location.protocol}//${window.location.hostname}/api`,
        ENDPOINTS: {
            LOGIN: '/login',
            LOGOUT: '/logout',
            CLIENT_LOGIN: '/api/client/login',
            CLIENT_SIGNUP: '/api/client/signup',
            PROFILE: '/api/client/profile',
            PROFILE_UPDATE: '/api/client/profile/update',
            FINANCIALS: '/api/reports/financials',
            HERO: '/api/site/hero',
            HERO_UPDATE: '/api/site/hero/update',
            SERVICES: '/api/services/data',
            SERVICES_ADD: '/api/services/add',
            SERVICES_UPDATE: '/api/services/update',
            SERVICES_DELETE: '/api/services/delete',
            SERVICES_CAT_ADD: '/api/services/category/add',
            SERVICES_CAT_UPDATE: '/api/services/category/update',
            SERVICES_CAT_DELETE: '/api/services/category/delete',
            PROJECTS: '/api/projects/data',
            PROJECTS_ADD: '/api/projects/add',
            PROJECTS_RECENT: '/api/projects/recent',
            PROJECTS_STATS: '/api/projects/stats',
            PROJECTS_UPDATE: '/api/projects/update',
            PROJECTS_DELETE: '/api/projects/delete',
            PROJECTS_SETTINGS: '/api/projects/settings/update',
            CLIENTS: '/api/clients/data',
            CLIENTS_ADD: '/api/clients/add',
            CLIENTS_UPDATE: '/api/clients/update',
            CLIENTS_DELETE: '/api/clients/delete',
            EMPLOYEES: '/api/employees/data',
            EMPLOYEES_ADD: '/api/employees/add',
            EMPLOYEES_UPDATE: '/api/employees/update',
            EMPLOYEES_DELETE: '/api/employees/delete',
            LEADS_DATA: '/api/leads/data',
            LEADS_STATUS: '/api/leads/status',
            LEADS_SUBMIT: '/api/leads/submit',
            STATS: '/api/stats/master',
            STATS_ASSIGN: '/api/stats/assign',
            STATS_DELETE: '/api/stats/assignments/delete',
            STATS_GET_ASSIGNMENTS: '/api/stats/assignments/get',
            FOOTER: '/api/site/footer/data',
            FOOTER_ADD: '/api/site/footer/add',
            FOOTER_UPDATE: '/api/site/footer/update',
            FOOTER_DELETE: '/api/site/footer/delete'
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
