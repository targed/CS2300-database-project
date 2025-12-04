// State
let allFacilities = [];
let filteredFacilities = [];
let currentType = 'all';
let currentEditFacility = null;

// Logo filename mappings for special characters
const LOGO_MAPPINGS = {
    'SITE-Θ': 'Site-theta.svg',
    'SITE-θ': 'Site-theta.svg',
    'SITE-⌘': 'Site-Looped_Square.svg',
    'AREA-Θ': 'Area-theta.svg',
    'SITE-ANVIL': 'Site-Anvil.png',
    'SITE-00': 'Site-00.png',
    'SITE-05': 'Site-05.png',
    'SITE-13': 'Site-13.png',
    'SITE-43': 'Site-43.png',
    'SITE-87': 'Site-87.png',
    'SITE-225': 'Site-225.png',
    'SITE-246': 'Site-246.png',
    'SITE-247': 'Site-247.png',
    'SITE-418': 'Site-418.png',
    'SITE-433': 'Site-433.png',
    'SITE-898': 'Site-898.png'
};

// PNG logos (for proper extension handling)
const PNG_LOGOS = new Set([
    'Site-00', 'Site-05', 'Site-13', 'Site-43', 'Site-87',
    'Site-225', 'Site-246', 'Site-247', 'Site-418', 'Site-433', 'Site-898',
    'Site-Anvil'
]);

/**
 * Get the logo filename for a facility code
 */
function getLogoFilename(code) {
    if (!code) return null;

    const upperCode = code.toUpperCase();

    // Check special mappings first
    if (LOGO_MAPPINGS[upperCode]) {
        return LOGO_MAPPINGS[upperCode];
    }

    // Parse the code to get type and number
    const match = code.match(/^(SITE|AREA)-?(.+)$/i);
    if (!match) return null;

    const type = match[1].charAt(0).toUpperCase() + match[1].slice(1).toLowerCase();
    const number = match[2];

    // Format: Site-19 or Area-02
    const baseName = `${type}-${number}`;

    // Check if it's a PNG logo
    if (PNG_LOGOS.has(baseName)) {
        return `${baseName}.png`;
    }

    // Default to SVG
    return `${baseName}.svg`;
}

/**
 * Get facility type from code
 */
function getFacilityType(code) {
    if (!code) return 'special';
    const upperCode = code.toUpperCase();
    if (upperCode.startsWith('SITE-')) return 'site';
    if (upperCode.startsWith('AREA-')) return 'area';
    return 'special';
}

/**
 * Get type badge styling
 */
function getTypeBadgeClass(type) {
    switch (type) {
        case 'site':
            return 'bg-amber-600/20 text-amber-600';
        case 'area':
            return 'bg-cyan-600/20 text-cyan-600';
        case 'special':
            return 'bg-purple-600/20 text-purple-600';
        default:
            return 'bg-stone-600/20 text-stone-600';
    }
}

/**
 * Get type icon background
 */
function getTypeIconBg(type) {
    switch (type) {
        case 'site':
            return 'bg-amber-600/20';
        case 'area':
            return 'bg-cyan-600/20';
        case 'special':
            return 'bg-purple-600/20';
        default:
            return 'bg-stone-600/20';
    }
}

/**
 * Load facilities data from API
 */
async function loadFacilities() {
    showLoading();

    try {
        allFacilities = await fetchAllFacilities();

        // Sort alphabetically by name
        allFacilities.sort((a, b) => {
            const nameA = a.name || a.code || '';
            const nameB = b.name || b.code || '';
            return nameA.localeCompare(nameB);
        });

        updateStats();
        filterFacilities();
        hideLoading();
    } catch (error) {
        console.error('Error loading facilities:', error);
        showError(error.message);
    }
}

/**
 * Update statistics display
 */
function updateStats() {
    const sites = allFacilities.filter(f => getFacilityType(f.code) === 'site').length;
    const areas = allFacilities.filter(f => getFacilityType(f.code) === 'area').length;
    const special = allFacilities.filter(f => getFacilityType(f.code) === 'special').length;

    document.getElementById('totalFacilities').textContent = allFacilities.length;
    document.getElementById('totalSites').textContent = sites;
    document.getElementById('totalAreas').textContent = areas;
    document.getElementById('totalSpecial').textContent = special;
}

/**
 * Filter facilities based on current type and search
 */
function filterFacilities() {
    const searchTerm = document.getElementById('facilitySearch').value.toLowerCase().trim();

    filteredFacilities = allFacilities.filter(facility => {
        // Type filter
        const facilityType = getFacilityType(facility.code);
        if (currentType !== 'all' && facilityType !== currentType) {
            return false;
        }

        // Search filter
        if (searchTerm) {
            const searchableText = [
                facility.name || '',
                facility.code || '',
                facility.purpose || ''
            ].join(' ').toLowerCase();

            if (!searchableText.includes(searchTerm)) {
                return false;
            }
        }

        return true;
    });

    renderFacilities();
}

