// API Base URL
const API_BASE_URL = 'http://localhost:5000/api';

/**
 * Fetch SCPs with filters and pagination
 * @param {Object} filters - Search filters (query, object_class, clearance_level)
 * @param {number} page - Page number (1-indexed)
 * @param {number} limit - Results per page
 * @returns {Promise<Object>} - { scps: [], total: number, page: number, total_pages: number }
 */
async function fetchSCPs(filters = {}, page = 1, limit = 20) {
    try {
        // Build query parameters
        const params = new URLSearchParams();

        if (filters.query) params.append('query', filters.query);
        if (filters.object_class) params.append('object_class', filters.object_class);
        if (filters.clearance_level) params.append('clearance_level', filters.clearance_level);
        params.append('page', page);
        params.append('limit', limit);

        const url = `${API_BASE_URL}/scps?${params.toString()}`;
        console.log('Fetching SCPs:', url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // If API returns array, convert to paginated format
        if (Array.isArray(data)) {
            return {
                scps: data,
                total: data.length,
                page: page,
                total_pages: Math.ceil(data.length / limit)
            };
        }

        return data;
    } catch (error) {
        console.error('Error fetching SCPs:', error);
        throw new Error(`Failed to fetch SCPs: ${error.message}`);
    }
}

/**
 * Fetch a specific SCP by code (e.g., "SCP-173")
 * @param {string} scpCode - SCP designation
 * @returns {Promise<Object>} - SCP object
 */
async function fetchSCPByCode(scpCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/scp/code/${scpCode}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching SCP:', error);
        throw new Error(`Failed to fetch SCP ${scpCode}: ${error.message}`);
    }
}

/**
 * Fetch all object classes
 * @returns {Promise<Array>} - Array of object class objects
 */
async function fetchObjectClasses() {
    try {
        const response = await fetch(`${API_BASE_URL}/object-classes`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching object classes:', error);
        throw new Error(`Failed to fetch object classes: ${error.message}`);
    }
}

/**
 * Fetch all security clearances
 * @returns {Promise<Array>} - Array of security clearance objects
 */
async function fetchSecurityClearances() {
    try {
        const response = await fetch(`${API_BASE_URL}/security-clearances`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching security clearances:', error);
        throw new Error(`Failed to fetch security clearances: ${error.message}`);
    }
}

/**
 * Fetch full SCP dossier with all related information
 * @param {string} scpCode - SCP designation
 * @returns {Promise<Object>} - Full dossier object
 */
async function fetchSCPDossier(scpCode) {
    try {
        const response = await fetch(`${API_BASE_URL}/scp/dossier/${scpCode}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching SCP dossier:', error);
        throw new Error(`Failed to fetch dossier for ${scpCode}: ${error.message}`);
    }
}

/**
 * Test API connection
 * @returns {Promise<Object>} - Test response
 */
async function testConnection() {
    try {
        const response = await fetch(`${API_BASE_URL}/test`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error testing connection:', error);
        throw new Error(`Failed to connect to API: ${error.message}`);
    }
}

/**
 * Fetch all facilities
 * @returns {Promise<Array>} - Array of facility objects
 */
async function fetchAllFacilities() {
    try {
        const response = await fetch(`${API_BASE_URL}/facilities`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching facilities:', error);
        throw new Error(`Failed to fetch facilities: ${error.message}`);
    }
}

/**
 * Fetch all personnel
 * @returns {Promise<Array>} - Array of personnel objects
 */
async function fetchAllPersonnel() {
    try {
        const response = await fetch(`${API_BASE_URL}/personnel`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching personnel:', error);
        throw new Error(`Failed to fetch personnel: ${error.message}`);
    }
}

/**
 * Fetch all incidents
 * @returns {Promise<Array>} - Array of incident objects
 */
async function fetchAllIncidents() {
    try {
        const response = await fetch(`${API_BASE_URL}/incidents`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching incidents:', error);
        throw new Error(`Failed to fetch incidents: ${error.message}`);
    }
}

/**
 * Fetch all incidents with their related SCP codes
 * @returns {Promise<Array>} - Array of incident objects with related_scps field
 */
async function fetchIncidentsWithSCPs() {
    try {
        const response = await fetch(`${API_BASE_URL}/incidents/with-scps`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching incidents with SCPs:', error);
        throw new Error(`Failed to fetch incidents with SCPs: ${error.message}`);
    }
}

/**
 * Fetch a single incident by ID
 * @param {number} incidentId - The incident ID
 * @returns {Promise<Object>} - Incident object
 */
async function fetchIncidentById(incidentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/incident/${incidentId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching incident:', error);
        throw new Error(`Failed to fetch incident ${incidentId}: ${error.message}`);
    }
}

/**
 * Fetch SCPs related to an incident
 * @param {number} incidentId - The incident ID
 * @returns {Promise<Array>} - Array of SCP objects
 */
async function fetchIncidentSCPs(incidentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/incident/${incidentId}/scps`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching incident SCPs:', error);
        throw new Error(`Failed to fetch SCPs for incident ${incidentId}: ${error.message}`);
    }
}

/**
 * Fetch all MTF units
 * @returns {Promise<Array>} - Array of MTF unit objects
 */
async function fetchAllMTFUnits() {
    try {
        const response = await fetch(`${API_BASE_URL}/mtf`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching MTF units:', error);
        throw new Error(`Failed to fetch MTF units: ${error.message}`);
    }
}

