/**
 * AlGraphy Studio — Services Management Logic
 * Handles fetching services, rendering admin cards, and updating via API.
 */

window.fetchAndRenderServices = async function() {
    const container = document.getElementById('services-admin-workspace') || document.getElementById('services-list-container');
    if (!container) return;

    try {
        const data = await APIService.fetchServices();
        
        if (data.status === 'success') {
            renderServicesAdmin(data.categories, container);
        }
    } catch (error) {
        console.error('Error fetching services:', error);
        container.innerHTML = '<div style="color:red; padding:40px; text-align:center;">Failed to load services. Check server connection.</div>';
    }
};

function renderServicesAdmin(categories, container) {
    container.innerHTML = '';
    
    categories.forEach(cat => {
        // Category Header with Edit Action
        const catHeader = document.createElement('div');
        catHeader.style.gridColumn = '1 / -1';
        catHeader.style.marginTop = '40px';
        catHeader.style.marginBottom = '20px';
        catHeader.style.display = 'flex';
        catHeader.style.alignItems = 'center';
        catHeader.style.gap = '15px';

        catHeader.innerHTML = `
            <h2 style="color:var(--primary); font-size:1.3rem; border-bottom:1px solid var(--border-color); padding-bottom:10px; flex-grow:1;">
                ${cat.name} Section
            </h2>
            <div style="display: flex; gap: 10px;">
                <button class="edit-cat-btn" style="background:transparent; border:1px solid var(--border-color); color:#fff; padding:8px 12px; border-radius:8px; cursor:pointer; transition:0.3s; font-size:0.8rem;">
                    <i class="fa fa-edit"></i> Edit
                </button>
                <button class="delete-cat-btn" style="background:rgba(255,0,0,0.1); border:1px solid rgba(255,0,0,0.3); color:#ff5555; padding:8px 12px; border-radius:8px; cursor:pointer; transition:0.3s; font-size:0.8rem;">
                    <i class="fa fa-trash"></i> Delete
                </button>
                <button class="add-service-btn" style="background:var(--primary); border:none; color:#fff; padding:8px 12px; border-radius:8px; cursor:pointer; transition:0.3s; font-size:0.8rem; font-weight:600;">
                    <i class="fa fa-plus"></i> Add Service
                </button>
            </div>
        `;
        
        catHeader.querySelector('.edit-cat-btn').onclick = () => openEditCategoryModal(cat);
        catHeader.querySelector('.delete-cat-btn').onclick = () => handleDeleteCategory(cat.id, cat.name);
        catHeader.querySelector('.add-service-btn').onclick = () => openAddServiceModal(cat.id);
        container.appendChild(catHeader);

        const grid = document.createElement('div');
        grid.className = 'admin-services-grid';

        cat.services.forEach(svc => {
            const card = document.createElement('div');
            card.className = 'svc-admin-card'; // Matches Projects Design
            
            let imgPath = svc.image_url ? svc.image_url : '/Assets/GIF/strategy.gif';
            if (imgPath && typeof imgPath === 'string') {
                if (imgPath.startsWith('Assets') || imgPath.startsWith('algraphybackend')) imgPath = '/'+ imgPath;
                if (imgPath.startsWith('uploads')) {
                    const baseUrl = CONFIG.API.BASE_URL.replace('/algraphybackend/public', '');
                    imgPath = `${baseUrl}/algraphybackend/public/${imgPath}`;
                }
            }

            card.innerHTML = `
                <img src="${imgPath}" class="svc-preview">
                <div class="svc-info">
                    <div class="svc-tags">SERVICE OFFERING</div>
                    <h3>${svc.Service_Name}</h3>
                    <p class="svc-desc">${svc.description || 'Professional studio service tailored to your business needs.'}</p>
                    <div class="svc-meta" style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <span><i class="fa fa-tag"></i> ${svc.Base_Price}</span>
                            <span><i class="fa fa-clock"></i> ${svc.Delivery_Time}</span>
                        </div>
                        <button class="svc-delete-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); color:rgba(255,255,255,0.5); padding:6px 12px; border-radius:8px; cursor:pointer; font-size:0.75rem; transition:0.3s; display:flex; align-items:center; gap:6px; font-weight:600;" title="Remove Service">
                             <i class="fa fa-trash"></i> Delete
                        </button>
                    </div>
                    <div class="card-actions">
                        <button class="edit-btn"><i class="fa fa-edit"></i> Adjust Details</button>
                    </div>
                </div>
            `;
 
            card.querySelector('.edit-btn').onclick = () => openEditServiceModal(svc);
            card.querySelector('.svc-delete-btn').onclick = () => handleDeleteService(svc.id, svc.Service_Name);
            grid.appendChild(card);
        });
 
        container.appendChild(grid);
    });
}