/**
 * Render facilities grid
 */
function renderFacilities() {
    const grid = document.getElementById('facilitiesGrid');
    const emptyState = document.getElementById('emptyState');
    const resultsInfo = document.getElementById('resultsInfo');
    const resultsCount = document.getElementById('resultsCount');

    if (filteredFacilities.length === 0) {
        grid.classList.add('hidden');
        emptyState.classList.remove('hidden');
        resultsInfo.classList.add('hidden');
        return;
    }

    emptyState.classList.add('hidden');
    grid.classList.remove('hidden');
    resultsInfo.classList.remove('hidden');
    resultsCount.textContent = filteredFacilities.length;

    grid.innerHTML = filteredFacilities.map(facility => createFacilityCard(facility)).join('');
}

/**
 * Create a facility card HTML
 */
function createFacilityCard(facility) {
    const type = getFacilityType(facility.code);
    const badgeClass = getTypeBadgeClass(type);
    const iconBg = getTypeIconBg(type);
    const logoFilename = getLogoFilename(facility.code);
    const purpose = facility.purpose || 'No information available.';
    const truncatedPurpose = purpose.length > 120 ? purpose.substring(0, 120) + '...' : purpose;

    // Create logo HTML
    let logoHtml;
    if (logoFilename) {
        logoHtml = `<img src="assets/facility_logos/${logoFilename}" alt="${facility.name}" class="w-full h-full object-contain facility-logo" onerror="this.onerror=null; this.parentElement.innerHTML='<img src=\\'assets/foundation_assets/SCP_Foundation_(emblem).svg\\' class=\\'w-12 h-12 facility-logo facility-logo-invert\\' />'">`;
    } else {
        logoHtml = `<img src="assets/foundation_assets/SCP_Foundation_(emblem).svg" class="w-12 h-12 facility-logo facility-logo-invert" />`;
    }

    return `
        <div class="border border-primary/20 dark:border-primary/30 rounded-lg p-4 hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-amber-600/50 transition cursor-pointer bg-white/30 dark:bg-black/20"
             onclick='showFacilityModal(${JSON.stringify(facility).replace(/'/g, "&#39;")})'>
            <div class="flex items-start gap-4">
                <div class="w-20 h-20 rounded-lg ${iconBg} flex items-center justify-center flex-shrink-0 p-2 overflow-hidden">
                    ${logoHtml}
                </div>
                <div class="flex-grow min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                        <span class="px-2 py-0.5 text-xs font-bold uppercase rounded ${badgeClass}">${type}</span>
                        <span class="text-xs text-stone-400 dark:text-stone-500 font-mono">${facility.code || 'N/A'}</span>
                    </div>
                    <h3 class="font-bold text-stone-900 dark:text-stone-100 mb-1 truncate">${facility.name || 'Unknown Facility'}</h3>
                    <p class="text-xs text-stone-500 dark:text-stone-400 line-clamp-3">${truncatedPurpose}</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Show facility detail modal
 */
function showFacilityModal(facility) {
    const modal = document.getElementById('facilityModal');
    const type = getFacilityType(facility.code);
    const badgeClass = getTypeBadgeClass(type);
    const iconBg = getTypeIconBg(type);
    const logoFilename = getLogoFilename(facility.code);

    // Store current facility for editing
    currentEditFacility = facility;

    // Set badge
    const badge = document.getElementById('modalBadge');
    badge.textContent = type.toUpperCase();
    badge.className = `px-2 py-0.5 text-xs font-bold uppercase rounded ${badgeClass}`;

    // Set title
    document.getElementById('modalTitle').textContent = facility.name || facility.code || 'Unknown Facility';

    // Set logo
    const logoContainer = document.getElementById('modalLogo');
    logoContainer.className = `w-16 h-16 rounded-lg ${iconBg} flex items-center justify-center overflow-hidden p-2`;

    if (logoFilename) {
        logoContainer.innerHTML = `<img src="assets/facility_logos/${logoFilename}" alt="${facility.name}" class="w-full h-full object-contain facility-logo" onerror="this.onerror=null; this.parentElement.innerHTML='<img src=\\'assets/foundation_assets/SCP_Foundation_(emblem).svg\\' class=\\'w-10 h-10 facility-logo facility-logo-invert\\' />'">`;
    } else {
        logoContainer.innerHTML = `<img src="assets/foundation_assets/SCP_Foundation_(emblem).svg" class="w-10 h-10 facility-logo facility-logo-invert" />`;
    }

    // Set purpose
    document.getElementById('modalPurpose').textContent = facility.purpose || 'No detailed information available for this facility.';

    // Set location details (de-emphasized)
    const locationHtml = formatLocationDetails(facility);
    document.getElementById('modalLocation').innerHTML = locationHtml;

    // Reset location section state
    document.getElementById('locationDetails').classList.add('hidden');
    document.getElementById('locationChevron').classList.remove('rotate-90');

    // Set action buttons
    const facilityName = facility.name || facility.code || 'Unknown';
    const escapedName = facilityName.replace(/'/g, "\\'");
    document.getElementById('modalActions').innerHTML = `
        <button onclick="openEditModal(${facility.facility_id})" class="px-4 py-2 text-sm font-medium bg-blue-600/20 text-blue-400 border border-blue-600/40 rounded-lg hover:bg-blue-600/30 transition flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
            </svg>
            Edit
        </button>
        <button onclick="openDecommissionModal(${facility.facility_id}, '${escapedName}')" class="px-4 py-2 text-sm font-medium bg-red-600/20 text-red-400 border border-red-600/40 rounded-lg hover:bg-red-600/30 transition flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
            Decommission
        </button>
    `;

    // Show modal
    modal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Format location details for modal
 */
function formatLocationDetails(facility) {
    const parts = [];

    const formatField = (label, value) => {
        const displayValue = (!value || value === 'Undisclosed' || value === '█████')
            ? '<span class="text-stone-500">[REDACTED]</span>'
            : value;
        return `<div><span class="text-stone-500">${label}:</span> ${displayValue}</div>`;
    };

    parts.push(formatField('Street', facility.street));
    parts.push(formatField('City', facility.city));
    parts.push(formatField('State/Province', facility.state_province));
    parts.push(formatField('Country', facility.country));
    parts.push(formatField('Postal Code', facility.postal_code));
    parts.push(formatField('Coordinates', facility.coords));

    return parts.join('');
}

/**
 * Toggle location details visibility
 */
function toggleLocationDetails() {
    const details = document.getElementById('locationDetails');
    const chevron = document.getElementById('locationChevron');

    details.classList.toggle('hidden');
    chevron.classList.toggle('rotate-90');
}

/**
 * Close facility modal
 */
function closeFacilityModal() {
    document.getElementById('facilityModal').classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Toggle form location fields visibility
 */
function toggleFormLocation() {
    const fields = document.getElementById('form-location-fields');
    const chevron = document.getElementById('form-location-chevron');

    fields.classList.toggle('hidden');
    chevron.classList.toggle('rotate-180');
}

/**
 * Open modal to create new facility
 */
function openCreateModal() {
    currentEditFacility = null;

    // Reset form
    document.getElementById('facility-form').reset();
    document.getElementById('form-facility-id').value = '';
    document.getElementById('form-code-type').value = 'SITE';

    // Collapse location fields
    document.getElementById('form-location-fields').classList.add('hidden');
    document.getElementById('form-location-chevron').classList.remove('rotate-180');

    // Update title
    document.getElementById('form-modal-title').textContent = 'Add Facility';

    // Show modal
    document.getElementById('form-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Open modal to edit existing facility
 * @param {number} facilityId - Facility ID
 */
async function openEditModal(facilityId) {
    try {
        const facility = await fetchFacilityById(facilityId);
        currentEditFacility = facility;

        // Parse code into type and number
        const code = facility.code || '';
        const match = code.match(/^(SITE|AREA)-?(.+)$/i);
        const codeType = match ? match[1].toUpperCase() : 'SITE';
        const codeNumber = match ? match[2] : '';

        // Populate form
        document.getElementById('form-facility-id').value = facility.facility_id;
        document.getElementById('form-name').value = facility.name || '';
        document.getElementById('form-code-type').value = codeType;
        document.getElementById('form-code-number').value = codeNumber;
        document.getElementById('form-purpose').value = facility.purpose || '';
        document.getElementById('form-street').value = facility.street || '';
        document.getElementById('form-city').value = facility.city || '';
        document.getElementById('form-state').value = facility.state_province || '';
        document.getElementById('form-country').value = facility.country || '';
        document.getElementById('form-postal').value = facility.postal_code || '';
        document.getElementById('form-coords').value = facility.coords || '';

        // Expand location fields if any are populated
        const hasLocation = facility.street || facility.city || facility.state_province ||
            facility.country || facility.postal_code || facility.coords;
        if (hasLocation) {
            document.getElementById('form-location-fields').classList.remove('hidden');
            document.getElementById('form-location-chevron').classList.add('rotate-180');
        } else {
            document.getElementById('form-location-fields').classList.add('hidden');
            document.getElementById('form-location-chevron').classList.remove('rotate-180');
        }

        // Update title
        document.getElementById('form-modal-title').textContent = 'Edit Facility';

        // Close detail modal and show form modal
        closeFacilityModal();
        document.getElementById('form-modal').classList.remove('hidden');
        document.body.style.overflow = 'hidden';

    } catch (error) {
        console.error('Error loading facility for edit:', error);
        showToast('Failed to load facility for editing', 'error');
    }
}

/**
 * Close the form modal
 */
function closeFormModal() {
    document.getElementById('form-modal').classList.add('hidden');
    document.body.style.overflow = '';
    currentEditFacility = null;
}

/**
 * Save facility (create or update)
 * @param {Event} event - Form submit event
 */
async function saveFacility(event) {
    event.preventDefault();

    const facilityId = document.getElementById('form-facility-id').value;
    const name = document.getElementById('form-name').value.trim();
    const codeType = document.getElementById('form-code-type').value;
    const codeNumber = document.getElementById('form-code-number').value.trim();
    const purpose = document.getElementById('form-purpose').value.trim();
    const street = document.getElementById('form-street').value.trim();
    const city = document.getElementById('form-city').value.trim();
    const state = document.getElementById('form-state').value.trim();
    const country = document.getElementById('form-country').value.trim();
    const postal = document.getElementById('form-postal').value.trim();
    const coords = document.getElementById('form-coords').value.trim();

    // Validate required fields
    if (!name || !codeNumber) {
        showToast('Facility name and code are required', 'error');
        return;
    }

    // Build facility code
    const code = `${codeType}-${codeNumber}`;

    const facilityData = {
        name: name,
        code: code,
        purpose: purpose || null,
        street: street || null,
        city: city || null,
        state_province: state || null,
        country: country || null,
        postal_code: postal || null,
        coords: coords || null
    };

    try {
        if (facilityId) {
            // Update existing
            await updateFacility(facilityId, facilityData);
            showToast(`${code} updated successfully`, 'success');
        } else {
            // Create new
            await createFacility(facilityData);
            showToast(`${code} created successfully`, 'success');
        }

        closeFormModal();
        await loadFacilities(); // Refresh the list

    } catch (error) {
        console.error('Error saving facility:', error);
        showToast(error.message || 'Failed to save facility', 'error');
    }
}

/**
 * Open decommission confirmation modal
 * @param {number} facilityId - Facility ID
 * @param {string} facilityName - Facility name for display
 */
function openDecommissionModal(facilityId, facilityName) {
    document.getElementById('decommission-facility-id').value = facilityId;
    document.getElementById('decommission-facility-name').textContent = facilityName;

    // Close detail modal
    closeFacilityModal();

    // Show decommission modal
    document.getElementById('decommission-modal').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
}

/**
 * Close the decommission confirmation modal
 */
function closeDecommissionModal() {
    document.getElementById('decommission-modal').classList.add('hidden');
    document.body.style.overflow = '';
}

/**
 * Confirm and execute facility decommission
 */
async function confirmDecommission() {
    const facilityId = document.getElementById('decommission-facility-id').value;
    const facilityName = document.getElementById('decommission-facility-name').textContent;

    if (!facilityId) return;

    try {
        const result = await decommissionFacility(facilityId);
        closeDecommissionModal();

        // Show success with any warnings
        let message = `${facilityName} has been decommissioned`;
        if (result.warnings && result.warnings.length > 0) {
            message += `. Note: ${result.warnings.join(', ')}`;
        }
        showToast(message, 'success');

        await loadFacilities(); // Refresh the list

    } catch (error) {
        console.error('Error decommissioning facility:', error);
        showToast(error.message || 'Failed to decommission facility', 'error');
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

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loadingState').classList.remove('hidden');
    document.getElementById('errorState').classList.add('hidden');
    document.getElementById('facilitiesGrid').classList.add('hidden');
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
 * Set up event listeners
 */
function setupEventListeners() {
    // Type filter buttons
    document.querySelectorAll('.type-filter').forEach(button => {
        button.addEventListener('click', function () {
            // Update active state
            document.querySelectorAll('.type-filter').forEach(btn => {
                btn.classList.remove('bg-amber-600', 'text-white');
                btn.classList.add('bg-stone-200', 'dark:bg-stone-700', 'text-stone-700', 'dark:text-stone-300');
            });
            this.classList.remove('bg-stone-200', 'dark:bg-stone-700', 'text-stone-700', 'dark:text-stone-300');
            this.classList.add('bg-amber-600', 'text-white');

            currentType = this.dataset.type;
            filterFacilities();
        });
    });

    // Search input
    document.getElementById('facilitySearch').addEventListener('input', debounce(filterFacilities, 200));

    // Close modal on Escape key
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            closeFacilityModal();
        }
    });
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

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    loadFacilities();
});
