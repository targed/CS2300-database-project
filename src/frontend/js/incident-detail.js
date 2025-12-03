/**
 * Incident Detail Page JavaScript
 * Handles loading and displaying a single incident report with related SCPs
 */

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
    if (num >= 4) return `Critical (Level ${level})`;
    if (num === 3) return `High (Level ${level})`;
    if (num === 2) return `Medium (Level ${level})`;
    return `Low (Level ${level})`;
}

/**
 * Format date for display
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Unknown Date';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', {
            weekday: 'long',
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
 * Get object class badge classes
 */
function getClassBadgeClasses(className) {
    const baseClasses = 'px-2 py-0.5 text-xs font-bold uppercase rounded';
    const classMap = {
        'Safe': 'bg-green-500/20 text-green-500',
        'Euclid': 'bg-yellow-500/20 text-yellow-500',
        'Keter': 'bg-red-500/20 text-red-500',
        'Thaumiel': 'bg-purple-500/20 text-purple-500',
        'Apollyon': 'bg-slate-800/80 text-red-400',
        'Archon': 'bg-blue-500/20 text-blue-500',
        'Neutralized': 'bg-gray-500/20 text-gray-400'
    };
    return `${baseClasses} ${classMap[className] || 'bg-gray-500/20 text-gray-400'}`;
}

/**
 * Get incident ID from URL
 */
function getIncidentIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

/**
 * Load incident data
 */
async function loadIncident() {
    const incidentId = getIncidentIdFromUrl();

    if (!incidentId) {
        showError('No incident ID specified');
        return;
    }

    try {
        // Fetch incident details and related SCPs in parallel
        const [incident, relatedSCPs] = await Promise.all([
            fetchIncidentById(incidentId),
            fetchIncidentSCPs(incidentId)
        ]);

        if (!incident || incident.error) {
            showError(incident?.error || 'Incident not found');
            return;
        }

        displayIncident(incident, relatedSCPs);

    } catch (error) {
        console.error('Error loading incident:', error);
        showError(error.message);
    }
}

/**
 * Display incident data
 */
function displayIncident(incident, relatedSCPs) {
    // Update page title
    document.title = `${incident.title || 'Incident Report'} | SCP Foundation`;

    // Set severity badge
    const severityBadge = document.getElementById('severityBadge');
    severityBadge.textContent = getSeverityLabel(incident.severity_level);
    severityBadge.className = `px-2 py-0.5 text-xs font-bold uppercase rounded ${getSeverityBadgeClass(incident.severity_level)}`;

    // Set date
    document.getElementById('incidentDate').textContent = formatDate(incident.incident_date);

    // Set title
    document.getElementById('incidentTitle').textContent = incident.title || 'Unnamed Incident';

    // Set incident ID
    document.getElementById('incidentId').textContent = `INC-${String(incident.incident_id).padStart(4, '0')}`;

    // Set facility (if available)
    if (incident.facility_id) {
        document.getElementById('incidentFacility').textContent = `Facility #${incident.facility_id}`;
    }

    // Set summary
    const summaryElement = document.getElementById('incidentSummary');
    if (incident.summary) {
        summaryElement.textContent = incident.summary;
    } else {
        summaryElement.innerHTML = '<span class="text-stone-400 italic">No summary available for this incident.</span>';
    }

    // Display related SCPs
    if (relatedSCPs && relatedSCPs.length > 0) {
        const scpsSection = document.getElementById('relatedSCPsSection');
        const scpsList = document.getElementById('relatedSCPsList');

        scpsList.innerHTML = relatedSCPs.map(scp => {
            const objectClass = scp.object_class || 'Unknown';
            let title = scp.title || 'Untitled';
            // Clean up title
            title = title.replace(/^["']|["']$/g, '').trim();

            return `
                <a href="entry.html?scp=${encodeURIComponent(scp.scp_code)}" 
                   class="flex items-center gap-3 p-3 rounded-lg border border-primary/10 dark:border-primary/20 hover:border-red-600/50 hover:bg-red-600/5 transition">
                    <div class="w-10 h-10 rounded bg-stone-200 dark:bg-stone-700 flex items-center justify-center flex-shrink-0">
                        <span class="text-xs font-bold text-stone-600 dark:text-stone-300">${escapeHtml(scp.scp_code.replace('SCP-', ''))}</span>
                    </div>
                    <div class="flex-grow min-w-0">
                        <div class="flex items-center gap-2 mb-0.5">
                            <span class="font-bold text-sm text-stone-900 dark:text-stone-100">${escapeHtml(scp.scp_code)}</span>
                            <span class="${getClassBadgeClasses(objectClass)}">${escapeHtml(objectClass)}</span>
                        </div>
                        <p class="text-xs text-stone-500 dark:text-stone-400 truncate">"${escapeHtml(title)}"</p>
                    </div>
                    <svg class="w-4 h-4 text-stone-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                    </svg>
                </a>
            `;
        }).join('');

        scpsSection.classList.remove('hidden');
    }

    // Show content
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('incidentContent').classList.remove('hidden');
}

/**
 * Show error state
 */
function showError(message) {
    document.getElementById('loadingState').classList.add('hidden');
    document.getElementById('errorState').classList.remove('hidden');
    document.getElementById('errorMessage').textContent = message;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', loadIncident);
