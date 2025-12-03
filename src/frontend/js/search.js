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

        // Fetch results from API
        const results = await fetchSCPs(currentFilters, currentPage, currentLimit);

        console.log('Search results:', results);

        // Handle different response formats
        let scps = [];
        let total = 0;
        let totalPages = 1;

        if (Array.isArray(results)) {
            // If API returns a simple array
            scps = results;
            total = results.length;
            totalPages = Math.ceil(total / currentLimit);
        } else if (results.scps) {
            // If API returns paginated format
            scps = results.scps;
            total = results.total || scps.length;
            totalPages = results.total_pages || Math.ceil(total / currentLimit);
        } else {
            // Unexpected format
            throw new Error('Unexpected API response format');
        }

        // Apply client-side filtering if needed
        scps = applyClientSideFilters(scps, currentFilters);

        // Apply client-side pagination if API doesn't support it
        const paginatedSCPs = paginateResults(scps, currentPage, currentLimit);
        total = scps.length;
        totalPages = Math.ceil(total / currentLimit);

        // Render results
        hideLoading();
        showResults(total);
        renderResults(paginatedSCPs);

        // Update pagination
        if (totalPages > 1) {
            updatePagination(currentPage, totalPages, handlePageChange);
        } else {
            // Hide pagination if only one page
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

    // Filter by query (search in code, title, description)
    if (filters.query) {
        const query = filters.query.toLowerCase();
        filtered = filtered.filter(scp => {
            const code = (scp.scp_code || '').toLowerCase();
            const title = (scp.title || '').toLowerCase();
            const description = (scp.description || '').toLowerCase();
            const procedures = (scp.special_containment_procedures || '').toLowerCase();

            return code.includes(query) ||
                title.includes(query) ||
                description.includes(query) ||
                procedures.includes(query);
        });
    }

    // Filter by object class
    if (filters.object_class) {
        filtered = filtered.filter(scp => {
            const objectClass = scp.object_class_name || scp.object_class || '';
            return objectClass === filters.object_class;
        });
    }

    // Filter by clearance level
    if (filters.clearance_level) {
        const clearanceLevel = parseInt(filters.clearance_level);
        filtered = filtered.filter(scp => {
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
