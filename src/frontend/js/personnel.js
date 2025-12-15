// Store all personnel for filtering
let allPersonnel = [];
let filteredPersonnel = [];
let securityClearances = [];
let currentEditPerson = null;

/**
 * Initialize personnel page on load
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadSecurityClearances();
    await loadPersonnel();
    setupEventListeners();
});

/**
 * Load security clearances for dropdown
 */
async function loadSecurityClearances() {
    try {
        securityClearances = await fetchSecurityClearances();
        populateClearanceDropdown();
    } catch (error) {
        console.error('Error loading security clearances:', error);
    }
}

/**
 * Populate security clearance dropdown in form
 */
function populateClearanceDropdown() {
    const select = document.getElementById('form-clearance');
    if (!select) return;

    select.innerHTML = '<option value="">Select Clearance</option>';

    securityClearances.forEach(sc => {
        const option = document.createElement('option');
        option.value = sc.clearance_id;
        option.textContent = sc.level_name || `Level ${sc.clearance_id}`;
        select.appendChild(option);
    });
}

/**
 * Get the level name for a clearance_id
 * @param {number} clearanceId - The clearance_id from the database
 * @returns {string} - The level name (e.g., "Level 4")
 */
function getClearanceLevelName(clearanceId) {
    if (!clearanceId) return 'Unknown';
    const sc = securityClearances.find(s => s.clearance_id === clearanceId);
    if (sc && sc.level_name) {
        return sc.level_name;
    }
    return `Level ${clearanceId}`;
}

/**
 * Get the numeric level from clearance_id (extracts number from level_name)
 * @param {number} clearanceId - The clearance_id from the database
 * @returns {number} - The numeric level (0-5)
 */
function getClearanceLevel(clearanceId) {
    if (!clearanceId) return 0;
    const sc = securityClearances.find(s => s.clearance_id === clearanceId);
    if (sc && sc.level_name) {
        const match = sc.level_name.match(/Level\s*(\d+)/i);
        if (match) return parseInt(match[1]);
    }
    return clearanceId;
}

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Search filter
    const searchInput = document.getElementById('filter-search');
    if (searchInput) {
        searchInput.addEventListener('input', debounce(applyFilters, 300));
    }

    // Role filter
    const roleFilter = document.getElementById('filter-role');
    if (roleFilter) {
        roleFilter.addEventListener('change', applyFilters);
    }

    // Clearance filter
    const clearanceFilter = document.getElementById('filter-clearance');
    if (clearanceFilter) {
        clearanceFilter.addEventListener('change', applyFilters);
    }

    // Clear filters button
    const clearBtn = document.getElementById('clear-filters-btn');
    if (clearBtn) {
        clearBtn.addEventListener('click', clearFilters);
    }

    // Quick search
    const quickSearch = document.getElementById('quick-search');
    if (quickSearch) {
        quickSearch.addEventListener('input', debounce((e) => {
            document.getElementById('filter-search').value = e.target.value;
            applyFilters();
        }, 300));
    }

    // Add Personnel button
    const addBtn = document.getElementById('add-personnel-btn');
    if (addBtn) {
        addBtn.addEventListener('click', openCreateModal);
    }

    // Close modal on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeFormModal();
            closeDeleteModal();
        }
    });
}

/**
 * Load all personnel data
 */
async function loadPersonnel() {
    showLoading();

    try {
        const personnel = await fetchAllPersonnel();
        allPersonnel = personnel || [];
        filteredPersonnel = [...allPersonnel];

        updateStats();
        renderPersonnel();
        hideLoading();

    } catch (error) {
        console.error('Error loading personnel:', error);
        showError(error.message || 'Failed to load personnel data');
    }
}

/**
 * Update statistics display
 */
function updateStats() {
    const total = allPersonnel.length;
    const researchers = allPersonnel.filter(p => p.role === 'Researcher').length;
    const agents = allPersonnel.filter(p => p.role === 'Agent').length;
    const security = allPersonnel.filter(p => p.role === 'Security Officer' || p.role === 'Security').length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-researchers').textContent = researchers;
    document.getElementById('stat-agents').textContent = agents;
    document.getElementById('stat-security').textContent = security;
}

/**
 * Apply filters to personnel list
 */
