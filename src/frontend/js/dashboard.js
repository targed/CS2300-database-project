/**
 * SCP Foundation Dashboard
 * Handles loading and displaying dashboard data
 */

// Store all SCPs for random selection
let allSCPs = [];

/**
 * Initialize dashboard on page load
 */
document.addEventListener('DOMContentLoaded', async () => {
    // Load all dashboard data in parallel
    await Promise.all([
        loadStats(),
        loadClassificationBreakdown(),
        loadFeaturedSCP(),
        loadIncidents(),
        loadMTFUnits()
    ]);

    // Setup event listeners
    setupEventListeners();
});

/**
 * Setup event listeners
 */
function setupEventListeners() {
    // Refresh featured SCP button
    const refreshBtn = document.getElementById('refresh-featured');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => {
            loadFeaturedSCP(true);
        });
    }

    // Quick search
    const quickSearch = document.getElementById('quick-search');
    if (quickSearch) {
        quickSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = quickSearch.value.trim();
                if (query) {
                    window.location.href = `search.html?query=${encodeURIComponent(query)}`;
                }
            }
        });
    }
}

/**
 * Load dashboard statistics
 */
async function loadStats() {
    try {
        // Fetch all data in parallel
        const [scps, facilities, personnel, mtfUnits] = await Promise.all([
            fetchSCPs({}, 1, 1000),
            fetchAllFacilities(),
            fetchAllPersonnel(),
            fetchAllMTFUnits()
        ]);

        // Store SCPs for featured selection
        allSCPs = scps.scps || scps || [];

        // Update stat cards
        document.getElementById('stat-scps').textContent = allSCPs.length;
        document.getElementById('stat-facilities').textContent = Array.isArray(facilities) ? facilities.length : '-';
        document.getElementById('stat-personnel').textContent = Array.isArray(personnel) ? personnel.length : '-';
        document.getElementById('stat-mtf').textContent = Array.isArray(mtfUnits) ? mtfUnits.length : '-';

    } catch (error) {
        console.error('Error loading stats:', error);
        document.getElementById('stat-scps').textContent = '?';
        document.getElementById('stat-facilities').textContent = '?';
        document.getElementById('stat-personnel').textContent = '?';
        document.getElementById('stat-mtf').textContent = '?';
    }
}

/**
 * Load classification breakdown
 */
async function loadClassificationBreakdown() {
    const container = document.getElementById('classification-breakdown');

    try {
        // If we already have SCPs, use them; otherwise fetch
        if (allSCPs.length === 0) {
            const result = await fetchSCPs({}, 1, 1000);
            allSCPs = result.scps || result || [];
        }

        // Count by class
        const classCounts = {};
        allSCPs.forEach(scp => {
            const className = scp.object_class || scp.object_class_name || 'Unknown';
            classCounts[className] = (classCounts[className] || 0) + 1;
        });

        // Sort by count descending
        const sortedClasses = Object.entries(classCounts).sort((a, b) => b[1] - a[1]);
        const total = allSCPs.length || 1;

        // Build HTML
        let html = '';
        sortedClasses.forEach(([className, count]) => {
            const percentage = Math.round((count / total) * 100);
            const color = getClassColor(className);

            html += `
                <div class="space-y-1">
                    <div class="flex justify-between text-xs">
                        <span class="font-medium">${escapeHtml(className)}</span>
                        <span class="text-stone-500 dark:text-stone-400">${count} (${percentage}%)</span>
                    </div>
                    <div class="h-2 bg-primary/10 dark:bg-primary/20 rounded overflow-hidden">
                        <div class="h-full rounded" style="width: ${percentage}%; background-color: ${color};"></div>
                    </div>
                </div>
            `;
        });

        container.innerHTML = html || '<p class="text-sm text-stone-500 dark:text-stone-400 text-center">No classification data available</p>';

    } catch (error) {
        console.error('Error loading classification breakdown:', error);
        container.innerHTML = '<p class="text-sm text-red-500 text-center">Failed to load data</p>';
    }
}

/**
 * Load featured SCP entry
 * @param {boolean} forceRandom - Force random selection
 */
