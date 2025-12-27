"""
Script to import businesses from CSV file using the bulk import API endpoint.
Reads the CSV, parses each row, and calls POST /businesses/bulk-import for each business.
"""

import csv
import requests
import sys
from typing import Optional, List
from urllib.parse import urljoin

# Configuration
API_BASE_URL = "http://localhost:8000"  # Change this to your backend URL
CSV_FILE = "Lokal business onboarding - Cambridge v0.csv"

def parse_csv_row(row: dict) -> dict:
    """
    Parse a CSV row into the format expected by BulkBusinessImportRequest.
    """
    # Extract features (Feature_0, Feature_1, etc.)
    features = []
    for key in row.keys():
        if key.startswith("Feature_") and row[key] and row[key].strip():
            features.append(row[key].strip())
    
    # Build the request payload
    payload = {
        "name": row.get("business_name", "").strip(),
        "category": row.get("business_category", "").strip(),
        "address": row.get("business_location", "").strip(),
        "location_name": None,  # Will use geocoded place_name
        "website": row.get("Website", "").strip() or None,
        "x_url": row.get("X", "").strip() or None,
        "instagram_url": row.get("Instagram", "").strip() or None,
        "facebook_url": row.get("Facebook", "").strip() or None,
        "tiktok_url": row.get("TikTok", "").strip() or None,
        "logo_url": None,  # Not in CSV
        "oh_monday": row.get("OH Monday", "").strip() or None,
        "oh_tuesday": row.get("OH Tuesday", "").strip() or None,
        "oh_wednesday": row.get("OH Wednesday", "").strip() or None,
        "oh_thursday": row.get("OH Thursday", "").strip() or None,
        "oh_friday": row.get("OH Friday", "").strip() or None,
        "oh_saturday": row.get("OH Saturday", "").strip() or None,
        "oh_sunday": row.get("OH Sunday", "").strip() or None,
        "features": features if features else None
    }
    
    # Remove None values for optional fields (keep empty strings for required fields)
    cleaned_payload = {}
    for key, value in payload.items():
        if value is not None and value != "":
            cleaned_payload[key] = value
        elif key in ["name", "category", "address"]:
            # Required fields - keep even if empty (will fail validation)
            cleaned_payload[key] = value
    
    return cleaned_payload

def import_business(api_url: str, payload: dict) -> tuple[bool, str, dict]:
    """
    Import a single business via the bulk import API.
    Returns: (success, message, response_data)
    """
    try:
        response = requests.post(
            urljoin(api_url, "/businesses/bulk-import"),
            json=payload,
            timeout=30
        )
        
        if response.status_code == 200:
            data = response.json()
            return True, f"Successfully imported: {data.get('message', 'OK')}", data
        else:
            error_detail = response.json().get("detail", "Unknown error")
            return False, f"Error {response.status_code}: {error_detail}", {}
    except requests.exceptions.RequestException as e:
        return False, f"Request failed: {str(e)}", {}

def main():
    """
    Main function to read CSV and import businesses.
    """
    print(f"Reading CSV file: {CSV_FILE}")
    print(f"API endpoint: {API_BASE_URL}/businesses/bulk-import")
    print("-" * 60)
    
    # Read CSV file
    businesses = []
    try:
        with open(CSV_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                # Skip empty rows
                if not row.get("business_name", "").strip():
                    continue
                businesses.append(row)
    except FileNotFoundError:
        print(f"ERROR: CSV file '{CSV_FILE}' not found!")
        sys.exit(1)
    except Exception as e:
        print(f"ERROR: Failed to read CSV file: {str(e)}")
        sys.exit(1)
    
    print(f"Found {len(businesses)} businesses to import\n")
    
    # Import each business
    results = {
        "success": [],
        "failed": []
    }
    
    for idx, row in enumerate(businesses, 1):
        business_name = row.get("business_name", "").strip()
        print(f"[{idx}/{len(businesses)}] Processing: {business_name}")
        
        # Parse CSV row
        payload = parse_csv_row(row)
        
        # Validate required fields
        if not payload.get("name"):
            error_msg = "Missing business name"
            print(f"  ✗ {error_msg}")
            results["failed"].append({"name": business_name, "error": error_msg})
            continue
        
        if not payload.get("category"):
            error_msg = "Missing category"
            print(f"  ✗ {error_msg}")
            results["failed"].append({"name": business_name, "error": error_msg})
            continue
        
        if not payload.get("address"):
            error_msg = "Missing address"
            print(f"  ✗ {error_msg}")
            results["failed"].append({"name": business_name, "error": error_msg})
            continue
        
        # Import business
        success, message, data = import_business(API_BASE_URL, payload)
        
        if success:
            business_id = data.get("business_id", "?")
            location_name = data.get("location_name", "?")
            print(f"  ✓ {message}")
            print(f"    Business ID: {business_id}, Location: {location_name}")
            results["success"].append({
                "name": business_name,
                "business_id": business_id,
                "location_name": location_name
            })
        else:
            print(f"  ✗ {message}")
            results["failed"].append({"name": business_name, "error": message})
        
        print()  # Empty line between businesses
    
    # Print summary
    print("=" * 60)
    print("IMPORT SUMMARY")
    print("=" * 60)
    print(f"Total businesses: {len(businesses)}")
    print(f"Successfully imported: {len(results['success'])}")
    print(f"Failed: {len(results['failed'])}")
    
    if results["success"]:
        print("\n✓ Successfully imported businesses:")
        for item in results["success"]:
            print(f"  - {item['name']} (ID: {item['business_id']})")
    
    if results["failed"]:
        print("\n✗ Failed imports:")
        for item in results["failed"]:
            print(f"  - {item['name']}: {item['error']}")
    
    # Exit with error code if any failed
    if results["failed"]:
        sys.exit(1)

if __name__ == "__main__":
    main()

