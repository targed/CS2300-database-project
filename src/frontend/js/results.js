/**
 * Render results in the grid
 * @param {Array} results - Array of result objects
 */
function renderResults(results) {
    const resultsGrid = document.getElementById('results-grid');
    resultsGrid.innerHTML = '';

    if (results.length === 0) {
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

    results.forEach(item => {
        const card = createResultCard(item);
        resultsGrid.appendChild(card);
    });
}

/**
 * Create a result card element (Handles multiple types)
 * @param {Object} item - Result object
 * @returns {HTMLElement} - Card element
 */
function createResultCard(item) {
    const card = document.createElement('div');
    card.className = 'border border-primary/20 dark:border-primary/30 rounded-lg p-4 hover:bg-primary/5 dark:hover:bg-primary/10 transition cursor-pointer';

    // Determine badge style based on object class or type
    const type = item.type || 'SCP';
    let badgeClasses = 'text-stone-500 bg-stone-500/20';
    
    if (type === 'SCP') {
        const objectClassColors = {
            'Safe': 'text-green-500 bg-green-500/20',
            'Euclid': 'text-yellow-500 bg-yellow-500/20',
            'Keter': 'text-red-500 bg-red-500/20',
            'Thaumiel': 'text-purple-500 bg-purple-500/20',
            'Apollyon': 'text-orange-500 bg-orange-500/20',
            'Archon': 'text-blue-500 bg-blue-500/20',
            'Neutralized': 'text-gray-500 bg-gray-500/20'
        };
        badgeClasses = objectClassColors[item.object_class] || badgeClasses;
    } else if (type === 'INCIDENT') {
        badgeClasses = 'text-red-500 bg-red-500/20 border border-red-500/30';
    } else if (type === 'PERSONNEL') {
        badgeClasses = 'text-blue-500 bg-blue-500/20';
    } else if (type === 'MTF') {
        badgeClasses = 'text-indigo-500 bg-indigo-500/20';
    } else if (type === 'FACILITY') {
        badgeClasses = 'text-teal-500 bg-teal-500/20';
    }

    // Format values for display
    const code = item.scp_code || item.code || 'Unknown';
    const title = item.title || 'Untitled';
    const subtitle = item.object_class || type;
    
    // Properly escape onclick parameters
    const safeCode = (code).replace(/'/g, "\\'");
    const safeType = (type).replace(/'/g, "\\'");
    const safeId = item.id || 0;

    card.innerHTML = `
    <div class="flex items-start justify-between gap-4">
      <div class="flex-grow min-w-0">
        <div class="flex items-center gap-3 mb-2">
          <h3 class="text-lg font-bold text-stone-900 dark:text-stone-100">
            ${code}
          </h3>
          <span class="px-2 py-1 text-xs font-bold uppercase rounded ${badgeClasses}">
            ${subtitle}
          </span>
        </div>
        
        <h4 class="text-sm font-medium text-stone-700 dark:text-stone-300 mb-2 truncate">
          ${title}
        </h4>
        
        <p class="text-sm text-stone-600 dark:text-stone-400 line-clamp-2">
          ${truncateText(item.description || item.special_containment_procedures || 'No description available.', 150)}
        </p>
      </div>
      
      <button 
        class="flex-shrink-0 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-primary text-white rounded hover:bg-opacity-90 transition"
        onclick="viewDetails('${safeId}', '${safeCode}', '${safeType}')"
      >
        View
      </button>
    </div>
    
    <div class="mt-3 pt-3 border-t border-primary/10 dark:border-primary/20 flex items-center gap-4 text-xs text-stone-500 dark:text-stone-400">
        <span class="flex items-center gap-1 font-mono">
            TYPE: ${type}
        </span>
    </div>
  `;

    return card;
}

/**
 * Navigate to details page based on type
 */
function viewDetails(id, code, type) {
    console.log('Navigating:', type, code, id);
    
    switch(type) {
        case 'SCP':
            window.location.href = `entry.html?scp=${encodeURIComponent(code)}`;
            break;
        case 'INCIDENT':
            // Assuming incident.html takes an ID
            window.location.href = `incident.html?id=${id}`;
            break;
        case 'PERSONNEL':
            // Navigate to personnel list (filtering would be ideal if supported)
            window.location.href = 'personnel.html'; 
            break;
        case 'MTF':
            window.location.href = 'mtf.html';
            break;
        case 'FACILITY':
            window.location.href = 'facilities.html';
            break;
        default:
            // Fallback to SCP entry
            window.location.href = `entry.html?scp=${encodeURIComponent(code)}`;
    }
}

function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text || '';
    return text.substring(0, maxLength).trim() + '...';
}

function updatePagination(currentPage, totalPages, onPageChange) {
    document.getElementById('current-page').textContent = currentPage;
    document.getElementById('total-pages').textContent = totalPages;

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

    renderPageNumbers(currentPage, totalPages, onPageChange);
}

function renderPageNumbers(currentPage, totalPages, onPageChange) {
    const pageNumbersContainer = document.getElementById('page-numbers');
    pageNumbersContainer.innerHTML = '';

    const maxButtons = 7;
    let startPage = Math.max(1, currentPage - Math.floor(maxButtons / 2));
    let endPage = Math.min(totalPages, startPage + maxButtons - 1);

    if (endPage - startPage < maxButtons - 1) {
        startPage = Math.max(1, endPage - maxButtons + 1);
    }

    if (startPage > 1) {
        pageNumbersContainer.appendChild(createPageButton(1, currentPage, onPageChange));
        if (startPage > 2) {
            pageNumbersContainer.appendChild(createEllipsis());
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        pageNumbersContainer.appendChild(createPageButton(i, currentPage, onPageChange));
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            pageNumbersContainer.appendChild(createEllipsis());
        }
        pageNumbersContainer.appendChild(createPageButton(totalPages, currentPage, onPageChange));
    }
}

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

function createEllipsis() {
    const span = document.createElement('span');
    span.textContent = '...';
    span.className = 'px-2 text-stone-500 dark:text-stone-400';
    return span;
}

function showLoading() {
    document.getElementById('loading-state').classList.remove('hidden');
    document.getElementById('results-container').classList.add('hidden');
    document.getElementById('error-state').classList.add('hidden');
}

function hideLoading() {
    document.getElementById('loading-state').classList.add('hidden');
}

function showError(message) {
    document.getElementById('error-message').textContent = message;
    document.getElementById('error-state').classList.remove('hidden');
    document.getElementById('results-container').classList.add('hidden');
    document.getElementById('loading-state').classList.add('hidden');
}

function showResults(totalResults) {
    document.getElementById('results-count').textContent = `${totalResults} Result${totalResults !== 1 ? 's' : ''} Found`;
    document.getElementById('results-container').classList.remove('hidden');
    document.getElementById('error-state').classList.add('hidden');
    document.getElementById('loading-state').classList.add('hidden');
}