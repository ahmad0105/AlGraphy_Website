/**
 * AlGraphy Studio — Dashboard Handler
 * 
 * TABLE OF CONTENTS:
 * 1. Lifecycle & Property Initialization
 * 2. Event Binding (Sidebar Navigation)
 * 3. Remote Data Fetching (User Identity)
 * 4. Application Initialization Bootstrapper
 * 
 * @class DashboardHandler
 */

class DashboardHandler {
    /**
     * 1. Lifecycle & Property Initialization
     * Maps essential UI components to the class instance.
     */
    constructor() {
        this.userRoleElement = document.getElementById("headerUserRole");
        this.avatarImg = document.getElementById("profileAvatar");

        this.init();
    }

    init() {
        this.fetchDashboardData();
    }

    /**
     * Remote Data Fetching
     * Synchronizes the dashboard header with real user data from the API.
     */
    async fetchDashboardData() {
        try {
            const data = await APIService.getProfile();
            
            if (data.status === 'success') {
                // Update all name fields (Header and Sidebar)
                const nameElements = document.querySelectorAll(".displayUserName");
                nameElements.forEach(el => el.innerText = data.user.full_name);

                if (this.userRoleElement && data.user.role) {
                    this.userRoleElement.innerText = data.user.role;
                }
                
                // Update avatar if provided
                if (this.avatarImg && data.user.profile_image) {
                    this.avatarImg.src = data.user.profile_image;
                }

                // Fetch Recent Studio Projects (Mosaic)
                this.renderRecentActivities();

                // Fetch and Render Service Categories
                this.renderServiceCategories();

                // Fetch and Render Recent Talent
                this.renderRecentTalent();

                // Project Radar (Stats)
                this.renderProjectStats();

                // Fetch and Render Recent Inquiries (Leads)
                this.renderRecentInquiries();
            } else {
                console.warn("Session Expired: Authentication redirect may be required.");
            }
        } catch (error) {
            console.error("Critical Dashboard Failure: Unable to fetch user identity.", error);
        }
    }

    /**
     * Project stats and animated Progress Radar
     */
    async renderProjectStats() {
        const circle = document.querySelector(".active-calories-container .circle");
        const percentText = document.getElementById("projectProgressPercent");
        const todayText = document.getElementById("statToday");
        const weekText = document.getElementById("statWeek");
        const monthText = document.getElementById("statMonth");

        if (!circle) return;

        try {
            const res = await APIService.fetchProjectStats();
            if (res.status === 'success' && res.stats) {
                const s = res.stats;
                
                if (todayText) todayText.innerText = s.today;
                if (weekText) weekText.innerText = s.week;
                if (monthText) monthText.innerText = s.month;

                const end = s.percentage;
                const duration = 1.8; // Cinematic duration
                
                const animation = { val: 0 };
                gsap.to(animation, {
                    val: end,
                    duration: duration,
                    ease: "power2.out",
                    onUpdate: () => {
                        const current = Math.round(animation.val);
                        circle.style.setProperty('--i', `${current}%`);
                        if (percentText) percentText.innerHTML = `${current}<small>%</small>`;
                    }
                });
            }
        } catch (err) {
            console.error("Radar Sync Failed:", err);
        }
    }

    /**
     * Render Service Categories in the Weekly Schedule area
     */
    async renderServiceCategories() {
        const listContainer = document.getElementById("serviceCategoriesList");
        if (!listContainer) return;

        try {
            const data = await APIService.fetchServices();
            if (data.status === 'success' && data.categories) {
                listContainer.innerHTML = ''; // Clear loader
                
                data.categories.forEach(cat => {
                    const itemHtml = `
                        <div class="day-and-activity">
                            <div class="day">
                                <i class="fa fa-layer-group" style="font-size: 1.5rem; color: var(--primary);"></i>
                            </div>
                            <div class="activity">
                                <h2>${cat.name}</h2>
                            </div>
                            <button class="btn" onclick="window.location.href='services_manage.html'">Details</button>
                        </div>
                    `;
                    listContainer.insertAdjacentHTML('beforeend', itemHtml);
                });
            }
        } catch (err) {
            console.error("Failed to load service categories:", err);
        }
    }

