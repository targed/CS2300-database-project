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

// ============================================================
// FACILITY CRUD FUNCTIONS
// ============================================================

/**
 * Fetch a single facility by ID
 * @param {number} facilityId - Facility ID
 * @returns {Promise<Object>} - Facility object
 */
async function fetchFacilityById(facilityId) {
    try {
        const response = await fetch(`${API_BASE_URL}/facility/${facilityId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching facility:', error);
        throw new Error(`Failed to fetch facility: ${error.message}`);
    }
}

/**
 * Create a new facility record
 * @param {Object} facilityData - Facility data object
 * @returns {Promise<Object>} - Created facility response with facility_id
 */
async function createFacility(facilityData) {
    try {
        const response = await fetch(`${API_BASE_URL}/facility`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(facilityData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating facility:', error);
        throw new Error(`Failed to create facility: ${error.message}`);
    }
}

/**
 * Update an existing facility record
 * @param {number} facilityId - Facility ID
 * @param {Object} facilityData - Updated facility data
 * @returns {Promise<Object>} - Update response
 */
async function updateFacility(facilityId, facilityData) {
    try {
        const response = await fetch(`${API_BASE_URL}/facility/${facilityId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(facilityData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating facility:', error);
        throw new Error(`Failed to update facility: ${error.message}`);
    }
}

/**
 * Decommission (delete) a facility record
 * @param {number} facilityId - Facility ID to decommission
 * @returns {Promise<Object>} - Delete response
 */
async function decommissionFacility(facilityId) {
    try {
        const response = await fetch(`${API_BASE_URL}/facility/${facilityId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error decommissioning facility:', error);
        throw new Error(`Failed to decommission facility: ${error.message}`);
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

// ============================================================
// INCIDENT CRUD FUNCTIONS
// ============================================================

/**
 * Create a new incident record
 * @param {Object} incidentData - Incident data object
 * @returns {Promise<Object>} - Created incident response with incident_id
 */
async function createIncident(incidentData) {
    try {
        const response = await fetch(`${API_BASE_URL}/incident`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(incidentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating incident:', error);
        throw new Error(`Failed to create incident: ${error.message}`);
    }
}

/**
 * Update an existing incident record
 * @param {number} incidentId - Incident ID
 * @param {Object} incidentData - Updated incident data
 * @returns {Promise<Object>} - Update response
 */
async function updateIncident(incidentId, incidentData) {
    try {
        const response = await fetch(`${API_BASE_URL}/incident/${incidentId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(incidentData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating incident:', error);
        throw new Error(`Failed to update incident: ${error.message}`);
    }
}

/**
 * Delete an incident record
 * @param {number} incidentId - Incident ID to delete
 * @returns {Promise<Object>} - Delete response
 */
async function deleteIncident(incidentId) {
    try {
        const response = await fetch(`${API_BASE_URL}/incident/${incidentId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting incident:', error);
        throw new Error(`Failed to delete incident: ${error.message}`);
    }
}

/**
 * Link an SCP to an incident
 * @param {number} incidentId - Incident ID
 * @param {number} scpId - SCP ID to link
 * @returns {Promise<Object>} - Link response
 */
async function linkIncidentSCP(incidentId, scpId) {
    try {
        const response = await fetch(`${API_BASE_URL}/incident/${incidentId}/scp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ scp_id: scpId })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error linking SCP to incident:', error);
        throw new Error(`Failed to link SCP: ${error.message}`);
    }
}

/**
 * Unlink an SCP from an incident
 * @param {number} incidentId - Incident ID
 * @param {number} scpId - SCP ID to unlink
 * @returns {Promise<Object>} - Unlink response
 */
async function unlinkIncidentSCP(incidentId, scpId) {
    try {
        const response = await fetch(`${API_BASE_URL}/incident/${incidentId}/scp/${scpId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error unlinking SCP from incident:', error);
        throw new Error(`Failed to unlink SCP: ${error.message}`);
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

// ============================================================
// MTF CRUD FUNCTIONS
// ============================================================

/**
 * Fetch a single MTF unit by ID
 * @param {number} mtfId - MTF unit ID
 * @returns {Promise<Object>} - MTF unit object
 */
async function fetchMTFById(mtfId) {
    try {
        const response = await fetch(`${API_BASE_URL}/mtf/${mtfId}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error fetching MTF unit:', error);
        throw new Error(`Failed to fetch MTF unit: ${error.message}`);
    }
}

/**
 * Create a new MTF unit record
 * @param {Object} mtfData - MTF unit data object
 * @returns {Promise<Object>} - Created MTF response with mtf_id
 */
async function createMTFRecord(mtfData) {
    try {
        const response = await fetch(`${API_BASE_URL}/mtf`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mtfData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating MTF unit:', error);
        throw new Error(`Failed to create MTF unit: ${error.message}`);
    }
}

/**
 * Update an existing MTF unit record
 * @param {number} mtfId - MTF unit ID
 * @param {Object} mtfData - Updated MTF unit data
 * @returns {Promise<Object>} - Update response
 */
async function updateMTFRecord(mtfId, mtfData) {
    try {
        const response = await fetch(`${API_BASE_URL}/mtf/${mtfId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mtfData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating MTF unit:', error);
        throw new Error(`Failed to update MTF unit: ${error.message}`);
    }
}

/**
 * Disband (delete) an MTF unit record
 * @param {number} mtfId - MTF unit ID to disband
 * @returns {Promise<Object>} - Delete response
 */
async function disbandMTFUnit(mtfId) {
    try {
        const response = await fetch(`${API_BASE_URL}/mtf/${mtfId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error disbanding MTF unit:', error);
        throw new Error(`Failed to disband MTF unit: ${error.message}`);
    }
}

/**
 * Create a new SCP entry
 * @param {Object} scpData - SCP data object
 * @returns {Promise<Object>} - Created SCP response with scp_id
 */
async function createSCP(scpData) {
    try {
        const response = await fetch(`${API_BASE_URL}/scp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scpData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating SCP:', error);
        throw new Error(`Failed to create SCP: ${error.message}`);
    }
}

/**
 * Update an existing SCP entry
 * @param {number} scpId - SCP ID
 * @param {Object} scpData - Updated SCP data
 * @returns {Promise<Object>} - Update response
 */
async function updateSCP(scpId, scpData) {
    try {
        const response = await fetch(`${API_BASE_URL}/scp/${scpId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(scpData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating SCP:', error);
        throw new Error(`Failed to update SCP: ${error.message}`);
    }
}

/**
 * Delete an SCP entry
 * @param {number} scpId - SCP ID to delete
 * @returns {Promise<Object>} - Delete response
 */
async function deleteSCPEntry(scpId) {
    try {
        const response = await fetch(`${API_BASE_URL}/scp/${scpId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error deleting SCP:', error);
        throw new Error(`Failed to delete SCP: ${error.message}`);
    }
}

// ============================================================
// PERSONNEL CRUD FUNCTIONS
// ============================================================

/**
 * Fetch a single personnel by ID
 * @param {number} personId - Personnel ID
 * @returns {Promise<Object>} - Personnel object
 */
async function fetchPersonnelById(personId) {
    try {
        const response = await fetch(`${API_BASE_URL}/personnel/${personId}`);

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
 * Create a new personnel record
 * @param {Object} personnelData - Personnel data object
 * @returns {Promise<Object>} - Created personnel response with person_id
 */
async function createPersonnelRecord(personnelData) {
    try {
        const response = await fetch(`${API_BASE_URL}/personnel`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(personnelData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error creating personnel:', error);
        throw new Error(`Failed to create personnel: ${error.message}`);
    }
}

/**
 * Update an existing personnel record
 * @param {number} personId - Personnel ID
 * @param {Object} personnelData - Updated personnel data
 * @returns {Promise<Object>} - Update response
 */
async function updatePersonnelRecord(personId, personnelData) {
    try {
        const response = await fetch(`${API_BASE_URL}/personnel/${personId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(personnelData)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error updating personnel:', error);
        throw new Error(`Failed to update personnel: ${error.message}`);
    }
}

/**
 * Decommission (delete) a personnel record
 * @param {number} personId - Personnel ID to decommission
 * @returns {Promise<Object>} - Delete response
 */
async function decommissionPersonnel(personId) {
    try {
        const response = await fetch(`${API_BASE_URL}/personnel/${personId}`, {
            method: 'DELETE'
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error decommissioning personnel:', error);
        throw new Error(`Failed to decommission personnel: ${error.message}`);
    }
}

/**
 * Perform semantic search
 * @param {string} query - The search query
 * @param {number} limit - Max results
 * @returns {Promise<Array>} - Array of SCP objects
 */
async function searchSCPsSemantic(query, limit = 20) {
    try {
        const params = new URLSearchParams();
        params.append('q', query);
        params.append('limit', limit);

        const url = `${API_BASE_URL}/search/semantic?${params.toString()}`;
        console.log('Semantic Search:', url);

        const response = await fetch(url);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Error in semantic search:', error);
        throw new Error(`Failed to perform search: ${error.message}`);
    }
}

