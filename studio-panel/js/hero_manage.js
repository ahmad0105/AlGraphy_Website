/**
 * AlGraphy Studio — Hero Section Management Handler (Premium Card Design)
 * 
 * Handles fetching, previewing, and updating the hero section content
 * including background videos and localized titles with `:` line-breaks.
 * 
 * @class HeroHandler
 */

class HeroHandler {
    constructor() {
        this.heroForm = document.getElementById('heroMgmtForm');
        this.heroMsg = document.getElementById('heroMsg');
        
        // Text Inputs
        this.subtitleInput = document.getElementById('heroSubtitle');
        this.titleInput = document.getElementById('heroTitle');
        
        // Video Inputs & Previews
        this.bgVideoInput = document.getElementById('bgVideoInput');
        this.bgPreview = document.getElementById('heroBgPreview');
        
        this.srVideoInput = document.getElementById('showreelInput');
        this.srPreview = document.getElementById('showreelPreview');

        this.init();
    }

    init() {
        this.fetchHeroData();
        this.bindEvents();
    }

    /**
     * Bind form and input events
     */
    bindEvents() {
        if (this.heroForm) {
            this.heroForm.addEventListener('submit', (e) => this.handleUpdate(e));
        }

        // Real-time video previews with enhanced validation
        this.bgVideoInput.addEventListener('change', (e) => this.handleVideoSelection(e, this.bgPreview));
        this.srVideoInput.addEventListener('change', (e) => this.handleVideoSelection(e, this.srPreview));


    }

    /**
     * Video selection logic with relaxed validation (Handles OS inconsistencies)
     */
    handleVideoSelection(e, previewElem) {
        const file = e.target.files[0];
        if (!file) return;

        const extension = file.name.split('.').pop().toLowerCase();
        const validExtensions = ['mp4', 'webm', 'mov', 'avi', 'mkv'];
        
        // Check both MIME type and Extension for better compatibility
        const isVideoMime = file.type.startsWith('video/');
        const isValidExt = validExtensions.includes(extension);

        if (!isVideoMime && !isValidExt) {
            this.displayStatus({ 
                status: 'error', 
                message: `Format (.${extension}) is not supported. Please use MP4 or WebM.` 
            });
            e.target.value = ''; // Reset input
            return;
        }

        // Limit size check (to match PHP settings if possible, but keep it generous)
        const sizeInMb = file.size / (1024 * 1024);
        if (sizeInMb > 500) {
            this.displayStatus({ 
                status: 'error', 
                message: 'File is too large! (Limit: 500MB)' 
            });
            e.target.value = '';
            return;
        }

        const url = URL.createObjectURL(file);
        previewElem.src = url;
        previewElem.load();
        
        // Success feedback
        this.displayStatus({ status: 'success', message: `Video loaded locally. Click PUSH to publish.` });
    }

    /**
     * Fetch current hero data from backend
     */
    async fetchHeroData() {
        try {
            const data = await APIService.getHero();
            
            if (data.status === 'success' && data.hero) {
                if (this.subtitleInput) this.subtitleInput.value = data.hero.subtitle || '';
                if (this.titleInput) this.titleInput.value = data.hero.title || '';
                
                if (data.hero.bg_video && this.bgPreview) {
                    this.bgPreview.src = data.hero.bg_video;
                    this.bgPreview.load();
                }
                if (data.hero.showreel_video && this.srPreview) {
                    this.srPreview.src = data.hero.showreel_video;
                    this.srPreview.load();
                }
            }
        } catch (error) {
            console.warn("Hero Data Sync Warning: Database may be empty or unreachable.", error);
        }
    }

    /**
     * Handle form submission
     */
    async handleUpdate(e) {
        e.preventDefault();
        
        const submitBtn = this.heroForm.querySelector('button[type="submit"]');
        const originalHtml = submitBtn.innerHTML;
        
        // Visual feedback for heavy media uploads
        submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> PUBLISHING (0-100%)...';
        submitBtn.disabled = true;

        const formData = new FormData();
        formData.append('subtitle', this.subtitleInput.value);
        formData.append('title', this.titleInput.value);
        
        try {
            // Helper for Direct Cloudinary Upload
            const uploadToCloudinary = async (file) => {
                const cloudName = 'Root'; // From your config
                const unsignedPreset = 'ml_default';
                const url = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
                
                const cData = new FormData();
                cData.append('file', file);
                cData.append('upload_preset', unsignedPreset);
                
                const res = await fetch(url, { method: 'POST', body: cData });
                const json = await res.json();
                if (json.secure_url) return json.secure_url;
                throw new Error(json.error?.message || "Cloudinary Upload Failed");
            };

            if (this.bgVideoInput.files[0]) {
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> UPLOADING BG VIDEO...';
                const bgUrl = await uploadToCloudinary(this.bgVideoInput.files[0]);
                formData.append('hero_bg_video_url_direct', bgUrl);
            }
            
            if (this.srVideoInput.files[0]) {
                submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> UPLOADING SHOWREEL...';
                const srUrl = await uploadToCloudinary(this.srVideoInput.files[0]);
                formData.append('showreel_video_url_direct', srUrl);
            }

            const response = await APIService.updateHero(formData);
            
            submitBtn.innerHTML = originalHtml;
            submitBtn.disabled = false;

            this.displayStatus(response);
            
            // If session expired (401 handled by request logic), prompt login
            if (response.error && response.error.includes("login")) {
                window.location.href = "../auth";
            }
        } catch (err) {
            submitBtn.innerHTML = originalHtml;
            submitBtn.disabled = false;
            this.displayStatus({ status: 'error', message: "Network error during upload. Check XAMPP settings." });
        }
    }

    /**
     * Standardized notification display
     */
    displayStatus(response) {
        this.heroMsg.className = `auth-msg ${response.status}`;
        this.heroMsg.innerHTML = response.status === 'success' 
            ? `<i class="fa fa-check-circle"></i> ${response.message}`
            : `<i class="fa fa-exclamation-triangle"></i> ${response.message || response.error}`;
        
        if (response.status === 'success') {
            // Clear message slowly
            setTimeout(() => { if(this.heroMsg) this.heroMsg.innerHTML = ''; }, 8000);
        }
    }
}

// Global Application Initialization
document.addEventListener('DOMContentLoaded', () => {
    const heroApp = new HeroHandler();
    
});
