/**
 * SCP Foundation Mobile Task Force Registry
 * Handles loading and displaying MTF data
 */

// Store all MTF units for filtering
let allMTFUnits = [];
let filteredMTFUnits = [];

// CRUD state
let currentEditMTF = null;

/**
 * Initialize MTF page on load
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadMTFUnits();
    setupEventListeners();
    setupFormListeners();
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

    // Letter filter
    const letterFilter = document.getElementById('filter-letter');
    if (letterFilter) {
        letterFilter.addEventListener('change', applyFilters);
    }

    // Specialty filter
    const specialtyFilter = document.getElementById('filter-specialty');
    if (specialtyFilter) {
        specialtyFilter.addEventListener('change', applyFilters);
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
 * Load all MTF units
 */
async function loadMTFUnits() {
    showLoading();

    try {
        const mtfUnits = await fetchAllMTFUnits();
        allMTFUnits = mtfUnits || [];
        filteredMTFUnits = [...allMTFUnits];

        updateStats();
        renderMTFUnits();
        hideLoading();

    } catch (error) {
        console.error('Error loading MTF units:', error);
        showError(error.message || 'Failed to load MTF registry');
    }
}

/**
 * Update statistics display
 */
function updateStats() {
    const total = allMTFUnits.length;

    // Categorize by specialty keywords
    const combat = allMTFUnits.filter(mtf =>
        matchesCategory(mtf.primary_role, ['combat', 'armed', 'military', 'weapon', 'force', 'battalion', 'warfare', 'assault', 'tactical'])
    ).length;

    const research = allMTFUnits.filter(mtf =>
        matchesCategory(mtf.primary_role, ['research', 'investigation', 'analysis', 'study', 'tracking', 'exploration', 'documentation'])
    ).length;

    const covert = allMTFUnits.filter(mtf =>
        matchesCategory(mtf.primary_role, ['covert', 'undercover', 'infiltration', 'surveillance', 'classified', 'secret', 'intel'])
    ).length;

    document.getElementById('stat-total').textContent = total;
    document.getElementById('stat-combat').textContent = combat;
    document.getElementById('stat-research').textContent = research;
    document.getElementById('stat-covert').textContent = covert;
}

/**
 * Check if text matches any category keywords
 */
function matchesCategory(text, keywords) {
    if (!text) return false;
    const lowerText = text.toLowerCase();
    return keywords.some(keyword => lowerText.includes(keyword));
}

/**
 * Apply filters to MTF list
 */
function applyFilters() {
    const searchTerm = document.getElementById('filter-search').value.toLowerCase().trim();
    const letterFilter = document.getElementById('filter-letter').value;
    const specialtyFilter = document.getElementById('filter-specialty').value;

    filteredMTFUnits = allMTFUnits.filter(mtf => {
        // Search filter
        if (searchTerm) {
            const searchFields = [
                mtf.designation,
                mtf.nickname,
                mtf.primary_role,
                mtf.notes
            ].filter(Boolean).map(f => f.toLowerCase());

            const matches = searchFields.some(field => field.includes(searchTerm));
            if (!matches) return false;
        }

        // Letter filter
        if (letterFilter) {
            const designation = mtf.designation || '';
            if (!designation.toLowerCase().startsWith(letterFilter.toLowerCase())) {
                return false;
            }
        }

        // Specialty filter
        if (specialtyFilter) {
            const role = (mtf.primary_role || '').toLowerCase();
            const specialtyKeywords = {
                'combat': ['combat', 'armed', 'military', 'weapon', 'battalion', 'warfare', 'assault', 'tactical', 'force'],
                'containment': ['containment', 'containment', 'capture', 'secure', 'recovery', 'detain'],
                'covert': ['covert', 'undercover', 'infiltration', 'surveillance', 'classified', 'secret', 'intel', 'disguise'],
                'research': ['research', 'investigation', 'analysis', 'study', 'tracking', 'exploration', 'documentation', 'monitoring'],
                'hazard': ['hazard', 'chemical', 'biological', 'radiological', 'nuclear', 'toxic', 'contamination', 'cleanup'],
                'anomalous': ['anomalous', 'reality', 'cognitohazard', 'memetic', 'thaumat', 'paranormal', 'supernatural']
            };

            const keywords = specialtyKeywords[specialtyFilter] || [];
            if (!keywords.some(kw => role.includes(kw))) {
                return false;
            }
        }

        return true;
    });

    renderMTFUnits();
}

