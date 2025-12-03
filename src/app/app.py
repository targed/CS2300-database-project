from flask import Flask, request, jsonify, send_from_directory, redirect
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS
import sys
import os
from pathlib import Path

# Ensure the project parent directory is on sys.path so sibling packages can be imported
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

# Import all database modules
from database_queries import database_getters as getters
from database_queries import database_updates as updates  
from database_queries import database_insertions as insertions
from database_queries import database_queries as queries

# Initialize the Flask application
app = Flask(__name__)

# Enable CORS for all routes
CORS(app)

# Get the frontend directory path
FRONTEND_DIR = Path(__file__).resolve().parent.parent / 'frontend'

# Swagger UI configuration
SWAGGER_URL = '/api/docs'
API_URL = '/api/swagger.json'

swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={'app_name': "SCP Database API"}
)
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# ============================================================
# FRONTEND ROUTES
# ============================================================

@app.route('/')
def index():
    """Redirect root to frontend"""
    return redirect('/frontend/')

@app.route('/frontend/')
def frontend_index():
    """Serve the frontend HTML"""
    return send_from_directory(FRONTEND_DIR, 'index.html')

@app.route('/frontend/<path:path>')
def serve_frontend(path):
    """Serve frontend static files"""
    return send_from_directory(FRONTEND_DIR, path)

# ============================================================
# SYSTEM ENDPOINTS
# ============================================================

@app.route('/api/test', methods=['GET'])
def test_connection():
    """Test endpoint to verify API is running"""
    return jsonify({"message": "API is running!"})

# ============================================================
# SCP ENDPOINTS
# ============================================================

