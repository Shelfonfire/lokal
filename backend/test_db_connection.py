"""
Test script to verify database connection to Supabase PostgreSQL.
Run this script to check if the database connection is working correctly.

Usage:
    python test_db_connection.py
"""

import os
import sys
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

def test_database_connection():
    """Test the database connection and print detailed results."""
    
    print("=" * 60)
    print("DATABASE CONNECTION TEST")
    print("=" * 60)
    print()
    
    # Step 1: Check environment variables
    print("Step 1: Checking environment variables...")
    db_url = os.getenv("DATABASE_URL")
    
    if db_url:
        print("  ✓ DATABASE_URL found")
        # Parse and display connection details (masked)
        try:
            # Parse the URL to extract components
            from urllib.parse import urlparse
            parsed = urlparse(db_url)
            print(f"  Host: {parsed.hostname}")
            print(f"  Port: {parsed.port or '5432 (default)'}")
            print(f"  Database: {parsed.path.lstrip('/')}")
            print(f"  User: {parsed.username}")
            print(f"  Password: {'*' * len(parsed.password) if parsed.password else 'NOT SET'}")
        except Exception as e:
            print(f"  Could not parse URL: {e}")
            # Mask password in output
            masked_url = db_url.split('@')[0].split(':')
            if len(masked_url) >= 3:
                masked_url[2] = '***'
            print(f"  Connection string: {'@'.join(masked_url)}@...")
    else:
        print("  ✗ DATABASE_URL not found, checking individual variables...")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "5432")
        db_name = os.getenv("DB_NAME")
        db_user = os.getenv("DB_USER")
        db_password = os.getenv("DB_PASSWORD")
        
        if not all([db_name, db_user, db_password]):
            print("  ✗ Missing required database configuration!")
            print("     Required: DB_NAME, DB_USER, DB_PASSWORD")
            print("     Optional: DB_HOST (default: localhost), DB_PORT (default: 5432)")
            return False
        
        print(f"  ✓ DB_HOST: {db_host}")
        print(f"  ✓ DB_PORT: {db_port}")
        print(f"  ✓ DB_NAME: {db_name}")
        print(f"  ✓ DB_USER: {db_user}")
        print(f"  ✓ DB_PASSWORD: {'*' * len(db_password) if db_password else 'NOT SET'}")
    
    print()
    
    # Step 2: Test DNS resolution and network connectivity
    print("Step 2: Testing network connectivity...")
    try:
        import socket
        from urllib.parse import urlparse
        
        if db_url:
            parsed = urlparse(db_url)
            hostname = parsed.hostname
            port = parsed.port or 5432
            
            print(f"  Testing DNS resolution for: {hostname}")
            try:
                ip_address = socket.gethostbyname(hostname)
                print(f"  ✓ DNS resolution successful: {hostname} -> {ip_address}")
            except socket.gaierror as e:
                print(f"  ✗ DNS resolution failed: {e}")
                print(f"     This usually means:")
                print(f"     - No internet connection")
                print(f"     - DNS server issues")
                print(f"     - Hostname is incorrect")
                print(f"     - VPN/firewall blocking DNS")
                return False
            
            print(f"  Testing port connectivity: {hostname}:{port}")
            try:
                sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
                sock.settimeout(5)
                result = sock.connect_ex((hostname, port))
                sock.close()
                if result == 0:
                    print(f"  ✓ Port {port} is reachable")
                else:
                    print(f"  ✗ Port {port} is not reachable (connection refused)")
                    print(f"     Try port 6543 for Supabase transaction pooler")
                    return False
            except Exception as e:
                print(f"  ⚠ Could not test port connectivity: {e}")
        print()
        
    except ImportError:
        print("  ⚠ socket module not available for network tests")
        print()
    
    # Step 3: Test database connection
    print("Step 3: Testing database connection...")
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        
        print("  ✓ psycopg2 imported successfully")
        
        # Create connection
        if db_url:
            print("  Attempting connection using DATABASE_URL...")
            # Increase connection timeout
            conn = psycopg2.connect(db_url, connect_timeout=10)
        else:
            print(f"  Attempting connection to {db_host}:{db_port}/{db_name}...")
            conn = psycopg2.connect(
                host=db_host,
                port=db_port,
                database=db_name,
                user=db_user,
                password=db_password
            )
        
        print("  ✓ Connection established successfully!")
        print()
        
        # Step 4: Test query
        print("Step 4: Testing database query...")
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            # Test basic query
            cur.execute("SELECT version();")
            version = cur.fetchone()
            print(f"  ✓ PostgreSQL version: {version['version']}")
            
            # Test PostGIS extension
            print()
            print("  Checking PostGIS extension...")
            cur.execute("SELECT PostGIS_version();")
            postgis_version = cur.fetchone()
            print(f"  ✓ PostGIS version: {postgis_version['postgis_version']}")
            
            # Test businesses table
            print()
            print("  Checking businesses table...")
            cur.execute("""
                SELECT 
                    table_name,
                    column_name,
                    data_type
                FROM information_schema.columns
                WHERE table_name = 'businesses'
                ORDER BY ordinal_position;
            """)
            columns = cur.fetchall()
            
            if columns:
                print(f"  ✓ Found businesses table with {len(columns)} columns:")
                for col in columns:
                    print(f"     - {col['column_name']}: {col['data_type']}")
            else:
                print("  ⚠ businesses table not found or has no columns")
            
            # Test data retrieval
            print()
            print("  Testing data retrieval...")
            cur.execute("""
                SELECT 
                    COUNT(*) as total_businesses,
                    COUNT(CASE WHEN location IS NOT NULL THEN 1 END) as businesses_with_location,
                    COUNT(CASE WHEN details IS NOT NULL THEN 1 END) as businesses_with_details
                FROM businesses;
            """)
            stats = cur.fetchone()
            
            if stats:
                print(f"  ✓ Total businesses: {stats['total_businesses']}")
                print(f"  ✓ Businesses with location: {stats['businesses_with_location']}")
                print(f"  ✓ Businesses with details: {stats['businesses_with_details']}")
            
            # Test PostGIS location extraction
            print()
            print("  Testing PostGIS location extraction...")
            cur.execute("""
                SELECT 
                    name,
                    ST_Y(location::geometry) as latitude,
                    ST_X(location::geometry) as longitude,
                    details->>'description' as description
                FROM businesses
                LIMIT 3;
            """)
            sample_businesses = cur.fetchall()
            
            if sample_businesses:
                print(f"  ✓ Successfully extracted location data from {len(sample_businesses)} businesses:")
                for biz in sample_businesses:
                    print(f"     - {biz['name']}: ({biz['latitude']:.4f}, {biz['longitude']:.4f})")
            else:
                print("  ⚠ No businesses found in database")
        
        # Close connection
        conn.close()
        print()
        print("=" * 60)
        print("✓ ALL TESTS PASSED - Database connection is working!")
        print("=" * 60)
        return True
        
    except ImportError:
        print("  ✗ psycopg2 not installed!")
        print("     Install it with: pip install psycopg2-binary")
        return False
    except psycopg2.OperationalError as e:
        error_msg = str(e)
        print(f"  ✗ Connection failed: {error_msg}")
        print()
        print("  Troubleshooting steps:")
        
        if "could not translate host name" in error_msg.lower() or "no such host" in error_msg.lower():
            print("    1. Check your internet connection")
            print("    2. Verify the hostname in your .env file is correct")
            print("    3. Try pinging the hostname: ping db.cjdlykgtwokalqdccykr.supabase.co")
            print("    4. Check if you're behind a VPN or firewall")
            print("    5. Try using Supabase's transaction pooler port 6543")
        elif "timeout" in error_msg.lower() or "connection timed out" in error_msg.lower():
            print("    1. Check firewall settings")
            print("    2. Verify Supabase allows connections from your IP")
            print("    3. Try port 6543 (transaction pooler) instead of 5432")
            print("    4. Check Supabase dashboard for connection issues")
        elif "password authentication failed" in error_msg.lower():
            print("    1. Verify your password in .env file")
            print("    2. Check if password has special characters that need encoding")
        elif "database" in error_msg.lower() and "does not exist" in error_msg.lower():
            print("    1. Verify database name in .env file")
            print("    2. Check Supabase dashboard for correct database name")
        else:
            print("    1. Check your .env file has correct credentials")
            print("    2. Verify Supabase database is accessible")
            print("    3. Check firewall/network settings")
            print("    4. For Supabase, try port 6543 (transaction pooler) instead of 5432")
        
        return False
    except Exception as e:
        print(f"  ✗ Unexpected error: {str(e)}")
        print(f"     Error type: {type(e).__name__}")
        return False

if __name__ == "__main__":
    success = test_database_connection()
    sys.exit(0 if success else 1)
