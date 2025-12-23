import psycopg2
from psycopg2.extras import RealDictCursor
import os
from dotenv import load_dotenv

load_dotenv()


def get_db_connection():
    """
    Create and return a database connection to Supabase PostgreSQL.
    Uses environment variables for connection details.
    """
    db_url = os.getenv("DATABASE_URL")
    
    if not db_url:
        # Construct from individual components if DATABASE_URL is not set
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME")
        db_user = os.getenv("DB_USER")
        db_password = os.getenv("DB_PASSWORD")
        
        if not all([db_name, db_user, db_password]):
            raise ValueError(
                "Database configuration missing. Please set DATABASE_URL or "
                "DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD"
            )
        
        db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    try:
        conn = psycopg2.connect(db_url)
        return conn
    except Exception as e:
        raise ConnectionError(f"Failed to connect to database: {str(e)}")
