/**
 * AlGraphy Studio — Inquiry Management Logic
 */

let allLeads = []; // Global store for filtering

window.fetchAndRenderLeads = async function() {
    const container = document.getElementById('leads-admin-workspace');
    if (!container) return;

    try {
        const data = await APIService.fetchLeads();
        
        if (data.status === 'success') {
            allLeads = data.leads || [];
            renderLeads(allLeads, container);
        }
    } catch (error) {
        console.error('Error fetching leads:', error);
        container.innerHTML = '<div style="color:red; padding:40px; text-align:center;">Failed to load inquiries.</div>';
    }
};

// Search Filter Logic
document.getElementById('leadSearchInput')?.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    const container = document.getElementById('leads-admin-workspace');
    
    const filtered = allLeads.filter(lead => 
        lead.Client_Name.toLowerCase().includes(term) || 
        (lead.Email_Address && lead.Email_Address.toLowerCase().includes(term)) ||
        (lead.status && lead.status.toLowerCase().includes(term))
    );
    
    renderLeads(filtered, container);
});

function renderLeads(leads, container) {
    container.innerHTML = '';
    
    if (leads.length === 0) {
        container.innerHTML = '<div style="grid-column:1/-1; text-align:center; padding:50px; color:var(--text-muted);">No inquiries found.</div>';
        return;
    }

    leads.forEach(lead => {
        const card = document.createElement('div');
        card.className = 'lead-admin-card';
        
        const statusClass = `status-${lead.status.toLowerCase()}`;
        
        card.innerHTML = `
            <div class="lead-status-banner ${statusClass}">${lead.status}</div>
            <div class="lead-info">
                <h3>${lead.Client_Name}</h3>
                <div class="lead-detail"><i class="fa fa-envelope"></i> ${lead.Email_Address}</div>
                <div class="lead-detail"><i class="fa fa-phone"></i> ${lead.Phone_Number}</div>
                <div class="lead-detail"><i class="fa fa-calendar-check"></i> ${lead.Appointment_Date || 'Flexible Date'}</div>
                <div class="lead-detail"><i class="fa fa-clock"></i> ${lead.Preferred_Time || 'Flexible Time'}</div>
                <div class="lead-detail"><i class="fa fa-clock-rotate-left"></i> Submitted: ${new Date(lead.Created_At).toLocaleString()}</div>
            </div>
            
            <div class="card-actions">
                ${lead.status === 'Pending' ? 
                    `<button class="action-btn contacted-btn" onclick="updateLeadStatus(${lead.ID}, 'Contacted')"><i class="fa fa-phone-flip"></i> MARK AS CONTACTED</button>` : 
                    `<button class="action-btn pending-btn" onclick="updateLeadStatus(${lead.ID}, 'Pending')"><i class="fa fa-undo"></i> REVERT TO PENDING</button>`
                }
            </div>
        `;
        
        container.appendChild(card);
    });
}

window.updateLeadStatus = async function(id, status) {
    const formData = new FormData();
    formData.append('id', id);
    formData.append('status', status);

    try {
        const res = await APIService.updateLeadStatus(formData);
        if (res.status === 'success') {
            window.fetchAndRenderLeads();
        } else {
            alert('Update failed: ' + res.message);
        }
    } catch (err) {
        console.error('Status update failed:', err);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    if (typeof CustomCursor === 'function')  // Redundant ;
    window.fetchAndRenderLeads();
});