function applyFilters() {
    const searchTerm = document.getElementById('filter-search').value.toLowerCase().trim();
    const roleFilter = document.getElementById('filter-role').value;
    const clearanceFilter = document.getElementById('filter-clearance').value;

    filteredPersonnel = allPersonnel.filter(person => {
        // Search filter
        if (searchTerm) {
            const searchFields = [
                person.callsign,
                person.given_name,
                person.surname,
                `${person.given_name} ${person.surname}`,
                person.role,
                person.notes
            ].filter(Boolean).map(f => f.toLowerCase());

            const matches = searchFields.some(field => field.includes(searchTerm));
            if (!matches) return false;
        }

        // Role filter
        if (roleFilter) {
            if (roleFilter === 'Security' && person.role !== 'Security Officer' && person.role !== 'Security') {
                return false;
            } else if (roleFilter !== 'Security' && person.role !== roleFilter) {
                return false;
            }
        }

        // Clearance filter
        if (clearanceFilter) {
            const personClearance = person.clearance_id || person.clearance_level || 0;
            if (String(personClearance) !== clearanceFilter) {
                return false;
            }
        }

        return true;
    });

    renderPersonnel();
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-role').value = '';
    document.getElementById('filter-clearance').value = '';

    const quickSearch = document.getElementById('quick-search');
    if (quickSearch) quickSearch.value = '';

    filteredPersonnel = [...allPersonnel];
    renderPersonnel();
}

/**
 * Render personnel cards
 */
