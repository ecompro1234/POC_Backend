"""
    This module handles the database
"""

import psycopg2

DB_NAME = 'bookstore'
DB_USER = 'postgres'
DB_PASSWORD = '12345678'
DB_HOST = 'localhost'
DB_PORT = '5432'

conn_str = "dbname="+DB_NAME+" user="+DB_USER+" host="+DB_HOST+" password="+DB_PASSWORD


def db_connection():
    # Check to see if we need to create one
    conn = psycopg2.connect(conn_str)
    return conn
