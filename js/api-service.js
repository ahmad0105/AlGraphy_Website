/**
 * AlGraphy Studio — API Service Layer (Vanilla JS)
 * 
 * TABLE OF CONTENTS:
 * 1. Configuration & Dynamic Base URL
 * 2. Core Request Handler (Fetch with Credentials)
 * 3. Authentication Endpoints (Login/Signup)
 * 4. User Profile Endpoints (Fetch/Update)
 * 
 * @class APIService
 */

class APIService {
    // 1. Configuration: Values are retrieved from CONFIG.js
    static BASE_URL = CONFIG.API.BASE_URL;

    /**
     * 2. Core Request Handler
     * Orchestrates all fetch operations with standardized error handling.
     * 
     * @param {string} endpoint - The target API route
     * @param {string} method - HTTP Verb (GET, POST, etc.)
     * @param {object|FormData} body - Data payload
     * @returns {Promise<object>} - JSON response from server
     */
    static async request(endpoint, method = 'GET', body = null) {
        const options = {
            method,
            // Handle both raw JSON and FormData (for file uploads)
            body: body instanceof FormData ? body : (body ? JSON.stringify(body) : null),
            // 'include' is mandatory to send and receive PHP session cookies across origins
            credentials: 'include' 
        };

        // Set Content-Type only for JSON payloads (FormData sets its own boundaries)
        if (body && !(body instanceof FormData)) {
            options.headers = { 'Content-Type': 'application/json' };
        }

        try {
            // Build absolute URL while preventing double-slashes or triple-slashes
            const cleanBase = this.BASE_URL.replace(/\/+$/, '');
            const cleanEndpoint = endpoint.replace(/^\/+/, '');
            const url = endpoint.startsWith('http') ? endpoint : `${cleanBase}/${cleanEndpoint}`;
            
            const response = await fetch(url, options);
            
            // 1. Success path (200-299)
            if (response.ok) {
                return await response.json();
            }

            // 2. Client/Server Error path (400+)
            try {
                const errorData = await response.json();
                return { ...errorData, isSystemError: false }; // Handled errors from PHP (e.g., wrong password)
            } catch (e) {
                // Return a system error if the response isn't valid JSON (e.g., PHP error crash)
                return { 
                    status: 'error', 
                    message: `Backend System Error (${response.status})`, 
                    isSystemError: true 
                };
            }

        } catch (error) {
            console.error(`AlGraphy API Runtime Error (${endpoint}):`, error);
            return { 
                status: 'error', 
                message: 'Connection failed. Please ensure XAMPP (Apache/MySQL) is running.',
                isSystemError: true
            };
        }
    }

    // Authenticate professional/employee users
    static login(formData) { 
        return this.request(CONFIG.API.ENDPOINTS.LOGIN, 'POST', formData); 
    }

    // Standard session logout
    static logout() {
        return this.request(CONFIG.API.ENDPOINTS.LOGOUT, 'GET');
    }
    
    // Authenticate guest/client users
    static clientLogin(formData) {
        return this.request(CONFIG.API.ENDPOINTS.CLIENT_LOGIN, 'POST', formData);
    }

    // Register new client accounts
    static signup(formData) { 
        return this.request(CONFIG.API.ENDPOINTS.CLIENT_SIGNUP, 'POST', formData); 
    }

    /* --- 4. User Profile Endpoints --- */

    // Retrieve full profile details for the currently logged-in user
    static getProfile() { 
        return this.request(CONFIG.API.ENDPOINTS.PROFILE, 'GET'); 
    }
    
    // Update profile text data and upload images
    static updateProfile(formData) { 
        return this.request(CONFIG.API.ENDPOINTS.PROFILE_UPDATE, 'POST', formData); 
    }

    /* --- 5. Hero Section Management --- */

    // Retrieve current hero section content (videos and text)
    static getHero() {
        return this.request(CONFIG.API.ENDPOINTS.HERO, 'GET');
    }

    // Update hero section data (including video uploads)
    static updateHero(formData) {
        return this.request(CONFIG.API.ENDPOINTS.HERO_UPDATE, 'POST', formData);
    }

    /* --- 6. Services Management --- */

    // Fetch categories and nested services
    static fetchServices() {
        return this.request(CONFIG.API.ENDPOINTS.SERVICES, 'GET');
    }

    // Update a service card and media
    static updateService(formData) {
        return this.request(CONFIG.API.ENDPOINTS.SERVICES_UPDATE, 'POST', formData);
    }

    // Add a new service to a category
    static addService(formData) {
        return this.request(CONFIG.API.ENDPOINTS.SERVICES_ADD, 'POST', formData);
    }

