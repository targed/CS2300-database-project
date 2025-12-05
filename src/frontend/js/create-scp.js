let objectClasses = [];

/**
 * Initialize the create SCP page
 */
document.addEventListener('DOMContentLoaded', async () => {
    console.log('Initializing Create SCP page...');

    // Load object classes for dropdown
    await loadObjectClasses();

    // Set up form submission handler
    setupFormHandler();
});

/**
 * Load object classes from API
 */
async function loadObjectClasses() {
    try {
        objectClasses = await fetchObjectClasses();
        populateObjectClassDropdown();
    } catch (error) {
        console.error('Error loading object classes:', error);
        showToast('Failed to load object classes', 'error');
    }
}

/**
 * Populate the object class dropdown
 */
function populateObjectClassDropdown() {
    const select = document.getElementById('object-class');
    if (!select) return;

    select.innerHTML = '<option value="">Select Object Class</option>';

    objectClasses.forEach(oc => {
        const option = document.createElement('option');
        option.value = oc.class_name || oc.name;
        option.textContent = oc.class_name || oc.name;
        select.appendChild(option);
    });
}

/**
 * Set up form submission handler
 */
function setupFormHandler() {
    const form = document.getElementById('create-scp-form');

    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            await handleFormSubmit();
        });
    }
}

/**
 * Handle form submission
 */
async function handleFormSubmit() {
    const scpCode = document.getElementById('scp-code').value.trim();
    const objectClass = document.getElementById('object-class').value;
    const title = document.getElementById('title').value.trim();
    const containmentProcedures = document.getElementById('containment-procedures').value.trim();
    const description = document.getElementById('description').value.trim();
    const tags = document.getElementById('tags').value.trim();

    // Validate required fields
    if (!scpCode) {
        showToast('SCP Designation is required', 'error');
        return;
    }

    // Validate SCP code format
    if (!scpCode.match(/^SCP-\d+$/i)) {
        showToast('SCP Designation must be in format SCP-XXX (e.g., SCP-173)', 'error');
        return;
    }

    if (!objectClass) {
        showToast('Object Class is required', 'error');
        return;
    }

    if (!description) {
        showToast('Description is required', 'error');
        return;
    }

    // Prepare data object
    const scpData = {
        scp_code: scpCode.toUpperCase(),
        object_class: objectClass,
        title: title || null,
        containment_procedures: containmentProcedures || null,
        short_description: description,
        tags_list: tags || null
    };

    try {
        // Disable submit button to prevent double submission
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerHTML = '<svg class="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg> Creating...';
        }

        const response = await createSCP(scpData);

        showToast(`${scpCode.toUpperCase()} created successfully!`, 'success');

        // Redirect to the new SCP entry page after a short delay
        setTimeout(() => {
            window.location.href = `entry.html?scp=${encodeURIComponent(scpCode.toUpperCase())}`;
        }, 1500);

    } catch (error) {
        console.error('Error creating SCP:', error);
        showToast(`Failed to create SCP: ${error.message}`, 'error');

        // Re-enable submit button
        const submitBtn = document.querySelector('button[type="submit"]');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.innerHTML = '<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg> Create Entry';
        }
    }
}

/**
 * Show toast notification
 * @param {string} message - Message to display
 * @param {string} type - 'success' or 'error'
 */
function showToast(message, type) {
    const toast = document.getElementById('toast');
    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');

    if (!toast) return;

    // Set icon and style based on type
    if (type === 'success') {
        toast.className = 'fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 bg-green-600/90 border border-green-500';
        toastIcon.innerHTML = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>';
    } else {
        toast.className = 'fixed bottom-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg transform transition-all duration-300 bg-red-600/90 border border-red-500';
        toastIcon.innerHTML = '<svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>';
    }

    toastMessage.textContent = message;
    toastMessage.className = 'text-sm font-medium text-white';
    toast.classList.remove('hidden');

    // Auto-hide after 4 seconds
    setTimeout(() => {
        toast.classList.add('hidden');
    }, 4000);
}
