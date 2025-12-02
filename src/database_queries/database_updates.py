from db_connection import execute_update, execute_transaction

# Agent
def update_agent(person_id, badge_number=None):
    """Update agent information."""
    query = """
    UPDATE AGENT
    SET badge_number = COALESCE(%s, badge_number)
    WHERE person_id = %s;
    """
    return execute_update(query, (badge_number, person_id))

# Containment Chamber
def update_containment_chamber(facility_id, chamber_no, chamber_type=None, capacity=None,
                               special_equipment=None, chamber_notes=None):
    """Update containment chamber information."""
    query = """
    UPDATE CONTAINMENT_CHAMBER
    SET chamber_type = COALESCE(%s, chamber_type),
        capacity = COALESCE(%s, capacity),
        special_equipment = COALESCE(%s, special_equipment),
        chamber_notes = COALESCE(%s, chamber_notes)
    WHERE facility_id = %s AND chamber_no = %s;
    """
    return execute_update(query, (chamber_type, capacity, special_equipment, chamber_notes,
                                  facility_id, chamber_no))

# Facility
def update_facility(facility_id, name=None, code=None, street=None, city=None, 
                    state_province=None, country=None, postal_code=None, coords=None, purpose=None):
    """Update facility information."""
    query = """
    UPDATE FACILITY
    SET name = COALESCE(%s, name),
        code = COALESCE(%s, code),
        street = COALESCE(%s, street),
        city = COALESCE(%s, city),
        state_province = COALESCE(%s, state_province),
        country = COALESCE(%s, country),
        postal_code = COALESCE(%s, postal_code),
        coords = COALESCE(%s, coords),
        purpose = COALESCE(%s, purpose)
    WHERE facility_id = %s;
    """
    return execute_update(query, (name, code, street, city, state_province, country,
                                  postal_code, coords, purpose, facility_id))

# Incident
def update_incident(incident_id, facility_id=None, title=None, incident_date=None, 
                    summary=None, severity_level=None):
    """Update incident information."""
    query = """
    UPDATE INCIDENT
    SET facility_id = COALESCE(%s, facility_id),
        title = COALESCE(%s, title),
        incident_date = COALESCE(%s, incident_date),
        summary = COALESCE(%s, summary),
        severity_level = COALESCE(%s, severity_level)
    WHERE incident_id = %s;
    """
    return execute_update(query, (facility_id, title, incident_date, summary, 
                                  severity_level, incident_id))

# Mobile Task Force
def update_mtf_unit(mtf_id, designation=None, nickname=None, primary_role=None, notes=None):
    """Update MTF unit information."""
    query = """
    UPDATE MOBILE_TASK_FORCE
    SET designation = COALESCE(%s, designation),
        nickname = COALESCE(%s, nickname),
        primary_role = COALESCE(%s, primary_role),
        notes = COALESCE(%s, notes)
    WHERE mtf_id = %s;
    """
    return execute_update(query, (designation, nickname, primary_role, notes, mtf_id))

# Object Class
def update_object_class(class_name, description=None, is_esoteric=None):
    """Update object class information."""
    query = """
    UPDATE OBJECT_CLASS
    SET description = COALESCE(%s, description),
        is_esoteric = COALESCE(%s, is_esoteric)
    WHERE class_name = %s;
    """
    return execute_update(query, (description, is_esoteric, class_name))

# Personnel
def update_personnel(person_id, callsign=None, given_name=None, surname=None, role=None,
                     hire_date=None, notes=None, clearance_id=None):
    """Update personnel information."""
    query = """
    UPDATE PERSONNEL
    SET callsign = COALESCE(%s, callsign),
        given_name = COALESCE(%s, given_name),
        surname = COALESCE(%s, surname),
        role = COALESCE(%s, role),
        hire_date = COALESCE(%s, hire_date),
        notes = COALESCE(%s, notes),
        clearance_id = COALESCE(%s, clearance_id)
    WHERE person_id = %s;
    """
    return execute_update(query, (callsign, given_name, surname, role, hire_date, 
                                  notes, clearance_id, person_id))

# Researcher
def update_researcher(person_id, lab_affiliation=None):
    """Update researcher information."""
    query = """
    UPDATE RESEARCHER
    SET lab_affiliation = COALESCE(%s, lab_affiliation)
    WHERE person_id = %s;
    """
    return execute_update(query, (lab_affiliation, person_id))

