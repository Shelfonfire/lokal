"""
Test script to verify Supabase connection pooling (transaction pooler).
This uses port 6543 instead of 5432 to avoid IPv6 connection issues.

Usage:
    python test_pooler_connection.py
"""

import os
import sys
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables from .env file
load_dotenv()

def test_pooler_connection():
    """Test the connection pooler and compare with direct connection."""
    
    print("=" * 70)
    print("SUPABASE CONNECTION POOLER TEST")
    print("=" * 70)
    print()
    
    # Step 1: Check environment variables
    print("Step 1: Checking environment variables...")
    db_url = os.getenv("DATABASE_URL")
    pooler_url = os.getenv("DATABASE_POOLER_URL")
    
    if pooler_url:
        print("  [OK] DATABASE_POOLER_URL found")
        parsed = urlparse(pooler_url)
        print(f"    Host: {parsed.hostname}")
        print(f"    Port: {parsed.port or '6543 (default)'}")
        print(f"    Database: {parsed.path.lstrip('/')}")
        print(f"    User: {parsed.username}")
    elif db_url:
        print("  [OK] DATABASE_URL found")
        parsed = urlparse(db_url)
        print(f"    Host: {parsed.hostname}")
        print(f"    Port: {parsed.port or '5432 (default)'}")
        print(f"    Database: {parsed.path.lstrip('/')}")
        print(f"    User: {parsed.username}")
        
        # Check if it's a Supabase URL
        if parsed.hostname and '.supabase.co' in parsed.hostname:
            print()
            print("  [INFO] Supabase URL detected - will convert to pooler (port 6543)")
    else:
        print("  [ERROR] No DATABASE_URL or DATABASE_POOLER_URL found")
        print("    Checking individual variables...")
        db_host = os.getenv("DB_HOST", "localhost")
        db_port = os.getenv("DB_PORT", "6543")
        db_name = os.getenv("DB_NAME")
        db_user = os.getenv("DB_USER")
        
        if not all([db_name, db_user]):
            print("  [ERROR] Missing required database configuration!")
            return False
        
        print(f"    Host: {db_host}")
        print(f"    Port: {db_port}")
        print(f"    Database: {db_name}")
        print(f"    User: {db_user}")
    
    print()
    
    # Step 2: Test connection pooler
    print("Step 2: Testing connection pooler (port 6543)...")
    print("-" * 70)
    
    try:
        import psycopg2
        from psycopg2.extras import RealDictCursor
        from database import get_db_connection
        
        print("  Attempting connection using pooler...")
        
        # Test pooler connection
        conn_pooler = get_db_connection(use_pooler=True)
        print("  [OK] Connection pooler established successfully!")
        print()
        
        # Test query through pooler
        print("  Testing query through pooler...")
        with conn_pooler.cursor(cursor_factory=RealDictCursor) as cur:
            cur.execute("SELECT version();")
            version = cur.fetchone()
            print(f"  [OK] PostgreSQL version: {version['version']}")
            
            # Check PostGIS
            print()
            print("  Checking PostGIS extension...")
            cur.execute("SELECT PostGIS_version();")
            postgis_version = cur.fetchone()
            print(f"  [OK] PostGIS version: {postgis_version['postgis_version']}")
            
            # Test businesses table
            print()
            print("  Testing businesses table query...")
            cur.execute("""
                SELECT 
                    COUNT(*) as total_businesses,
                    COUNT(CASE WHEN location IS NOT NULL THEN 1 END) as businesses_with_location
                FROM businesses;
            """)
            stats = cur.fetchone()
            
            if stats:
                print(f"  [OK] Total businesses: {stats['total_businesses']}")
                print(f"  [OK] Businesses with location: {stats['businesses_with_location']}")
            
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
                print(f"  [OK] Successfully extracted location data from {len(sample_businesses)} businesses:")
                for biz in sample_businesses:
                    print(f"     - {biz['name']}: ({biz['latitude']:.4f}, {biz['longitude']:.4f})")
        
        conn_pooler.close()
        print()
        print("=" * 70)
        print("[SUCCESS] CONNECTION POOLER TEST PASSED!")
        print("=" * 70)
        print()
        print("Benefits of using connection pooler:")
        print("  - Avoids IPv6 connection issues")
        print("  - Better for serverless environments (Railway, Vercel)")
        print("  - Improved connection management")
        print("  - Reduced connection overhead")
        return True
        
    except ImportError:
        print("  [ERROR] psycopg2 not installed!")
        print("     Install it with: pip install psycopg2-binary")
        return False
    except psycopg2.OperationalError as e:
        error_msg = str(e)
        print(f"  [ERROR] Connection pooler failed: {error_msg}")
        print()
        print("  Troubleshooting steps:")
        
        if "could not translate host name" in error_msg.lower():
            print("    1. Check your internet connection")
            print("    2. Verify the hostname in your .env file is correct")
            print("    3. Check if you're behind a VPN or firewall")
        elif "timeout" in error_msg.lower() or "connection timed out" in error_msg.lower():
            print("    1. Check firewall settings")
            print("    2. Verify Supabase allows connections from your IP")
            print("    3. Ensure port 6543 is not blocked")
            print("    4. Check Supabase dashboard for connection pooler status")
        elif "password authentication failed" in error_msg.lower():
            print("    1. Verify your password in .env file")
            print("    2. Check if password has special characters that need encoding")
        elif "port 6543" in error_msg.lower():
            print("    1. Verify your Supabase project has connection pooling enabled")
            print("    2. Check Supabase dashboard → Settings → Database")
            print("    3. Get the connection pooler URL from Supabase dashboard")
            print("    4. Set DATABASE_POOLER_URL in your .env file")
        else:
            print("    1. Check your .env file has correct credentials")
            print("    2. Verify Supabase database is accessible")
            print("    3. Try setting DATABASE_POOLER_URL explicitly")
            print("    4. Check Supabase dashboard for connection pooler URL")
        
        return False
    except Exception as e:
        print(f"  [ERROR] Unexpected error: {str(e)}")
        print(f"     Error type: {type(e).__name__}")
        import traceback
        traceback.print_exc()
        return False


def compare_connections():
    """Compare direct connection vs pooler connection."""
    print()
    print("=" * 70)
    print("COMPARISON: Direct Connection vs Connection Pooler")
    print("=" * 70)
    print()
    print("Direct Connection (port 5432):")
    print("  - May have IPv6 connection issues")
    print("  - Higher connection overhead")
    print("  - Not ideal for serverless environments")
    print()
    print("Connection Pooler (port 6543):")
    print("  - Avoids IPv6 issues")
    print("  - Better connection management")
    print("  - Recommended for Railway/Vercel deployments")
    print("  - Uses pgbouncer for connection pooling")
    print()
    print("To use connection pooler:")
    print("  1. Get connection pooler URL from Supabase dashboard")
    print("  2. Set DATABASE_POOLER_URL in your .env file")
    print("     OR")
    print("  3. Set DATABASE_URL and the code will auto-convert to pooler")
    print()


if __name__ == "__main__":
    compare_connections()
    success = test_pooler_connection()
    sys.exit(0 if success else 1)

