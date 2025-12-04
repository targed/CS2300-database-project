// State
let allIncidents = [];
let filteredIncidents = [];
let currentSeverity = 'all';
let allFacilities = [];
let allSCPs = [];
let currentEditId = null;
let linkedSCPs = []; // SCPs currently linked in the form

/**
 * Get severity level category (DEFCON-style: lower = more severe)
 */
function getSeverityCategory(level) {
    const num = parseInt(level) || 5;
    if (num <= 1) return 'critical';
    if (num === 2) return 'severe';
    if (num === 3) return 'elevated';
    return 'moderate-low';
}

/**
 * Get severity color (DEFCON-style: 1=red, 5=green)
 */
function getSeverityColor(level) {
    const num = parseInt(level) || 5;
    if (num <= 1) return 'rgb(239, 68, 68)';  // Red - critical
    if (num === 2) return 'rgb(249, 115, 22)'; // Orange - severe
    if (num === 3) return 'rgb(234, 179, 8)';  // Yellow - elevated
    if (num === 4) return 'rgb(59, 130, 246)'; // Blue - moderate
    return 'rgb(34, 197, 94)';  // Green - low
}

/**
 * Get severity badge classes (DEFCON-style)
 */
function getSeverityBadgeClass(level) {
    const num = parseInt(level) || 5;
    if (num <= 1) return 'bg-red-600/20 text-red-600';
    if (num === 2) return 'bg-orange-500/20 text-orange-500';
    if (num === 3) return 'bg-yellow-500/20 text-yellow-500';
    if (num === 4) return 'bg-blue-500/20 text-blue-500';
    return 'bg-green-500/20 text-green-500';
}

/**
 * Get severity label (DEFCON-style descriptive labels)
 */
function getSeverityLabel(level) {
    const num = parseInt(level) || 5;
    if (num <= 1) return 'Critical';
    if (num === 2) return 'Severe';
    if (num === 3) return 'Elevated';
    if (num === 4) return 'Moderate';
    return 'Low';
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}

/**
 * Format date for input field (YYYY-MM-DD)
 */
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return '';
        return date.toISOString().split('T')[0];
    } catch {
        return '';
    }
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');
    const toastIcon = document.getElementById('toastIcon');

    toastMessage.textContent = message;

    // Set icon and colors based on type
    if (type === 'success') {
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>';
        toastIcon.classList.remove('text-red-500');
        toastIcon.classList.add('text-green-500');
    } else {
        toastIcon.innerHTML = '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>';
        toastIcon.classList.remove('text-green-500');
        toastIcon.classList.add('text-red-500');
    }

    toast.classList.remove('hidden', 'opacity-0', 'translate-y-2');
    toast.classList.add('opacity-100', 'translate-y-0');

    setTimeout(() => {
        toast.classList.remove('opacity-100', 'translate-y-0');
        toast.classList.add('opacity-0', 'translate-y-2');
        setTimeout(() => toast.classList.add('hidden'), 300);
    }, 3000);
}

/**
 * Load incidents data from API
 */
async function loadIncidents() {
    showLoading();

    try {
        allIncidents = await fetchIncidentsWithSCPs();

        // Sort by severity first (lower = more severe), then by date
        allIncidents.sort((a, b) => {
            const sevA = parseInt(a.severity_level) || 5;
            const sevB = parseInt(b.severity_level) || 5;
            if (sevA !== sevB) return sevA - sevB; // Lower severity first
            const dateA = new Date(a.incident_date || 0);
            const dateB = new Date(b.incident_date || 0);
            return dateB - dateA; // More recent first
        });

        updateStats();
        filterIncidents();
        hideLoading();
    } catch (error) {
        console.error('Error loading incidents:', error);
        showError(error.message);
    }
}

/**
 * Load facilities for dropdown
 */
async function loadFacilities() {
    try {
        allFacilities = await fetchAllFacilities();
    } catch (error) {
        console.error('Error loading facilities:', error);
    }
}

