/**
 * Facilities Page JavaScript
 * Handles loading, filtering, and displaying SCP Foundation facilities
 */

// State
let allFacilities = [];
let filteredFacilities = [];
let currentType = 'all';

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
