-- Clears the databases
SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS SCP_SEMANTIC_CHUNKS;
DROP TABLE IF EXISTS INCIDENT_MTF;
DROP TABLE IF EXISTS INCIDENT_PERSONNEL;
DROP TABLE IF EXISTS INCIDENT_SCP;
DROP TABLE IF EXISTS PERSONNEL_ASSIGNMENT;
DROP TABLE IF EXISTS SCP_ASSIGNMENT;
DROP TABLE IF EXISTS INCIDENT;
DROP TABLE IF EXISTS SCP_VERSION;
DROP TABLE IF EXISTS CONTAINMENT_CHAMBER;
DROP TABLE IF EXISTS SECURITY_OFFICER;
DROP TABLE IF EXISTS AGENT;
DROP TABLE IF EXISTS RESEARCHER;
DROP TABLE IF EXISTS SCP;
DROP TABLE IF EXISTS PERSONNEL;
DROP TABLE IF EXISTS FACILITY;
DROP TABLE IF EXISTS MOBILE_TASK_FORCE;
DROP TABLE IF EXISTS SECURITY_CLEARANCE;
DROP TABLE IF EXISTS OBJECT_CLASS;
SET FOREIGN_KEY_CHECKS = 1;

-- Create the OBJECT_CLASS table first since SCP references it
CREATE TABLE IF NOT EXISTS OBJECT_CLASS (
    class_name VARCHAR(50) PRIMARY KEY,
    description TEXT NOT NULL,
    is_esoteric BOOLEAN NOT NULL DEFAULT FALSE
);

-- Create SECURITY_CLEARANCE lookup table
CREATE TABLE IF NOT EXISTS SECURITY_CLEARANCE (
    clearance_id INT AUTO_INCREMENT PRIMARY KEY,
    level_name VARCHAR(50) UNIQUE NOT NULL,
    privileges TEXT
);

-- Create MOBILE_TASK_FORCE lookup table
CREATE TABLE IF NOT EXISTS MOBILE_TASK_FORCE (
    mtf_id INT AUTO_INCREMENT PRIMARY KEY,
    designation VARCHAR(50) UNIQUE NOT NULL,
    nickname VARCHAR(100),
    primary_role TEXT,
    notes TEXT
);

-- Create FACILITY core entity table
CREATE TABLE IF NOT EXISTS FACILITY (
    facility_id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    code VARCHAR(50),
    street VARCHAR(200),
    city VARCHAR(100),
    state_province VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    coords VARCHAR(100),
    purpose TEXT
);

-- Create PERSONNEL core entity table
CREATE TABLE IF NOT EXISTS PERSONNEL (
    person_id INT AUTO_INCREMENT PRIMARY KEY,
    callsign VARCHAR(50),
    given_name VARCHAR(100),
    surname VARCHAR(100),
    role VARCHAR(50),
    hire_date DATE,
    notes TEXT,
    clearance_id INT,
    FOREIGN KEY (clearance_id) REFERENCES SECURITY_CLEARANCE (clearance_id)
);

-- Create SCP core entity table
CREATE TABLE IF NOT EXISTS SCP (
    scp_id INT AUTO_INCREMENT PRIMARY KEY,
    scp_code VARCHAR(20) UNIQUE NOT NULL,
    title VARCHAR(500),
    short_description TEXT,
    containment_procedures LONGTEXT,
    full_description LONGTEXT,
    first_published DATE,
    decommissioned DATE,
    tags_list LONGTEXT,
    object_class VARCHAR(50),
    FOREIGN KEY (object_class) REFERENCES OBJECT_CLASS (class_name)
);

-- Create RESEARCHER specialization table
CREATE TABLE IF NOT EXISTS RESEARCHER (
    person_id INT PRIMARY KEY,
    lab_affiliation VARCHAR(200),
    FOREIGN KEY (person_id) REFERENCES PERSONNEL (person_id) ON DELETE CASCADE
);

-- Create AGENT specialization table
CREATE TABLE IF NOT EXISTS AGENT (
    person_id INT PRIMARY KEY,
    badge_number VARCHAR(50) UNIQUE,
    FOREIGN KEY (person_id) REFERENCES PERSONNEL (person_id) ON DELETE CASCADE
);

