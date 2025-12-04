/**
 * SCP Entry Viewer
 * Displays detailed SCP information fetched from the API
 */

// Current SCP data
let currentSCP = null;
let objectClasses = [];

/**
 * Initialize the entry viewer page
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing SCP entry viewer...');

    // Get SCP code from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const scpCode = urlParams.get('scp');

    if (!scpCode) {
        showError('No SCP code provided in URL. Please provide an SCP code (e.g., ?scp=SCP-173)');
        return;
    }

    // Update breadcrumb
    document.getElementById('breadcrumb-scp').textContent = scpCode;

    // Set up quick search
    setupQuickSearch();

    // Set up CRUD button handlers
    setupCRUDButtons();

    // Load object classes for edit form
    await loadObjectClasses();

    // Load SCP dossier
    await loadSCPDossier(scpCode);
});

/**
 * Set up CRUD button event handlers
 */
function setupCRUDButtons() {
    const editBtn = document.getElementById('edit-scp-btn');
    const deleteBtn = document.getElementById('delete-scp-btn');

    if (editBtn) {
        editBtn.addEventListener('click', openEditModal);
    }

    if (deleteBtn) {
        deleteBtn.addEventListener('click', openDeleteModal);
    }
}

/**
 * Load object classes from API
 */
async function loadObjectClasses() {
    try {
        objectClasses = await fetchObjectClasses();
        populateObjectClassDropdown();
    } catch (error) {
        console.error('Error loading object classes:', error);
    }
}

/**
 * Populate object class dropdown in edit form
 */
function populateObjectClassDropdown() {
    const select = document.getElementById('edit-object-class');
    if (!select) return;

    select.innerHTML = '<option value="">Select Object Class</option>';

    objectClasses.forEach(oc => {
        const option = document.createElement('option');
        option.value = oc.class_name || oc.name;
        option.textContent = oc.class_name || oc.name;
        select.appendChild(option);
    });
}

/**
 * Open edit modal with current SCP data
 */
