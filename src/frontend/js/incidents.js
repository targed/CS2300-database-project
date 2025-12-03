/**
 * Incidents Page JavaScript
 * Handles loading, filtering, and displaying SCP Foundation incident reports
 */

// State
let allIncidents = [];
let filteredIncidents = [];
let currentSeverity = 'all';

/**
 * Get severity level category
 */
function getSeverityCategory(level) {
    const num = parseInt(level) || 0;
    if (num >= 4) return 'critical';
    if (num === 3) return 'high';
    return 'medium-low';
}

/**
 * Get severity color
 */
function getSeverityColor(level) {
    const num = parseInt(level) || 0;
    if (num >= 4) return 'rgb(239, 68, 68)';  // Red - critical
    if (num === 3) return 'rgb(249, 115, 22)'; // Orange - high
    if (num === 2) return 'rgb(234, 179, 8)';  // Yellow - medium
    return 'rgb(34, 197, 94)';  // Green - low
}

/**
 * Get severity badge classes
 */
function getSeverityBadgeClass(level) {
    const num = parseInt(level) || 0;
    if (num >= 4) return 'bg-red-600/20 text-red-600';
    if (num === 3) return 'bg-orange-500/20 text-orange-500';
    if (num === 2) return 'bg-yellow-500/20 text-yellow-500';
    return 'bg-green-500/20 text-green-500';
}

/**
 * Get severity label
 */
function getSeverityLabel(level) {
    const num = parseInt(level) || 0;
    if (num >= 4) return 'Critical';
    if (num === 3) return 'High';
    if (num === 2) return 'Medium';
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
 * Escape HTML
 */
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = String(text);
    return div.innerHTML;
}

/**
 * Load incidents data from API
 */
async function loadIncidents() {
    showLoading();

    try {
        allIncidents = await fetchIncidentsWithSCPs();

        // Sort by date descending (most recent first)
        allIncidents.sort((a, b) => {
            const dateA = new Date(a.incident_date || 0);
            const dateB = new Date(b.incident_date || 0);
            return dateB - dateA;
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
 * Update statistics display
 */
function updateStats() {
    const critical = allIncidents.filter(i => getSeverityCategory(i.severity_level) === 'critical').length;
    const high = allIncidents.filter(i => getSeverityCategory(i.severity_level) === 'high').length;
    const mediumLow = allIncidents.filter(i => getSeverityCategory(i.severity_level) === 'medium-low').length;

    document.getElementById('totalIncidents').textContent = allIncidents.length;
    document.getElementById('criticalCount').textContent = critical;
    document.getElementById('highCount').textContent = high;
    document.getElementById('mediumLowCount').textContent = mediumLow;
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
            if (category !== currentSeverity) {
                return false;
            }
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
        <a href="incident.html?id=${incident.incident_id}" 
           class="block border border-primary/20 dark:border-primary/30 rounded-lg p-4 hover:bg-primary/5 dark:hover:bg-primary/10 hover:border-red-600/50 transition bg-white/30 dark:bg-black/20">
            <div class="flex items-start gap-4">
                <div class="w-3 h-3 rounded-full mt-1.5 flex-shrink-0" style="background-color: ${severityColor};"></div>
                <div class="flex-grow min-w-0">
                    <div class="flex flex-wrap items-center gap-2 mb-2">
                        <span class="px-2 py-0.5 text-xs font-bold uppercase rounded ${severityBadgeClass}">${severityLabel}</span>
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
        </a>
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
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    loadIncidents();
});
