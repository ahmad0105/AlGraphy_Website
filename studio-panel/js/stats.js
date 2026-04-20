class AnalyticsHandler {
    constructor() {
        this.container = document.getElementById('stats-admin-workspace');
        this.searchInput = document.getElementById('globalSearch');
        this.filterSelect = document.getElementById('columnFilter');
        this.masterData = [];
        this.projects = [];
        this.employees = [];

        // Modal Elements
        this.assignModal = document.getElementById('assignProjectModal');
        this.openModalBtn = document.getElementById('openAssignModalBtn');
        this.closeModalBtn = document.getElementById('closeAssignModal');
        this.assignForm = document.getElementById('assignResourcesForm');
        this.addRowBtn = document.getElementById('addResourceRowBtn');
        this.rowsContainer = document.getElementById('assignmentRows');

        if (this.container) {
            this.init();
        }
    }

    async init() {
        // ALWAYS bind events so UI is interactive immediately
        this.bindEvents();

        try {
            const [statsRes, projRes, empRes] = await Promise.all([
                APIService.fetchStats().catch(() => ({ status: 'error' })),
                APIService.fetchProjects().catch(() => ({ status: 'error' })),
                APIService.fetchEmployees().catch(() => ({ status: 'error' }))
            ]);

            if (statsRes.status === 'success') {
                this.masterData = statsRes.data;
                this.renderTable(this.masterData);
            }

            this.projects = projRes.status === 'success' ? projRes.projects : [];
            this.employees = empRes.status === 'success' ? empRes.employees : [];
            
            this.populateDropdowns();
            
        } catch (err) {
            console.error('Stats pull failed:', err);
            // Don't show total error if it's just a data fetch issue, 
            // the table renderer handles empty states.
        }
    }

    populateDropdowns() {
        const projDrop = document.getElementById('assignProjDropdown');
        if (!projDrop) return;
        
        projDrop.innerHTML = '<option value="">Choose Project...</option>';
        this.projects.forEach(p => {
            const opt = document.createElement('option');
            opt.value = p.ID;
            opt.innerText = p.Project_name;
            projDrop.appendChild(opt);
        });

        // Initialize First Row
        this.resetAssignmentRows();
    }

    resetAssignmentRows() {
        this.rowsContainer.innerHTML = '';
        this.addAssignmentRow();
    }


    renderTable(dataSet) {
        if (!dataSet || dataSet.length === 0) {
            this.container.innerHTML = `
                <div class="empty-state">
                    <i class="fa fa-folder-open" style="font-size:3rem; margin-bottom:20px; color:var(--text-muted);"></i>
                    <h3>No Master Data Points Yet</h3>
                    <p>Metrics will sync once projects, time logs, and clients are combined.</p>
                </div>`;
            return;
        }

        let tableHtml = `
            <table class="stats-table">
                <thead>
                    <tr>
                        <th style="width: 80px;">Actions</th>
                        <th data-sort="Project_name">Project Focus <i class="fa fa-sort"></i></th>
                        <th data-sort="Company_name">Client / Stakeholder <i class="fa fa-sort"></i></th>
                        <th data-sort="Employee_Names">Operator (Team) <i class="fa fa-sort"></i></th>
                        <th data-sort="Project_Budget" class="col-num">Budget <i class="fa fa-sort"></i></th>
                        <th data-sort="Employee_Rates" class="col-num">Team Rate (Σ) <i class="fa fa-sort"></i></th>
                        <th data-sort="Total_Hours_Worked" class="col-num">Hours <i class="fa fa-sort"></i></th>
                        <th data-sort="Total_Cost" class="col-num">Total Team Cost <i class="fa fa-sort"></i></th>
                    </tr>
                </thead>
                <tbody>
        `;

        dataSet.forEach(row => {
            const budStr = row.Project_Budget ? `$${parseFloat(row.Project_Budget).toLocaleString()}` : '-';
            const rateStr = row.Employee_Rates ? `$${parseFloat(row.Employee_Rates).toLocaleString()}/h` : '$0/h';
            const hrStr = row.Total_Hours_Worked ? parseFloat(row.Total_Hours_Worked).toFixed(1) : '0';
            const costStr = row.Total_Cost ? `$${parseFloat(row.Total_Cost).toLocaleString()}` : '$0.00';
            const emps = row.Employee_Names || 'Unassigned';

            tableHtml += `
                <tr>
                    <td>
                        <div style="display:flex; gap:10px; justify-content:center;">
                            <button class="edit-assignment-btn" data-id="${row.Project_ID}" title="Edit Team Assignments" style="background:transparent; border:none; color:var(--text-muted); cursor:pointer; font-size:1.1rem; transition:0.3s;"><i class="fa fa-pencil-alt"></i></button>
                            <button class="delete-assignment-btn" data-id="${row.Project_ID}" title="Delete All Logs" style="background:transparent; border:none; color:#ff4d4d; cursor:pointer; font-size:1.1rem; transition:0.3s;"><i class="fa fa-eraser"></i></button>
                        </div>
                    </td>
                    <td class="col-proj">${row.Project_name || 'N/A'}</td>
                    <td>${row.Company_name || 'AlGraphy Studio (Internal)'}</td>
                    <td class="col-emp"><i class="fa fa-users" style="margin-right:8px; color:var(--primary);"></i>${emps}</td>
                    <td class="col-num">${budStr}</td>
                    <td class="col-num">${rateStr}</td>
                    <td class="col-num col-hours">${hrStr} hrs</td>
                    <td class="col-num col-money">${costStr}</td>
                </tr>
            `;
        });

        tableHtml += `</tbody></table>`;
        this.container.innerHTML = tableHtml;

        this.container.querySelectorAll('th[data-sort]').forEach(th => {
            th.addEventListener('click', () => this.handleSort(th.dataset.sort));
        });

        this.container.querySelectorAll('.edit-assignment-btn').forEach(btn => {
            btn.onclick = () => this.handleEditAssignments(btn.dataset.id);
        });

        this.container.querySelectorAll('.delete-assignment-btn').forEach(btn => {
            btn.onclick = () => this.handleDeleteAssignments(btn.dataset.id);
        });
    }

    bindEvents() {
        if (this.searchInput) {
            this.searchInput.addEventListener('input', () => this.handleFilter());
        }
        if (this.filterSelect) {
            this.filterSelect.addEventListener('change', () => this.handleFilter());
        }

        // Modal Controls
        this.openModalBtn.onclick = () => {
            const modalTitle = this.assignModal.querySelector('h3');
            if (modalTitle) modalTitle.innerHTML = '<i class="fa fa-users-cog"></i> ASSIGN PROJECT RESOURCES';
            this.assignModal.style.display = 'flex';
            this.resetAssignmentRows();
        };

        this.closeModalBtn.onclick = () => {
            this.assignModal.style.display = 'none';
        };

        this.addRowBtn.onclick = () => this.addAssignmentRow();

        this.assignForm.onsubmit = async (e) => {
            e.preventDefault();
            const formData = new FormData(this.assignForm);
            const statusMsg = document.getElementById('assignStatusMsg');
            const submitBtn = document.getElementById('saveAssignmentsBtn');

            submitBtn.innerText = 'Synchronizing...';
            submitBtn.disabled = true;

            try {
                const res = await APIService.assignProjectResources(formData);
                if (res.status === 'success') {
                    statusMsg.innerHTML = '<span style="color:#00ff00;">Assignment Successful! Reloading metrics...</span>';
                    setTimeout(() => {
                        this.assignModal.style.display = 'none';
                        this.init(); // Refresh data
                        statusMsg.innerText = '';
                    }, 1500);
                } else {
                    statusMsg.innerHTML = `<span style="color:red;">Error: ${res.message}</span>`;
                }
            } catch (err) {
                console.error(err);
                statusMsg.innerHTML = '<span style="color:red;">Connection error. Architecture unstable.</span>';
            } finally {
                submitBtn.innerText = 'CONFIRM ASSIGNMENT & SYNC HOURS';
                submitBtn.disabled = false;
            }
        };
    }

    handleSort(column) {
        if (this.currentSortCol === column) {
            this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortCol = column;
            this.sortDirection = 'asc';
        }

        this.masterData.sort((a, b) => {
            let valA = a[column] || 0;
            let valB = b[column] || 0;

            if (!isNaN(parseFloat(valA)) && isFinite(valA)) {
                return this.sortDirection === 'asc' 
                    ? parseFloat(valA) - parseFloat(valB) 
                    : parseFloat(valB) - parseFloat(valA);
            }

            return this.sortDirection === 'asc'
                ? valA.toString().localeCompare(valB.toString())
                : valB.toString().localeCompare(valA.toString());
        });

        this.renderTable(this.masterData);
    }

    handleFilter() {
        let keyword = this.searchInput.value.toLowerCase().trim();
        let viewType = this.filterSelect.value;
        
        let filtered = this.masterData.filter(row => {
            let aggregatedText = Object.values(row).join(' ').toLowerCase();
            return keyword === '' || aggregatedText.includes(keyword);
        });

        if (viewType === 'Roster') {
            filtered.sort((a,b) => (a.Employee_Names || '').localeCompare(b.Employee_Names || ''));
        } else if (viewType === 'ClientUpdate') {
            filtered.sort((a,b) => (a.Company_name || '').localeCompare(b.Company_name || ''));
        } else if (viewType === 'Profitability') {
            filtered.sort((a,b) => parseFloat(b.Total_Cost || 0) - parseFloat(a.Total_Cost || 0));
        }

        this.renderTable(filtered);
    }

    async handleEditAssignments(projectId) {
        const modalTitle = this.assignModal.querySelector('h3');
        try {
            const res = await APIService.fetchProjectAssignments(projectId);
            if (res.status === 'success') {
                // Branding the modal for EDIT mode
                if (modalTitle) modalTitle.innerHTML = '<i class="fa fa-edit"></i> UPDATE PROJECT RESOURCE ARCHITECTURE';
                
                this.assignModal.style.display = 'flex';
                document.getElementById('assignProjDropdown').value = projectId;
                
                this.rowsContainer.innerHTML = '';
                if (res.assignments && res.assignments.length > 0) {
                    res.assignments.forEach(as => {
                        this.addAssignmentRow(as.employee_id, as.Hours_worked);
                    });
                } else {
                    this.addAssignmentRow();
                }
            }
        } catch (err) {
            console.error('Fetch assignment failed:', err);
        }
    }

    async handleDeleteAssignments(projectId) {
        if (!confirm('Are you sure you want to clear all resource logs for this project? This will reset hours and costs to 0.')) return;

        const formData = new FormData();
        formData.append('project_id', projectId);

        try {
            const res = await APIService.deleteAssignments(formData);
            if (res.status === 'success') {
                this.init(); // Refresh table
            } else {
                alert('Purge failed: ' + res.message);
            }
        } catch (err) {
            console.error('Delete failed:', err);
        }
    }

    // Updated to support pre-filling and dynamic titles
    addAssignmentRow(empId = '', hours = '') {
        const row = document.createElement('div');
        row.className = 'assignment-row';
        row.style = 'display: grid; grid-template-columns: 2fr 1fr 40px; gap: 10px; margin-bottom: 15px; background: rgba(255,255,255,0.03); padding: 10px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1);';

        let empOptions = '<option value="">Select Employee...</option>';
        this.employees.forEach(e => {
            const selected = (e.ID == empId) ? 'selected' : '';
            // For editing, we add a hint about the employee's rate
            const rateHint = e.hourly_rate ? ` ($${e.hourly_rate}/h)` : '';
            empOptions += `<option value="${e.ID}" ${selected}>${e.Full_name}${rateHint}</option>`;
        });

        row.innerHTML = `
            <div class="form-group" style="margin-bottom:0; flex-grow:1;">
                <select name="employees[]" class="emp-select" required>${empOptions}</select>
            </div>
            <div class="form-group" style="margin-bottom:0; width:80px;">
                <input type="number" step="0.5" name="hours[]" placeholder="Hrs" value="${hours}" required>
            </div>
            <button type="button" class="remove-row" style="background:transparent; color:#ff4d4d; border:none; cursor:pointer; font-size: 1.2rem; display:flex; align-items:center; justify-content:center;"><i class="fa fa-minus-circle"></i></button>
        `;

        row.querySelector('.remove-row').onclick = () => {
            if (this.rowsContainer.children.length > 1) row.remove();
        };

        this.rowsContainer.appendChild(row);
    }

    showError(msg) {
        this.container.innerHTML = `<div style="color:red; padding:40px; text-align:center;"><i class="fa fa-exclamation-triangle"></i> ${msg}</div>`;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    new AnalyticsHandler();
});