function openEditModal() {
    if (!currentSCP) return;

    const scp = currentSCP.scp_data || currentSCP.scp || currentSCP;

    // Populate form fields
    document.getElementById('edit-scp-id').value = scp.scp_id || '';
    document.getElementById('edit-scp-code').value = scp.scp_code || '';
    document.getElementById('edit-title').value = (scp.title || '').replace(/^["']|["']$/g, '');
    document.getElementById('edit-containment').value = scp.special_containment_procedures || scp.containment_procedures || '';
    document.getElementById('edit-description').value = scp.short_description || scp.description || '';
    document.getElementById('edit-tags').value = scp.tags_list || '';

    // Set object class
    const objectClass = scp.object_class_name || scp.object_class || '';
    document.getElementById('edit-object-class').value = objectClass;

    // Show modal
    document.getElementById('edit-modal').classList.remove('hidden');
}

/**
 * Close edit modal
 */
function closeEditModal() {
    document.getElementById('edit-modal').classList.add('hidden');
}

/**
 * Save changes to SCP
 */
async function saveChanges() {
    const scpId = document.getElementById('edit-scp-id').value;

    if (!scpId) {
        showToast('Error: No SCP ID found', 'error');
        return;
    }

    const scpData = {
        scp_code: document.getElementById('edit-scp-code').value.trim(),
        title: document.getElementById('edit-title').value.trim(),
        containment_procedures: document.getElementById('edit-containment').value.trim(),
        short_description: document.getElementById('edit-description').value.trim(),
        tags_list: document.getElementById('edit-tags').value.trim(),
        object_class: document.getElementById('edit-object-class').value
    };

    // Validate required fields
    if (!scpData.scp_code) {
        showToast('SCP Code is required', 'error');
        return;
    }

    if (!scpData.object_class) {
        showToast('Object Class is required', 'error');
        return;
    }

    try {
        await updateSCP(scpId, scpData);
        closeEditModal();
        showToast('SCP entry updated successfully', 'success');

        // Reload the page to show updated data
        setTimeout(() => {
            window.location.reload();
        }, 1500);
    } catch (error) {
        showToast(`Failed to update: ${error.message}`, 'error');
    }
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal() {
    if (!currentSCP) return;

    const scp = currentSCP.scp_data || currentSCP.scp || currentSCP;
    const title = (scp.title || 'Untitled').replace(/^["']|["']$/g, '');

    document.getElementById('delete-scp-name').textContent = `${scp.scp_code} - ${title}`;
    document.getElementById('delete-modal').classList.remove('hidden');
}

/**
 * Close delete confirmation modal
 */
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
}

/**
 * Confirm and execute SCP deletion
 */
async function confirmDelete() {
    if (!currentSCP) return;

    const scp = currentSCP.scp_data || currentSCP.scp || currentSCP;
    const scpId = scp.scp_id;

    if (!scpId) {
        showToast('Error: No SCP ID found', 'error');
        return;
    }

    try {
        await deleteSCPEntry(scpId);
        closeDeleteModal();
        showToast('SCP entry deleted successfully', 'success');

        // Redirect to search page after deletion
        setTimeout(() => {
            window.location.href = 'search.html';
        }, 1500);
    } catch (error) {
        showToast(`Failed to delete: ${error.message}`, 'error');
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');

    if (!toast) return;

    // Set icon and style based on type
    if (type === 'success') {
        toast.className = 'fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 bg-green-600/90 border border-green-500';
        toastIcon.innerHTML = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    } else {
        toast.className = 'fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 bg-red-600/90 border border-red-500';
        toastIcon.innerHTML = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    }

    toastMessage.textContent = message;
    toastMessage.className = 'text-sm font-medium text-white';
    toast.classList.remove('hidden');

    // Auto-hide after 4 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

/**
 * Set up quick search functionality
 */
function setupQuickSearch() {
    const quickSearch = document.getElementById('quick-search');
    if (quickSearch) {
        quickSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = quickSearch.value.trim();
                if (query) {
                    // Check if it looks like an SCP code
                    if (query.match(/^SCP-\d+$/i)) {
                        window.location.href = `entry.html?scp=${encodeURIComponent(query.toUpperCase())}`;
                    } else {
                        window.location.href = `index.html?query=${encodeURIComponent(query)}`;
                    }
                }
            }
        });
    }
}

/**
 * Load SCP dossier from API
 * @param {string} scpCode - SCP designation (e.g., "SCP-173")
 */
async function loadSCPDossier(scpCode) {
    showLoading();

    try {
        console.log('Fetching dossier for:', scpCode);
        const dossier = await fetchSCPDossier(scpCode);
        console.log('Dossier received:', dossier);

        currentSCP = dossier;

        // Hide loading and show content
        hideLoading();
        showContent();

        // Render all sections
        renderHeader(dossier);
        renderContainmentProcedures(dossier);
        renderDescription(dossier);
        renderAddenda(dossier);
        renderAssignments(dossier);
        renderIncidents(dossier);
        renderRevisionHistory(dossier);

        // Update page title
        const scp = dossier.scp_data || dossier.scp || dossier;
        let title = (scp.title || 'Entry').replace(/^["']|["']$/g, '').trim();
        document.title = `${scp.scp_code || 'SCP'} - ${title} | SCP Foundation Archives`;

    } catch (error) {
        console.error('Error loading dossier:', error);
        hideLoading();
        showError(error.message || 'Failed to load SCP entry. Please try again.');
    }
}

/**
 * Render SCP header section
 * @param {Object} dossier - SCP dossier data
 */
function renderHeader(dossier) {
    // API returns scp_data, not scp
    const scp = dossier.scp_data || dossier.scp || dossier;

    // Set title and name - remove extra quotes from title if present
    const scpCode = scp.scp_code || 'Unknown';
    let title = scp.title || 'Untitled';
    // Clean up title (remove surrounding quotes)
    title = title.replace(/^["']|["']$/g, '').trim();

    document.getElementById('scp-title').textContent = `Item #: ${scpCode}`;
    document.getElementById('scp-name').textContent = title;

    // Set object class badge
    const objectClass = scp.object_class_name || scp.object_class || 'Unknown';
    const badgeContainer = document.getElementById('object-class-badge');
    badgeContainer.innerHTML = getObjectClassBadge(objectClass);

    // Set clearance level
    const clearanceLevel = scp.security_clearance_level || scp.clearance_level || '-';
    document.getElementById('clearance-level').textContent = `Level ${clearanceLevel}`;

    // Set facility - check assignment_history for current site
    let facility = scp.containment_site_name || scp.facility || 'Unknown';
    if (facility === 'Unknown' && dossier.assignment_history && dossier.assignment_history.length > 0) {
        // Get the most recent assignment (last one without end_date or most recent)
        const currentAssignment = dossier.assignment_history.find(a => !a.end_date) || dossier.assignment_history[dossier.assignment_history.length - 1];
        if (currentAssignment && currentAssignment.name) {
            facility = currentAssignment.name;
        }
    }
    document.getElementById('facility').textContent = facility;

    // Set last updated
    const lastUpdated = scp.last_updated || scp.date_documented || scp.first_published || scp.created_at;
    document.getElementById('last-updated').textContent = lastUpdated ? formatDate(lastUpdated) : '-';
}

/**
 * Render containment procedures
 * @param {Object} dossier - SCP dossier data
 */
function renderContainmentProcedures(dossier) {
    // API returns scp_data, not scp
    const scp = dossier.scp_data || dossier.scp || dossier;
    const procedures = scp.special_containment_procedures || scp.containment_procedures;

    const element = document.getElementById('containment-procedures');

    if (procedures && procedures.trim()) {
        element.textContent = formatSCPText(procedures);
    } else {
        element.textContent = '[DATA EXPUNGED]';
        element.classList.add('text-stone-500', 'dark:text-stone-500', 'italic');
    }
}

/**
 * Render description
 * @param {Object} dossier - SCP dossier data
 */
function renderDescription(dossier) {
    // API returns scp_data, not scp
    const scp = dossier.scp_data || dossier.scp || dossier;
    // API uses short_description for the main description, full_description often contains metadata/notes
    const description = scp.short_description || scp.description || scp.full_description;

    const element = document.getElementById('description');

    if (description && description.trim()) {
        element.textContent = formatSCPText(description);
    } else {
        element.textContent = '[DATA EXPUNGED]';
        element.classList.add('text-stone-500', 'dark:text-stone-500', 'italic');
    }
}

/**
 * Render addenda section (optional)
 * @param {Object} dossier - SCP dossier data
 */
function renderAddenda(dossier) {
    // API returns scp_data, not scp
    const scp = dossier.scp_data || dossier.scp || dossier;
    const addenda = scp.addenda || scp.addendum;

    if (addenda && addenda.trim()) {
        const section = document.getElementById('addenda-section');
        const content = document.getElementById('addenda-content');

        content.textContent = formatSCPText(addenda);
        section.classList.remove('hidden');
    }
}

/**
 * Render assignments section (optional)
 * @param {Object} dossier - SCP dossier data
 */
function renderAssignments(dossier) {
    // API returns assignment_history, not assignments
    const assignments = dossier.assignment_history || dossier.assignments || [];

    if (assignments && assignments.length > 0) {
        const section = document.getElementById('assignments-section');
        const grid = document.getElementById('assignments-grid');

        grid.innerHTML = '';

        assignments.forEach(assignment => {
            const card = createAssignmentCard(assignment);
            grid.appendChild(card);
        });

        section.classList.remove('hidden');
    }
}

/**
 * Create an assignment card element
 * @param {Object} assignment - Assignment data
 * @returns {HTMLElement} - Assignment card element
 */
function createAssignmentCard(assignment) {
    const card = document.createElement('div');
    card.className = 'p-4 border border-primary/20 dark:border-primary/30 rounded bg-primary/5 dark:bg-primary/10';

    // API returns facility assignment with 'name' being the facility name
    const facilityName = assignment.name || assignment.facility_name || assignment.facility || 'Unknown Facility';
    const startDate = assignment.assignment_start_date || assignment.start_date;
    const endDate = assignment.assignment_end_date || assignment.end_date;

    let dateInfo = '';
    if (startDate) {
        dateInfo = `<div class="text-xs text-stone-500 dark:text-stone-400 mt-2">
            Assigned: ${formatDate(startDate)}${endDate ? ` - ${formatDate(endDate)}` : ' - Present'}
        </div>`;
    }

    card.innerHTML = `
        <div class="font-bold text-stone-900 dark:text-stone-100">📍 ${escapeHtml(facilityName)}</div>
        <div class="text-sm text-stone-600 dark:text-stone-400 mt-1">Containment Site</div>
        ${dateInfo}
    `;

    return card;
}

/**
 * Render incidents section (optional)
 * @param {Object} dossier - SCP dossier data
 */
function renderIncidents(dossier) {
    // API returns involved_incidents, not incidents
    const incidents = dossier.involved_incidents || dossier.incidents || [];

    if (incidents && incidents.length > 0) {
        const section = document.getElementById('incidents-section');
        const list = document.getElementById('incidents-list');

        list.innerHTML = '';

        incidents.forEach(incident => {
            const card = createIncidentCard(incident);
            list.appendChild(card);
        });

        section.classList.remove('hidden');
    }
}

/**
 * Create an incident card element
 * @param {Object} incident - Incident data
 * @returns {HTMLElement} - Incident card element
 */
function createIncidentCard(incident) {
    const card = document.createElement('div');
    card.className = 'p-4 border border-red-600/30 rounded bg-red-600/10';

    const code = incident.incident_code || incident.code || 'Unknown Incident';
    const date = incident.incident_date || incident.date;
    const severity = incident.severity_level || incident.severity || 'Unknown';
    const description = incident.description || incident.summary || 'No description available.';

    // Severity color coding
    let severityClass = 'text-stone-400';
    if (severity && typeof severity === 'string') {
        const sev = severity.toLowerCase();
        if (sev.includes('critical') || sev.includes('high') || sev === '5' || sev === '4') {
            severityClass = 'text-red-500';
        } else if (sev.includes('medium') || sev === '3') {
            severityClass = 'text-yellow-500';
        } else if (sev.includes('low') || sev === '2' || sev === '1') {
            severityClass = 'text-green-500';
        }
    }

    card.innerHTML = `
        <div class="flex items-start justify-between">
            <div class="font-bold text-red-500">${escapeHtml(code)}</div>
            <div class="text-xs text-stone-400">${date ? formatDate(date) : 'Date Unknown'}</div>
        </div>
        <div class="text-sm ${severityClass} mt-1 font-medium">Severity: ${escapeHtml(String(severity))}</div>
        <div class="text-sm text-stone-700 dark:text-stone-300 mt-2 scp-content">${escapeHtml(formatSCPText(description))}</div>
    `;

    return card;
}

/**
 * Render revision history section (optional)
 * @param {Object} dossier - SCP dossier data
 */
function renderRevisionHistory(dossier) {
    const revisions = dossier.revisions || dossier.revision_history || [];

    if (revisions && revisions.length > 0) {
        const section = document.getElementById('revision-history-section');
        const tbody = document.getElementById('revision-tbody');

        tbody.innerHTML = '';

        revisions.forEach(revision => {
            const row = createRevisionRow(revision);
            tbody.appendChild(row);
        });

        section.classList.remove('hidden');
    }
}

/**
 * Create a revision history table row
 * @param {Object} revision - Revision data
 * @returns {HTMLElement} - Table row element
 */
function createRevisionRow(revision) {
    const row = document.createElement('tr');
    row.className = 'border-b border-primary/20 dark:border-primary/30 hover:bg-primary/5 dark:hover:bg-primary/10';

    const version = revision.version_number || revision.version || '-';
    const date = revision.revision_date || revision.date || '-';
    const changes = revision.changes_made || revision.changes || revision.description || 'No changes documented';

    row.innerHTML = `
        <td class="py-3 px-3 font-medium">${escapeHtml(String(version))}</td>
        <td class="py-3 px-3">${date !== '-' ? formatDate(date) : '-'}</td>
        <td class="py-3 px-3 text-stone-700 dark:text-stone-300">${escapeHtml(changes)}</td>
    `;

    return row;
}

/**
 * Get object class badge HTML
 * @param {string} objectClass - Object class name
 * @returns {string} - Badge HTML
 */
function getObjectClassBadge(objectClass) {
    const classLower = (objectClass || '').toLowerCase();
    let badgeClass = 'badge-default';

    switch (classLower) {
        case 'safe':
            badgeClass = 'badge-safe';
            break;
        case 'euclid':
            badgeClass = 'badge-euclid';
            break;
        case 'keter':
            badgeClass = 'badge-keter';
            break;
        case 'thaumiel':
            badgeClass = 'badge-thaumiel';
            break;
        case 'apollyon':
            badgeClass = 'badge-apollyon';
            break;
        case 'archon':
            badgeClass = 'badge-archon';
            break;
        case 'neutralized':
            badgeClass = 'badge-neutralized';
            break;
    }

    return `<span class="badge ${badgeClass}">${escapeHtml(objectClass)}</span>`;
}

/**
 * Format SCP text content
 * Handles escape characters, normalizes whitespace, preserves intentional line breaks
 * @param {string} text - Raw text
 * @returns {string} - Formatted text
 */
function formatSCPText(text) {
    if (!text) return '';

    let formatted = String(text);

    // Replace literal \n with actual newlines
    formatted = formatted.replace(/\\n/g, '\n');

    // Replace literal \t with spaces
    formatted = formatted.replace(/\\t/g, '    ');

    // Replace literal \r
    formatted = formatted.replace(/\\r/g, '');

    // Remove other common escape characters
    formatted = formatted.replace(/\\"/g, '"');
    formatted = formatted.replace(/\\\\/g, '\\');

    // Normalize multiple spaces (but keep intentional spacing)
    formatted = formatted.replace(/ {3,}/g, '  ');

    // Remove excessive newlines (more than 2 consecutive)
    formatted = formatted.replace(/\n{4,}/g, '\n\n\n');

    // Trim leading/trailing whitespace
    formatted = formatted.trim();

    return formatted;
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

/**
 * Format date to readable string
 * @param {string} dateString - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(dateString) {
    if (!dateString) return '-';

    try {
        const date = new Date(dateString);

        // Check if valid date
        if (isNaN(date.getTime())) {
            return dateString; // Return original if invalid
        }

        // Format as: Jan 15, 2024
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return date.toLocaleDateString('en-US', options);
    } catch (error) {
        console.error('Error formatting date:', error);
        return dateString;
    }
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('error-state').classList.add('hidden');
    document.getElementById('content-container').classList.add('hidden');
}

/**
 * Hide loading state
 */
function hideLoading() {
    document.getElementById('loading-state').classList.add('hidden');
}

/**
 * Show content
 */
function showContent() {
    document.getElementById('content-container').classList.remove('hidden');
    document.getElementById('error-state').classList.add('hidden');
}

/**
 * Show error message
 * @param {string} message - Error message
 */
function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-state').classList.remove('hidden');
    document.getElementById('loading-state').classList.add('hidden');
    document.getElementById('content-container').classList.add('hidden');
}
