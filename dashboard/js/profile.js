/**
 * AlGraphy Studio — Profile Management Handler
 * 
 * TABLE OF CONTENTS:
 * 1. Interface & Component Initialization
 * 2. Multi-Part Event Binding
 * 3. Remote Data Fetching (Profile Hydration)
 * 4. Local Media Handling (Live Preview)
 * 5. Update Submission (Binary & Text Data)
 * 6. UI Synchronization & State Cleanup
 * 
 * @class ProfileHandler
 */

class ProfileHandler {
    /**
     * 1. Interface & Component Initialization
     * Caches DOM references and starts the hydration process.
     */
    constructor() {
        this.profileForm = document.getElementById("profileForm");
        this.msgElement = document.getElementById("profileMsg");
        this.imageInput = document.getElementById("profileImageInput");
        this.avatarImg = document.getElementById("profileAvatar");
        // Target both specific ID and class for sidebar logout consistency
        this.logoutButtons = document.querySelectorAll('#logoutBtn, .logoutBtn');

        this.init();
    }

    init() {
        this.fetchProfileData();
        this.bindEvents();
    }

    /**
     * 2. Event Binding
     * Connects form interactions and image triggers to logic handlers.
     */
    bindEvents() {
        if (this.profileForm) this.profileForm.addEventListener("submit", (e) => this.handleUpdate(e));
        


        if (this.imageInput) this.imageInput.addEventListener("change", (e) => this.previewImage(e));
    }

    /**
     * 3. Remote Data Fetching
     * Loads the authenticated user's profile from the API into the form fields.
     */
    async fetchProfileData() {
        const data = await APIService.getProfile();
        
        if (data.status === 'success') {
            // Hydrate text fields
            document.getElementById("profileName").value = data.user.full_name;
            document.getElementById("profileEmail").value = data.user.email;
            
            // Sync header UI elements
            const headerName = document.getElementById("headerUserName");
            if (headerName) headerName.innerText = data.user.full_name;
            
            const headerRole = document.getElementById("headerUserRole");
            if (headerRole) headerRole.innerText = data.user.role || 'AlGraphy Employee';

            // Sync avatar image
            if (data.user.profile_image) {
                let imgPath = data.user.profile_image;
                // Fix path if it starts with Assets or algraphybackend but doesn't have parent jump
                if (imgPath.startsWith('Assets') || imgPath.startsWith('algraphybackend')) {
                    imgPath = '../' + imgPath;
                }
                this.avatarImg.src = imgPath;
            }
        } else {
            // Redirect to authentication if session is invalid
            window.location.href = "../auth";
        }
    }

    /**
     * 4. Local Media Handling
     * Provides an instant visual preview of the selected image before submission.
     */
    previewImage(e) {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (evt) => this.avatarImg.src = evt.target.result;
            reader.readAsDataURL(e.target.files[0]);
        }
    }

    /**
     * 5. Update Submission
     * Aggregates textual data and binary images into a FormData object.
     */
    async handleUpdate(e) {
        e.preventDefault();
        // Target the submit button within the form
        const submitBtn = this.profileForm.querySelector('button[type="submit"]');
        const originalBtnText = submitBtn.textContent;
        submitBtn.textContent = "SYNCHRONIZING...";
        submitBtn.disabled = true;

        const email = document.getElementById("profileEmail").value;

        // Frontend Privacy & Format Validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            this.displayStatus({ 
                status: 'error', 
                message: 'Please provide a valid email address (e.g., name@example.com).' 
            });
            submitBtn.textContent = originalBtnText;
            submitBtn.disabled = false;
            return;
        }

        const formData = new FormData();
        formData.append('full_name', document.getElementById("profileName").value);
        formData.append('email', email);
        
        const passwordField = document.getElementById("profilePassword");
        const password = passwordField ? passwordField.value : "";
        if (password.trim() !== '') {
            formData.append('password', password);
        }
        
        if (this.imageInput.files.length > 0) {
            formData.append('profile_image', this.imageInput.files[0]);
        }

        const data = await APIService.updateProfile(formData);
        
        // Restore button state
        submitBtn.textContent = originalBtnText;
        submitBtn.disabled = false;

        this.displayStatus(data);
        
        // Success cleanup & Sync
        if (data.status === 'success') {
            document.getElementById("profilePassword").value = ''; // Reset password field
            
            // Sync final image from server if returned
            if (data.profile_image) {
                let imgPath = data.profile_image;
                if (imgPath.startsWith('Assets') || imgPath.startsWith('algraphybackend')) {
                    imgPath = '../' + imgPath;
                }
                this.avatarImg.src = imgPath;
            }
            
            // Sync visual header name
            const headerName = document.getElementById("headerUserName");
            if (headerName) headerName.innerText = document.getElementById("profileName").value;

            // Auto-clear success message
            setTimeout(() => this.msgElement.innerHTML = '', 3000);
        }
    }

    /**
     * UI Feedback method for the profile form.
     */
    displayStatus(response) {
        this.msgElement.classList.remove('error', 'success');
        this.msgElement.classList.add(response.status === 'success' ? 'success' : 'error');
        this.msgElement.innerHTML = response.message;
    }
}

