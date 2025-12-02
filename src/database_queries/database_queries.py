from db_connection import execute_query, execute_update, execute_transaction
from database_getters import get_scp_by_code, get_personnel_by_id, get_all_facilities

# Data Management Functions:

"""
Input: A dictionary or object containing all SCP attributes.
Logic:
a. First, query the OBJECT_CLASS table to ensure the provided class exists. If not, return an error.
b. Construct an INSERT INTO SCP (...) VALUES (...); query.
c. Crucially, use parameterized queries to prevent SQL injection. The mysql-connector library handles this automatically when you pass arguments separately.
d. Execute the query. Return the ID of the newly created SCP on success.
"""

def log_new_scp(scp_code, object_class, title, containment_procedures, full_description):
    query = """
    INSERT INTO SCP (scp_code, object_class, title, containment_procedures, full_description)
    VALUES (%s, %s, %s, %s, %s);
    """
    params = (scp_code, object_class, title, containment_procedures, full_description)
    return execute_update(query, params)

"""
Input: scp_id and details of the new assignment.
Logic (as a transaction):
a. Start a database transaction.
b. Execute an UPDATE SCP_ASSIGNMENT SET end_date = NOW() WHERE scp_id = %s AND end_date IS NULL;. This "closes" the current assignment.
c. Execute an INSERT INTO SCP_ASSIGNMENT (...) VALUES (...); to create the new assignment record.
d. Commit the transaction. If either step fails, roll back the transaction.
"""

def update_scp_assignment(scp_id, new_facility_id, assigned_personnel_id):
    # Close current assignment
    close_query = """
    UPDATE SCP_ASSIGNMENT
    SET end_date = NOW()
    WHERE scp_id = %s AND end_date IS NULL;
    """
    # Create new assignment
    insert_query = """
    INSERT INTO SCP_ASSIGNMENT (scp_id, facility_id, person_id, start_date)
    VALUES (%s, %s, %s, NOW());
    """
    queries = [
        (close_query, (scp_id,)),
        (insert_query, (scp_id, new_facility_id, assigned_personnel_id))
    ]
    return execute_transaction(queries)

"""
Input: person_id.
Logic:
a. Execute DELETE FROM PERSONNEL WHERE person_id = %s;.
b. Because you set up ON DELETE CASCADE in your schema for the specialization tables (RESEARCHER, AGENT, etc.), the database will automatically delete the corresponding subclass record. This makes the logic here very clean.
c. Return a success message.
"""
def decommission_personnel(person_id):
    query = """
    DELETE FROM PERSONNEL
    WHERE person_id = %s;
    """
    params = (person_id,)
    return execute_update(query, params)

# Querying and Data Retrieval Functions:

"""
Input: scp_code.
Logic: This is your centerpiece function. It will execute multiple queries to build a complete picture.
a. Get the main SCP data using your get_scp_by_code() helper. If None, return a "Not Found" error.
b. Query 1 (JOIN): Get object class details: SELECT O.description FROM SCP S JOIN OBJECT_CLASS O ON S.object_class = O.class_name WHERE S.scp_code = %s;
c. Query 2 (JOIN): Get assignment history: SELECT F.name, A.start_date, A.end_date FROM SCP_ASSIGNMENT A JOIN FACILITY F ON A.facility_id = F.facility_id WHERE A.scp_id = %s ORDER BY A.start_date DESC;
d. Query 3 (JOIN): Get involved incidents: SELECT I.title, I.incident_date FROM INCIDENT_SCP I_S JOIN INCIDENT I ON I_S.incident_id = I.incident_id WHERE I_S.scp_id = %s;
e. Combine the results from all these queries into a single, large dictionary or JSON object and return it.
"""

