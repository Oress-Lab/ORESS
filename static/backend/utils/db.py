
"""


"""


import sqlite3
import os

def get_db_connection(campus, semester, year):
    base_dir = os.path.abspath(os.path.dirname(__file__))

    # Construct the database name using the campus, semester, and year
    if campus == 'main':
        db_name = f"main_{semester}_{year}.db"
    elif campus == 'north_lebanon':
        db_name = f"north_{semester}_{year}.db"
    elif campus == 'shouf':
        db_name = f"shouf_{semester}_{year}.db"
    else:
        db_name = f"main_{semester}_{year}.db"

    # Construct the full path to the database file
    db_path = os.path.join(base_dir, '..', '..', 'db', db_name)
    
    # Connect to the database
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn