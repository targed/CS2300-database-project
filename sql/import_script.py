import mysql.connector
from mysql.connector import Error
import json
import os

DB_CONFIG = {
    'host': 'mysql-db',
    'database': 'scp_db',
    'user': 'scp_user',
    'password': 'scp_password'
}

TABLE_MAPPINGS = {
    'SECURITY_CLEARANCE': {
        'file': '../data/securityClearance.json',
        'sql': """
            INSERT INTO SECURITY_CLEARANCE 
            (clearance_id, level_name, privileges)
            VALUES (%s, %s, %s)
        """,
        'json_keys': ['clearance_id', 'level_name', 'privileges']
    },
    'OBJECT_CLASS': {
        'file': '../data/objectClass.json',
        'sql': """
            INSERT INTO OBJECT_CLASS 
            (class_name, description, is_esoteric)
            VALUES (%s, %s, %s)
        """,
        'json_keys': ['class_name', 'description', 'is_esoteric']
    },
    'FACILITY': {
        'file': '../data/sites.json',
        'sql': """
            INSERT INTO FACILITY 
            (name, code, street, city, state_province, country, postal_code, coords, purpose)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
        """,
        'json_keys': ['name', 'code', 'street', 'city', 'state_province', 'country', 'postal_code', 'coords', 'purpose']
    },
    'MOBILE_TASK_FORCE': {
        'file': '../data/mtf.json',
        'sql': """
            INSERT INTO MOBILE_TASK_FORCE 
            (designation, nickname, primary_role, notes)
            VALUES (%s, %s, %s, %s)
        """,
        'json_keys': ['designation', 'nickname', 'primary_role', 'notes']
    },
    'PERSONNEL': {
        'file': '../data/personnel.json',
        'sql': """
            INSERT INTO PERSONNEL 
            (callsign, given_name, surname, role, hire_date, notes, clearance_id)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        'json_keys': [
            'callsign', 
            'given_name', 
            'surname', 
            'role', 
            'hire_date', 
            'notes', 
            'clearance_id'
            ]
    },
    'SCP': {
        'file': '../data/scpjsonmoreatrributes.json',
        'sql': """
            INSERT INTO SCP 
            (scp_code, title, short_description, containment_procedures, full_description, tags_list, object_class)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
        """,
        'json_keys': [
            'code', 
            'title', 
            'short_description', 
            'containment_procedures', 
            'full_description', 
            'tags', 
            'object_class'
        ]
    },
    'INCIDENT': {
        'file': '../data/incident.json',
        'sql': """
            INSERT INTO INCIDENT 
            (incident_id, title, incident_date, summary, severity_level)
            VALUES (%s, %s, %s, %s, %s)
        """,
        'json_keys': [
            'incident_id', 
            'title', 
            'incident_date', 
            'summary', 
            'severity_level'
        ]
    },
    'CONTAINMENT_CHAMBER': {
        'file': '../data/containment_chamber.json',
        'sql': """
            INSERT INTO CONTAINMENT_CHAMBER 
            (facility_id, chamber_no, chamber_type, capacity, special_equipment, chamber_notes)
            VALUES (%s, %s, %s, %s, %s, %s)
        """,
        'json_keys': [
            'facility_id',
            'chamber_no',
            'chamber_type',
            'capacity',
            'special_equipment',
            'chamber_notes'
        ]
    },
    'AGENT': {
        'file': '../data/agent.json',
        'sql': """
            INSERT INTO AGENT 
            (person_id, badge_number)
            VALUES (%s, %s)
        """,
        'json_keys': [
            'person_id', 
            'badge_number'
        ]
    },
    'SECURITY_OFFICER': {
        'file': '../data/security_officer.json',
        'sql': """
            INSERT INTO SECURITY_OFFICER
            (person_id, certifications)
            VALUES (%s, %s)
        """,
        'json_keys': [
            'person_id', 
            'certifications'
        ]
    },
    'SCP_VERSION': {
        'file': '../data/scp_version.json',
        'sql': """
            INSERT INTO SCP_VERSION
            (scp_id, version_date, change_summary, content)
            VALUES (%s, %s, %s, %s)
        """,
        'json_keys': [
            'scp_id',
            'version_date',
            'change_summary',
            'content'
        ]
    },
    'SCP_ASSIGNMENT': {
        'file': '../data/scp_assignment.json',
        'sql': """
            INSERT INTO SCP_ASSIGNMENT
            (scp_id, facility_id, chamber_no, start_date, end_date, reason)
            VALUES (%s, %s, %s, %s, %s, %s)
        """,
        'json_keys': [
            'scp_id',
            'facility_id',
            'chamber_no',
            'start_date',
            'end_date',
            'reason'
        ]
    },
    # To add suff later, just add a new entry here:
}

def import_data_from_json(cursor, table_name, config):
    filename = config['file']
    
    if not os.path.exists(filename):
        print(f"Skipping {table_name}: File '{filename}' not found.")
        return

    try:
        with open(filename, 'r', encoding='utf-8') as f:
            data_list = json.load(f)

        if not data_list:
            print(f"Skipping {table_name}: JSON file is empty.")
            return

        values_to_insert = []
        
        # Extract values dynamically based on the 'json_keys' list in the config
        for entry in data_list:
            row = tuple(entry.get(k, None) for k in config['json_keys'])
            values_to_insert.append(row)

        # Execute Batch Insert
        cursor.executemany(config['sql'], values_to_insert)
        print(f"Success: Inserted {cursor.rowcount} rows into {table_name}.")

    except json.JSONDecodeError:
        print(f"Error: '{filename}' is not valid JSON.")
    except Error as e:
        print(f"MySQL Error on {table_name}: {e}")

def main():
    conn = None
    try:
        conn = mysql.connector.connect(**DB_CONFIG)
        if conn.is_connected():
            cursor = conn.cursor()
            print("Connected to MySQL Database.\n")
            print("-" * 30)

            # Loop through the configuration and import files
            for table_name, config in TABLE_MAPPINGS.items():
                import_data_from_json(cursor, table_name, config)
                conn.commit() # Commit after every table to save progress

    except Error as e:
        print(f"Critical Connection Error: {e}")

    finally:
        if conn and conn.is_connected():
            cursor.close()
            conn.close()
            print("\nDatabase connection closed.")

if __name__ == "__main__":
    main()