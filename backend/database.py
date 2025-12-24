import psycopg2
from psycopg2.extras import RealDictCursor
import os
from urllib.parse import urlparse, urlunparse
from dotenv import load_dotenv

load_dotenv()


def get_db_connection(use_pooler=True):
    """
    Create and return a database connection to Supabase PostgreSQL.
    Uses connection pooling (port 6543) by default to avoid IPv6 issues.
    
    Args:
        use_pooler (bool): If True, use Supabase transaction pooler (port 6543).
                          If False, use direct connection (port 5432).
    
    Environment variables:
        - DATABASE_POOLER_URL: Direct connection pooler URL (takes precedence)
        - DATABASE_URL: Standard database URL (will be converted to pooler if use_pooler=True)
        - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD: Individual components
    """
    # Check for explicit pooler URL first
    pooler_url = os.getenv("DATABASE_POOLER_URL")
    if pooler_url and use_pooler:
        db_url = pooler_url
    else:
        db_url = os.getenv("DATABASE_URL")
        
        # Convert to pooler if needed
        if db_url and use_pooler:
            db_url = _convert_to_pooler_url(db_url)
        
        if not db_url:
            # Construct from individual components if DATABASE_URL is not set
            db_host = os.getenv("DB_HOST", "localhost")
            db_port = os.getenv("DB_PORT", "6543" if use_pooler else "5432")
            db_name = os.getenv("DB_NAME")
            db_user = os.getenv("DB_USER")
            db_password = os.getenv("DB_PASSWORD")
            
            if not all([db_name, db_user, db_password]):
                raise ValueError(
                    "Database configuration missing. Please set DATABASE_URL, "
                    "DATABASE_POOLER_URL, or DB_HOST, DB_PORT, DB_NAME, DB_USER, and DB_PASSWORD"
                )
            
            db_url = f"postgresql://{db_user}:{db_password}@{db_host}:{db_port}/{db_name}"
    
    # Note: For Supabase connection pooler, we just use port 6543
    # No need to add pgbouncer=true parameter - psycopg2 doesn't recognize it
    # The pooler works transparently when connecting to port 6543
    
    try:
        conn = psycopg2.connect(db_url, connect_timeout=10)
        return conn
    except Exception as e:
        raise ConnectionError(f"Failed to connect to database: {str(e)}")


def _convert_to_pooler_url(db_url):
    """
    Convert a standard Supabase DATABASE_URL to use the transaction pooler (port 6543).
    This helps avoid IPv6 connection issues.
    """
    try:
        parsed = urlparse(db_url)
        
        # Check if it's already using pooler port
        if parsed.port == 6543:
            return db_url
        
        # Check if it's a Supabase URL (contains .supabase.co)
        if parsed.hostname and '.supabase.co' in parsed.hostname:
            # Replace port 5432 with 6543 for transaction pooler
            if parsed.port == 5432 or parsed.port is None:
                # Reconstruct URL with port 6543
                new_netloc = f"{parsed.username}:{parsed.password}@{parsed.hostname}:6543"
                return urlunparse((
                    parsed.scheme,
                    new_netloc,
                    parsed.path,
                    parsed.params,
                    parsed.query,
                    parsed.fragment
                ))
        
        # Not a Supabase URL or already configured, return as-is
        return db_url
    except Exception:
        # If parsing fails, return original URL
        return db_url