async function loadFeaturedSCP(forceRandom = false) {
    const container = document.getElementById('featured-scp');

    // Show loading
    container.innerHTML = `
        <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
            <p class="mt-2 text-sm text-stone-500 dark:text-stone-400">Loading featured entry...</p>
        </div>
    `;

    try {
        // Ensure we have SCPs loaded
        if (allSCPs.length === 0) {
            const result = await fetchSCPs({}, 1, 1000);
            allSCPs = result.scps || result || [];
        }

        if (allSCPs.length === 0) {
            container.innerHTML = '<p class="text-sm text-stone-500 dark:text-stone-400 text-center py-8">No entries available</p>';
            return;
        }

        // Pick a random SCP
        const randomIndex = Math.floor(Math.random() * allSCPs.length);
        const scp = allSCPs[randomIndex];

        // Try to get full dossier
        let dossier = null;
        try {
            dossier = await fetchSCPDossier(scp.scp_code);
        } catch (e) {
            console.warn('Could not fetch dossier, using basic data');
        }

        const scpData = dossier?.scp_data || scp;
        const objectClass = scpData.object_class || scpData.object_class_name || 'Unknown';
        let title = scpData.title || 'Untitled';
        title = title.replace(/^["']|["']$/g, '').trim();

        const description = scpData.short_description || scpData.description || 'No description available.';
        const containment = scpData.containment_procedures || scpData.special_containment_procedures || '';

        container.innerHTML = `
            <div class="flex flex-col md:flex-row gap-6">
                <div class="flex-grow">
                    <div class="flex items-center gap-3 mb-3">
                        <h4 class="text-xl font-bold">${escapeHtml(scpData.scp_code || 'Unknown')}</h4>
                        <span class="${getClassBadgeClasses(objectClass)}">${escapeHtml(objectClass)}</span>
                    </div>
                    <h5 class="text-lg text-stone-600 dark:text-stone-400 mb-4">"${escapeHtml(title)}"</h5>
                    
                    <div class="prose prose-sm dark:prose-invert max-w-none">
                        <p class="text-stone-700 dark:text-stone-300 leading-relaxed">
                            ${escapeHtml(truncateText(description, 300))}
                        </p>
                    </div>

                    ${containment ? `
                        <div class="mt-4 pt-4 border-t border-primary/10 dark:border-primary/20">
                            <h6 class="text-xs uppercase tracking-wider text-stone-500 dark:text-stone-400 mb-2">Containment Procedures</h6>
                            <p class="text-xs text-stone-600 dark:text-stone-400 leading-relaxed">
                                ${escapeHtml(truncateText(containment, 200))}
                            </p>
                        </div>
                    ` : ''}

                    <div class="mt-4">
                        <a href="entry.html?scp=${encodeURIComponent(scpData.scp_code)}" 
                           class="inline-flex items-center gap-2 text-sm font-medium text-red-600 hover:text-red-500 transition">
                            View Full Entry →
                        </a>
                    </div>
                </div>
            </div>
        `;

    } catch (error) {
        console.error('Error loading featured SCP:', error);
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-sm text-red-500">Failed to load featured entry</p>
                <button onclick="loadFeaturedSCP(true)" class="mt-2 text-xs text-stone-500 hover:text-red-600">Try again</button>
            </div>
        `;
    }
}

/**
 * Load recent incidents
 */
async function loadIncidents() {
    const container = document.getElementById('incidents-list');

    try {
        const incidents = await fetchAllIncidents();

        if (!incidents || incidents.length === 0) {
            container.innerHTML = '<p class="text-sm text-stone-500 dark:text-stone-400 text-center py-2">No incidents on record</p>';
            return;
        }

        // Sort by date descending and show up to 5 most recent
        incidents.sort((a, b) => {
            const dateA = new Date(a.incident_date || 0);
            const dateB = new Date(b.incident_date || 0);
            return dateB - dateA;
        });
        const recentIncidents = incidents.slice(0, 5);

        let html = '';
        recentIncidents.forEach(incident => {
            const severity = incident.severity_level || incident.severity || 'Unknown';
            const severityColor = getSeverityColor(severity);
            const date = incident.incident_date || incident.date || 'Unknown date';
            const title = incident.title || 'Unnamed Incident';
            const incidentId = incident.incident_id;

            html += `
                <a href="incident.html?id=${incidentId}" class="flex items-center justify-between p-2 rounded hover:bg-primary/5 dark:hover:bg-primary/10 transition">
                    <div class="flex items-center gap-3">
                        <div class="w-2 h-2 rounded-full" style="background-color: ${severityColor};"></div>
                        <div>
                            <div class="text-sm font-medium">${escapeHtml(truncateText(title, 40))}</div>
                            <div class="text-xs text-stone-500 dark:text-stone-400">${formatDate(date)}</div>
                        </div>
                    </div>
                    <span class="text-xs px-2 py-0.5 rounded" style="background-color: ${severityColor}20; color: ${severityColor};">
                        Level ${severity}
                    </span>
                </a>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading incidents:', error);
        container.innerHTML = '<p class="text-sm text-stone-500 dark:text-stone-400 text-center py-2">Unable to load incidents</p>';
    }
}

/**
 * Load MTF units
 */
async function loadMTFUnits() {
    const container = document.getElementById('mtf-list');

    try {
        const mtfUnits = await fetchAllMTFUnits();

        if (!mtfUnits || mtfUnits.length === 0) {
            container.innerHTML = '<p class="text-sm text-stone-500 dark:text-stone-400 text-center py-2">No MTF units on record</p>';
            return;
        }

        // Show up to 5 units
        const displayedUnits = mtfUnits.slice(0, 5);

        let html = '';
        displayedUnits.forEach(unit => {
            // MTF data has: designation, nickname, primary_role, notes
            const name = unit.nickname || 'Unknown Unit';
            const designation = unit.designation || '';
            const primaryRole = unit.primary_role || '';

            html += `
                <a href="mtf.html" class="flex items-center justify-between p-2 rounded hover:bg-primary/5 dark:hover:bg-primary/10 transition">
                    <div>
                        <div class="text-sm font-medium">"${escapeHtml(name)}"</div>
                        ${designation ? `<div class="text-xs text-stone-500 dark:text-stone-400">MTF ${escapeHtml(designation)}</div>` : ''}
                    </div>
                    ${primaryRole ? `
                        <span class="text-xs px-2 py-0.5 rounded bg-purple-600/10 text-purple-500">
                            ${escapeHtml(truncateText(primaryRole, 20))}
                        </span>
                    ` : ''}
                </a>
            `;
        });

        container.innerHTML = html;

    } catch (error) {
        console.error('Error loading MTF units:', error);
        container.innerHTML = '<p class="text-sm text-stone-500 dark:text-stone-400 text-center py-2">Unable to load MTF units</p>';
    }
}

// ============ Utility Functions ============

/**
 * Get color for object class
 */
function getClassColor(className) {
    const colors = {
        'Safe': 'rgb(34, 197, 94)',
        'Euclid': 'rgb(234, 179, 8)',
        'Keter': 'rgb(239, 68, 68)',
        'Thaumiel': 'rgb(147, 51, 234)',
        'Apollyon': 'rgb(248, 113, 113)',
        'Archon': 'rgb(59, 130, 246)',
        'Neutralized': 'rgb(156, 163, 175)',
        'Unknown': 'rgb(107, 114, 128)'
    };
    return colors[className] || colors['Unknown'];
}

/**
 * Get badge classes for object class
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
 * Get color for severity level
 */
function getSeverityColor(severity) {
    const num = parseInt(severity) || 0;
    if (num >= 4) return 'rgb(239, 68, 68)';  // Red - critical
    if (num === 3) return 'rgb(249, 115, 22)'; // Orange - high
    if (num === 2) return 'rgb(234, 179, 8)';  // Yellow - medium
    return 'rgb(34, 197, 94)';  // Green - low
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
 * Format date for display
 */
function formatDate(dateStr) {
    if (!dateStr) return 'Unknown';
    try {
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) return dateStr;
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateStr;
    }
}
