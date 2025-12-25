import psycopg2
from psycopg2.extras import RealDictCursor
import os
import logging
import socket
from urllib.parse import urlparse, urlunparse, urlencode, parse_qs
from dotenv import load_dotenv

load_dotenv()

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


def get_db_connection(use_pooler=True):
    """
    Create and return a database connection to Supabase PostgreSQL.
    Uses connection pooling (port 6543) by default to avoid IPv6 issues.
    
    Args:
        use_pooler (bool): If True, use Supabase transaction pooler (port 6543).
                          If False, use direct connection (port 5432).
    
    Environment variables:
        - DATABASE_POOLER_URL: Direct connection pooler URL (takes precedence, used as-is)
        - DATABASE_URL: Standard database URL (will be converted to pooler if use_pooler=True)
        - DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD: Individual components
    
    Recommended format for Railway:
    postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?sslmode=disable
    """
    # Check for explicit pooler URL first - use it exactly as provided
    pooler_url = os.getenv("DATABASE_POOLER_URL")
    if pooler_url and use_pooler:
        db_url = pooler_url
        logger.info("Using DATABASE_POOLER_URL from environment")
    else:
        db_url = os.getenv("DATABASE_URL")
        
        # Convert to pooler if needed (only for old .supabase.co URLs)
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
    
    # Parse URL for logging and debugging
    try:
        parsed = urlparse(db_url)
        hostname = parsed.hostname
        port = parsed.port or (6543 if use_pooler else 5432)
        
        logger.info(f"Attempting connection to host: {hostname} on port {port}")
        
        # Log DNS resolution for debugging
        try:
            ip_address = socket.gethostbyname(hostname)
            logger.info(f"Resolved {hostname} to IPv4: {ip_address}")
        except socket.gaierror as e:
            logger.warning(f"Could not resolve {hostname} to IPv4: {e}")
            # Try IPv6 for informational purposes
            try:
                addr_info = socket.getaddrinfo(hostname, port, socket.AF_INET6)
                if addr_info:
                    ipv6 = addr_info[0][4][0]
                    logger.warning(f"Hostname resolves to IPv6: {ipv6} (may cause connection issues)")
            except Exception:
                pass
        
        # Ensure SSL mode is set (default to disable for pooler, require for direct)
        query_params = parse_qs(parsed.query)
        if 'sslmode' not in query_params:
            # Add sslmode=disable for pooler, require for direct connection
            sslmode = 'disable' if use_pooler else 'require'
            query_params['sslmode'] = [sslmode]
            logger.info(f"Adding sslmode={sslmode} to connection string")
            
            # Reconstruct URL with sslmode
            new_query = urlencode(query_params, doseq=True)
            db_url = urlunparse((
                parsed.scheme,
                parsed.netloc,
                parsed.path,
                parsed.params,
                new_query,
                parsed.fragment
            ))
        
        # Use the connection pooler URL directly
        conn = psycopg2.connect(db_url, connect_timeout=10)
        logger.info("Database connection established successfully")
        return conn
        
    except psycopg2.Error as e:
        logger.error(f"PostgreSQL connection error: {str(e)}")
        raise ConnectionError(f"Failed to connect to database at {hostname}: {str(e)}")
    except Exception as e:
        logger.error(f"Database connection error: {str(e)}")
        raise ConnectionError(f"Failed to connect to database: {str(e)}")


def _convert_to_pooler_url(db_url):
    """
    Convert a standard Supabase DATABASE_URL to use the transaction pooler (port 6543).
    Only converts old .supabase.co URLs - does NOT modify .pooler.supabase.com URLs.
    This helps avoid IPv6 connection issues.
    """
    try:
        parsed = urlparse(db_url)
        
        # Check if it's already using pooler port
        if parsed.port == 6543:
            return db_url
        
        # Don't modify .pooler.supabase.com URLs - they're already pooler URLs
        if parsed.hostname and '.pooler.supabase.com' in parsed.hostname:
            logger.info("URL already uses pooler hostname (.pooler.supabase.com), using as-is")
            return db_url
        
        # Only convert old .supabase.co URLs to use pooler port
        if parsed.hostname and '.supabase.co' in parsed.hostname:
            # Replace port 5432 with 6543 for transaction pooler
            if parsed.port == 5432 or parsed.port is None:
                logger.info(f"Converting .supabase.co URL from port {parsed.port or 5432} to pooler port 6543")
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
    except Exception as e:
        logger.warning(f"Error parsing URL for pooler conversion: {e}, using original URL")
        # If parsing fails, return original URL
        return db_url