/**
 * Load SCPs for type-ahead search
 */
async function loadSCPs() {
    try {
        const result = await fetchSCPs({}, 1, 1000); // Load all SCPs
        allSCPs = result.scps || [];
    } catch (error) {
        console.error('Error loading SCPs:', error);
    }
}

/**
 * Update statistics display (DEFCON-style)
 */
function updateStats() {
    const critical = allIncidents.filter(i => getSeverityCategory(i.severity_level) === 'critical').length;
    const severe = allIncidents.filter(i => getSeverityCategory(i.severity_level) === 'severe').length;
    const elevated = allIncidents.filter(i => getSeverityCategory(i.severity_level) === 'elevated').length;
    const moderateLow = allIncidents.filter(i => getSeverityCategory(i.severity_level) === 'moderate-low').length;

    document.getElementById('totalIncidents').textContent = allIncidents.length;
    document.getElementById('criticalCount').textContent = critical;
    document.getElementById('severeCount').textContent = severe;
    document.getElementById('elevatedCount').textContent = elevated + moderateLow;
}

/**
 * Filter incidents based on current severity and search
 */
function filterIncidents() {
    const searchTerm = document.getElementById('incidentSearch').value.toLowerCase().trim();

    filteredIncidents = allIncidents.filter(incident => {
        // Severity filter
        if (currentSeverity !== 'all') {
            const category = getSeverityCategory(incident.severity_level);
            if (currentSeverity === 'critical' && category !== 'critical') return false;
            if (currentSeverity === 'severe' && category !== 'severe') return false;
            if (currentSeverity === 'elevated-low' && category !== 'elevated' && category !== 'moderate-low') return false;
        }

        // Search filter
        if (searchTerm) {
            const searchableText = [
                incident.title || '',
                incident.summary || '',
                incident.related_scps || ''
            ].join(' ').toLowerCase();

            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });

    renderIncidents();
}

/**
 * Render incidents grid
 */
function renderIncidents() {
    const grid = document.getElementById('incidentsGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsInfo = document.getElementById('resultsInfo');
    const resultsCount = document.getElementById('resultsCount');

    if (filteredIncidents.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        resultsInfo.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    grid.classList.remove('hidden');
    resultsInfo.classList.remove('hidden');
    resultsCount.textContent = filteredIncidents.length;

    grid.innerHTML = filteredIncidents.map(incident => createIncidentCard(incident)).join('');
}

/**
 * Create an incident card HTML
 */
function createIncidentCard(incident) {
    const severityBadgeClass = getSeverityBadgeClass(incident.severity_level);
    const severityLabel = getSeverityLabel(incident.severity_level);
    const severityColor = getSeverityColor(incident.severity_level);
    const date = formatDate(incident.incident_date);
    const title = incident.title || 'Unnamed Incident';
    const summary = incident.summary || 'No summary available.';
    const truncatedSummary = summary.length > 150 ? summary.substring(0, 150) + '...' : summary;
    const relatedSCPs = incident.related_scps || '';

    // Create SCP badges
    let scpBadgesHtml = '';
    if (relatedSCPs) {
        const scpCodes = relatedSCPs.split(', ').slice(0, 3); // Show max 3
        scpBadgesHtml = scpCodes.map(code =>
            `<span class="px-1.5 py-0.5 text-xs font-mono bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded">${escapeHtml(code)}</span>`
        ).join('');

        if (relatedSCPs.split(', ').length > 3) {
            scpBadgesHtml += `<span class="text-xs text-stone-400">+${relatedSCPs.split(', ').length - 3} more</span>`;
        }
    }

    return `
        <div class="border border-primary/20 dark:border-primary/30 rounded-lg p-4 hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-red-600/50 transition bg-white/30 dark:bg-black/20 cursor-pointer"
             onclick="openDetailModal(${incident.incident_id})">
            <div class="flex items-start gap-4">
                <div class="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style="background-color: ${severityColor};"></div>
                <div class="flex-grow min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-2">
                        <span class="px-2 py-0.5 text-xs font-bold uppercase rounded ${severityBadgeClass}">
                            Lvl ${incident.severity_level || '?'} - ${severityLabel}
                        </span>
                        <span class="text-xs text-stone-500 dark:text-stone-400">${date}</span>
                    </div>
                    <h3 class="font-bold text-stone-900 dark:text-stone-100 mb-2 line-clamp-2">${escapeHtml(title)}</h3>
                    <p class="text-xs text-stone-500 dark:text-stone-400 line-clamp-2 mb-3">${escapeHtml(truncatedSummary)}</p>
                    ${scpBadgesHtml ? `
                        <div class="flex flex-wrap items-center gap-1.5">
                            <span class="text-xs text-stone-400 dark:text-stone-500">Related:</span>
                            ${scpBadgesHtml}
                        </div>
                    ` : ''}
                </div>
                <svg class="w-5 h-5 text-stone-400 dark:text-stone-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                </svg>
            </div>
        </div>
    `;
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.getElementById('incidentsGrid').classList.add('hidden');
    document.getElementById('emptyState').classList.add('hidden');
    document.getElementById('resultsInfo').classList.add('hidden');
}

/**
 * Hide loading state
 */
function hideLoading() {
    document.getElementById('loadingState').classList.add('hidden');
}

/**
 * Show error state
 */
function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

/**
 * Open detail modal for an incident
 */
async function openDetailModal(incidentId) {
    const modal = document.getElementById('detailModal');
    const content = document.getElementById('detailContent');

    // Show loading state
    content.innerHTML = `
        <div class="flex items-center justify-center py-12">
            <svg class="animate-spin w-8 h-8 text-red-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
        </div>
    `;
    modal.classList.remove('hidden');

    try {
        const [incident, scps] = await Promise.all([
            fetchIncidentById(incidentId),
            fetchIncidentSCPs(incidentId)
        ]);

        const severityBadgeClass = getSeverityBadgeClass(incident.severity_level);
        const severityLabel = getSeverityLabel(incident.severity_level);
        const severityColor = getSeverityColor(incident.severity_level);
        const date = formatDate(incident.incident_date);

        // Find facility name
        const facility = allFacilities.find(f => f.facility_id === incident.facility_id);
        const facilityName = facility ? (facility.name || facility.code) : 'Unknown Facility';

        // Build SCP list
        let scpListHtml = '';
        if (scps && scps.length > 0) {
            scpListHtml = scps.map(scp => `
                <a href="entry.html?code=${scp.scp_code}" class="px-2 py-1 text-sm font-mono bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded hover:bg-red-600/20 hover:text-red-600 transition">
                    ${escapeHtml(scp.scp_code)}
                </a>
            `).join('');
        } else {
            scpListHtml = '<span class="text-stone-400">None</span>';
        }

        content.innerHTML = `
            <div class="flex items-start gap-4 mb-6">
                <div class="w-4 h-4 rounded-full mt-1 flex-shrink-0" style="background-color: ${severityColor};"></div>
                <div>
                    <span class="px-2 py-0.5 text-xs font-bold uppercase rounded ${severityBadgeClass}">
                        Lvl ${incident.severity_level || '?'} - ${severityLabel}
                    </span>
                    <h2 class="text-xl font-bold text-stone-900 dark:text-stone-100 mt-2">${escapeHtml(incident.title || 'Unnamed Incident')}</h2>
                </div>
            </div>
            
            <div class="grid grid-cols-2 gap-4 mb-6">
                <div>
                    <span class="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">Date</span>
                    <p class="text-stone-900 dark:text-stone-100">${date}</p>
                </div>
                <div>
                    <span class="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">Facility</span>
                    <p class="text-stone-900 dark:text-stone-100">${escapeHtml(facilityName)}</p>
                </div>
            </div>
            
            <div class="mb-6">
                <span class="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">Summary</span>
                <p class="text-stone-700 dark:text-stone-300 mt-1 whitespace-pre-wrap">${escapeHtml(incident.summary || 'No summary available.')}</p>
            </div>
            
            <div class="mb-6">
                <span class="text-xs text-stone-500 dark:text-stone-400 uppercase tracking-wider">Related SCPs</span>
                <div class="flex flex-wrap gap-2 mt-2">
                    ${scpListHtml}
                </div>
            </div>
            
            <div class="flex gap-3 pt-4 border-t border-primary/20 dark:border-primary/30">
                <button onclick="openEditModal(${incident.incident_id})" class="flex-1 px-4 py-2 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 font-medium rounded-lg hover:bg-stone-300 dark:hover:bg-stone-600 transition">
                    Edit Report
                </button>
                <button onclick="openDeleteModal(${incident.incident_id}, '${escapeHtml(incident.title || 'this incident').replace(/'/g, "\\'")}', ${incident.severity_level || 5})" class="px-4 py-2 bg-red-600/20 text-red-600 font-medium rounded-lg hover:bg-red-600 hover:text-white transition">
                    Delete
                </button>
            </div>
        `;
    } catch (error) {
        content.innerHTML = `
            <div class="text-center py-8">
                <svg class="w-12 h-12 mx-auto text-red-500 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
                </svg>
                <p class="text-red-600">Failed to load incident details</p>
                <p class="text-sm text-stone-500">${error.message}</p>
            </div>
        `;
    }
}

/**
 * Close detail modal
 */
function closeDetailModal() {
    document.getElementById('detailModal').classList.add('hidden');
}

/**
 * Open create/edit modal
 */
async function openCreateModal() {
    currentEditId = null;
    linkedSCPs = [];
    document.getElementById('formModalTitle').textContent = 'Report New Incident';
    document.getElementById('incidentForm').reset();
    document.getElementById('linkedSCPsList').innerHTML = '';
    document.getElementById('scpSearchInput').value = '';
    document.getElementById('scpSearchResults').classList.add('hidden');

    // Populate facility dropdown
    populateFacilityDropdown();

    // Set default date to today
    document.getElementById('incidentDate').value = new Date().toISOString().split('T')[0];

    document.getElementById('formModal').classList.remove('hidden');
}

/**
 * Open edit modal with existing data
 */
async function openEditModal(incidentId) {
    currentEditId = incidentId;
    closeDetailModal();

    document.getElementById('formModalTitle').textContent = 'Edit Incident Report';
    document.getElementById('formModal').classList.remove('hidden');

    // Populate facility dropdown
    populateFacilityDropdown();

    try {
        const [incident, scps] = await Promise.all([
            fetchIncidentById(incidentId),
            fetchIncidentSCPs(incidentId)
        ]);

        document.getElementById('facilityId').value = incident.facility_id || '';
        document.getElementById('incidentTitle').value = incident.title || '';
        document.getElementById('incidentDate').value = formatDateForInput(incident.incident_date);
        document.getElementById('severityLevel').value = incident.severity_level || '5';
        document.getElementById('incidentSummary').value = incident.summary || '';

        // Set linked SCPs
        linkedSCPs = scps.map(scp => ({ scp_id: scp.scp_id, scp_code: scp.scp_code }));
        renderLinkedSCPs();
    } catch (error) {
        showToast('Failed to load incident data', 'error');
        closeFormModal();
    }
}

/**
 * Populate facility dropdown
 */
function populateFacilityDropdown() {
    const select = document.getElementById('facilityId');
    select.innerHTML = '<option value="">-- Select Facility --</option>';

    allFacilities.forEach(facility => {
        const option = document.createElement('option');
        option.value = facility.facility_id;
        option.textContent = facility.name || facility.code;
        select.appendChild(option);
    });
}

/**
 * Close form modal
 */
function closeFormModal() {
    document.getElementById('formModal').classList.add('hidden');
    currentEditId = null;
    linkedSCPs = [];
}

/**
 * Save incident (create or update)
 */
async function saveIncident() {
    const facilityId = document.getElementById('facilityId').value;
    const title = document.getElementById('incidentTitle').value.trim();
    const incidentDate = document.getElementById('incidentDate').value;
    const severityLevel = document.getElementById('severityLevel').value;
    const summary = document.getElementById('incidentSummary').value.trim();

    // Validation
    if (!facilityId) {
        showToast('Please select a facility', 'error');
        return;
    }
    if (!title) {
        showToast('Please enter an incident title', 'error');
        return;
    }
    if (!severityLevel) {
        showToast('Please select a severity level', 'error');
        return;
    }

    const incidentData = {
        facility_id: parseInt(facilityId),
        title: title,
        incident_date: incidentDate || null,
        severity_level: parseInt(severityLevel),
        summary: summary || null
    };

    try {
        let incidentId = currentEditId;

        if (currentEditId) {
            // Update existing
            await updateIncident(currentEditId, incidentData);
            showToast('Incident report updated successfully');
        } else {
            // Create new
            const result = await createIncident(incidentData);
            incidentId = result.incident_id;
            showToast('Incident report filed successfully');
        }

        // Handle SCP linking
        if (incidentId) {
            // Get existing SCPs for this incident
            const existingSCPs = currentEditId ? await fetchIncidentSCPs(currentEditId) : [];
            const existingIds = existingSCPs.map(s => s.scp_id);
            const newIds = linkedSCPs.map(s => s.scp_id);

            // Unlink removed SCPs
            for (const existing of existingSCPs) {
                if (!newIds.includes(existing.scp_id)) {
                    await unlinkIncidentSCP(incidentId, existing.scp_id);
                }
            }

            // Link new SCPs
            for (const linked of linkedSCPs) {
                if (!existingIds.includes(linked.scp_id)) {
                    await linkIncidentSCP(incidentId, linked.scp_id);
                }
            }
        }

        closeFormModal();
        loadIncidents();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

/**
 * SCP type-ahead search
 */
function searchSCPs(query) {
    const resultsDiv = document.getElementById('scpSearchResults');

    if (!query || query.length < 2) {
        resultsDiv.classList.add('hidden');
        return;
    }

    const lowerQuery = query.toLowerCase();
    const matches = allSCPs.filter(scp => {
        // Exclude already linked SCPs
        if (linkedSCPs.find(ls => ls.scp_id === scp.scp_id)) return false;

        const code = (scp.scp_code || '').toLowerCase();
        const title = (scp.title || '').toLowerCase();
        return code.includes(lowerQuery) || title.includes(lowerQuery);
    }).slice(0, 10); // Limit to 10 results

    if (matches.length === 0) {
        resultsDiv.innerHTML = '<div class="px-3 py-2 text-sm text-stone-500">No matching SCPs found</div>';
    } else {
        resultsDiv.innerHTML = matches.map(scp => `
            <div class="px-3 py-2 hover:bg-stone-100 dark:hover:bg-stone-700 cursor-pointer text-sm" onclick="addLinkedSCP(${scp.scp_id}, '${escapeHtml(scp.scp_code)}')">
                <span class="font-mono font-bold text-red-600">${escapeHtml(scp.scp_code)}</span>
                ${scp.title ? `<span class="text-stone-500 dark:text-stone-400 ml-2">- ${escapeHtml(scp.title)}</span>` : ''}
            </div>
        `).join('');
    }

    resultsDiv.classList.remove('hidden');
}

/**
 * Add SCP to linked list
 */
function addLinkedSCP(scpId, scpCode) {
    if (!linkedSCPs.find(s => s.scp_id === scpId)) {
        linkedSCPs.push({ scp_id: scpId, scp_code: scpCode });
        renderLinkedSCPs();
    }
    document.getElementById('scpSearchInput').value = '';
    document.getElementById('scpSearchResults').classList.add('hidden');
}

/**
 * Remove SCP from linked list
 */
function removeLinkedSCP(scpId) {
    linkedSCPs = linkedSCPs.filter(s => s.scp_id !== scpId);
    renderLinkedSCPs();
}

/**
 * Render linked SCPs badges
 */
function renderLinkedSCPs() {
    const container = document.getElementById('linkedSCPsList');

    if (linkedSCPs.length === 0) {
        container.innerHTML = '<span class="text-sm text-stone-400">No SCPs linked yet</span>';
        return;
    }

    container.innerHTML = linkedSCPs.map(scp => `
        <span class="inline-flex items-center gap-1 px-2 py-1 bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 rounded text-sm font-mono">
            ${escapeHtml(scp.scp_code)}
            <button type="button" onclick="removeLinkedSCP(${scp.scp_id})" class="hover:text-red-600 transition">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                </svg>
            </button>
        </span>
    `).join('');
}

/**
 * Open delete confirmation modal
 */
function openDeleteModal(incidentId, title, severityLevel) {
    closeDetailModal();
    document.getElementById('deleteIncidentId').value = incidentId;
    document.getElementById('deleteIncidentName').textContent = title;

    const severityLabel = getSeverityLabel(severityLevel);
    const severityBadgeClass = getSeverityBadgeClass(severityLevel);
    document.getElementById('deleteIncidentSeverity').innerHTML = `
        <span class="px-2 py-0.5 text-xs font-bold uppercase rounded ${severityBadgeClass}">
            Lvl ${severityLevel} - ${severityLabel}
        </span>
    `;

    document.getElementById('deleteModal').classList.remove('hidden');
}

/**
 * Close delete modal
 */
function closeDeleteModal() {
    document.getElementById('deleteModal').classList.add('hidden');
}

/**
 * Confirm delete incident
 */
async function confirmDelete() {
    const incidentId = document.getElementById('deleteIncidentId').value;

    try {
        await deleteIncident(incidentId);
        showToast('Incident report deleted successfully');
        closeDeleteModal();
        loadIncidents();
    } catch (error) {
        showToast(error.message, 'error');
    }
}

/**
 * Debounce utility function
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
    // Severity filter buttons
    document.querySelectorAll('.severity-filter').forEach(button => {
        button.addEventListener('click', function () {
            // Update active state
            document.querySelectorAll('.severity-filter').forEach(btn => {
                btn.classList.remove('bg-red-600', 'text-white');
                btn.classList.add('bg-stone-200', 'dark:bg-stone-700', 'text-stone-700', 'dark:text-stone-300');
            });
            this.classList.remove('bg-stone-200', 'dark:bg-stone-700', 'text-stone-700', 'dark:text-stone-300');
            this.classList.add('bg-red-600', 'text-white');

            currentSeverity = this.dataset.severity;
            filterIncidents();
        });
    });

    // Search input
    document.getElementById('incidentSearch').addEventListener('input', debounce(filterIncidents, 200));

    // SCP search input with debounce
    const scpSearchInput = document.getElementById('scpSearchInput');
    if (scpSearchInput) {
        scpSearchInput.addEventListener('input', debounce(function () {
            searchSCPs(this.value);
        }, 200));

        // Hide results when clicking outside
        document.addEventListener('click', function (e) {
            if (!e.target.closest('#scpSearchContainer')) {
                document.getElementById('scpSearchResults').classList.add('hidden');
            }
        });
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', async function () {
    setupEventListeners();
    await Promise.all([loadFacilities(), loadSCPs()]);
    loadIncidents();
});