async function handleDeleteService(id, name) {
    if (!confirm(`Are you sure you want to PERMANENTLY delete the service: "${name}"?`)) return;

    try {
        const formData = new FormData();
        formData.append('id', id);

        const res = await APIService.deleteService(formData);
        if (res.status === 'success') {
            window.fetchAndRenderServices();
        } else {
            alert(res.message);
        }
    } catch (err) {
        console.error("Delete service failed:", err);
    }
}

function openEditServiceModal(svc) {
    const modal = document.getElementById('editServiceModal');
    if (!modal) return;

    // Fill Form
    document.getElementById('editSvcId').value = svc.id;
    document.getElementById('editSvcTitleInput').value = svc.Service_Name || '';
    document.getElementById('editSvcPriceInput').value = svc.Base_Price || '';
    document.getElementById('editSvcDurationInput').value = svc.Delivery_Time || '';
    document.getElementById('editSvcDescInput').value = svc.description || '';
    
    // Safety check for optional fields expecting JSON
    let inc = [];
    try { inc = JSON.parse(svc.Service_Includes || '[]'); } catch(e){}
    let tech = [];
    try { tech = JSON.parse(svc.Technology_Stack || '[]'); } catch(e){}
    
    if(document.getElementById('editSvcIncludesInput')) 
        document.getElementById('editSvcIncludesInput').value = Array.isArray(inc) ? inc.join(', ') : '';
    if(document.getElementById('editSvcTechInput'))
        document.getElementById('editSvcTechInput').value = Array.isArray(tech) ? tech.join(', ') : '';

    modal.style.display = 'flex';
}

function openEditCategoryModal(cat) {
    const modal = document.getElementById('editCategoryModal');
    if (!modal) return;

    document.getElementById('editCatId').value = cat.id;
    document.getElementById('editCatNameInput').value = cat.name;
    
    modal.style.display = 'flex';
}

// Form Submission
document.getElementById('editServiceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const statusDiv = document.getElementById('svcUpdateStatus');
    
    submitBtn.innerText = 'Synchronizing...';
    submitBtn.disabled = true;

    try {
        const result = await APIService.updateService(formData);

        if (result.status === 'success') {
            if(statusDiv) {
                statusDiv.style.color = '#00ff00';
                statusDiv.innerText = 'Service Synced Successfully!';
            }
            setTimeout(() => {
                document.getElementById('editServiceModal').style.display = 'none';
                window.fetchAndRenderServices(); // Refresh list
            }, 1000);
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Update failed:', error);
        alert('An unexpected error occurred.');
    } finally {
        submitBtn.innerText = 'Sync Changes';
        submitBtn.disabled = false;
    }
});

// Category Name Update Submission
document.getElementById('editCategoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const statusDiv = document.getElementById('catUpdateStatus');
    
    submitBtn.innerText = 'Updating...';
    submitBtn.disabled = true;

    try {
        const result = await APIService.updateCategory(formData);

        if (result.status === 'success') {
            if(statusDiv) {
                statusDiv.style.color = '#00ff00';
                statusDiv.innerText = 'Tab Renamed Successfully!';
            }
            setTimeout(() => {
                document.getElementById('editCategoryModal').style.display = 'none';
                window.fetchAndRenderServices(); 
            }, 1000);
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Category failed:', error);
        alert('An unexpected error occurred.');
    } finally {
        submitBtn.innerText = 'Update Tab Button';
        submitBtn.disabled = false;
    }
});

