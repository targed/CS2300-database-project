import mysql.connector
from mysql.connector import Error
from contextlib import contextmanager

# Database configuration
DB_CONFIG = {
    'host': 'mysql-db',
    'port': 3306,
    'user': 'scp_user',
    'password': 'scp_password',
    'database': 'scp_db'
}

def get_connection():
    """Create and return a database connection."""
    try:
        connection = mysql.connector.connect(**DB_CONFIG)
        if connection.is_connected():
            return connection
    except Error as e:
        print(f"Error connecting to MySQL: {e}")
        return None

@contextmanager
def get_cursor(dictionary=True):
    """Context manager for database cursor."""
    connection = get_connection()
    if connection is None:
        raise Exception("Failed to connect to database")
    
    try:
        cursor = connection.cursor(dictionary=dictionary)
        yield cursor, connection
        connection.commit()
    except Error as e:
        connection.rollback()
        raise e
    finally:
        cursor.close()
        connection.close()

def execute_query(query, params=None, fetch_one=False):
    """
    Execute a SELECT query and return results.
    
    Args:
        query: SQL query string
        params: Query parameters tuple
        fetch_one: If True, return single result; if False, return all results
    
    Returns:
        Dictionary or list of dictionaries with query results
    """
    try:
        with get_cursor() as (cursor, connection):
            cursor.execute(query, params or ())
            if fetch_one:
                return cursor.fetchone()
            return cursor.fetchall()
    except Error as e:
        print(f"Error executing query: {e}")
        return None

def execute_update(query, params=None):
    """
    Execute an INSERT, UPDATE, or DELETE query.
    
    Args:
        query: SQL query string
        params: Query parameters tuple
    
    Returns:
        Number of affected rows, or lastrowid for INSERT queries
    """
    try:
        with get_cursor() as (cursor, connection):
            cursor.execute(query, params or ())
            return cursor.lastrowid if cursor.lastrowid else cursor.rowcount
    except Error as e:
        print(f"Error executing update: {e}")
        return None

def execute_transaction(queries_with_params):
    """
    Execute multiple queries as a transaction.
    
    Args:
        queries_with_params: List of tuples [(query, params), ...]
    
    Returns:
        True if successful, False otherwise
    """
    connection = get_connection()
    if connection is None:
        return False
    
    try:
        cursor = connection.cursor()
        for query, params in queries_with_params:
            cursor.execute(query, params or ())
        connection.commit()
        cursor.close()
        connection.close()
        return True
    except Error as e:
        print(f"Transaction failed: {e}")
        connection.rollback()
        cursor.close()
        connection.close()
        return False
