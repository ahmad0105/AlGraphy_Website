/**
 * AlGraphy Studio — Clients Management Logic
 */

window.fetchAndRenderClients = async function() {
    const container = document.getElementById('clients-admin-workspace');
    if (!container) return;

    try {
        const data = await APIService.fetchClients();
        
        if (data.status === 'success') {
            renderClientsAdmin(data.clients, container);
        }
    } catch (error) {
        console.error('Error fetching clients:', error);
        container.innerHTML = '<div style="color:red; padding:40px; text-align:center;">Failed to load clients.</div>';
    }
};

function renderClientsAdmin(clients, container) {
    container.innerHTML = '';
    
    if (clients.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; color:var(--text-muted);">No clients found. Click "Add Client" to start.</div>';
        return;
    }

    clients.forEach(client => {
        const card = document.createElement('div');
        card.className = 'client-admin-card';
        
        // Use the first letter of the company name as an avatar icon
        const firstLetter = client.Company_name ? client.Company_name.charAt(0).toUpperCase() : 'C';

        card.innerHTML = `
            <div class="client-preview-tile"><i class="fa fa-user-circle"></i></div>
            <div class="client-info">
                <h3>${client.Company_name}</h3>
                <p class="client-email"><i class="fa fa-envelope" style="margin-right:5px; color:var(--primary);"></i> ${client.Contact_email || 'No email provided'}</p>
                <div class="card-actions">
                    <button class="edit-btn"><i class="fa fa-edit"></i> Edit</button>
                    <button class="delete-btn"><i class="fa fa-trash"></i></button>
                </div>
            </div>
        `;

        card.querySelector('.edit-btn').onclick = () => openEditClientModal(client);
        card.querySelector('.delete-btn').onclick = () => deleteClient(client.ID);
        
        container.appendChild(card);
    });
}

function openEditClientModal(client) {
    const modal = document.getElementById('editClientModal');
    if (!modal) return;

    document.getElementById('editClientId').value = client.ID;
    document.getElementById('editClientNameInput').value = client.Company_name;
    document.getElementById('editClientEmailInput').value = client.Contact_email || '';
    
    modal.style.display = 'flex';
}

/**
 * API Actions
 */

async function deleteClient(id) {
    if (!confirm('Are you absolutely sure? This will permanently remove this client.')) return;
    
    const formData = new FormData();
    formData.append('id', id);

    try {
        const res = await APIService.deleteClient(formData);
        if (res.status === 'success') {
            window.fetchAndRenderClients();
        } else {
            if (res.error === 'dependency_error') {
                alert("Restricted Action: \n\n" + res.message);
            } else {
                alert('An unexpected error occurred: ' + (res.message || res.error));
            }
        }
    } catch (err) {
        console.error('Delete failed:', err);
    }
}



document.getElementById('editClientForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const statusDiv = document.getElementById('clientUpdateStatus');

    submitBtn.innerText = 'Saving...';
    submitBtn.disabled = true;

    try {
        const res = await APIService.updateClient(formData);
        if (res.status === 'success') {
            statusDiv.style.color = '#00ff00';
            statusDiv.innerText = 'Client details updated!';
            setTimeout(() => {
                document.getElementById('editClientModal').style.display = 'none';
                statusDiv.innerText = '';
                window.fetchAndRenderClients();
            }, 1000);
        } else {
            alert('Error: ' + res.message);
        }
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        submitBtn.innerText = 'SAVE CHANGES';
        submitBtn.disabled = false;
    }
});

/**
 * UI Controls
 */
document.getElementById('closeClientModal')?.addEventListener('click', () => {
    document.getElementById('editClientModal').style.display = 'none';
});

document.getElementById('closeAddClientModal')?.addEventListener('click', () => {
    document.getElementById('addClientModal').style.display = 'none';
});

// Show Add Client Modal
document.getElementById('addNewClientBtn')?.addEventListener('click', () => {
    document.getElementById('addClientModal').style.display = 'flex';
    document.getElementById('addClientForm').reset();
    document.getElementById('addClientStatus').innerText = '';
});

// Handle Add Client Form Submission
document.getElementById('addClientForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target;
    const formData = new FormData(form);
    const statusDiv = document.getElementById('addClientStatus');
    const submitBtn = form.querySelector('button[type="submit"]');

    statusDiv.style.color = 'var(--primary)';
    statusDiv.innerText = 'Creating client...';
    submitBtn.disabled = true;

    try {
        const data = await APIService.addClient(formData);
        if (data.status === 'success') {
            statusDiv.style.color = '#00ff88';
            statusDiv.innerText = 'Client registered successfully!';
            setTimeout(() => {
                document.getElementById('addClientModal').style.display = 'none';
                window.fetchAndRenderClients();
            }, 1500);
        } else {
            throw new Error(data.error || 'Failed to add client');
        }
    } catch (err) {
        statusDiv.style.color = '#ff4d4d';
        statusDiv.innerText = err.message;
    } finally {
        submitBtn.disabled = false;
    }
});

document.addEventListener('DOMContentLoaded', () => {
    if (typeof CustomCursor === 'function')  // Redundant ;
    window.fetchAndRenderClients();
    console.log("Clients Management Module: Active");
});
