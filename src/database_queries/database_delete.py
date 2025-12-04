from .db_connection import execute_update, execute_transaction

# Agent
def delete_agent(person_id):
    """Delete an agent record."""
    query = """
    DELETE FROM AGENT
    WHERE person_id = %s;
    """
    return execute_update(query, (person_id,))

# Containment Chamber
def delete_containment_chamber(facility_id, chamber_no):
    """Delete a containment chamber."""
    query = """
    DELETE FROM CONTAINMENT_CHAMBER
    WHERE facility_id = %s AND chamber_no = %s;
    """
    return execute_update(query, (facility_id, chamber_no))

# Facility
def delete_facility(facility_id):
    """Delete a facility."""
    query = """
    DELETE FROM FACILITY
    WHERE facility_id = %s;
    """
    return execute_update(query, (facility_id,))

def delete_facility_cascade(facility_id):
    """Decommission a facility - closes active assignments, returns info about related records."""
    from .db_connection import execute_query
    
    warnings = []
    
    # Check for incidents at this facility
    query_incidents = """
    SELECT COUNT(*) as count FROM INCIDENT WHERE facility_id = %s;
    """
    incident_result = execute_query(query_incidents, (facility_id,))
    incident_count = incident_result[0]['count'] if incident_result else 0
    if incident_count > 0:
        warnings.append(f"{incident_count} incident(s) are associated with this facility")
    
    # Close active SCP assignments (set end_date to today)
    query_close_scp = """
    UPDATE SCP_ASSIGNMENT
    SET end_date = CURDATE()
    WHERE facility_id = %s AND end_date IS NULL;
    """
    execute_update(query_close_scp, (facility_id,))
    
    # Close active personnel assignments (set end_date to today)
    query_close_personnel = """
    UPDATE PERSONNEL_ASSIGNMENT
    SET end_date = CURDATE()
    WHERE facility_id = %s AND end_date IS NULL;
    """
    execute_update(query_close_personnel, (facility_id,))
    
    # Containment chambers will cascade delete automatically due to FK constraint
    # Now delete the facility
    query_delete = """
    DELETE FROM FACILITY
    WHERE facility_id = %s;
    """
    execute_update(query_delete, (facility_id,))
    
    result = {"message": "Facility decommissioned successfully"}
    if warnings:
        result["warnings"] = warnings
    
    return result

# Incident
def delete_incident(incident_id):
    """Delete an incident."""
    query = """
    DELETE FROM INCIDENT
    WHERE incident_id = %s;
    """
    return execute_update(query, (incident_id,))

def delete_incident_cascade(incident_id):
    """Delete an incident and cascade delete all associations (SCP, MTF, Personnel)."""
    # Delete SCP associations
    query_scp = """
    DELETE FROM INCIDENT_SCP
    WHERE incident_id = %s;
    """
    execute_update(query_scp, (incident_id,))
    
    # Delete MTF associations
    query_mtf = """
    DELETE FROM INCIDENT_MTF
    WHERE incident_id = %s;
    """
    execute_update(query_mtf, (incident_id,))
    
    # Delete Personnel associations
    query_personnel = """
    DELETE FROM INCIDENT_PERSONNEL
    WHERE incident_id = %s;
    """
    execute_update(query_personnel, (incident_id,))
    
    # Delete the incident itself
    query_incident = """
    DELETE FROM INCIDENT
    WHERE incident_id = %s;
    """
    execute_update(query_incident, (incident_id,))
    
    return {"message": "Incident deleted successfully"}

# Mobile Task Force
def delete_mtf_unit(mtf_id):
    """Delete an MTF unit."""
    query = """
    DELETE FROM MOBILE_TASK_FORCE
    WHERE mtf_id = %s;
    """
    return execute_update(query, (mtf_id,))

def delete_mtf_unit_cascade(mtf_id):
    """Delete an MTF unit and cascade delete related INCIDENT_MTF records."""
    # First delete incident associations
    query_incidents = """
    DELETE FROM INCIDENT_MTF
    WHERE mtf_id = %s;
    """
    execute_update(query_incidents, (mtf_id,))
    
    # Then delete the MTF unit
    query_mtf = """
    DELETE FROM MOBILE_TASK_FORCE
    WHERE mtf_id = %s;
    """
    return execute_update(query_mtf, (mtf_id,))

# Object Class
def delete_object_class(class_name):
    """Delete an object class."""
    query = """
    DELETE FROM OBJECT_CLASS
    WHERE class_name = %s;
    """
    return execute_update(query, (class_name,))

# Personnel (cascades to specialization tables)
def delete_personnel(person_id):
    """Delete a personnel record (cascades to RESEARCHER, AGENT, SECURITY_OFFICER)."""
    query = """
    DELETE FROM PERSONNEL
    WHERE person_id = %s;
    """
    return execute_update(query, (person_id,))

# Researcher
def delete_researcher(person_id):
    """Delete a researcher record."""
    query = """
    DELETE FROM RESEARCHER
    WHERE person_id = %s;
    """
    return execute_update(query, (person_id,))

# SCP
def delete_scp(scp_id):
    """Delete an SCP entry."""
    query = """
    DELETE FROM SCP
    WHERE scp_id = %s;
    """
    return execute_update(query, (scp_id,))

# SCP Version
def delete_scp_version(version_id):
    """Delete an SCP version."""
    query = """
    DELETE FROM SCP_VERSION
    WHERE version_id = %s;
    """
    return execute_update(query, (version_id,))

# Security Clearance
def delete_security_clearance(clearance_id):
    """Delete a security clearance level."""
    query = """
    DELETE FROM SECURITY_CLEARANCE
    WHERE clearance_id = %s;
    """
    return execute_update(query, (clearance_id,))

# Security Officer
def delete_security_officer(person_id):
    """Delete a security officer record."""
    query = """
    DELETE FROM SECURITY_OFFICER
    WHERE person_id = %s;
    """
    return execute_update(query, (person_id,))

# SCP Assignment
def delete_scp_assignment(assignment_id):
    """Delete an SCP assignment."""
    query = """
    DELETE FROM SCP_ASSIGNMENT
    WHERE assignment_id = %s;
    """
    return execute_update(query, (assignment_id,))

# Personnel Assignment
def delete_personnel_assignment(assignment_id):
    """Delete a personnel assignment."""
    query = """
    DELETE FROM PERSONNEL_ASSIGNMENT
    WHERE assignment_id = %s;
    """
    return execute_update(query, (assignment_id,))

# Incident-SCP Association
def delete_incident_scp(incident_id, scp_id):
    """Remove the link between an incident and an SCP."""
    query = """
    DELETE FROM INCIDENT_SCP
    WHERE incident_id = %s AND scp_id = %s;
    """
    return execute_update(query, (incident_id, scp_id))

# Incident-Personnel Association
def delete_incident_personnel(incident_id, person_id):
    """Remove the link between an incident and personnel."""
    query = """
    DELETE FROM INCIDENT_PERSONNEL
    WHERE incident_id = %s AND person_id = %s;
    """
    return execute_update(query, (incident_id, person_id))

# Incident-MTF Association
def delete_incident_mtf(incident_id, mtf_id):
    """Remove the link between an incident and an MTF unit."""
    query = """
    DELETE FROM INCIDENT_MTF
    WHERE incident_id = %s AND mtf_id = %s;
    """
    return execute_update(query, (incident_id, mtf_id))