// Modal Toggles (Close)
document.getElementById('closeEditModal')?.addEventListener('click', () => document.getElementById('editServiceModal').style.display = 'none');
document.getElementById('closeCatModal')?.addEventListener('click', () => document.getElementById('editCategoryModal').style.display = 'none');
document.getElementById('closeAddCatModal')?.addEventListener('click', () => document.getElementById('addCategoryModal').style.display = 'none');
document.getElementById('closeAddSvcModal')?.addEventListener('click', () => document.getElementById('addServiceModal').style.display = 'none');

// Modal Toggles (Open)
document.getElementById('addNewSectionBtn')?.addEventListener('click', () => {
    document.getElementById('addCategoryModal').style.display = 'flex';
});

function openAddServiceModal(categoryId) {
    const modal = document.getElementById('addServiceModal');
    if (!modal) return;
    
    document.getElementById('addSvcCatId').value = categoryId;
    modal.style.display = 'flex';
}

// Handle Add Service Submission
document.getElementById('addServiceForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const statusDiv = document.getElementById('svcAddStatus');
    
    submitBtn.innerText = 'Deploying...';
    submitBtn.disabled = true;

    try {
        const result = await APIService.addService(formData);

        if (result.status === 'success') {
            if(statusDiv) {
                statusDiv.style.color = '#00ff00';
                statusDiv.innerText = 'Service Successfully Deployed!';
            }
            setTimeout(() => {
                document.getElementById('addServiceModal').style.display = 'none';
                e.target.reset();
                window.fetchAndRenderServices(); 
            }, 1000);
        } else {
            alert('Error: ' + result.error || result.message);
        }
    } catch (error) {
        console.error('Add Service failed:', error);
        alert('An unexpected error occurred.');
    } finally {
        submitBtn.innerText = 'Deploy Service';
        submitBtn.disabled = false;
    }
});

// Handle Delete Category
async function handleDeleteCategory(id, name) {
    if (!confirm(`CAUTION: Are you sure you want to delete the "${name}" section? This will permanently remove all services within this category as well.`)) return;

    try {
        const formData = new FormData();
        formData.append('id', id);
        const res = await APIService.deleteCategory(formData);
        if (res.status === 'success') {
            window.fetchAndRenderServices();
        } else {
            alert(res.message);
        }
    } catch (err) {
        console.error("Delete category failed:", err);
    }
}

// Handle Add Category Submission
document.getElementById('addCategoryForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const statusDiv = document.getElementById('catAddStatus');
    
    submitBtn.innerText = 'Establishing Pillar...';
    submitBtn.disabled = true;

    try {
        const result = await APIService.addCategory(formData);

        if (result.status === 'success') {
            if(statusDiv) {
                statusDiv.style.color = '#00ff00';
                statusDiv.innerText = 'New Pillar Established!';
            }
            setTimeout(() => {
                document.getElementById('addCategoryModal').style.display = 'none';
                e.target.reset();
                window.fetchAndRenderServices(); 
            }, 1000);
        } else {
            alert('Error: ' + result.message);
        }
    } catch (error) {
        console.error('Add Category failed:', error);
        alert('An unexpected error occurred.');
    } finally {
        submitBtn.innerText = 'Establish New Pillar';
        submitBtn.disabled = false;
    }
});

/**
 * Page Initialization Orchestrator
 */
document.addEventListener('DOMContentLoaded', () => {
    // 1. Initialize Global UI Components (Cursor, etc.)
    if (typeof CustomCursor === 'function') {
         // Redundant ;
    }

    // 2. Initial Data Pull from API
    window.fetchAndRenderServices();

    // 3. Status/Logging (Optional)
    console.log("Services Management Module: Online");
});
