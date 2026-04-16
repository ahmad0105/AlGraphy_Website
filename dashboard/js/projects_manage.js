/**
 * AlGraphy Studio — Projects Management Logic
 * Orchestrates portfolio CRUD operations and section synchronization.
 */

let allClients = [];

window.fetchAndRenderProjects = async function () {
    const container = document.getElementById('projects-admin-workspace');
    if (!container) return;

    try {
        const [projData, clientData] = await Promise.all([
            APIService.fetchProjects(),
            APIService.fetchClients()
        ]);

        if (projData.status === 'success') {
            if (projData.settings) {
                document.getElementById('projHeaderTitle').value = projData.settings.projects_section_title || '';
            }

            // Store clients for dropdowns
            allClients = clientData.clients || [];
            populateClientDropdown();

            renderProjectsAdmin(projData.projects, container);
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        container.innerHTML = '<div style="color:red; padding:40px; text-align:center;">Failed to load project ecosystem.</div>';
    }
};

function populateClientDropdown() {
    const dropdown = document.getElementById('editProjClientInput');
    if (!dropdown) return;

    dropdown.innerHTML = '<option value="">Select Client...</option>';
    allClients.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.ID;
        opt.innerText = c.Company_name;
        dropdown.appendChild(opt);
    });
}

function renderProjectsAdmin(projects, container) {
    container.innerHTML = '';

    if (projects.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; color:var(--text-muted);">No deployments found.</div>';
        return;
    }

    projects.forEach((proj, index) => {
        const card = document.createElement('div');
        card.className = 'proj-admin-card';

        let imgPath = proj.Main_Image || '../Assets/image/Aura.png';
        if (imgPath.startsWith('Assets') || imgPath.startsWith('algraphybackend')) imgPath = '/algraphy/' + imgPath;
        if (imgPath.startsWith('uploads')) imgPath = baseUrl + '/algraphybackend/public/' + imgPath; if (imgPath.startsWith('uploads')) imgPath = baseUrl + '/algraphybackend/public/' + imgPath;

        const budgetStr = proj.Budget ? `$${parseFloat(proj.Budget).toLocaleString()}` : '-';

        card.innerHTML = `
            <img src="${imgPath}" class="proj-preview" alt="${proj.Project_name || ''}">
            <div class="proj-info">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                   <span class="proj-tags">#${index + 1} | ${proj.Service_Category || 'General'}</span>
                   <span class="proj-status-tag status-${(proj.Status || 'Planning').toLowerCase()}">${proj.Status || 'Planning'}</span>
                </div>
                <h3>${proj.Project_name || 'Untitled Project'}</h3>
                <p class="proj-desc">${proj.Description || 'No overview provided.'}</p>
                
                <div style="margin-top:10px; font-size:0.85rem; color:var(--text-muted); display:flex; gap:15px;">
                    <span><i class="fa fa-wallet"></i> ${budgetStr}</span>
                    <span><i class="fa fa-calendar-alt"></i> ${proj.Start_Date || 'N/A'}</span>
                </div>

                <div class="card-actions">
                    <button class="edit-btn"><i class="fa fa-edit"></i> Edit Architecture</button>
                    <button class="delete-btn"><i class="fa fa-trash"></i></button>
                </div>
            </div>
        `;

        card.querySelector('.edit-btn').onclick = () => openEditProjectModal(proj);
        card.querySelector('.delete-btn').onclick = () => deleteProject(proj.ID);

        container.appendChild(card);
    });
}

function openEditProjectModal(proj = null) {
    const modal = document.getElementById('editProjectModal');
    if (!modal) return;

    const modalTitle = modal.querySelector('h3');
    const form = document.getElementById('editProjectForm');
    form.reset();

    if (proj) {
        // Edit Mode
        modalTitle.innerText = "Edit Project Architecture";
        document.getElementById('editProjId').value = proj.ID;
        document.getElementById('editProjTitleInput').value = proj.Project_name || '';
        document.getElementById('editProjTagsInput').value = proj.Service_Category || '';
        document.getElementById('editProjDescInput').value = proj.Description || '';
        document.getElementById('editProjBudgetInput').value = proj.Budget || '';
        document.getElementById('editProjStatusInput').value = proj.Status || 'Planning';
        document.getElementById('editProjClientInput').value = proj.client_id || '';
        document.getElementById('editProjStartInput').value = proj.Start_Date || '';
        document.getElementById('editProjEndInput').value = proj.End_Date || '';

        let featuresArray = [];
        try {
            featuresArray = typeof proj.Key_Features === 'string' ? JSON.parse(proj.Key_Features) : (proj.Key_Features || []);
            if (!Array.isArray(featuresArray)) featuresArray = [];
        } catch (e) { }

        if (document.getElementById('editProjFeaturesInput')) {
            document.getElementById('editProjFeaturesInput').value = featuresArray.join(', ');
        }
    } else {
        // Add Mode
        modalTitle.innerText = "Initiate New Project";
        document.getElementById('editProjId').value = '';
    }

    // Clear status message
    const statusDiv = document.getElementById('projUpdateStatus');
    if (statusDiv) statusDiv.innerText = '';

    modal.style.display = 'flex';
}

/**
 * API Actions
 */

async function deleteProject(id) {
    if (!confirm('Are you absolutely sure? This will permanently remove this project from your portfolio.')) return;

    const formData = new FormData();
    formData.append('id', id);

    try {
        const res = await APIService.deleteProject(formData);
        if (res.status === 'success') {
            window.fetchAndRenderProjects();
        } else {
            alert('Failed to delete: ' + res.message);
        }
    } catch (err) {
        console.error('Delete failed:', err);
    }
}

document.getElementById('addNewProjectBtn')?.addEventListener('click', () => {
    openEditProjectModal(null); // Open empty modal for adding
});

document.getElementById('editProjectForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const projId = formData.get('id');
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const statusDiv = document.getElementById('projUpdateStatus');

    submitBtn.innerText = 'Synchronizing Architecture...';
    submitBtn.disabled = true;

    try {
        let res;
        if (projId) {
            // Update existing
            res = await APIService.updateProject(formData);
        } else {
            // Create new
            res = await APIService.addProject(formData);
        }

        if (res.status === 'success') {
            statusDiv.style.color = '#00ff00';
            statusDiv.innerText = projId ? 'Project synchronized!' : 'New project registered!';
            setTimeout(() => {
                document.getElementById('editProjectModal').style.display = 'none';
                window.fetchAndRenderProjects();
            }, 1000);
        } else {
            statusDiv.style.color = 'red';
            statusDiv.innerText = 'Error: ' + res.message;
        }
    } catch (err) {
        console.error('Operation failed:', err);
    } finally {
        submitBtn.innerText = 'SAVE PROJECT ARCHITECTURE';
        submitBtn.disabled = false;
    }
});

document.getElementById('projectHeaderForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');

    submitBtn.innerText = 'Syncing...';
    submitBtn.disabled = true;

    try {
        const res = await APIService.updateProjectSettings(formData);
        if (res.status === 'success') {
            alert('Section headings updated successfully!');
        }
    } catch (err) {
        console.error('Header update failed:', err);
    } finally {
        submitBtn.innerText = 'Sync Headers';
        submitBtn.disabled = false;
    }
});

/**
 * UI Controls
 */
document.getElementById('closeProjModal')?.addEventListener('click', () => {
    document.getElementById('editProjectModal').style.display = 'none';
});

document.addEventListener('DOMContentLoaded', () => {
    if (typeof CustomCursor === 'function')  // Redundant ;
        window.fetchAndRenderProjects();
    console.log("Projects Management Module: Active");
});