    /**
     * Render Latest 5 Employees in the Talent section
     */
    async renderRecentTalent() {
        const talentContainer = document.getElementById("recentEmployeesList");
        if (!talentContainer) return;

        try {
            const data = await APIService.fetchEmployees();
            if (data.status === 'success' && data.employees) {
                talentContainer.innerHTML = ''; // Clear onboarding text
                
                // Limit to 5
                const latestFive = data.employees.slice(0, 5);
                
                latestFive.forEach(emp => {
                    const baseUrl = CONFIG.API.BASE_URL.replace('/algraphybackend/public/api', '');
                    let avatarPath = emp.profile_pic ? `${baseUrl}/algraphybackend/public/${emp.profile_pic}` : '../Assets/image/default_avatar.png';
                    
                    // Fallback for paths starting with Assets
                    if (avatarPath.startsWith('Assets') || avatarPath.startsWith('algraphybackend')) avatarPath = '../'+ avatarPath;
                    
                    const itemHtml = `
                        <div class="best-item">
                            <img src="${avatarPath}" alt="${emp.Full_name}">
                            <div class="talent-info">
                                <h2>${emp.Full_name}</h2>
                                <p>${emp.Role}</p>
                            </div>
                        </div>
                    `;
                    talentContainer.insertAdjacentHTML('beforeend', itemHtml);
                });
            }
        } catch (err) {
            console.error("Failed to load talent pool:", err);
        }
    }

    /**
     * Recent Activities - Fetches last 6 projects and renders them into the mosaic.
     */
    async renderRecentActivities() {
        const activityContainer = document.querySelector(".activity-container");
        if (!activityContainer) return;

        try {
            const res = await APIService.fetchRecentProjects();
            if (res.status === 'success' && res.projects) {
                // Clear existing static placeholders
                activityContainer.innerHTML = '';
                
                res.projects.forEach((proj, index) => {
                    let imgPath = proj.Main_Image || '../Assets/image/Aura.png';
                    // Ensure relative paths from DB point to root
                    if (imgPath.startsWith('Assets') || imgPath.startsWith('algraphybackend')) imgPath = '../'+ imgPath;
                    
                    const containerClass = `img-${['one','two','three','four','five','six'][index] || 'one'}`;

                    const itemHtml = `
                        <div class="image-container ${containerClass}">
                            <img loading="lazy" src="${imgPath}" alt="${proj.Project_name}" style="width:100%; height:100%; object-fit:cover;" />
                            <div class="overlay"><h3>${proj.Project_name}</h3></div>
                        </div>
                    `;
                    activityContainer.insertAdjacentHTML('beforeend', itemHtml);
                });
            }
        } catch (error) {
            console.error("Failed to render recent activities:", error);
        }
    }

    /**
     * Recent Inquiries - Fetches from potential_clients and renders cards.
     */
    async renderRecentInquiries() {
        const listContainer = document.getElementById("leadsActivityList");
        if (!listContainer) return;

        try {
            const data = await APIService.fetchLeads();
            if (data.status === 'success' && data.leads) {
                listContainer.innerHTML = '';
                
                // Show latest 4 leads
                const latestLeads = data.leads.slice(0, 4);

                latestLeads.forEach(lead => {
                    const initial = lead.Client_Name ? lead.Client_Name.charAt(0).toUpperCase() : '?';
                    const date = lead.Created_At ? new Date(lead.Created_At).toLocaleDateString() : 'New';

                    const itemHtml = `
                        <div class="card">
                            <div class="card-user-info">
                                <div class="lead-avatar">${initial}</div>
                                <h2>${lead.Client_Name}</h2>
                            </div>
                            <p>${lead.Email_Address || 'No email provided'}</p>
                            <div class="lead-meta">
                                <span><i class="fa fa-phone"></i> ${lead.Phone_Number || 'N/A'}</span>
                                <span>${date}</span>
                            </div>
                        </div>
                    `;
                    listContainer.insertAdjacentHTML('beforeend', itemHtml);
                });
            }
        } catch (err) {
            console.error("Failed to load inquiries:", err);
        }
    }
}

/**
 * 4. Application Initialization Bootstrapper
 * Ensures the script runs only after the DOM is fully interactive.
 */
document.addEventListener("DOMContentLoaded", () => {
    const dashboardApp = new DashboardHandler();
    
    // Auxiliary UI Enhancements
    if (typeof CustomCursor === 'function') {
        
    }
});