-- Create SECURITY_OFFICER specialization table
CREATE TABLE IF NOT EXISTS SECURITY_OFFICER (
    person_id INT PRIMARY KEY,
    certifications TEXT,
    FOREIGN KEY (person_id) REFERENCES PERSONNEL (person_id) ON DELETE CASCADE
);

-- Create CONTAINMENT_CHAMBER weak entity table
CREATE TABLE IF NOT EXISTS CONTAINMENT_CHAMBER (
    facility_id INT,
    chamber_no VARCHAR(20),
    chamber_type VARCHAR(100),
    capacity INT,
    special_equipment TEXT,
    chamber_notes TEXT,
    PRIMARY KEY (facility_id, chamber_no),
    FOREIGN KEY (facility_id) REFERENCES FACILITY (facility_id) ON DELETE CASCADE
);

-- Create SCP_VERSION weak entity table
CREATE TABLE IF NOT EXISTS SCP_VERSION (
    version_id INT AUTO_INCREMENT PRIMARY KEY,
    scp_id INT NOT NULL,
    version_date DATE,
    change_summary TEXT,
    content TEXT,
    FOREIGN KEY (scp_id) REFERENCES SCP (scp_id) ON DELETE CASCADE
);

-- Create INCIDENT associative entity table
CREATE TABLE IF NOT EXISTS INCIDENT (
    incident_id INT AUTO_INCREMENT PRIMARY KEY,
    facility_id INT,
    title VARCHAR(500),
    incident_date DATE,
    summary TEXT,
    severity_level INT,
    FOREIGN KEY (facility_id) REFERENCES FACILITY (facility_id)
);

-- Create SCP_ASSIGNMENT associative entity table
CREATE TABLE IF NOT EXISTS SCP_ASSIGNMENT (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    scp_id INT NOT NULL,
    facility_id INT NOT NULL,
    chamber_no VARCHAR(20),
    start_date DATE,
    end_date DATE,
    reason TEXT,
    FOREIGN KEY (scp_id) REFERENCES SCP (scp_id),
    FOREIGN KEY (facility_id) REFERENCES FACILITY (facility_id)
);

-- Create PERSONNEL_ASSIGNMENT associative entity table
CREATE TABLE IF NOT EXISTS PERSONNEL_ASSIGNMENT (
    assignment_id INT AUTO_INCREMENT PRIMARY KEY,
    person_id INT NOT NULL,
    scp_id INT NOT NULL,
    facility_id INT NOT NULL,
    role_on_assignment VARCHAR(100),
    start_date DATE,
    end_date DATE,
    FOREIGN KEY (person_id) REFERENCES PERSONNEL (person_id),
    FOREIGN KEY (scp_id) REFERENCES SCP (scp_id),
    FOREIGN KEY (facility_id) REFERENCES FACILITY (facility_id)
);

-- Create INCIDENT_SCP associative entity table
CREATE TABLE IF NOT EXISTS INCIDENT_SCP (
    incident_id INT,
    scp_id INT,
    PRIMARY KEY (incident_id, scp_id),
    FOREIGN KEY (incident_id) REFERENCES INCIDENT (incident_id),
    FOREIGN KEY (scp_id) REFERENCES SCP (scp_id)
);

-- Create INCIDENT_PERSONNEL associative entity table
CREATE TABLE IF NOT EXISTS INCIDENT_PERSONNEL (
    incident_id INT,
    person_id INT,
    duty VARCHAR(200),
    PRIMARY KEY (incident_id, person_id),
    FOREIGN KEY (incident_id) REFERENCES INCIDENT (incident_id),
    FOREIGN KEY (person_id) REFERENCES PERSONNEL (person_id)
);

-- Create INCIDENT_MTF associative entity table
CREATE TABLE IF NOT EXISTS INCIDENT_MTF (
    incident_id INT,
    mtf_id INT,
    PRIMARY KEY (incident_id, mtf_id),
    FOREIGN KEY (incident_id) REFERENCES INCIDENT (incident_id),
    FOREIGN KEY (mtf_id) REFERENCES MOBILE_TASK_FORCE (mtf_id)
);