    // New: Remove an individual service
    static deleteService(formData) {
        return this.request(CONFIG.API.ENDPOINTS.SERVICES_DELETE, 'POST', formData);
    }

    // Update a service category title (The Section Tab)
    static updateCategory(formData) {
        return this.request(CONFIG.API.ENDPOINTS.SERVICES_CAT_UPDATE, 'POST', formData);
    }

    static addCategory(formData) {
        return this.request(CONFIG.API.ENDPOINTS.SERVICES_CAT_ADD, 'POST', formData);
    }

    static deleteCategory(formData) {
        return this.request(CONFIG.API.ENDPOINTS.SERVICES_CAT_DELETE, 'POST', formData);
    }

    /**
     * Projects Management
     */
    static fetchProjects() {
        return this.request(CONFIG.API.ENDPOINTS.PROJECTS);
    }

    static fetchRecentProjects() {
        return this.request(CONFIG.API.ENDPOINTS.PROJECTS_RECENT);
    }

    static fetchProjectStats() {
        return this.request(CONFIG.API.ENDPOINTS.PROJECTS_STATS);
    }

    static addProject(formData) {
        return this.request(CONFIG.API.ENDPOINTS.PROJECTS_ADD, 'POST', formData);
    }

    static updateProject(formData) {
        return this.request(CONFIG.API.ENDPOINTS.PROJECTS_UPDATE, 'POST', formData);
    }

    static deleteProject(formData) {
        return this.request(CONFIG.API.ENDPOINTS.PROJECTS_DELETE, 'POST', formData);
    }

    static updateProjectSettings(formData) {
        return this.request(CONFIG.API.ENDPOINTS.PROJECTS_SETTINGS, 'POST', formData);
    }

    /**
     * Clients Management
     */
    static fetchClients() {
        return this.request(CONFIG.API.ENDPOINTS.CLIENTS);
    }

    static addClient(formData) {
        return this.request(CONFIG.API.ENDPOINTS.CLIENTS_ADD, 'POST', formData);
    }

    static updateClient(formData) {
        return this.request(CONFIG.API.ENDPOINTS.CLIENTS_UPDATE, 'POST', formData);
    }

    static deleteClient(formData) {
        return this.request(CONFIG.API.ENDPOINTS.CLIENTS_DELETE, 'POST', formData);
    }

    /**
     * Employees Management
     */
    static fetchEmployees() {
        return this.request(CONFIG.API.ENDPOINTS.EMPLOYEES);
    }

    static addEmployee(formData) {
        return this.request(CONFIG.API.ENDPOINTS.EMPLOYEES_ADD, 'POST', formData);
    }

    static updateEmployee(formData) {
        return this.request(CONFIG.API.ENDPOINTS.EMPLOYEES_UPDATE, 'POST', formData);
    }

    static deleteEmployee(formData) {
        return this.request(CONFIG.API.ENDPOINTS.EMPLOYEES_DELETE, 'POST', formData);
    }

    /**
     * Stats & Analytics Management
     */
    static fetchStats() {
        return this.request(CONFIG.API.ENDPOINTS.STATS, 'GET');
    }

    static assignProjectResources(formData) {
        return this.request(CONFIG.API.ENDPOINTS.STATS_ASSIGN, 'POST', formData);
    }

    static deleteAssignments(formData) {
        return this.request(CONFIG.API.ENDPOINTS.STATS_DELETE, 'POST', formData);
    }

    static fetchProjectAssignments(projectId) {
        return this.request(`${CONFIG.API.ENDPOINTS.STATS_GET_ASSIGNMENTS}?project_id=${projectId}`);
    }

    /**
     * Public Inquiries (Leads)
     */
    static fetchLeads() {
        return this.request(CONFIG.API.ENDPOINTS.LEADS_DATA);
    }

    static updateLeadStatus(formData) {
        return this.request(CONFIG.API.ENDPOINTS.LEADS_STATUS, 'POST', formData);
    }

    static submitLead(formData) {
        return this.request(CONFIG.API.ENDPOINTS.LEADS_SUBMIT, 'POST', formData);
    }

    /**
     * Footer Management (NEW)
     */
    static fetchFooterData() {
        return this.request(CONFIG.API.ENDPOINTS.FOOTER, 'GET');
    }

    static addFooterLink(formData) {
        return this.request(CONFIG.API.ENDPOINTS.FOOTER_ADD, 'POST', formData);
    }

    static updateFooterLink(formData) {
        return this.request(CONFIG.API.ENDPOINTS.FOOTER_UPDATE, 'POST', formData);
    }

    static deleteFooterLink(id) {
        const formData = new FormData();
        formData.append('id', id);
        return this.request(CONFIG.API.ENDPOINTS.FOOTER_DELETE, 'POST', formData);
    }
}