/**
 * Clear all filters
 */
function clearFilters() {
    document.getElementById('filter-search').value = '';
    document.getElementById('filter-letter').value = '';
    document.getElementById('filter-specialty').value = '';

    const quickSearch = document.getElementById('quick-search');
    if (quickSearch) quickSearch.value = '';

    filteredMTFUnits = [...allMTFUnits];
    renderMTFUnits();
}

/**
 * Render MTF unit cards
 */
function renderMTFUnits() {
    const grid = document.getElementById('mtf-grid');
    const resultsInfo = document.getElementById('results-info');
    const emptyState = document.getElementById('empty-state');
    const resultsCount = document.getElementById('results-count');

    // Update results count
    resultsCount.textContent = filteredMTFUnits.length;

    if (filteredMTFUnits.length === 0) {
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

    // Sort by designation (Alpha-1, Alpha-4, Beta-1, etc.)
    const sorted = [...filteredMTFUnits].sort((a, b) => {
        return (a.designation || '').localeCompare(b.designation || '', undefined, { numeric: true });
    });

    // Render cards
    sorted.forEach(mtf => {
        const card = createMTFCard(mtf);
        grid.appendChild(card);
    });
}

/**
 * Create an MTF card element
 * @param {Object} mtf - MTF unit data
 * @returns {HTMLElement} - Card element
 */
function createMTFCard(mtf) {
    const card = document.createElement('div');
    card.className = 'border border-primary/20 dark:border-primary/30 rounded-lg p-4 hover:bg-primary/5 dark:hover:bg-primary/10 transition cursor-pointer';
    card.onclick = () => showMTFDetail(mtf);

    const designation = mtf.designation || 'Unknown';
    const nickname = mtf.nickname || 'Unnamed';
    const role = mtf.primary_role || 'No role description available.';

    // Extract Greek letter from designation
    const greekLetter = getGreekLetter(designation);
    const letterClass = `letter-${greekLetter.toLowerCase()}`;

    card.innerHTML = `
        <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-500 flex-shrink-0">
                <svg class="w-7 h-7" fill="currentColor" viewBox="0 0 256 256" xmlns="http://www.w3.org/2000/svg">
                    <path d="M208,32H48A16,16,0,0,0,32,48V208a16,16,0,0,0,16,16H208a16,16,0,0,0,16-16V48A16,16,0,0,0,208,32ZM128,192c-22.06,0-40-17.94-40-40s17.94-40,40-40,40,17.94,40,40S150.06,192,128,192ZM208,96H48V48H208Z"/>
                </svg>
            </div>
            <div class="flex-grow min-w-0">
                <div class="flex items-center gap-2 mb-1">
                    <span class="px-2 py-0.5 text-xs font-bold uppercase rounded ${letterClass}">
                        MTF ${escapeHtml(designation)}
                    </span>
                </div>
                <h3 class="font-bold text-stone-900 dark:text-stone-100 mb-1">
                    "${escapeHtml(nickname)}"
                </h3>
                <p class="text-xs text-stone-500 dark:text-stone-400 line-clamp-2">
                    ${escapeHtml(truncateText(role, 120))}
                </p>
            </div>
        </div>
    `;

    return card;
}

/**
 * Show MTF detail in modal
 * @param {Object} mtf - MTF unit data
 */
function showMTFDetail(mtf) {
    const modal = document.getElementById('detail-modal');
    const modalTitle = document.getElementById('modal-title');
    const modalContent = document.getElementById('modal-content');

    const designation = mtf.designation || 'Unknown';
    const nickname = mtf.nickname || 'Unnamed';
    const role = mtf.primary_role || 'No role description available.';
    const notes = mtf.notes || null;

    const greekLetter = getGreekLetter(designation);
    const letterClass = `letter-${greekLetter.toLowerCase()}`;
    const greekSymbol = getGreekSymbol(greekLetter);

    modalTitle.textContent = `MTF ${designation}`;

    modalContent.innerHTML = `
        <div class="text-center mb-6">
            <div class="w-20 h-20 mx-auto rounded-lg bg-purple-600/20 flex items-center justify-center text-purple-500 mb-3">
                <span class="text-3xl font-bold">${greekSymbol}</span>
            </div>
            <div class="mb-2">
                <span class="px-3 py-1 text-sm font-bold uppercase rounded ${letterClass}">
                    MTF ${escapeHtml(designation)}
                </span>
            </div>
            <h4 class="text-xl font-bold text-stone-900 dark:text-stone-100">"${escapeHtml(nickname)}"</h4>
        </div>
        
        <div class="space-y-4 text-left">
            <div class="border-t border-primary/10 dark:border-primary/20 pt-4">
                <label class="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                    Primary Role & Capabilities
                </label>
                <p class="text-sm text-stone-700 dark:text-stone-300 leading-relaxed">${escapeHtml(role)}</p>
            </div>
            
            ${notes ? `
                <div class="border-t border-primary/10 dark:border-primary/20 pt-4">
                    <label class="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                        Additional Notes
                    </label>
                    <p class="text-sm text-stone-600 dark:text-stone-400">${escapeHtml(notes)}</p>
                </div>
            ` : ''}
            
            <div class="border-t border-primary/10 dark:border-primary/20 pt-4">
                <label class="block text-xs font-medium uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">
                    Unit Classification
                </label>
                <div class="flex flex-wrap gap-2">
                    ${getSpecialtyTags(role).map(tag =>
        `<span class="px-2 py-1 text-xs rounded bg-primary/10 dark:bg-primary/20 text-stone-600 dark:text-stone-400">${tag}</span>`
    ).join('')}
                </div>
            </div>
        </div>
        
        <div class="mt-6 pt-4 border-t border-primary/10 dark:border-primary/20">
            <p class="text-xs text-stone-500 dark:text-stone-500 text-center uppercase tracking-wider mb-4">
                [OPERATIONAL DETAILS CLASSIFIED - LEVEL 4 CLEARANCE REQUIRED]
            </p>
            <div class="flex justify-center gap-3">
                <button onclick="openEditModal(${mtf.mtf_id})" class="px-4 py-2 text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-600/40 rounded hover:bg-blue-600/30 transition flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                    </svg>
                    Edit
                </button>
                <button onclick="openDisbandModal(${mtf.mtf_id}, '${escapeHtml(designation).replace(/'/g, "\\'")}')" class="px-4 py-2 text-sm font-medium bg-red-600/20 text-red-400 border border-red-600/40 rounded hover:bg-red-600/30 transition flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                    Disband
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

// ============ CRUD Functions ============

/**
 * Setup form event listeners for designation preview
 */
function setupFormListeners() {
    const greekLetterSelect = document.getElementById('form-greek-letter');
    const unitNumberInput = document.getElementById('form-unit-number');

    if (greekLetterSelect) {
        greekLetterSelect.addEventListener('change', updateDesignationPreview);
    }
    if (unitNumberInput) {
        unitNumberInput.addEventListener('input', updateDesignationPreview);
    }
}

/**
 * Update the designation preview based on form inputs
 */
function updateDesignationPreview() {
    const greekLetter = document.getElementById('form-greek-letter').value;
    const unitNumber = document.getElementById('form-unit-number').value;
    const preview = document.getElementById('designation-preview');

    if (greekLetter && unitNumber) {
        preview.textContent = `MTF ${greekLetter}-${unitNumber}`;
    } else if (greekLetter) {
        preview.textContent = `MTF ${greekLetter}-?`;
    } else if (unitNumber) {
        preview.textContent = `MTF ?-${unitNumber}`;
    } else {
        preview.textContent = 'MTF ---';
    }
}

/**
 * Open modal to create new MTF unit
 */
function openCreateModal() {
    currentEditMTF = null;

    // Reset form
    document.getElementById('mtf-form').reset();
    document.getElementById('form-mtf-id').value = '';
    document.getElementById('designation-preview').textContent = 'MTF ---';

    // Update title
    document.getElementById('form-modal-title').textContent = 'Add MTF Unit';

    // Show modal
    document.getElementById('form-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Open modal to edit existing MTF unit
 * @param {number} mtfId - MTF unit ID
 */
async function openEditModal(mtfId) {
    try {
        const mtf = await fetchMTFById(mtfId);
        currentEditMTF = mtf;

        // Parse designation into letter and number
        const designation = mtf.designation || '';
        const match = designation.match(/^([A-Za-z]+)-?(\d+)?$/);
        const greekLetter = match ? match[1] : '';
        const unitNumber = match ? match[2] || '' : '';

        // Populate form
        document.getElementById('form-mtf-id').value = mtf.mtf_id;
        document.getElementById('form-greek-letter').value = greekLetter;
        document.getElementById('form-unit-number').value = unitNumber;
        document.getElementById('form-nickname').value = mtf.nickname || '';
        document.getElementById('form-primary-role').value = mtf.primary_role || '';
        document.getElementById('form-notes').value = mtf.notes || '';

        // Update preview
        updateDesignationPreview();

        // Update title
        document.getElementById('form-modal-title').textContent = 'Edit MTF Unit';

        // Close detail modal and show form modal
        closeModal();
        document.getElementById('form-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Error loading MTF for edit:', error);
        showToast('Failed to load MTF unit for editing', 'error');
    }
}

/**
 * Close the form modal
 */
function closeFormModal() {
    document.getElementById('form-modal').classList.add('hidden');
    document.body.style.overflow = '';
    currentEditMTF = null;
}

/**
 * Save MTF unit (create or update)
 * @param {Event} event - Form submit event
 */
async function saveMTF(event) {
    event.preventDefault();

    const mtfId = document.getElementById('form-mtf-id').value;
    const greekLetter = document.getElementById('form-greek-letter').value;
    const unitNumber = document.getElementById('form-unit-number').value;
    const nickname = document.getElementById('form-nickname').value.trim();
    const primaryRole = document.getElementById('form-primary-role').value.trim();
    const notes = document.getElementById('form-notes').value.trim();

    // Validate required fields
    if (!greekLetter || !unitNumber) {
        showToast('Greek letter and unit number are required', 'error');
        return;
    }

    // Build designation
    const designation = `${greekLetter}-${unitNumber}`;

    const mtfData = {
        designation: designation,
        nickname: nickname || null,
        primary_role: primaryRole || null,
        notes: notes || null
    };

    try {
        if (mtfId) {
            // Update existing
            await updateMTFRecord(mtfId, mtfData);
            showToast(`MTF ${designation} updated successfully`, 'success');
        } else {
            // Create new
            await createMTFRecord(mtfData);
            showToast(`MTF ${designation} created successfully`, 'success');
        }

        closeFormModal();
        await loadMTFUnits(); // Refresh the list

    } catch (error) {
        console.error('Error saving MTF unit:', error);
        showToast(error.message || 'Failed to save MTF unit', 'error');
    }
}

/**
 * Open disband confirmation modal
 * @param {number} mtfId - MTF unit ID
 * @param {string} designation - MTF designation for display
 */
function openDisbandModal(mtfId, designation) {
    document.getElementById('disband-mtf-id').value = mtfId;
    document.getElementById('disband-mtf-name').textContent = `MTF ${designation}`;

    // Close detail modal
    closeModal();

    // Show disband modal
    document.getElementById('disband-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the disband confirmation modal
 */
function closeDisbandModal() {
    document.getElementById('disband-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Confirm and execute MTF unit disbandment
 */
async function confirmDisband() {
    const mtfId = document.getElementById('disband-mtf-id').value;
    const mtfName = document.getElementById('disband-mtf-name').textContent;

    if (!mtfId) return;

    try {
        await disbandMTFUnit(mtfId);
        closeDisbandModal();
        showToast(`${mtfName} has been disbanded`, 'success');
        await loadMTFUnits(); // Refresh the list

    } catch (error) {
        console.error('Error disbanding MTF unit:', error);
        showToast(error.message || 'Failed to disband MTF unit', 'error');
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');

    // Set message
    toastMessage.textContent = message;

    // Set styling based on type
    if (type === 'success') {
        toast.className = 'fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 bg-green-600/20 border-green-600/40 text-green-400';
        toastIcon.innerHTML = `
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
        `;
    } else {
        toast.className = 'fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg border transition-all duration-300 bg-red-600/20 border-red-600/40 text-red-400';
        toastIcon.innerHTML = `
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
            </svg>
        `;
    }

    // Show toast
    toast.classList.remove('hidden');

    // Auto-hide after 4 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}

// ============ Utility Functions ============

/**
 * Extract Greek letter from designation
 */
function getGreekLetter(designation) {
    if (!designation) return 'default';
    const match = designation.match(/^([A-Za-z]+)/);
    return match ? match[1] : 'default';
}

/**
 * Get Greek symbol for letter name
 */
function getGreekSymbol(letterName) {
    const symbols = {
        'Alpha': 'Α', 'Beta': 'Β', 'Gamma': 'Γ', 'Delta': 'Δ',
        'Epsilon': 'Ε', 'Zeta': 'Ζ', 'Eta': 'Η', 'Theta': 'Θ',
        'Iota': 'Ι', 'Kappa': 'Κ', 'Lambda': 'Λ', 'Mu': 'Μ',
        'Nu': 'Ν', 'Xi': 'Ξ', 'Omicron': 'Ο', 'Pi': 'Π',
        'Rho': 'Ρ', 'Sigma': 'Σ', 'Tau': 'Τ', 'Upsilon': 'Υ',
        'Phi': 'Φ', 'Chi': 'Χ', 'Psi': 'Ψ', 'Omega': 'Ω',
        'Rēsh': 'ר', 'Titan': 'T'
    };
    return symbols[letterName] || '?';
}

/**
 * Get specialty tags from role description
 */
function getSpecialtyTags(role) {
    if (!role) return ['General Operations'];

    const tags = [];
    const lowerRole = role.toLowerCase();

    if (lowerRole.includes('combat') || lowerRole.includes('armed') || lowerRole.includes('military')) tags.push('Combat');
    if (lowerRole.includes('covert') || lowerRole.includes('undercover') || lowerRole.includes('infiltration')) tags.push('Covert Ops');
    if (lowerRole.includes('research') || lowerRole.includes('investigation') || lowerRole.includes('analysis')) tags.push('Research');
    if (lowerRole.includes('containment') || lowerRole.includes('capture') || lowerRole.includes('secure')) tags.push('Containment');
    if (lowerRole.includes('hazard') || lowerRole.includes('chemical') || lowerRole.includes('biological')) tags.push('Hazmat');
    if (lowerRole.includes('anomal') || lowerRole.includes('reality') || lowerRole.includes('cognitohazard')) tags.push('Anomalous');
    if (lowerRole.includes('rapid') || lowerRole.includes('response') || lowerRole.includes('emergency')) tags.push('Rapid Response');
    if (lowerRole.includes('aerial') || lowerRole.includes('air')) tags.push('Aerial');
    if (lowerRole.includes('aquatic') || lowerRole.includes('marine') || lowerRole.includes('sea') || lowerRole.includes('ocean')) tags.push('Aquatic');
    if (lowerRole.includes('urban')) tags.push('Urban');
    if (lowerRole.includes('rural') || lowerRole.includes('forest') || lowerRole.includes('nature')) tags.push('Rural/Wild');

    return tags.length > 0 ? tags : ['General Operations'];
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('error-state').classList.add('hidden');
    document.getElementById('mtf-grid').classList.add('hidden');
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
 * Escape HTML to prevent XSS
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * Truncate text to specified length
 */
function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Debounce function
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
