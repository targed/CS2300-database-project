import sys
from pathlib import Path
from .db_connection import execute_query

# General table data retrieval
def get_specified_table_data(table_name):
    query = f"""
    SELECT *
    FROM {table_name};
    """
    return execute_query(query)

# Agent
def get_all_agents():
    query = """
    SELECT person_id, badge_number
    FROM AGENT
    """
    return execute_query(query)

def get_agent_by_id(agent_id):
    query = """
    SELECT person_id, badge_number
    FROM AGENT
    WHERE person_id = %s
    """
    return execute_query(query, (agent_id,), fetch_one=True)

# Containment chamber
def get_all_containment_chambers():
    query = """
    SELECT *
    FROM CONTAINMENT_CHAMBER;
    """
    return execute_query(query)

def get_containment_chamber_by_id(chamber_id):
    query = """
    SELECT *
    FROM CONTAINMENT_CHAMBER
    WHERE facility_id = %s;
    """
    return execute_query(query, (chamber_id,), fetch_one=True)

def get_containment_chambers_by_number(chamber_number):
    query = """
    SELECT *
    FROM CONTAINMENT_CHAMBER
    WHERE chamber_no = %s;
    """
    return execute_query(query, (chamber_number,))

# Facility
def get_all_facilities():
    query = """
    SELECT *
    FROM FACILITY;
    """
    return execute_query(query)

def get_facility_by_id(facility_id):
    query = """
    SELECT *
    FROM FACILITY
    WHERE facility_id = %s;
    """
    return execute_query(query, (facility_id,), fetch_one=True)

# Incident
def get_all_incidents():
    query = """
    SELECT *
    FROM INCIDENT;
    """
    return execute_query(query)

def get_incident_by_id(incident_id):
    query = """
    SELECT *
    FROM INCIDENT
    WHERE incident_id = %s;
    """
    return execute_query(query, (incident_id,), fetch_one=True)

def get_scps_for_incident(incident_id):
    """Get all SCPs related to an incident"""
    query = """
    SELECT S.scp_id, S.scp_code, S.title, S.short_description, S.object_class
    FROM INCIDENT_SCP I_S
    JOIN SCP S ON I_S.scp_id = S.scp_id
    WHERE I_S.incident_id = %s;
    """
    return execute_query(query, (incident_id,))

def get_all_incidents_with_scps():
    """Get all incidents with their related SCP codes"""
    query = """
    SELECT I.*, GROUP_CONCAT(S.scp_code SEPARATOR ', ') as related_scps
    FROM INCIDENT I
    LEFT JOIN INCIDENT_SCP I_S ON I.incident_id = I_S.incident_id
    LEFT JOIN SCP S ON I_S.scp_id = S.scp_id
    GROUP BY I.incident_id
    ORDER BY I.incident_date DESC;
    """
    return execute_query(query)

# Mobile Task Force
def get_all_mtf_units():
    query = """
    SELECT *
    FROM MOBILE_TASK_FORCE;
    """
    return execute_query(query)

def get_mtf_unit_by_id(mtf_id):
    query = """
    SELECT *
    FROM MOBILE_TASK_FORCE
    WHERE mtf_id = %s;
    """
    return execute_query(query, (mtf_id,), fetch_one=True)

# Object class
def get_all_object_classes():
    query = """
    SELECT *
    FROM OBJECT_CLASS;
    """
    return execute_query(query)

def get_object_class_by_name(class_name):
    query = """
    SELECT *
    FROM OBJECT_CLASS
    WHERE class_name = %s;
    """
    return execute_query(query, (class_name,), fetch_one=True)

# Personnel
def get_all_personnel():
    query = """
    SELECT *
    FROM PERSONNEL;
    """
    return execute_query(query)

def get_personnel_by_id(person_id):
    query = """
    SELECT *
    FROM PERSONNEL
    WHERE person_id = %s;
    """
    return execute_query(query, (person_id,), fetch_one=True)

# Researcher
def get_all_researchers():
    query = """
    SELECT *
    FROM RESEARCHER;
    """
    return execute_query(query)

def get_researcher_by_id(researcher_id):
    query = """
    SELECT *
    FROM RESEARCHER
    WHERE person_id = %s;
    """
    return execute_query(query, (researcher_id,), fetch_one=True)

# SCP
def get_all_scps():
    query = """
    SELECT *
    FROM SCP;
    """
    return execute_query(query)

def get_scp_by_id(scp_id):
    query = """
    SELECT *
    FROM SCP
    WHERE scp_id = %s;
    """
    return execute_query(query, (scp_id,), fetch_one=True)

def get_scp_by_code(scp_code):
    query = """
    SELECT *
    FROM SCP
    WHERE scp_code = %s;
    """
    return execute_query(query, (scp_code,), fetch_one=True)

# Security Clearance
def get_all_security_clearances():
    query = """
    SELECT *
    FROM SECURITY_CLEARANCE;
    """
    return execute_query(query)

def get_security_clearance_by_id(clearance_id):
    query = """
    SELECT *
    FROM SECURITY_CLEARANCE
    WHERE clearance_id = %s;
    """
    return execute_query(query, (clearance_id,), fetch_one=True)

