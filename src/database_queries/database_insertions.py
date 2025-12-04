from .db_connection import execute_query, execute_update, execute_transaction
from .database_getters import get_scp_by_code, get_personnel_by_id, get_all_facilities

def insert_into_specified_table(table_name, data):
    """
    Inserts a new record into the specified table using the provided data dictionary.
    Assumes that the keys of the data dictionary match the column names of the table.
    """
    columns = ', '.join(data.keys())
    placeholders = ', '.join(['%s'] * len(data))
    query = f"""
    INSERT INTO {table_name} ({columns})
    VALUES ({placeholders});
    """
    params = tuple(data.values())
    return execute_update(query, params)

def insert_agent(person_id, badge_number):
    query = """
    INSERT INTO AGENT (person_id, badge_number)
    VALUES (%s, %s);
    """
    params = (person_id, badge_number)
    return execute_update(query, params)

def insert_containment_chamber(facility_id, chamber_no, chamber_type, capacity, special_equipment, chamber_notes):
    query = """
    INSERT INTO CONTAINMENT_CHAMBER (facility_id, chamber_no, chamber_type, capacity, special_equipment, chamber_notes)
    VALUES (%s, %s, %s, %s, %s, %s);
    """
    params = (facility_id, chamber_no, chamber_type, capacity, special_equipment, chamber_notes)
    return execute_update(query, params)

def insert_facility(name, code, street, city, state_province, country, postal_code, coords, purpose):
    query = """
    INSERT INTO FACILITY (name, code, street, city, state_province, country, postal_code, coords, purpose)
    VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s);
    """
    params = (name, code, street, city, state_province, country, postal_code, coords, purpose)
    return execute_update(query, params)

def insert_incident(facility_id, title, incident_date, summary, severity_level):
    query = """
    INSERT INTO INCIDENT (facility_id, title, incident_date, summary, severity_level)
    VALUES (%s, %s, %s, %s, %s);
    """
    params = (facility_id, title, incident_date, summary, severity_level)
    return execute_update(query, params)

def insert_mtf_unit(designation, nickname, primary_role, notes):
    query = """
    INSERT INTO MOBILE_TASK_FORCE (designation, nickname, primary_role, notes)
    VALUES (%s, %s, %s, %s);
    """
    params = (designation, nickname, primary_role, notes)
    return execute_update(query, params)

def insert_object_class(name, description, is_esoteric=False):
    query = """
    INSERT INTO OBJECT_CLASS (class_name, description, is_esoteric)
    VALUES (%s, %s, %s);
    """
    params = (name, description, is_esoteric)
    return execute_update(query, params)

def insert_personnel(callsign, given_name, surname, role, hire_date, notes, clearance_id):
    query = """
    INSERT INTO PERSONNEL (callsign, given_name, surname, role, hire_date, notes, clearance_id)
    VALUES (%s, %s, %s, %s, %s, %s, %s);
    """
    params = (callsign, given_name, surname, role, hire_date, notes, clearance_id)
    return execute_update(query, params)

def insert_researcher(person_id, lab_affiliation):
    query = """
    INSERT INTO RESEARCHER (person_id, lab_affiliation)
    VALUES (%s, %s);
    """
    params = (person_id, lab_affiliation)
    return execute_update(query, params)

def insert_scp(scp_code, title, short_description, containment_procedures, full_description, tags_list, object_class):
    query = """
    INSERT INTO SCP (scp_code, title, short_description, containment_procedures, full_description, tags_list, object_class)
    VALUES (%s, %s, %s, %s, %s, %s, %s);
    """
    params = (scp_code, title, short_description, containment_procedures, full_description, tags_list, object_class)
    return execute_update(query, params)

def insert_incident_scp(incident_id, scp_id):
    """Link an SCP to an incident."""
    query = """
    INSERT INTO INCIDENT_SCP (incident_id, scp_id)
    VALUES (%s, %s);
    """
    params = (incident_id, scp_id)
    return execute_update(query, params)