@app.route('/api/scps', methods=['GET'])
def get_all_scps():
    """Get all SCPs"""
    try:
        scps = getters.get_all_scps()
        return jsonify(scps if scps else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/scp/<int:scp_id>', methods=['GET'])
def get_scp_by_id(scp_id):
    """Get SCP by ID"""
    try:
        scp = getters.get_scp_by_id(scp_id)
        if scp:
            return jsonify(scp)
        return jsonify({"error": "SCP not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/scp/code/<string:scp_code>', methods=['GET'])
def get_scp_by_code(scp_code):
    """Get SCP by code (e.g., SCP-173)"""
    try:
        scp = getters.get_scp_by_code(scp_code)
        if scp:
            return jsonify(scp)
        return jsonify({"error": f"SCP {scp_code} not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/scp/dossier/<string:scp_code>', methods=['GET'])
def get_scp_dossier(scp_code):
    """Get full SCP dossier with all related data"""
    try:
        dossier = queries.retrieve_full_scp_dossier(scp_code)
        if "error" in dossier:
            return jsonify(dossier), 404
        return jsonify(dossier)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/scp', methods=['POST'])
def create_scp():
    """Create new SCP"""
    try:
        data = request.get_json()
        scp_id = insertions.insert_scp(
            data['scp_code'],
            data.get('title'),
            data.get('short_description'),
            data.get('containment_procedures'),
            data.get('full_description'),
            data.get('tags_list'),
            data.get('object_class')
        )
        return jsonify({"message": "SCP created", "scp_id": scp_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/scp/<int:scp_id>', methods=['PUT'])
def update_scp(scp_id):
    """Update SCP"""
    try:
        data = request.get_json()
        updates.update_scp(
            scp_id,
            data.get('scp_code'),
            data.get('title'),
            data.get('short_description'),
            data.get('containment_procedures'),
            data.get('full_description'),
            data.get('first_published'),
            data.get('decommissioned'),
            data.get('tags_list'),
            data.get('object_class')
        )
        return jsonify({"message": "SCP updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# PERSONNEL ENDPOINTS
# ============================================================

@app.route('/api/personnel', methods=['GET'])
def get_all_personnel():
    """Get all personnel"""
    try:
        personnel = getters.get_all_personnel()
        return jsonify(personnel if personnel else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/personnel/<int:person_id>', methods=['GET'])
def get_personnel_by_id(person_id):
    """Get personnel by ID"""
    try:
        person = getters.get_personnel_by_id(person_id)
        if person:
            return jsonify(person)
        return jsonify({"error": "Personnel not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/personnel', methods=['POST'])
def create_personnel():
    """Create new personnel"""
    try:
        data = request.get_json()
        person_id = insertions.insert_personnel(
            data.get('callsign'),
            data.get('given_name'),
            data.get('surname'),
            data.get('role'),
            data.get('hire_date'),
            data.get('notes'),
            data.get('clearance_id')
        )
        return jsonify({"message": "Personnel created", "person_id": person_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/personnel/<int:person_id>', methods=['PUT'])
def update_personnel(person_id):
    """Update personnel"""
    try:
        data = request.get_json()
        updates.update_personnel(
            person_id,
            data.get('callsign'),
            data.get('given_name'),
            data.get('surname'),
            data.get('role'),
            data.get('hire_date'),
            data.get('notes'),
            data.get('clearance_id')
        )
        return jsonify({"message": "Personnel updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/personnel/<int:person_id>', methods=['DELETE'])
def delete_personnel(person_id):
    """Decommission personnel"""
    try:
        queries.decommission_personnel(person_id)
        return jsonify({"message": f"Personnel {person_id} decommissioned"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/personnel/search', methods=['POST'])
def search_personnel():
    """Search personnel by criteria"""
    try:
        criteria = request.get_json()
        results = queries.find_personnel_by_criteria(criteria)
        return jsonify(results if results else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# FACILITY ENDPOINTS
# ============================================================

@app.route('/api/facilities', methods=['GET'])
def get_all_facilities():
    """Get all facilities"""
    try:
        facilities = getters.get_all_facilities()
        return jsonify(facilities if facilities else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/facility/<int:facility_id>', methods=['GET'])
def get_facility_by_id(facility_id):
    """Get facility by ID"""
    try:
        facility = getters.get_facility_by_id(facility_id)
        if facility:
            return jsonify(facility)
        return jsonify({"error": "Facility not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/facility', methods=['POST'])
def create_facility():
    """Create new facility"""
    try:
        data = request.get_json()
        facility_id = insertions.insert_facility(
            data['name'],
            data.get('code'),
            data.get('street'),
            data.get('city'),
            data.get('state_province'),
            data.get('country'),
            data.get('postal_code'),
            data.get('coords'),
            data.get('purpose')
        )
        return jsonify({"message": "Facility created", "facility_id": facility_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/facility/<int:facility_id>', methods=['PUT'])
def update_facility(facility_id):
    """Update facility"""
    try:
        data = request.get_json()
        updates.update_facility(
            facility_id,
            data.get('name'),
            data.get('code'),
            data.get('street'),
            data.get('city'),
            data.get('state_province'),
            data.get('country'),
            data.get('postal_code'),
            data.get('coords'),
            data.get('purpose')
        )
        return jsonify({"message": "Facility updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/facility/<int:facility_id>/stats', methods=['GET'])
def get_facility_stats(facility_id):
    """Get facility statistics"""
    try:
        stats = queries.generate_facility_statistics(facility_id)
        return jsonify(stats)
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# INCIDENT ENDPOINTS
# ============================================================

@app.route('/api/incidents', methods=['GET'])
def get_all_incidents():
    """Get all incidents"""
    try:
        incidents = getters.get_all_incidents()
        return jsonify(incidents if incidents else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/incident/<int:incident_id>', methods=['GET'])
def get_incident_by_id(incident_id):
    """Get incident by ID"""
    try:
        incident = getters.get_incident_by_id(incident_id)
        if incident:
            return jsonify(incident)
        return jsonify({"error": "Incident not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/incident', methods=['POST'])
def create_incident():
    """Create new incident"""
    try:
        data = request.get_json()
        incident_id = insertions.insert_incident(
            data['facility_id'],
            data['title'],
            data.get('incident_date'),
            data.get('summary'),
            data.get('severity_level')
        )
        return jsonify({"message": "Incident created", "incident_id": incident_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/incident/<int:incident_id>', methods=['PUT'])
def update_incident(incident_id):
    """Update incident"""
    try:
        data = request.get_json()
        updates.update_incident(
            incident_id,
            data.get('facility_id'),
            data.get('title'),
            data.get('incident_date'),
            data.get('summary'),
            data.get('severity_level')
        )
        return jsonify({"message": "Incident updated"})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/incident/<int:incident_id>/scps', methods=['GET'])
def get_incident_scps(incident_id):
    """Get SCPs related to an incident"""
    try:
        scps = getters.get_scps_for_incident(incident_id)
        return jsonify(scps if scps else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/incidents/with-scps', methods=['GET'])
def get_incidents_with_scps():
    """Get all incidents with their related SCP codes"""
    try:
        incidents = getters.get_all_incidents_with_scps()
        return jsonify(incidents if incidents else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# AGENT ENDPOINTS
# ============================================================

@app.route('/api/agents', methods=['GET'])
def get_all_agents():
    """Get all agents"""
    try:
        agents = getters.get_all_agents()
        return jsonify(agents if agents else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/agent/<int:agent_id>', methods=['GET'])
def get_agent_by_id(agent_id):
    """Get agent by ID"""
    try:
        agent = getters.get_agent_by_id(agent_id)
        if agent:
            return jsonify(agent)
        return jsonify({"error": "Agent not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/agent', methods=['POST'])
def create_agent():
    """Create new agent"""
    try:
        data = request.get_json()
        insertions.insert_agent(data['person_id'], data.get('badge_number'))
        return jsonify({"message": "Agent created"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# RESEARCHER ENDPOINTS
# ============================================================

@app.route('/api/researchers', methods=['GET'])
def get_all_researchers():
    """Get all researchers"""
    try:
        researchers = getters.get_all_researchers()
        return jsonify(researchers if researchers else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/researcher/<int:researcher_id>', methods=['GET'])
def get_researcher_by_id(researcher_id):
    """Get researcher by ID"""
    try:
        researcher = getters.get_researcher_by_id(researcher_id)
        if researcher:
            return jsonify(researcher)
        return jsonify({"error": "Researcher not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/researcher', methods=['POST'])
def create_researcher():
    """Create new researcher"""
    try:
        data = request.get_json()
        insertions.insert_researcher(data['person_id'], data.get('lab_affiliation'))
        return jsonify({"message": "Researcher created"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# MTF ENDPOINTS
# ============================================================

@app.route('/api/mtf', methods=['GET'])
def get_all_mtf():
    """Get all MTF units"""
    try:
        mtf_units = getters.get_all_mtf_units()
        return jsonify(mtf_units if mtf_units else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mtf/<int:mtf_id>', methods=['GET'])
def get_mtf_by_id(mtf_id):
    """Get MTF unit by ID"""
    try:
        mtf = getters.get_mtf_unit_by_id(mtf_id)
        if mtf:
            return jsonify(mtf)
        return jsonify({"error": "MTF unit not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/mtf', methods=['POST'])
def create_mtf():
    """Create new MTF unit"""
    try:
        data = request.get_json()
        mtf_id = insertions.insert_mtf_unit(
            data['designation'],
            data.get('nickname'),
            data.get('primary_role'),
            data.get('notes')
        )
        return jsonify({"message": "MTF unit created", "mtf_id": mtf_id}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# OBJECT CLASS ENDPOINTS
# ============================================================

@app.route('/api/object-classes', methods=['GET'])
def get_all_object_classes():
    """Get all object classes"""
    try:
        classes = getters.get_all_object_classes()
        return jsonify(classes if classes else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/object-class/<string:class_name>', methods=['GET'])
def get_object_class_by_name(class_name):
    """Get object class by name"""
    try:
        obj_class = getters.get_object_class_by_name(class_name)
        if obj_class:
            return jsonify(obj_class)
        return jsonify({"error": "Object class not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/object-class', methods=['POST'])
def create_object_class():
    """Create new object class"""
    try:
        data = request.get_json()
        insertions.insert_object_class(
            data['name'],
            data['description'],
            data.get('is_esoteric', False)
        )
        return jsonify({"message": "Object class created"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# SECURITY CLEARANCE ENDPOINTS
# ============================================================

@app.route('/api/security-clearances', methods=['GET'])
def get_all_security_clearances():
    """Get all security clearances"""
    try:
        clearances = getters.get_all_security_clearances()
        return jsonify(clearances if clearances else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/security-clearance/<int:clearance_id>', methods=['GET'])
def get_security_clearance_by_id(clearance_id):
    """Get security clearance by ID"""
    try:
        clearance = getters.get_security_clearance_by_id(clearance_id)
        if clearance:
            return jsonify(clearance)
        return jsonify({"error": "Security clearance not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# CONTAINMENT CHAMBER ENDPOINTS
# ============================================================

@app.route('/api/containment-chambers', methods=['GET'])
def get_all_containment_chambers():
    """Get all containment chambers"""
    try:
        chambers = getters.get_all_containment_chambers()
        return jsonify(chambers if chambers else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/containment-chamber/<int:chamber_id>', methods=['GET'])
def get_containment_chamber_by_id(chamber_id):
    """Get containment chamber by ID"""
    try:
        chamber = getters.get_containment_chamber_by_id(chamber_id)
        if chamber:
            return jsonify(chamber)
        return jsonify({"error": "Containment chamber not found"}), 404
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/containment-chamber/number/<string:chamber_no>', methods=['GET'])
def get_containment_chambers_by_number(chamber_no):
    """Get containment chambers by chamber number"""
    try:
        chambers = getters.get_containment_chambers_by_number(chamber_no)
        return jsonify(chambers if chambers else [])
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/api/containment-chamber', methods=['POST'])
def create_containment_chamber():
    """Create new containment chamber"""
    try:
        data = request.get_json()
        insertions.insert_containment_chamber(
            data['facility_id'],
            data['chamber_no'],
            data.get('chamber_type'),
            data.get('capacity'),
            data.get('special_equipment'),
            data.get('chamber_notes')
        )
        return jsonify({"message": "Containment chamber created"}), 201
    except Exception as e:
        return jsonify({"error": str(e)}), 500

# ============================================================
# SWAGGER SPECIFICATION
# ============================================================

@app.route('/api/swagger.json')
def swagger_spec():
    """Generate Swagger/OpenAPI specification"""
    spec = {
        "openapi": "3.0.0",
        "info": {
            "title": "SCP Database API",
            "description": "Comprehensive API for managing SCP Foundation database",
            "version": "1.0.0"
        },
        "servers": [{"url": "http://localhost:5000"}],
        "tags": [
            {"name": "System"}, {"name": "SCP"}, {"name": "Personnel"},
            {"name": "Facilities"}, {"name": "Incidents"}, {"name": "Agents"},
            {"name": "Researchers"}, {"name": "MTF"}, {"name": "Object Classes"},
            {"name": "Security"}, {"name": "Chambers"}
        ],
        "paths": {
            "/api/test": {"get": {"tags": ["System"], "summary": "Test API", "responses": {"200": {"description": "OK"}}}},
            "/api/scps": {"get": {"tags": ["SCP"], "summary": "Get all SCPs", "responses": {"200": {"description": "List of SCPs"}}}},
            "/api/scp/{scp_id}": {
                "get": {"tags": ["SCP"], "summary": "Get SCP by ID", "parameters": [{"name": "scp_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "responses": {"200": {"description": "SCP details"}}},
                "put": {"tags": ["SCP"], "summary": "Update SCP", "parameters": [{"name": "scp_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object"}}}}, "responses": {"200": {"description": "Updated"}}}
            },
            "/api/scp/code/{scp_code}": {"get": {"tags": ["SCP"], "summary": "Get SCP by code", "parameters": [{"name": "scp_code", "in": "path", "required": True, "schema": {"type": "string"}, "example": "SCP-173"}], "responses": {"200": {"description": "SCP details"}}}},
            "/api/scp/dossier/{scp_code}": {"get": {"tags": ["SCP"], "summary": "Get full SCP dossier", "parameters": [{"name": "scp_code", "in": "path", "required": True, "schema": {"type": "string"}}], "responses": {"200": {"description": "Complete dossier"}}}},
            "/api/scp": {"post": {"tags": ["SCP"], "summary": "Create SCP", "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object"}}}}, "responses": {"201": {"description": "Created"}}}},
            "/api/personnel": {
                "get": {"tags": ["Personnel"], "summary": "Get all personnel", "responses": {"200": {"description": "List of personnel"}}},
                "post": {"tags": ["Personnel"], "summary": "Create personnel", "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object"}}}}, "responses": {"201": {"description": "Created"}}}
            },
            "/api/personnel/{person_id}": {
                "get": {"tags": ["Personnel"], "summary": "Get personnel by ID", "parameters": [{"name": "person_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "responses": {"200": {"description": "Personnel details"}}},
                "put": {"tags": ["Personnel"], "summary": "Update personnel", "parameters": [{"name": "person_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object"}}}}, "responses": {"200": {"description": "Updated"}}},
                "delete": {"tags": ["Personnel"], "summary": "Decommission personnel", "parameters": [{"name": "person_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "responses": {"200": {"description": "Decommissioned"}}}
            },
            "/api/personnel/search": {"post": {"tags": ["Personnel"], "summary": "Search personnel", "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object"}}}}, "responses": {"200": {"description": "Search results"}}}},
            "/api/facilities": {
                "get": {"tags": ["Facilities"], "summary": "Get all facilities", "responses": {"200": {"description": "List of facilities"}}},
                "post": {"tags": ["Facilities"], "summary": "Create facility", "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object"}}}}, "responses": {"201": {"description": "Created"}}}
            },
            "/api/facility/{facility_id}": {
                "get": {"tags": ["Facilities"], "summary": "Get facility by ID", "parameters": [{"name": "facility_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "responses": {"200": {"description": "Facility details"}}},
                "put": {"tags": ["Facilities"], "summary": "Update facility", "parameters": [{"name": "facility_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object"}}}}, "responses": {"200": {"description": "Updated"}}}
            },
            "/api/facility/{facility_id}/stats": {"get": {"tags": ["Facilities"], "summary": "Get facility stats", "parameters": [{"name": "facility_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "responses": {"200": {"description": "Statistics"}}}},
            "/api/incidents": {
                "get": {"tags": ["Incidents"], "summary": "Get all incidents", "responses": {"200": {"description": "List of incidents"}}},
                "post": {"tags": ["Incidents"], "summary": "Create incident", "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object"}}}}, "responses": {"201": {"description": "Created"}}}
            },
            "/api/incident/{incident_id}": {
                "get": {"tags": ["Incidents"], "summary": "Get incident by ID", "parameters": [{"name": "incident_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "responses": {"200": {"description": "Incident details"}}},
                "put": {"tags": ["Incidents"], "summary": "Update incident", "parameters": [{"name": "incident_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object"}}}}, "responses": {"200": {"description": "Updated"}}}
            },
            "/api/agents": {"get": {"tags": ["Agents"], "summary": "Get all agents", "responses": {"200": {"description": "List of agents"}}}},
            "/api/agent/{agent_id}": {"get": {"tags": ["Agents"], "summary": "Get agent by ID", "parameters": [{"name": "agent_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "responses": {"200": {"description": "Agent details"}}}},
            "/api/researchers": {"get": {"tags": ["Researchers"], "summary": "Get all researchers", "responses": {"200": {"description": "List of researchers"}}}},
            "/api/researcher/{researcher_id}": {"get": {"tags": ["Researchers"], "summary": "Get researcher by ID", "parameters": [{"name": "researcher_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "responses": {"200": {"description": "Researcher details"}}}},
            "/api/mtf": {
                "get": {"tags": ["MTF"], "summary": "Get all MTF units", "responses": {"200": {"description": "List of MTF units"}}},
                "post": {"tags": ["MTF"], "summary": "Create MTF unit", "requestBody": {"required": True, "content": {"application/json": {"schema": {"type": "object"}}}}, "responses": {"201": {"description": "Created"}}}
            },
            "/api/mtf/{mtf_id}": {"get": {"tags": ["MTF"], "summary": "Get MTF by ID", "parameters": [{"name": "mtf_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "responses": {"200": {"description": "MTF details"}}}},
            "/api/object-classes": {"get": {"tags": ["Object Classes"], "summary": "Get all object classes", "responses": {"200": {"description": "List of object classes"}}}},
            "/api/object-class/{class_name}": {"get": {"tags": ["Object Classes"], "summary": "Get object class by name", "parameters": [{"name": "class_name", "in": "path", "required": True, "schema": {"type": "string"}}], "responses": {"200": {"description": "Object class details"}}}},
            "/api/security-clearances": {"get": {"tags": ["Security"], "summary": "Get all security clearances", "responses": {"200": {"description": "List of clearances"}}}},
            "/api/security-clearance/{clearance_id}": {"get": {"tags": ["Security"], "summary": "Get clearance by ID", "parameters": [{"name": "clearance_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "responses": {"200": {"description": "Clearance details"}}}},
            "/api/containment-chambers": {"get": {"tags": ["Chambers"], "summary": "Get all chambers", "responses": {"200": {"description": "List of chambers"}}}},
            "/api/containment-chamber/{chamber_id}": {"get": {"tags": ["Chambers"], "summary": "Get chamber by ID", "parameters": [{"name": "chamber_id", "in": "path", "required": True, "schema": {"type": "integer"}}], "responses": {"200": {"description": "Chamber details"}}}},
            "/api/containment-chamber/number/{chamber_no}": {"get": {"tags": ["Chambers"], "summary": "Get chambers by number", "parameters": [{"name": "chamber_no", "in": "path", "required": True, "schema": {"type": "string"}}], "responses": {"200": {"description": "Chambers with number"}}}}
        }
    }
    return jsonify(spec)

if __name__ == '__main__':
    # Runs the app on port 5000, accessible from other Docker containers
    print("=" * 60)
    print("SCP Database API Starting...")
    print("API Documentation: http://localhost:5000/api/docs")
    print("API Endpoints: http://localhost:5000/api/test")
    print("=" * 60)
    app.run(host='0.0.0.0', port=5000, debug=True)