function renderPersonnel() {
    const grid = document.getElementById('personnel-grid');
    const resultsInfo = document.getElementById('results-info');
    const emptyState = document.getElementById('empty-state');
    const resultsCount = document.getElementById('results-count');

    // Update results count
    resultsCount.textContent = filteredPersonnel.length;

    if (filteredPersonnel.length === 0) {
        grid.classList.add('hidden');
        resultsInfo.classList.add('hidden');
        emptyState.classList.remove('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    resultsInfo.classList.remove('hidden');
    grid.classList.remove('hidden');

    // Clear grid
    grid.innerHTML = '';

    // Sort by clearance level (descending) then by surname
    const sorted = [...filteredPersonnel].sort((a, b) => {
        const clearanceA = a.clearance_id || a.clearance_level || 0;
        const clearanceB = b.clearance_id || b.clearance_level || 0;
        if (clearanceB !== clearanceA) return clearanceB - clearanceA;
        return (a.surname || '').localeCompare(b.surname || '');
    });

    // Render cards
    sorted.forEach(person => {
        const card = createPersonnelCard(person);
        grid.appendChild(card);
    });
}

/**
 * Create a personnel card element
 * @param {Object} person - Personnel data
 * @returns {HTMLElement} - Card element
 */
function createPersonnelCard(person) {
    const card = document.createElement('div');
    card.className = 'border border-primary/20 dark:border-primary/30 rounded-lg p-4 hover:bg-primary/5 dark:hover:bg-primary/10 transition cursor-pointer';
    card.onclick = () => showPersonnelDetail(person);

    const fullName = [person.given_name, person.surname].filter(Boolean).join(' ') || 'Unknown';
    const callsign = person.callsign || null;
    const role = person.role || 'Unknown';
    const clearanceId = person.clearance_id || person.clearance_level || 0;
    const clearanceLevel = getClearanceLevel(clearanceId);
    const clearanceName = getClearanceLevelName(clearanceId);

    // Get role class
    let roleClass = 'role-default';
    if (role === 'Researcher') roleClass = 'role-researcher';
    else if (role === 'Agent') roleClass = 'role-agent';
    else if (role === 'Security Officer' || role === 'Security') roleClass = 'role-security';

    // Get clearance class (use numeric level for styling)
    const clearanceClass = `clearance-${clearanceLevel}`;

    // Get initials for avatar
    const initials = getInitials(fullName);

    card.innerHTML = `
        <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-lg font-bold text-stone-600 dark:text-stone-400 flex-shrink-0">
                ${initials}
            </div>
            <div class="flex-grow min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <h3 class="font-bold text-stone-900 dark:text-stone-100 truncate">
                        ${escapeHtml(fullName)}
                    </h3>
                    ${callsign ? `<span class="text-xs text-stone-500 dark:text-stone-400">"${escapeHtml(callsign)}"</span>` : ''}
                </div>
                
                <div class="flex flex-wrap items-center gap-2 mb-2">
                    <span class="px-2 py-0.5 text-xs font-bold uppercase rounded ${roleClass}">
                        ${escapeHtml(role)}
                    </span>
                    <span class="px-2 py-0.5 text-xs font-bold rounded ${clearanceClass}">
                        ${escapeHtml(clearanceName)}
                    </span>
                </div>
                
                ${person.notes ? `
                    <p class="text-xs text-stone-500 dark:text-stone-400 truncate">
                        ${escapeHtml(truncateText(person.notes, 60))}
                    </p>
                ` : ''}
            </div>
        </div>
    `;

    return card;
}

/**
 * Show personnel detail in modal
 * @param {Object} person - Personnel data
 */
function showPersonnelDetail(person) {
    const modal = document.getElementById('detail-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    const fullName = [person.given_name, person.surname].filter(Boolean).join(' ') || 'Unknown';
    const callsign = person.callsign || null;
    const role = person.role || 'Unknown';
    const clearanceId = person.clearance_id || person.clearance_level || 0;
    const clearanceLevel = getClearanceLevel(clearanceId);
    const clearanceName = getClearanceLevelName(clearanceId);
    const hireDate = person.hire_date || null;
    const notes = person.notes || null;

    // Get role class
    let roleClass = 'role-default';
    if (role === 'Researcher') roleClass = 'role-researcher';
    else if (role === 'Agent') roleClass = 'role-agent';
    else if (role === 'Security Officer' || role === 'Security') roleClass = 'role-security';

    const clearanceClass = `clearance-${clearanceLevel}`;
    const initials = getInitials(fullName);

    modalTitle.textContent = callsign ? `Dr. ${callsign}` : fullName;

    modalContent.innerHTML = `
        <div class="text-center mb-6">
            <div class="w-20 h-20 mx-auto rounded-full bg-primary/20 dark:bg-primary/30 flex items-center justify-center text-2xl font-bold text-stone-600 dark:text-stone-400 mb-3">
                ${initials}
            </div>
            <h4 class="text-xl font-bold text-stone-900 dark:text-stone-100">${escapeHtml(fullName)}</h4>
            ${callsign ? `<p class="text-sm text-stone-500 dark:text-stone-400">Callsign: "${escapeHtml(callsign)}"</p>` : ''}
        </div>
        
        <div class="flex justify-center gap-3 mb-6">
            <span class="px-3 py-1 text-sm font-bold uppercase rounded ${roleClass}">
                ${escapeHtml(role)}
            </span>
            <span class="px-3 py-1 text-sm font-bold rounded ${clearanceClass}">
                ${escapeHtml(clearanceName)}
            </span>
        </div>
        
        <div class="space-y-4 text-left">
            ${hireDate ? `
                <div class="border-t border-primary/10 dark:border-primary/20 pt-4">
                    <label class="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                        Date of Employment
                    </label>
                    <p class="text-sm text-stone-900 dark:text-stone-100">${formatDate(hireDate)}</p>
                </div>
            ` : ''}
            
            ${notes ? `
                <div class="border-t border-primary/10 dark:border-primary/20 pt-4">
                    <label class="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                        Notes
                    </label>
                    <p class="text-sm text-stone-700 dark:text-stone-300">${escapeHtml(notes)}</p>
                </div>
            ` : ''}
            
            ${person.person_id ? `
                <div class="border-t border-primary/10 dark:border-primary/20 pt-4">
                    <label class="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-1">
                        Personnel ID
                    </label>
                    <p class="text-sm font-mono text-stone-600 dark:text-stone-400">PER-${String(person.person_id).padStart(4, '0')}</p>
                </div>
            ` : ''}
        </div>
        
        <div class="mt-6 pt-4 border-t border-primary/10 dark:border-primary/20">
            <p class="text-xs text-stone-500 dark:text-stone-500 text-center uppercase tracking-wider mb-4">
                [ACCESS RESTRICTED - ${escapeHtml(clearanceName).toUpperCase()} CLEARANCE REQUIRED]
            </p>
            <div class="flex justify-center gap-3">
                <button onclick="openEditModal(${person.person_id})" class="px-4 py-2 text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-600/40 rounded hover:bg-blue-600/30 transition flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Edit
                </button>
                <button onclick="openDeleteModal(${person.person_id}, '${escapeHtml(fullName).replace(/'/g, "\\'")}')" class="px-4 py-2 text-sm font-medium bg-red-600/20 text-red-400 border border-red-600/40 rounded hover:bg-red-600/30 transition flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Decommission
                </button>
            </div>
        </div>
    `;

    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the detail modal
 */
function closeModal() {
    const modal = document.getElementById('detail-modal');
    modal.classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('error-state').classList.add('hidden');
    document.getElementById('personnel-grid').classList.add('hidden');
    document.getElementById('results-info').classList.add('hidden');
    document.getElementById('empty-state').classList.add('hidden');
}

/**
 * Hide loading state
 */
function hideLoading() {
    document.getElementById('loading-state').classList.add('hidden');
}

/**
 * Show error state
 * @param {string} message - Error message
 */
function showError(message) {
    hideLoading();
    document.getElementById('error-state').classList.remove('hidden');
    document.getElementById('error-message').textContent = message;
}

/**
 * Get initials from a name
 * @param {string} name - Full name
 * @returns {string} - Initials (max 2 characters)
 */
function getInitials(name) {
    if (!name) return '?';
    const parts = name.split(' ').filter(Boolean);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Format date for display
 * @param {string} dateStr - Date string
 * @returns {string} - Formatted date
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
 * Debounce function to limit rapid calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in ms
 * @returns {Function} - Debounced function
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
 * Open create personnel modal
 */
function openCreateModal() {
    currentEditPerson = null;
    document.getElementById('form-modal-title').textContent = 'Add Personnel';
    document.getElementById('form-person-id').value = '';
    document.getElementById('form-given-name').value = '';
    document.getElementById('form-surname').value = '';
    document.getElementById('form-callsign').value = '';
    document.getElementById('form-role').value = '';
    document.getElementById('form-clearance').value = '';
    document.getElementById('form-hire-date').value = '';
    document.getElementById('form-notes').value = '';

    document.getElementById('form-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Open edit personnel modal
 * @param {number} personId - Personnel ID to edit
 */
function openEditModal(personId) {
    // Find the person in our local data
    const person = allPersonnel.find(p => p.person_id === personId);
    if (!person) {
        showToast('Personnel not found', 'error');
        return;
    }

    currentEditPerson = person;

    // Close detail modal first
    closeModal();

    document.getElementById('form-modal-title').textContent = 'Edit Personnel';
    document.getElementById('form-person-id').value = person.person_id;
    document.getElementById('form-given-name').value = person.given_name || '';
    document.getElementById('form-surname').value = person.surname || '';
    document.getElementById('form-callsign').value = person.callsign || '';
    document.getElementById('form-role').value = person.role || '';
    document.getElementById('form-clearance').value = person.clearance_id || '';
    document.getElementById('form-hire-date').value = person.hire_date ? person.hire_date.split('T')[0] : '';
    document.getElementById('form-notes').value = person.notes || '';

    document.getElementById('form-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Close form modal
 */
function closeFormModal() {
    document.getElementById('form-modal').classList.add('hidden');
    document.body.style.overflow = '';
    currentEditPerson = null;
}

/**
 * Save personnel (create or update)
 */
async function savePersonnel() {
    const personId = document.getElementById('form-person-id').value;
    const givenName = document.getElementById('form-given-name').value.trim();
    const surname = document.getElementById('form-surname').value.trim();
    const callsign = document.getElementById('form-callsign').value.trim();
    const role = document.getElementById('form-role').value;
    const clearanceId = document.getElementById('form-clearance').value;
    const hireDate = document.getElementById('form-hire-date').value;
    const notes = document.getElementById('form-notes').value.trim();

    // Validate required fields
    if (!givenName) {
        showToast('Given name is required', 'error');
        return;
    }
    if (!surname) {
        showToast('Surname is required', 'error');
        return;
    }
    if (!role) {
        showToast('Role is required', 'error');
        return;
    }
    if (!clearanceId) {
        showToast('Security clearance is required', 'error');
        return;
    }

    const personnelData = {
        given_name: givenName,
        surname: surname,
        callsign: callsign || null,
        role: role,
        clearance_id: parseInt(clearanceId),
        hire_date: hireDate || null,
        notes: notes || null
    };

    try {
        if (personId) {
            // Update existing
            await updatePersonnelRecord(parseInt(personId), personnelData);
            showToast('Personnel updated successfully', 'success');
        } else {
            // Create new
            await createPersonnelRecord(personnelData);
            showToast('Personnel created successfully', 'success');
        }

        closeFormModal();

        // Reload personnel data
        await loadPersonnel();

    } catch (error) {
        showToast(`Failed to save: ${error.message}`, 'error');
    }
}

/**
 * Open delete confirmation modal
 * @param {number} personId - Personnel ID to delete
 * @param {string} personName - Personnel name for display
 */
function openDeleteModal(personId, personName) {
    // Close detail modal first
    closeModal();

    document.getElementById('delete-person-id').value = personId;
    document.getElementById('delete-person-name').textContent = personName;
    document.getElementById('delete-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Close delete confirmation modal
 */
function closeDeleteModal() {
    document.getElementById('delete-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Confirm and execute personnel decommission
 */
async function confirmDecommission() {
    const personId = document.getElementById('delete-person-id').value;

    if (!personId) {
        showToast('Error: No personnel ID found', 'error');
        return;
    }

    try {
        await decommissionPersonnel(parseInt(personId));
        closeDeleteModal();
        showToast('Personnel decommissioned successfully', 'success');

        // Reload personnel data
        await loadPersonnel();

    } catch (error) {
        showToast(`Failed to decommission: ${error.message}`, 'error');
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