def retrieve_full_scp_dossier(scp_code):
    # Step a: Get main SCP data
    scp_data = get_scp_by_code(scp_code)
    if not scp_data:
        return {"error": "SCP Not Found"}

    scp_id = scp_data['scp_id']

    # Step b: Get object class details
    object_class_query = """
    SELECT O.description
    FROM SCP S
    JOIN OBJECT_CLASS O ON S.object_class = O.class_name
    WHERE S.scp_code = %s;
    """
    object_class_data = execute_query(object_class_query, (scp_code,), fetch_one=True)

    # Step c: Get assignment history
    assignment_history_query = """
    SELECT F.name, A.start_date, A.end_date
    FROM SCP_ASSIGNMENT A
    JOIN FACILITY F ON A.facility_id = F.facility_id
    WHERE A.scp_id = %s
    ORDER BY A.start_date DESC;
    """
    assignment_history_data = execute_query(assignment_history_query, (scp_id,))

    # Step d: Get involved incidents
    incidents_query = """
    SELECT I.title, I.incident_date
    FROM INCIDENT_SCP I_S
    JOIN INCIDENT I ON I_S.incident_id = I.incident_id
    WHERE I_S.scp_id = %s;
    """
    incidents_data = execute_query(incidents_query, (scp_id,))

    # Combine all data into a single dossier
    dossier = {
        "scp_data": scp_data,
        "object_class_details": object_class_data,
        "assignment_history": assignment_history_data or [],
        "involved_incidents": incidents_data or []
    }

    return dossier

"""
Input: A dictionary of criteria, e.g., {'clearance_level': 'Level 4', 'role': 'Researcher'}.
Logic:
a. Start with a base query: SELECT P.person_id, P.given_name, P.surname, SC.level_name FROM PERSONNEL P JOIN SECURITY_CLEARANCE SC ON P.clearance_id = SC.clearance_id.
b. Dynamically add WHERE clauses to the query based on the input criteria.
c. If criteria['role'] == 'Researcher', add JOIN RESEARCHER R ON P.person_id = R.person_id to the query.
d. Execute the final, constructed query and return the list of matching personnel.
"""

def find_personnel_by_criteria(criteria):
    base_query = """
    SELECT P.person_id, P.given_name, P.surname, P.role, SC.level_name
    FROM PERSONNEL P
    JOIN SECURITY_CLEARANCE SC ON P.clearance_id = SC.clearance_id
    """
    where_clauses = []
    params = []

    if 'clearance_level' in criteria:
        where_clauses.append("SC.level_name = %s")
        params.append(criteria['clearance_level'])

    if 'role' in criteria:
        where_clauses.append("P.role = %s")
        params.append(criteria['role'])

    if where_clauses:
        base_query += " WHERE " + " AND ".join(where_clauses)

    return execute_query(base_query, tuple(params))

"""
Input: facility_id.
Logic:
a. Execute the aggregation query: SELECT COUNT(scp_id) as current_anomaly_count FROM SCP_ASSIGNMENT WHERE facility_id = %s AND end_date IS NULL;
b. Execute a simple query to get facility details: SELECT name, purpose FROM FACILITY WHERE facility_id = %s;
c. Combine the results and return them.
"""

def generate_facility_statistics(facility_id):
    anomaly_count_query = """
    SELECT COUNT(scp_id) as current_anomaly_count
    FROM SCP_ASSIGNMENT
    WHERE facility_id = %s AND end_date IS NULL;
    """
    facility_details_query = """
    SELECT name, purpose
    FROM FACILITY
    WHERE facility_id = %s;
    """
    params = (facility_id,)
    
    anomaly_count = execute_query(anomaly_count_query, params, fetch_one=True)
    facility_details = execute_query(facility_details_query, params, fetch_one=True)
    
    return {
        "facility_details": facility_details,
        "current_anomaly_count": anomaly_count['current_anomaly_count'] if anomaly_count else 0
    }
    
