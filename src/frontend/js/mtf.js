/**
 * SCP Foundation Mobile Task Force Registry
 * Handles loading and displaying MTF data
 */

// Store all MTF units for filtering
let allMTFUnits = [];
let filteredMTFUnits = [];

/**
 * Initialize MTF page on load
 */
document.addEventListener('DOMContentLoaded', async () => {
    await loadMTFUnits();
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
            <p class="text-xs text-stone-500 dark:text-stone-500 text-center uppercase tracking-wider">
                [OPERATIONAL DETAILS CLASSIFIED - LEVEL 4 CLEARANCE REQUIRED]
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