/**
 * NEW: Integrated Footer Management Class
 */
class FooterManager {
    constructor() {
        this.workspace = document.getElementById('footer-admin-workspace');
        this.modal = document.getElementById('footerModal');
        this.form = document.getElementById('footerForm');
        this.addBtn = document.getElementById('addFooterBtn');
        this.closeBtn = document.getElementById('closeFooterModal');
        this.links = [];

        if (this.workspace) this.init();
    }

    async init() {
        this.bindEvents();
        await this.loadData();
    }

    bindEvents() {
        if (this.addBtn) this.addBtn.onclick = () => this.openModal();
        if (this.closeBtn) this.closeBtn.onclick = () => this.closeModal();
        if (this.form) this.form.onsubmit = (e) => this.handleSubmit(e);

        window.onclick = (e) => {
            if (e.target == this.modal) this.closeModal();
        };
    }

    async loadData() {
        try {
            const res = await APIService.fetchFooterData();
            if (res.status === 'success') {
                this.links = res.data;
                this.render();
            }
        } catch (err) {
            console.error("Footer load error:", err);
        }
    }

    render() {
        if (this.links.length === 0) {
            this.workspace.innerHTML = `<div style="text-align:center; padding:40px; color:var(--text-muted); background:var(--bg-card); border-radius:15px; border:1px dashed var(--border-color);">No footer links found.</div>`;
            return;
        }

        this.workspace.innerHTML = '';
        const groups = { 'CONTACT': [], 'SOCIAL': [] };
        this.links.forEach(l => { if (groups[l.category]) groups[l.category].push(l); });

        Object.keys(groups).forEach(cat => {
            const sectionHeader = document.createElement('div');
            sectionHeader.className = 'footer-category-title';
            sectionHeader.innerText = cat;
            this.workspace.appendChild(sectionHeader);

            groups[cat].forEach(link => {
                const card = document.createElement('div');
                card.className = 'footer-link-card';

                card.innerHTML = `
                    <div class="link-details">
                        <h4>${link.title}</h4>
                        <p>${link.url || 'No destination link set'}</p>
                    </div>
                    <div class="link-actions">
                        <button class="action-btn edit" onclick="footerMgr.openModal(${link.id})" title="Edit Architecture">
                            <i class="fa fa-edit"></i>
                        </button>
                        <button class="action-btn delete" onclick="footerMgr.handleDelete(${link.id})" title="Remove Pillar">
                            <i class="fa fa-trash"></i>
                        </button>
                    </div>
                `;
                this.workspace.appendChild(card);
            });
        });
        gsap.from(".footer-link-card", { opacity: 0, stagger: 0.08, duration: 0.5, ease: "power2.out" });
    }

    openModal(id = null) {
        this.form.reset();
        document.getElementById('linkId').value = id || '';
        document.getElementById('footerModalTitle').innerText = id ? 'Edit Link Pillar' : 'Add Link Pillar';

        if (id) {
            const link = this.links.find(l => l.id == id);
            if (link) {
                document.getElementById('linkCategory').value = link.category;
                document.getElementById('linkTitle').value = link.title;
                document.getElementById('linkUrl').value = link.url || '';
            }
        }
        this.modal.style.display = 'flex';
        gsap.from(".modal-content", { y: 30, opacity: 0, duration: 0.4 });
    }

    closeModal() {
        this.modal.style.display = 'none';
    }

    async handleSubmit(e) {
        e.preventDefault();
        const formData = new FormData(this.form);
        const id = formData.get('id');
        try {
            const res = id ? await APIService.updateFooterLink(formData) : await APIService.addFooterLink(formData);
            if (res.status === 'success') {
                this.closeModal();
                await this.loadData();
            }
        } catch (err) {
            console.error(err);
        }
    }

    async handleDelete(id) {
        if (!confirm("Remove this pillar from the studio architecture?")) return;
        try {
            const res = await APIService.deleteFooterLink(id);
            if (res.status === 'success') await this.loadData();
        } catch (err) {
            console.error(err);
        }
    }
}

// Global Application Initialization
let footerMgr;
document.addEventListener("DOMContentLoaded", () => {
    const profileApp = new ProfileHandler();
    footerMgr = new FooterManager();
    
    if (typeof ThemeAnimator !== 'undefined') {
        new ThemeAnimator();
    }
});
