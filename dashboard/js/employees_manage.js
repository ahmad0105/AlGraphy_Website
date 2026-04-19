/**
 * AlGraphy Studio — Employees Management Module (OOP Refactored)
 */

class EmployeeManager extends BaseManager {
    constructor() {
        super({
            containerId: 'employees-admin-workspace',
            addModalId: 'addEmployeeModal',
            editModalId: 'editEmployeeModal',
            entityName: 'Employee',
            api: {
                fetch: () => APIService.fetchEmployees(),
                extractData: (res) => res.employees || []
            }
        });

        this.initModule();
    }

    initModule() {
        this.bindEmployeeEvents();
        this.load();
    }

    bindEmployeeEvents() {
        // Search Filter
        document.getElementById('employeeSearchInput')?.addEventListener('input', (e) => this.handleSearch(e));

        // Forms handled via specific submit listeners
        document.getElementById('addEmployeeForm')?.addEventListener('submit', (e) => this.handleCreate(e));
        document.getElementById('editEmployeeForm')?.addEventListener('submit', (e) => this.handleUpdate(e));

        // Add Button Trigger
        document.getElementById('addNewEmployeeBtn')?.addEventListener('click', () => {
            this.openModal(this.addModal);
            // Default date setup
            const dateInput = document.getElementById('addEmpJoiningDate');
            if (dateInput) dateInput.value = new Date().toISOString().split('T')[0];
        });

        // Close Buttons
        document.getElementById('closeAddModal')?.addEventListener('click', () => this.closeModal(this.addModal));
        document.getElementById('closeEmployeeModal')?.addEventListener('click', () => this.closeModal(this.editModal));
    }

    handleSearch(e) {
        const term = e.target.value.toLowerCase();
        const filtered = this.items.filter(emp => 
            emp.Full_name.toLowerCase().includes(term) || 
            (emp.Role && emp.Role.toLowerCase().includes(term)) ||
            (emp.Email && emp.Email.toLowerCase().includes(term))
        );
        this.renderFiltered(filtered);
    }

    renderFiltered(filteredItems) {
        this.container.innerHTML = '';
        filteredItems.forEach(emp => this.container.appendChild(this.createEntityElement(emp)));
    }

    createEntityElement(emp) {
        const card = document.createElement('div');
        card.className = 'emp-admin-card';
        
        const baseUrl = CONFIG.API.BASE_URL.replace('/algraphybackend/public', '');
        const picPath = emp.profile_pic 
            ? `${baseUrl}/algraphybackend/public/${emp.profile_pic}` 
            : '../Assets/image/default_avatar.png';

        const hourlyRateStr = emp.hourly_rate ? `$${parseFloat(emp.hourly_rate).toFixed(2)}/hr` : 'N/A';

        card.innerHTML = `
            <div class="emp-preview-tile" style="background-image: url('${picPath}'); background-size: cover; background-position: center;"></div>
            <div class="emp-info">
                <span class="emp-role-tag">${emp.Role || 'Staff'}</span>
                <h3>${emp.Full_name}</h3>
                <p class="emp-details"><i class="fa fa-envelope"></i> ${emp.Email || 'No email'}</p>
                <p class="emp-details"><i class="fa fa-dollar-sign"></i> ${hourlyRateStr}</p>
                <p class="emp-details"><i class="fa fa-calendar-alt"></i> Joined: ${emp.joining_date || 'N/A'}</p>
                
                <div class="card-actions">
                    <button class="edit-btn"><i class="fa fa-edit"></i> Edit</button>
                    <button class="delete-btn"><i class="fa fa-trash"></i></button>
                </div>
            </div>
        `;

        card.querySelector('.edit-btn').onclick = () => this.openModal(this.editModal, emp);
        card.querySelector('.delete-btn').onclick = () => this.handleDelete(emp.ID, (fd) => APIService.deleteEmployee(fd));
        
        return card;
    }

    fillForm(modal, emp) {
        if (modal === this.editModal) {
            document.getElementById('editEmpId').value = emp.ID;
            document.getElementById('editEmpNameInput').value = emp.Full_name;
            document.getElementById('editEmpRoleInput').value = emp.Role || '';
            document.getElementById('editEmpEmailInput').value = emp.Email || '';
            document.getElementById('editEmpRateInput').value = emp.hourly_rate || '';
            document.getElementById('editEmpJoiningDate').value = emp.joining_date || '';
        }
    }

    async handleCreate(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        const statusDiv = document.getElementById('empAddStatus');

        try {
            submitBtn.innerText = 'Synchronizing...';
            submitBtn.disabled = true;
            const res = await APIService.addEmployee(formData);
            if (res.status === 'success') {
                this.closeModal(this.addModal);
                e.target.reset();
                await this.load();
            } else {
                statusDiv.innerText = res.message || "Sync Failed.";
            }
        } catch (err) {
            console.error(err);
        } finally {
            submitBtn.innerText = 'CREATE EMPLOYEE';
            submitBtn.disabled = false;
        }
    }

    async handleUpdate(e) {
        e.preventDefault();
        const formData = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');

        try {
            submitBtn.innerText = 'Updating...';
            submitBtn.disabled = true;
            const res = await APIService.updateEmployee(formData);
            if (res.status === 'success') {
                this.closeModal(this.editModal);
                await this.load();
            } else {
                alert(res.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            submitBtn.innerText = 'SAVE CHANGES';
            submitBtn.disabled = false;
        }
    }
}

// Global Initialization
document.addEventListener('DOMContentLoaded', () => {
    window.employeeManager = new EmployeeManager();
});
