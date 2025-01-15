"""


"""

import sqlite3
import os

def get_db_connection(campus):
    base_dir = os.path.abspath(os.path.dirname(__file__))
    
    if campus == 'main':
        db_name = 'main_courses.db'
    elif campus == 'north_lebanon':
        db_name = 'north_courses.db'
    elif campus == 'shouf':
        db_name = 'shouf_courses.db'
    else:
        db_name = 'main_courses.db'

    db_path = os.path.join(base_dir, '..', '..', 'db', db_name)
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    return conn