# SCP
def update_scp(scp_id, scp_code=None, title=None, short_description=None, 
               containment_procedures=None, full_description=None, first_published=None,
               decommissioned=None, tags_list=None, object_class=None):
    """Update SCP information."""
    query = """
    UPDATE SCP
    SET scp_code = COALESCE(%s, scp_code),
        title = COALESCE(%s, title),
        short_description = COALESCE(%s, short_description),
        containment_procedures = COALESCE(%s, containment_procedures),
        full_description = COALESCE(%s, full_description),
        first_published = COALESCE(%s, first_published),
        decommissioned = COALESCE(%s, decommissioned),
        tags_list = COALESCE(%s, tags_list),
        object_class = COALESCE(%s, object_class)
    WHERE scp_id = %s;
    """
    return execute_update(query, (scp_code, title, short_description, containment_procedures,
                                  full_description, first_published, decommissioned, 
                                  tags_list, object_class, scp_id))

# SCP Version
def update_scp_version(version_id, version_date=None, change_summary=None, content=None):
    """Update SCP version information."""
    query = """
    UPDATE SCP_VERSION
    SET version_date = COALESCE(%s, version_date),
        change_summary = COALESCE(%s, change_summary),
        content = COALESCE(%s, content)
    WHERE version_id = %s;
    """
    return execute_update(query, (version_date, change_summary, content, version_id))

# Security Clearance
def update_security_clearance(clearance_id, level_name=None, privileges=None):
    """Update security clearance information."""
    query = """
    UPDATE SECURITY_CLEARANCE
    SET level_name = COALESCE(%s, level_name),
        privileges = COALESCE(%s, privileges)
    WHERE clearance_id = %s;
    """
    return execute_update(query, (level_name, privileges, clearance_id))

# Security Officer
def update_security_officer(person_id, certifications=None):
    """Update security officer information."""
    query = """
    UPDATE SECURITY_OFFICER
    SET certifications = COALESCE(%s, certifications)
    WHERE person_id = %s;
    """
    return execute_update(query, (certifications, person_id))

# SCP Assignment
def update_scp_assignment(assignment_id, scp_id=None, facility_id=None, chamber_no=None,
                          start_date=None, end_date=None, reason=None):
    """Update SCP assignment information."""
    query = """
    UPDATE SCP_ASSIGNMENT
    SET scp_id = COALESCE(%s, scp_id),
        facility_id = COALESCE(%s, facility_id),
        chamber_no = COALESCE(%s, chamber_no),
        start_date = COALESCE(%s, start_date),
        end_date = COALESCE(%s, end_date),
        reason = COALESCE(%s, reason)
    WHERE assignment_id = %s;
    """
    return execute_update(query, (scp_id, facility_id, chamber_no, start_date, 
                                  end_date, reason, assignment_id))

# Personnel Assignment
def update_personnel_assignment(assignment_id, person_id=None, scp_id=None, facility_id=None,
                                role_on_assignment=None, start_date=None, end_date=None):
    """Update personnel assignment information."""
    query = """
    UPDATE PERSONNEL_ASSIGNMENT
    SET person_id = COALESCE(%s, person_id),
        scp_id = COALESCE(%s, scp_id),
        facility_id = COALESCE(%s, facility_id),
        role_on_assignment = COALESCE(%s, role_on_assignment),
        start_date = COALESCE(%s, start_date),
        end_date = COALESCE(%s, end_date)
    WHERE assignment_id = %s;
    """
    return execute_update(query, (person_id, scp_id, facility_id, role_on_assignment,
                                  start_date, end_date, assignment_id))

# Close SCP Assignment (set end_date to current date)
def close_scp_assignment(assignment_id):
    """Close an active SCP assignment by setting end_date to today."""
    query = """
    UPDATE SCP_ASSIGNMENT
    SET end_date = CURDATE()
    WHERE assignment_id = %s AND end_date IS NULL;
    """
    return execute_update(query, (assignment_id,))

# Close Personnel Assignment
def close_personnel_assignment(assignment_id):
    """Close an active personnel assignment by setting end_date to today."""
    query = """
    UPDATE PERSONNEL_ASSIGNMENT
    SET end_date = CURDATE()
    WHERE assignment_id = %s AND end_date IS NULL;
    """
    return execute_update(query, (assignment_id,))