def transfer_scp_to_facility(scp_id, new_facility_id, chamber_no=None, reason=None):
    """
    Transfer an SCP to a new facility.
    Closes the current assignment and creates a new one as a transaction.
    """
    close_query = """
    UPDATE SCP_ASSIGNMENT
    SET end_date = CURDATE()
    WHERE scp_id = %s AND end_date IS NULL;
    """
    insert_query = """
    INSERT INTO SCP_ASSIGNMENT (scp_id, facility_id, chamber_no, start_date, reason)
    VALUES (%s, %s, %s, CURDATE(), %s);
    """
    queries = [
        (close_query, (scp_id,)),
        (insert_query, (scp_id, new_facility_id, chamber_no, reason))
    ]
    return execute_transaction(queries)

def transfer_personnel_assignment(person_id, new_scp_id, new_facility_id, 
                                   role_on_assignment=None):
    """
    Transfer personnel to a new SCP assignment.
    Closes the current assignment and creates a new one as a transaction.
    """
    close_query = """
    UPDATE PERSONNEL_ASSIGNMENT
    SET end_date = CURDATE()
    WHERE person_id = %s AND end_date IS NULL;
    """
    insert_query = """
    INSERT INTO PERSONNEL_ASSIGNMENT (person_id, scp_id, facility_id, 
                                      role_on_assignment, start_date)
    VALUES (%s, %s, %s, %s, CURDATE());
    """
    queries = [
        (close_query, (person_id,)),
        (insert_query, (person_id, new_scp_id, new_facility_id, role_on_assignment))
    ]
    return execute_transaction(queries)

def create_personnel_with_role(callsign, given_name, surname, role, clearance_id, 
                                lab_affiliation=None, badge_number=None, certifications=None):
    """
    Create a new personnel record with their role specialization.
    Creates PERSONNEL entry and appropriate specialization (RESEARCHER, AGENT, or SECURITY_OFFICER).
    """
    # First insert personnel
    personnel_query = """
    INSERT INTO PERSONNEL (callsign, given_name, surname, role, hire_date, clearance_id)
    VALUES (%s, %s, %s, %s, CURDATE(), %s);
    """
    
    queries = [(personnel_query, (callsign, given_name, surname, role, clearance_id))]
    
    # Note: MySQL doesn't support RETURNING in transactions, so we'd need to query the last insert ID
    # For now, this will insert personnel and return success/failure
    # The calling code would need to get the person_id separately and then insert the specialization
    return execute_transaction(queries)

def decommission_scp(scp_id, reason=None):
    """
    Decommission an SCP by setting decommissioned date and closing all active assignments.
    """
    update_scp_query = """
    UPDATE SCP
    SET decommissioned = CURDATE()
    WHERE scp_id = %s;
    """
    close_assignments_query = """
    UPDATE SCP_ASSIGNMENT
    SET end_date = CURDATE(), reason = COALESCE(%s, reason)
    WHERE scp_id = %s AND end_date IS NULL;
    """
    close_personnel_query = """
    UPDATE PERSONNEL_ASSIGNMENT
    SET end_date = CURDATE()
    WHERE scp_id = %s AND end_date IS NULL;
    """
    queries = [
        (update_scp_query, (scp_id,)),
        (close_assignments_query, (reason, scp_id)),
        (close_personnel_query, (scp_id,))
    ]
    return execute_transaction(queries)

def log_incident_with_associations(facility_id, title, incident_date, summary, 
                                    severity_level, scp_ids=None, personnel_ids=None, 
                                    mtf_ids=None):
    """
    Create an incident and link it to SCPs, personnel, and MTF units.
    Note: This requires getting the incident_id after insertion, so it's a simplified version.
    In practice, you'd need to execute this in parts or use a stored procedure.
    """
    incident_query = """
    INSERT INTO INCIDENT (facility_id, title, incident_date, summary, severity_level)
    VALUES (%s, %s, %s, %s, %s);
    """
    # This would need to be called first, get the ID, then add associations
    return execute_update(incident_query, (facility_id, title, incident_date, summary, severity_level))
