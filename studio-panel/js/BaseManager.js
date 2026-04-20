/**
 * AlGraphy Studio — High-Level Entity Manager (Base OOP class)
 * 
 * This class abstracts the common logic for CRUD operations across the dashboard.
 * It handles fetching, rendering, modal toggling, and standard API synchronization.
 */

class BaseManager {
    constructor(config) {
        this.container = document.getElementById(config.containerId);
        this.addModal = document.getElementById(config.addModalId);
        this.editModal = document.getElementById(config.editModalId);
        this.entityName = config.entityName;
        this.items = [];
        this.api = config.api;

        if (this.container) {
            this.bindBaseEvents();
        }
    }

    bindBaseEvents() {
        // Handle window clicks to close modals if clicking overlay
        window.addEventListener('click', (e) => {
            if (e.target === this.addModal) this.closeModal(this.addModal);
            if (e.target === this.editModal) this.closeModal(this.editModal);
        });
    }

    async load() {
        if (!this.container) return;
        this.showLoading();
        
        try {
            const res = await this.api.fetch();
            if (res.status === 'success') {
                this.items = this.api.extractData(res);
                this.render();
            } else {
                this.showError(`Failed to fetch ${this.entityName} architecture.`);
            }
        } catch (err) {
            console.error(`${this.entityName} Load Error:`, err);
            this.showError("Connection attempt failed.");
        }
    }

    render() {
        this.container.innerHTML = '';
        if (this.items.length === 0) {
            this.showEmptyState();
            return;
        }

        this.items.forEach(item => {
            const element = this.createEntityElement(item);
            this.container.appendChild(element);
        });

        this.onRenderComplete();
    }

    // Abstract placeholder
    createEntityElement(item) {
        throw new Error("createEntityElement() must be implemented by subclass.");
    }

    onRenderComplete() {
        // GSAP Entry Animation — explicit fromTo ensures final state is always stable
        if (window.gsap) {
            gsap.fromTo(
                this.container.children,
                {
                    opacity: 0,
                    y: 30,
                },
                {
                    opacity: 1,
                    y: 0,
                    stagger: 0.08,
                    duration: 0.5,
                    ease: "power2.out",
                    clearProps: "transform" // Clean up after animation so hover CSS works
                }
            );
        }
    }

    openModal(modal, data = null) {
        if (!modal) return;
        if (data) this.fillForm(modal, data);
        modal.style.display = 'flex';
        gsap.from(modal.querySelector('.modal-content'), { scale: 0.9, opacity: 0, duration: 0.3 });
    }

    closeModal(modal) {
        if (modal) modal.style.display = 'none';
    }

    showLoading() {
        this.container.innerHTML = `
            <div style="grid-column: 1/-1; text-align: center; padding: 50px;">
                <i class="fa fa-spinner fa-spin" style="font-size: 2rem; color: var(--primary);"></i>
                <p style="margin-top: 15px; color: var(--text-muted);">Syncing Logic...</p>
            </div>`;
    }

    showError(msg) {
        this.container.innerHTML = `<div style="grid-column: 1/-1; color: red; text-align: center; padding: 40px;">${msg}</div>`;
    }

    showEmptyState() {
        this.container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; padding: 50px; color: var(--text-muted);">No ${this.entityName} found.</div>`;
    }

    async handleDelete(id, deleteFunc) {
        if (!confirm(`Are you sure you want to remove this ${this.entityName}?`)) return;
        
        try {
            const formData = new FormData();
            formData.append('id', id);
            const res = await deleteFunc(formData);
            if (res.status === 'success') {
                await this.load();
            } else {
                alert(res.message || "Action failed.");
            }
        } catch (err) {
            console.error("Delete Error:", err);
        }
    }
}
