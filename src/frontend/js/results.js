/**
 * Render SCP results in the grid
 * @param {Array} scps - Array of SCP objects
 */
function renderResults(scps) {
    const resultsGrid = document.getElementById('results-grid');
    resultsGrid.innerHTML = '';

    if (scps.length === 0) {
        resultsGrid.innerHTML = `
      <div class="col-span-full text-center py-12">
        <svg class="w-16 h-16 mx-auto text-stone-500 dark:text-stone-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p class="text-lg font-medium text-stone-500 dark:text-stone-400">No results found</p>
        <p class="text-sm text-stone-500 dark:text-stone-500 mt-2">Try adjusting your search filters</p>
      </div>
    `;
        return;
    }

    scps.forEach(scp => {
        const card = createSCPCard(scp);
        resultsGrid.appendChild(card);
    });
}

/**
 * Create an SCP result card element
 * @param {Object} scp - SCP object
 * @returns {HTMLElement} - Card element
 */
function createSCPCard(scp) {
    const card = document.createElement('div');
    card.className = 'border border-primary/20 dark:border-primary/30 rounded-lg p-4 hover:bg-primary/5 dark:hover:bg-primary/10 transition cursor-pointer';

    // Determine object class color
    const objectClassColors = {
        'Safe': 'text-green-500 bg-green-500/20',
        'Euclid': 'text-yellow-500 bg-yellow-500/20',
        'Keter': 'text-red-500 bg-red-500/20',
        'Thaumiel': 'text-purple-500 bg-purple-500/20',
        'Apollyon': 'text-orange-500 bg-orange-500/20',
        'Archon': 'text-blue-500 bg-blue-500/20',
        'Neutralized': 'text-gray-500 bg-gray-500/20'
    };

    const objectClassName = scp.object_class_name || scp.object_class || 'Unknown';
    const badgeClasses = objectClassColors[objectClassName] || 'text-stone-500 bg-stone-500/20';

    card.innerHTML = `
    <div class="flex items-start justify-between gap-4">
      <div class="flex-grow min-w-0">
        <div class="flex items-center gap-3 mb-2">
          <h3 class="text-lg font-bold text-stone-900 dark:text-stone-100">
            ${scp.scp_code || `SCP-${String(scp.scp_id).padStart(3, '0')}`}
          </h3>
          <span class="px-2 py-1 text-xs font-bold uppercase rounded ${badgeClasses}">
            ${objectClassName}
          </span>
        </div>
        
        <h4 class="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 truncate">
          ${scp.title || 'Untitled'}
        </h4>
        
        <p class="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
          ${truncateText(scp.description || scp.special_containment_procedures || 'No description available.', 150)}
        </p>
      </div>
      
      <button 
        class="flex-shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-primary text-white rounded hover:bg-opacity-90 transition"
        onclick="viewSCPDetails('${scp.scp_code || `SCP-${scp.scp_id}`}')"
      >
        View
      </button>
    </div>
    
    <div class="mt-3 pt-3 border-t border-primary/10 dark:border-primary/20 flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
      ${scp.security_clearance_level ? `
        <span class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
          </svg>
          Clearance Level ${scp.security_clearance_level}
        </span>
      ` : ''}
      
      ${scp.current_facility_name ? `
        <span class="flex items-center gap-1">
          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clip-rule="evenodd"/>
          </svg>
          ${scp.current_facility_name}
        </span>
      ` : ''}
    </div>
  `;

    return card;
}

/**
 * Truncate text to a maximum length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} - Truncated text
 */
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Update pagination controls
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {Function} onPageChange - Callback when page changes
 */
function updatePagination(currentPage, totalPages, onPageChange) {
    // Update page info
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;

    // Update prev/next buttons
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');

    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;

    prevBtn.onclick = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    nextBtn.onclick = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    // Render page numbers
    renderPageNumbers(currentPage, totalPages, onPageChange);
}

/**
 * Render page number buttons
 * @param {number} currentPage - Current page number
 * @param {number} totalPages - Total number of pages
 * @param {Function} onPageChange - Callback when page changes
 */
function renderPageNumbers(currentPage, totalPages, onPageChange) {
    const pageNumbersContainer = document.getElementById('page-numbers');
    pageNumbersContainer.innerHTML = '';

    // Show max 7 page numbers
    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    // Adjust start if we're near the end
    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    // First page button
    if (startPage > 1) {
        pageNumbersContainer.appendChild(createPageButton(1, currentPage, onPageChange));
        if (startPage > 2) {
            pageNumbersContainer.appendChild(createEllipsis());
        }
    }

    // Page number buttons
    for (let i = startPage; i <= endPage; i++) {
        pageNumbersContainer.appendChild(createPageButton(i, currentPage, onPageChange));
    }

    // Last page button
    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pageNumbersContainer.appendChild(createEllipsis());
        }
        pageNumbersContainer.appendChild(createPageButton(totalPages, currentPage, onPageChange));
    }
}

/**
 * Create a page number button
 * @param {number} pageNum - Page number
 * @param {number} currentPage - Current page
 * @param {Function} onClick - Click handler
 * @returns {HTMLElement} - Button element
 */
function createPageButton(pageNum, currentPage, onClick) {
    const button = document.createElement('button');
    button.textContent = pageNum;
    button.className = `px-3 py-1 text-sm font-medium rounded transition ${pageNum === currentPage
        ? 'bg-primary text-white'
        : 'bg-primary/10 dark:bg-primary/20 text-stone-800 dark:text-stone-300 hover:bg-primary/20 dark:hover:bg-primary/30'
        }`;

    if (pageNum === currentPage) {
        button.disabled = true;
    } else {
        button.onclick = () => onClick(pageNum);
    }

    return button;
}

/**
 * Create an ellipsis element for pagination
 * @returns {HTMLElement} - Span element
 */
function createEllipsis() {
    const span = document.createElement('span');
    span.textContent = '...';
    span.className = 'px-2 text-stone-500 dark:text-stone-400';
    return span;
}

/**
 * Show loading state
 */
function showLoading() {
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('results-container').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
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
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-state').classList.remove('hidden');
    document.getElementById('results-container').classList.add('hidden');
    document.getElementById('loading-state').classList.add('hidden');
}

/**
 * Show results container
 * @param {number} totalResults - Total number of results
 */
function showResults(totalResults) {
    document.getElementById('results-count').textContent = `${totalResults} Result${totalResults !== 1 ? 's' : ''} Found`;
    document.getElementById('results-container').classList.remove('hidden');
    document.getElementById('error-state').classList.add('hidden');
    document.getElementById('loading-state').classList.add('hidden');
}

/**
 * View SCP details - Navigate to entry viewer page
 * @param {string} scpCode - SCP code
 */
function viewSCPDetails(scpCode) {
    // Navigate to entry viewer with SCP code as URL parameter
    window.location.href = `entry.html?scp=${encodeURIComponent(scpCode)}`;
}
