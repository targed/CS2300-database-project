// Search state
let currentPage = 1;
let currentFilters = {};
let currentLimit = 20;

/**
 * Initialize the search page
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing search page...');

    // Test API connection
    try {
        await testConnection();
        console.log('API connection successful');
    } catch (error) {
        console.error('API connection failed:', error);
        showError('Failed to connect to the API. Please ensure the server is running on http://localhost:5000');
        return;
    }

    // Set up form event listeners
    setupFormListeners();

    // Perform initial search (load all SCPs)
    performSearch();
});

/**
 * Set up form event listeners
 */
function setupFormListeners() {
    const form = document.getElementById('search-form');
    const clearBtn = document.getElementById('clear-filters-btn');
    const limitSelect = document.getElementById('results-per-page');

    // Handle form submission
    form.addEventListener('submit', (e) => {
        e.preventDefault();
        currentPage = 1; // Reset to first page on new search
        performSearch();
    });

    // Handle clear filters
    clearBtn.addEventListener('click', () => {
        form.reset();
        currentPage = 1;
        currentFilters = {};
        performSearch();
    });

    // Handle results per page change
    limitSelect.addEventListener('change', (e) => {
        currentLimit = parseInt(e.target.value);
        currentPage = 1; // Reset to first page when changing limit
        performSearch();
    });
}

/**
 * Get current filters from form
 * @returns {Object} - Filter object
 */
function getFilters() {
    const form = document.getElementById('search-form');
    const formData = new FormData(form);

    const filters = {};

    // Get search query
    const query = formData.get('query');
    if (query && query.trim()) {
        filters.query = query.trim();
    }

    // Get object class
    const objectClass = formData.get('object_class');
    if (objectClass) {
        filters.object_class = objectClass;
    }

    // Get clearance level
    const clearanceLevel = formData.get('clearance_level');
    if (clearanceLevel) {
        filters.clearance_level = clearanceLevel;
    }

    return filters;
}

/**
 * Perform search with current filters
 */
async function performSearch() {
    showLoading();

    try {
        // Get current filters
        currentFilters = getFilters();
        currentLimit = parseInt(document.getElementById('results-per-page').value);

        console.log('Searching with filters:', currentFilters, 'Page:', currentPage, 'Limit:', currentLimit);

        let results;
        
        // DECISION: Use Semantic Search if text is present, otherwise standard DB fetch
        if (currentFilters.query && currentFilters.query.trim().length > 0) {
            // 1. Fetch via Semantic Search
            const semanticResults = await searchSCPsSemantic(currentFilters.query, currentLimit);
            
            // 2. Format results to match expected structure
            // The semantic API returns flat array, we wrap it to look like paginated response
            results = {
                scps: semanticResults,
                total: semanticResults.length, // Semantic search is usually limited by top-k
                total_pages: 1 
            };
        } else {
            // Standard Database Fetch
            results = await fetchSCPs(currentFilters, currentPage, currentLimit);
        }

        console.log('Search results:', results);

        // Handle different response formats
        let scps = [];
        let total = 0;
        let totalPages = 1;

        if (Array.isArray(results)) {
            scps = results;
            total = results.length;
            totalPages = Math.ceil(total / currentLimit);
        } else if (results.scps) {
            scps = results.scps;
            total = results.total || scps.length;
            totalPages = results.total_pages || 1;
        }

        // Apply client-side filters (Object Class / Clearance)
        // This allows us to Semantic Search "Keter monsters" and then filter by "Clearance Level 4"
        scps = applyClientSideFilters(scps, currentFilters);

        // Client-side pagination for semantic results (since we fetch top-K all at once)
        // Only paginate if we aren't using the standard DB pagination
        const isSemantic = !!currentFilters.query;
        let paginatedSCPs = scps;
        
        if (isSemantic) {
             paginatedSCPs = paginateResults(scps, currentPage, currentLimit);
             total = scps.length;
             totalPages = Math.ceil(total / currentLimit);
        }

        // Render results
        hideLoading();
        showResults(total);
        renderResults(paginatedSCPs);

        // Update pagination
        if (totalPages > 1) {
            updatePagination(currentPage, totalPages, handlePageChange);
        } else {
            document.getElementById('pagination-container').style.display = 'none';
        }

    } catch (error) {
        console.error('Search error:', error);
        hideLoading();
        showError(error.message || 'An error occurred while searching. Please try again.');
    }
}

/**
 * Apply client-side filters to results
 * @param {Array} scps - Array of SCPs
 * @param {Object} filters - Filter object
 * @returns {Array} - Filtered SCPs
 */
function applyClientSideFilters(scps, filters) {
    let filtered = [...scps];

    // NOTE: We do NOT filter by query here anymore if it was a semantic search,
    // because the semantic search already retrieved relevant items.
    // However, if we came from standard fetch, we might still want to filter.
    // But since performSearch split the logic, we only strictly need to filter Metadata here.

    // Filter by object class
    if (filters.object_class) {
        filtered = filtered.filter(scp => {
            // Handle differences in API response fields vs DB fields
            const objectClass = scp.object_class_name || scp.object_class || '';
            return objectClass.toLowerCase() === filters.object_class.toLowerCase();
        });
    }

    // Filter by clearance level
    if (filters.clearance_level) {
        const clearanceLevel = parseInt(filters.clearance_level);
        filtered = filtered.filter(scp => {
            // Semantic results might not have clearance level attached
            // If missing, we default to keep it (or you could strict filter)
            if (scp.security_clearance_level === undefined) return true;
            return scp.security_clearance_level === clearanceLevel;
        });
    }

    return filtered;
}

/**
 * Paginate results client-side
 * @param {Array} items - Array of items
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Items per page
 * @returns {Array} - Paginated items
 */
function paginateResults(items, page, limit) {
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    return items.slice(startIndex, endIndex);
}

/**
 * Handle page change
 * @param {number} newPage - New page number
 */
function handlePageChange(newPage) {
    currentPage = newPage;
    performSearch();

    // Scroll to top of results
    document.getElementById('results-container').scrollIntoView({
        behavior: 'smooth',
        block: 'start'
    });
}
