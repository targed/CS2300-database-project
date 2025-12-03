/**
 * SCP Foundation Personnel Directory
 * Handles loading and displaying personnel data
 */

// Store all personnel for filtering
let allPersonnel = [];
let filteredPersonnel = [];

/**
 * Initialize personnel page on load
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadPersonnel();
    setupEventListeners();
});

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

    // Close modal on escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
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
    const clearance = person.clearance_id || person.clearance_level || 0;

    // Get role class
    let roleClass = 'role-default';
    if (role === 'Researcher') roleClass = 'role-researcher';
    else if (role === 'Agent') roleClass = 'role-agent';
    else if (role === 'Security Officer' || role === 'Security') roleClass = 'role-security';

    // Get clearance class
    const clearanceClass = `clearance-${clearance}`;

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
                        Level ${clearance}
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
    const clearance = person.clearance_id || person.clearance_level || 0;
    const hireDate = person.hire_date || null;
    const notes = person.notes || null;

    // Get role class
    let roleClass = 'role-default';
    if (role === 'Researcher') roleClass = 'role-researcher';
    else if (role === 'Agent') roleClass = 'role-agent';
    else if (role === 'Security Officer' || role === 'Security') roleClass = 'role-security';

    const clearanceClass = `clearance-${clearance}`;
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
                Clearance Level ${clearance}
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
            <p class="text-xs text-stone-500 dark:text-stone-500 text-center uppercase tracking-wider">
                [ACCESS RESTRICTED - LEVEL ${clearance} CLEARANCE REQUIRED]
            </p>
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

// ============ Utility Functions ============

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
