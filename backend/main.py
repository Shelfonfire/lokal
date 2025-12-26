from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional, Tuple
from pydantic import BaseModel
import os
import requests
from urllib.parse import quote
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
from database import get_db_connection

load_dotenv()

app = FastAPI(title="Business API", version="1.0.0")

# Geocoding helper function
def geocode_address(address: str) -> Tuple[float, float, str]:
    """
    Geocode an address using Mapbox API.
    Returns: (longitude, latitude, place_name)
    Raises exception if not found or geocoding fails.
    """
    mapbox_token = os.getenv("MAPBOX_ACCESS_TOKEN")
    if not mapbox_token:
        raise ValueError("MAPBOX_ACCESS_TOKEN environment variable not set")
    
    url = f"https://api.mapbox.com/geocoding/v5/mapbox.places/{quote(address)}.json"
    
    params = {
        "access_token": mapbox_token,
        "limit": 1,
        "country": "GB"  # Bias towards UK addresses
    }
    
    try:
        resp = requests.get(url, params=params, timeout=10)
        resp.raise_for_status()
        
        data = resp.json()
        if not data.get("features"):
            raise ValueError(f"Could not geocode address: {address}")
        
        feature = data["features"][0]
        lng, lat = feature["center"]
        place_name = feature.get("place_name", address)
        
        return lng, lat, place_name
    except requests.RequestException as e:
        raise ValueError(f"Geocoding API error: {str(e)}")

# Opening hours parser for CSV format
DAY_MAP = {
    "Sun": 0,
    "Mon": 1,
    "Tue": 2,
    "Wed": 3,
    "Thu": 4,
    "Fri": 5,
    "Sat": 6,
}

def parse_opening_hours_csv(oh_monday: Optional[str], oh_tuesday: Optional[str], 
                           oh_wednesday: Optional[str], oh_thursday: Optional[str],
                           oh_friday: Optional[str], oh_saturday: Optional[str],
                           oh_sunday: Optional[str]) -> List[dict]:
    """
    Parse opening hours from CSV format (separate columns per day).
    Format: "HH:MM-HH:MM" or "closed" or empty
    Returns list of opening hour dicts ready for DB insertion.
    """
    results = []
    days = [
        ("Mon", oh_monday),
        ("Tue", oh_tuesday),
        ("Wed", oh_wednesday),
        ("Thu", oh_thursday),
        ("Fri", oh_friday),
        ("Sat", oh_saturday),
        ("Sun", oh_sunday),
    ]
    
    for day_name, time_str in days:
        if not time_str or time_str.strip() == "":
            continue  # Skip empty days
        
        day_of_week = DAY_MAP[day_name]
        time_str = time_str.strip()
        
        if time_str.lower() == "closed":
            results.append({
                "day_of_week": day_of_week,
                "open_time": None,
                "close_time": None,
                "is_closed": True
            })
        else:
            # Parse "HH:MM-HH:MM" format
            try:
                open_t, close_t = time_str.split("-")
                # Ensure time format is HH:MM:SS
                open_time = open_t.strip() if len(open_t.strip().split(':')) == 3 else f"{open_t.strip()}:00"
                close_time = close_t.strip() if len(close_t.strip().split(':')) == 3 else f"{close_t.strip()}:00"
                
                results.append({
                    "day_of_week": day_of_week,
                    "open_time": open_time,
                    "close_time": close_time,
                    "is_closed": False
                })
            except ValueError:
                # Skip invalid format
                continue
    
    return results

# CORS configuration - allow requests from frontend
# Supports local development and Vercel deployments
# Environment variables:
# - FRONTEND_URL: Main production frontend URL (e.g., https://lokal-tau.vercel.app)
# - FRONTEND_URLS: Comma-separated list of additional frontend URLs (optional)

# Build CORS origins list
origins = [
    "http://localhost:3000",  # Local development (Next.js default)
    "http://localhost:5173",  # Vite dev server (if using)
]

# Add main production frontend URL
frontend_url = os.getenv("FRONTEND_URL", "").strip()
if frontend_url and frontend_url not in origins:
    origins.append(frontend_url)

# Add additional frontend URLs if provided
frontend_urls = os.getenv("FRONTEND_URLS", "").strip()
if frontend_urls:
    for url in frontend_urls.split(","):
        url = url.strip()
        if url and url not in origins:
            origins.append(url)

# Configure CORS middleware with proper preflight handling
# Use regex pattern for Vercel preview deployments (allows all *.vercel.app subdomains)
vercel_regex = r"https://.*\.vercel\.app" if frontend_url and "vercel.app" in frontend_url.lower() else None

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins if origins else ["*"],  # Fallback to allow all if no origins specified
    allow_origin_regex=vercel_regex,  # Allow all Vercel preview deployments
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS", "HEAD", "PATCH"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,  # Cache preflight requests for 1 hour
)


class BusinessFeature(BaseModel):
    key: str
    name: str
    value: str | bool
    svg: str

class SocialLinks(BaseModel):
    website: Optional[str] = None
    facebook: Optional[str] = None
    instagram: Optional[str] = None
    twitter: Optional[str] = None
    tiktok: Optional[str] = None

class OpeningHours(BaseModel):
    day: str
    start: str
    end: str

class Business(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    latitude: float
    longitude: float
    category: Optional[str] = None
    categorySvg: Optional[str] = None
    isVerified: bool = False
    logo: Optional[str] = None
    icon: Optional[str] = None
    features: List[BusinessFeature] = []
    socialLinks: Optional[SocialLinks] = None
    openingHours: List[OpeningHours] = []
    
    class Config:
        # Use camelCase field names for JSON serialization
        json_encoders = {
            # Ensure proper serialization
        }
        populate_by_name = True

class Category(BaseModel):
    id: int
    category: str
    description: Optional[str] = None
    svg: Optional[str] = None

class Feature(BaseModel):
    id: int
    feature: str
    description: Optional[str] = None
    svg: Optional[str] = None

# Request models for business onboarding
class BusinessIdentityRequest(BaseModel):
    name: str
    category_id: int

class BusinessLocationRequest(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = None

class OpeningHourRequest(BaseModel):
    day_of_week: int  # 0=Sun, 1=Mon, ..., 6=Sat
    open_time: Optional[str] = None  # Format: "HH:MM:SS" or "HH:MM"
    close_time: Optional[str] = None  # Format: "HH:MM:SS" or "HH:MM"
    is_closed: bool = False

class OpeningHoursRequest(BaseModel):
    opening_hours: List[OpeningHourRequest]

class SocialLinksRequest(BaseModel):
    primary_website_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    x_url: Optional[str] = None
    tiktok_url: Optional[str] = None

class LogoRequest(BaseModel):
    url: str

class FeatureProposalRequest(BaseModel):
    feature_id: int
    feature_score: int = 0

class FeaturesRequest(BaseModel):
    features: List[FeatureProposalRequest]

class BusinessCreateResponse(BaseModel):
    id: int
    name: str
    category_id: Optional[int] = None
    message: str

# Bulk import request model for CSV ingestion
class BulkBusinessImportRequest(BaseModel):
    name: str
    category: str  # Category name, will be looked up
    address: str  # Address string, will be geocoded
    location_name: Optional[str] = None
    website: Optional[str] = None
    x_url: Optional[str] = None
    instagram_url: Optional[str] = None
    facebook_url: Optional[str] = None
    tiktok_url: Optional[str] = None
    logo_url: Optional[str] = None
    oh_monday: Optional[str] = None
    oh_tuesday: Optional[str] = None
    oh_wednesday: Optional[str] = None
    oh_thursday: Optional[str] = None
    oh_friday: Optional[str] = None
    oh_saturday: Optional[str] = None
    oh_sunday: Optional[str] = None
    features: Optional[List[str]] = None  # List of feature names

# Request models for business onboarding
class BusinessIdentityRequest(BaseModel):
    name: str
    category_id: int

class BusinessLocationRequest(BaseModel):
    latitude: float
    longitude: float
    location_name: Optional[str] = None

class OpeningHourRequest(BaseModel):
    day_of_week: int  # 0=Sun, 1=Mon, ..., 6=Sat
    open_time: Optional[str] = None  # Format: "HH:MM:SS" or "HH:MM"
    close_time: Optional[str] = None  # Format: "HH:MM:SS" or "HH:MM"
    is_closed: bool = False

class OpeningHoursRequest(BaseModel):
    opening_hours: List[OpeningHourRequest]

class SocialLinksRequest(BaseModel):
    primary_website_url: Optional[str] = None
    facebook_url: Optional[str] = None
    instagram_url: Optional[str] = None
    x_url: Optional[str] = None
    tiktok_url: Optional[str] = None

class LogoRequest(BaseModel):
    url: str

class FeatureProposalRequest(BaseModel):
    feature_id: int
    feature_score: int = 0

class FeaturesRequest(BaseModel):
    features: List[FeatureProposalRequest]

class BusinessCreateResponse(BaseModel):
    id: int
    name: str
    category_id: Optional[int] = None
    message: str


@app.get("/businesses", response_model=List[Business])
def get_businesses():
    """
    Get a list of all businesses from the normalized database schema.
    Returns businesses with all related data: locations, categories, features, social links, and opening hours.
    """
    try:
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Main query to get businesses with locations and categories
                cur.execute(
                    """
                    SELECT DISTINCT
                        b.id,
                        b.name,
                        b.is_verified,
                        bc.category,
                        COALESCE(bc.svg, parent_bc.svg) as category_svg,
                        bl.location_name,
                        bl.location_index,
                        ST_Y(bl.location::geometry) as latitude,
                        ST_X(bl.location::geometry) as longitude
                    FROM businesses b
                    LEFT JOIN business_locations bl ON b.id = bl.business_id AND bl.is_public = true AND bl.location_index = 1
                    LEFT JOIN business_categories bc ON b.category_id = bc.id
                    LEFT JOIN business_categories parent_bc ON bc.parent_category_id = parent_bc.id
                    WHERE bl.location IS NOT NULL
                    ORDER BY b.name, bl.location_index
                    """
                )
                business_rows = cur.fetchall()
                
                businesses_dict = {}
                for row in business_rows:
                    business_id = row["id"]
                    if business_id not in businesses_dict:
                        businesses_dict[business_id] = {
                            "id": business_id,
                            "name": row["name"] or "",
                            "is_verified": row["is_verified"] or False,
                            "category": row["category"],
                            "category_svg": row["category_svg"],
                            "latitude": float(row["latitude"]) if row["latitude"] else None,
                            "longitude": float(row["longitude"]) if row["longitude"] else None,
                            "location_name": row["location_name"],
                        }
                
                # Get features for each business
                cur.execute(
                    """
                    SELECT 
                        bfp.business_id,
                        bf.id as feature_id,
                        bf.feature,
                        bf.svg,
                        bfp.feature_score
                    FROM business_feature_proposals bfp
                    JOIN business_features bf ON bfp.feature_id = bf.id
                    WHERE bfp.proposal_status = 'approved'
                    ORDER BY bfp.business_id, bf.feature
                    """
                )
                feature_rows = cur.fetchall()
                
                # Group features by business_id
                features_by_business = {}
                for row in feature_rows:
                    business_id = row["business_id"]
                    if business_id not in features_by_business:
                        features_by_business[business_id] = []
                    features_by_business[business_id].append({
                        "key": f"feature_{row['feature_id']}",
                        "name": row["feature"],
                        "value": row["feature_score"] or True,
                        "svg": row["svg"] or ""
                    })
                
                # Get social links
                cur.execute(
                    """
                    SELECT 
                        business_id,
                        primary_website_url,
                        facebook_url,
                        instagram_url,
                        x_url,
                        tiktok_url
                    FROM business_web_links
                    """
                )
                social_rows = cur.fetchall()
                
                social_by_business = {}
                for row in social_rows:
                    business_id = row["business_id"]
                    social_by_business[business_id] = {
                        "website": row["primary_website_url"],
                        "facebook": row["facebook_url"],
                        "instagram": row["instagram_url"],
                        "twitter": row["x_url"],
                        "tiktok": row["tiktok_url"]
                    }
                
                # Get opening hours
                cur.execute(
                    """
                    SELECT 
                        bl.business_id,
                        bloh.day_of_week,
                        bloh.open_time,
                        bloh.close_time,
                        bloh.is_closed
                    FROM business_location_opening_hours bloh
                    JOIN business_locations bl ON bloh.location_id = bl.id
                    WHERE bl.location_index = 1 AND bl.is_public = true
                    ORDER BY bl.business_id, bloh.day_of_week
                    """
                )
                hours_rows = cur.fetchall()
                
                # Map day_of_week (0-6) to day names
                day_names = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
                
                hours_by_business = {}
                for row in hours_rows:
                    business_id = row["business_id"]
                    if business_id not in hours_by_business:
                        hours_by_business[business_id] = []
                    if not row["is_closed"]:
                        hours_by_business[business_id].append({
                            "day": day_names[row["day_of_week"]],
                            "start": str(row["open_time"]) if row["open_time"] else "9:00",
                            "end": str(row["close_time"]) if row["close_time"] else "17:00"
                        })
                
                # Get logo from business_images
                cur.execute(
                    """
                    SELECT DISTINCT ON (business_id)
                        business_id,
                        url
                    FROM business_images
                    WHERE image_type = 'logo' AND image_index = 0
                    ORDER BY business_id, image_index
                    """
                )
                logo_rows = cur.fetchall()
                
                logos_by_business = {}
                for row in logo_rows:
                    logos_by_business[row["business_id"]] = row["url"]
                
                # Build final business list
                businesses = []
                for business_id, business_data in businesses_dict.items():
                    if business_data["latitude"] is None or business_data["longitude"] is None:
                        continue  # Skip businesses without valid location
                    
                    # Build social links object if business has social links
                    social_links_obj = None
                    if business_id in social_by_business:
                        social_data = social_by_business[business_id]
                        # Only create SocialLinks if at least one field is not None
                        if social_data and any(v is not None for v in social_data.values()):
                            social_links_obj = SocialLinks(**social_data)
                    
                    business = Business(
                        id=business_data["id"],
                        name=business_data["name"],
                        description=business_data.get("location_name"),  # Use location_name as description for now
                        latitude=business_data["latitude"],
                        longitude=business_data["longitude"],
                        category=business_data["category"],
                        categorySvg=business_data["category_svg"],
                        isVerified=business_data["is_verified"],
                        logo=logos_by_business.get(business_id),
                        features=features_by_business.get(business_id, []),
                        socialLinks=social_links_obj,
                        openingHours=hours_by_business.get(business_id, [])
                    )
                    businesses.append(business)
                
                return businesses
        finally:
            conn.close()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/categories", response_model=List[Category])
def get_categories():
    """
    Get all business categories from the database.
    """
    try:
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT id, category, description, svg
                    FROM business_categories
                    ORDER BY category
                    """
                )
                rows = cur.fetchall()
                categories = [
                    Category(
                        id=row["id"],
                        category=row["category"] or "",
                        description=row["description"],
                        svg=row["svg"]
                    )
                    for row in rows
                ]
                return categories
        finally:
            conn.close()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/features", response_model=List[Feature])
def get_features():
    """
    Get all business features from the database.
    """
    try:
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT id, feature, description, svg
                    FROM business_features
                    ORDER BY feature
                    """
                )
                rows = cur.fetchall()
                features = [
                    Feature(
                        id=row["id"],
                        feature=row["feature"] or "",
                        description=row["description"],
                        svg=row["svg"]
                    )
                    for row in rows
                ]
                return features
        finally:
            conn.close()
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.get("/")
async def root():
    return {"message": "Business API is running"}


@app.get("/health")
async def health():
    return {"status": "healthy"}


# Business Onboarding Routes

@app.post("/businesses/identity", response_model=BusinessCreateResponse)
def create_business_identity(request: BusinessIdentityRequest):
    """
    Step 1: Create business identity (name + category).
    Creates the base business entry.
    """
    try:
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Verify category exists
                cur.execute("SELECT id FROM business_categories WHERE id = %s", (request.category_id,))
                category = cur.fetchone()
                if not category:
                    raise HTTPException(status_code=404, detail=f"Category with id {request.category_id} not found")
                
                # Insert business
                cur.execute(
                    """
                    INSERT INTO businesses (name, category_id)
                    VALUES (%s, %s)
                    RETURNING id, name, category_id
                    """,
                    (request.name, request.category_id)
                )
                result = cur.fetchone()
                conn.commit()
                
                return BusinessCreateResponse(
                    id=result["id"],
                    name=result["name"],
                    category_id=result["category_id"],
                    message="Business identity created successfully"
                )
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/businesses/{business_id}/location", response_model=dict)
def add_business_location(business_id: int, request: BusinessLocationRequest):
    """
    Step 2: Add location for business (required for map display).
    Creates the first business_locations entry with location_index: 1.
    """
    conn = None
    try:
        conn = get_db_connection()
        conn.autocommit = False
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Verify business exists
                cur.execute("SELECT id FROM businesses WHERE id = %s", (business_id,))
                business = cur.fetchone()
                if not business:
                    conn.rollback()
                    raise HTTPException(status_code=404, detail=f"Business with id {business_id} not found")
                
                # Check if primary location already exists
                cur.execute(
                    """
                    SELECT id FROM business_locations 
                    WHERE business_id = %s AND location_index = 1
                    """,
                    (business_id,)
                )
                existing = cur.fetchone()
                if existing:
                    conn.rollback()
                    raise HTTPException(
                        status_code=400, 
                        detail="Primary location already exists for this business"
                    )
                
                # Insert location using PostGIS
                cur.execute(
                    """
                    INSERT INTO business_locations (business_id, location, location_name, location_index, is_public)
                    VALUES (
                        %s,
                        ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                        %s,
                        1,
                        true
                    )
                    RETURNING id
                    """,
                    (business_id, request.longitude, request.latitude, request.location_name)
                )
                result = cur.fetchone()
                conn.commit()
                
                return {
                    "location_id": result["id"],
                    "business_id": business_id,
                    "latitude": request.latitude,
                    "longitude": request.longitude,
                    "location_name": request.location_name,
                    "message": "Location added successfully"
                }
        except HTTPException:
            if conn:
                conn.rollback()
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            if conn:
                conn.autocommit = True
                conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/businesses/{business_id}/opening-hours", response_model=dict)
def add_business_opening_hours(business_id: int, request: OpeningHoursRequest):
    """
    Step 3: Add opening hours for the primary location (recommended).
    """
    conn = None
    try:
        conn = get_db_connection()
        conn.autocommit = False
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Verify business exists
                cur.execute("SELECT id FROM businesses WHERE id = %s", (business_id,))
                business = cur.fetchone()
                if not business:
                    conn.rollback()
                    raise HTTPException(status_code=404, detail=f"Business with id {business_id} not found")
                
                # Get primary location
                cur.execute(
                    """
                    SELECT id FROM business_locations 
                    WHERE business_id = %s AND location_index = 1
                    """,
                    (business_id,)
                )
                location = cur.fetchone()
                if not location:
                    conn.rollback()
                    raise HTTPException(
                        status_code=400,
                        detail="Primary location must be created before adding opening hours"
                    )
                
                location_id = location["id"]
                
                # Delete existing opening hours for this location
                cur.execute(
                    "DELETE FROM business_location_opening_hours WHERE location_id = %s",
                    (location_id,)
                )
                
                # Insert new opening hours
                inserted_hours = []
                for hour in request.opening_hours:
                    # Validate day_of_week
                    if hour.day_of_week < 0 or hour.day_of_week > 6:
                        conn.rollback()
                        raise HTTPException(
                            status_code=400,
                            detail=f"Invalid day_of_week: {hour.day_of_week}. Must be 0-6 (0=Sun, 6=Sat)"
                        )
                    
                    # Convert time strings to time format if provided
                    open_time = None
                    close_time = None
                    
                    if not hour.is_closed:
                        if hour.open_time:
                            # Handle both "HH:MM" and "HH:MM:SS" formats
                            open_time = hour.open_time if len(hour.open_time.split(':')) == 3 else f"{hour.open_time}:00"
                        if hour.close_time:
                            close_time = hour.close_time if len(hour.close_time.split(':')) == 3 else f"{hour.close_time}:00"
                    
                    cur.execute(
                        """
                        INSERT INTO business_location_opening_hours 
                        (location_id, day_of_week, open_time, close_time, is_closed)
                        VALUES (%s, %s, %s, %s, %s)
                        RETURNING id
                        """,
                        (location_id, hour.day_of_week, open_time, close_time, hour.is_closed)
                    )
                    result = cur.fetchone()
                    inserted_hours.append({
                        "id": result["id"],
                        "day_of_week": hour.day_of_week,
                        "open_time": open_time,
                        "close_time": close_time,
                        "is_closed": hour.is_closed
                    })
                
                conn.commit()
                
                return {
                    "business_id": business_id,
                    "location_id": location_id,
                    "opening_hours": inserted_hours,
                    "message": f"Added {len(inserted_hours)} opening hour entries"
                }
        except HTTPException:
            if conn:
                conn.rollback()
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            if conn:
                conn.autocommit = True
                conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/businesses/{business_id}/social-links", response_model=dict)
def add_business_social_links(business_id: int, request: SocialLinksRequest):
    """
    Step 4: Add social links and website (optional).
    """
    try:
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Verify business exists
                cur.execute("SELECT id FROM businesses WHERE id = %s", (business_id,))
                business = cur.fetchone()
                if not business:
                    raise HTTPException(status_code=404, detail=f"Business with id {business_id} not found")
                
                # Check if social links already exist
                cur.execute(
                    "SELECT id FROM business_web_links WHERE business_id = %s",
                    (business_id,)
                )
                existing = cur.fetchone()
                
                if existing:
                    # Update existing
                    cur.execute(
                        """
                        UPDATE business_web_links
                        SET primary_website_url = %s,
                            facebook_url = %s,
                            instagram_url = %s,
                            x_url = %s,
                            tiktok_url = %s
                        WHERE business_id = %s
                        RETURNING id
                        """,
                        (
                            request.primary_website_url,
                            request.facebook_url,
                            request.instagram_url,
                            request.x_url,
                            request.tiktok_url,
                            business_id
                        )
                    )
                    result = cur.fetchone()
                    action = "updated"
                else:
                    # Insert new
                    cur.execute(
                        """
                        INSERT INTO business_web_links 
                        (business_id, primary_website_url, facebook_url, instagram_url, x_url, tiktok_url)
                        VALUES (%s, %s, %s, %s, %s, %s)
                        RETURNING id
                        """,
                        (
                            business_id,
                            request.primary_website_url,
                            request.facebook_url,
                            request.instagram_url,
                            request.x_url,
                            request.tiktok_url
                        )
                    )
                    result = cur.fetchone()
                    action = "created"
                
                conn.commit()
                
                return {
                    "id": result["id"],
                    "business_id": business_id,
                    "social_links": {
                        "primary_website_url": request.primary_website_url,
                        "facebook_url": request.facebook_url,
                        "instagram_url": request.instagram_url,
                        "x_url": request.x_url,
                        "tiktok_url": request.tiktok_url
                    },
                    "message": f"Social links {action} successfully"
                }
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/businesses/{business_id}/logo", response_model=dict)
def add_business_logo(business_id: int, request: LogoRequest):
    """
    Step 4 (continued): Add logo image (optional).
    """
    try:
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Verify business exists
                cur.execute("SELECT id FROM businesses WHERE id = %s", (business_id,))
                business = cur.fetchone()
                if not business:
                    raise HTTPException(status_code=404, detail=f"Business with id {business_id} not found")
                
                # Check if logo already exists (image_index = 0)
                cur.execute(
                    """
                    SELECT id FROM business_images 
                    WHERE business_id = %s AND image_type = 'logo' AND image_index = 0
                    """,
                    (business_id,)
                )
                existing = cur.fetchone()
                
                if existing:
                    # Update existing logo
                    cur.execute(
                        """
                        UPDATE business_images
                        SET url = %s
                        WHERE id = %s
                        RETURNING id
                        """,
                        (request.url, existing["id"])
                    )
                    result = cur.fetchone()
                    action = "updated"
                else:
                    # Insert new logo
                    cur.execute(
                        """
                        INSERT INTO business_images (business_id, image_type, image_index, url)
                        VALUES (%s, 'logo', 0, %s)
                        RETURNING id
                        """,
                        (business_id, request.url)
                    )
                    result = cur.fetchone()
                    action = "created"
                
                conn.commit()
                
                return {
                    "id": result["id"],
                    "business_id": business_id,
                    "logo_url": request.url,
                    "message": f"Logo {action} successfully"
                }
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/businesses/{business_id}/features", response_model=dict)
def add_business_features(business_id: int, request: FeaturesRequest):
    """
    Step 5: Add feature proposals (optional).
    Creates business_feature_proposals entries with status 'pending'.
    """
    try:
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # Verify business exists
                cur.execute("SELECT id FROM businesses WHERE id = %s", (business_id,))
                business = cur.fetchone()
                if not business:
                    raise HTTPException(status_code=404, detail=f"Business with id {business_id} not found")
                
                # Verify all features exist
                feature_ids = [f.feature_id for f in request.features]
                if feature_ids:
                    placeholders = ','.join(['%s'] * len(feature_ids))
                    cur.execute(
                        f"SELECT id FROM business_features WHERE id IN ({placeholders})",
                        tuple(feature_ids)
                    )
                    existing_features = {row["id"] for row in cur.fetchall()}
                    missing_features = set(feature_ids) - existing_features
                    if missing_features:
                        raise HTTPException(
                            status_code=404,
                            detail=f"Features not found: {list(missing_features)}"
                        )
                
                # Insert feature proposals
                inserted_features = []
                for feature in request.features:
                    cur.execute(
                        """
                        INSERT INTO business_feature_proposals 
                        (business_id, feature_id, feature_score, proposal_status)
                        VALUES (%s, %s, %s, 'pending')
                        RETURNING id
                        """,
                        (business_id, feature.feature_id, feature.feature_score)
                    )
                    result = cur.fetchone()
                    inserted_features.append({
                        "id": result["id"],
                        "feature_id": feature.feature_id,
                        "feature_score": feature.feature_score,
                        "proposal_status": "pending"
                    })
                
                conn.commit()
                
                return {
                    "business_id": business_id,
                    "features": inserted_features,
                    "message": f"Added {len(inserted_features)} feature proposals"
                }
        finally:
            conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


@app.post("/businesses/bulk-import", response_model=dict)
def bulk_import_business(request: BulkBusinessImportRequest):
    """
    Bulk import endpoint for CSV ingestion.
    Creates a complete business entry in a single transaction:
    - Resolves category by name
    - Geocodes address to lat/lng
    - Creates business, location, opening hours, social links, logo, and features
    - All in one transaction (rolls back on any error)
    """
    conn = None
    try:
        conn = get_db_connection()
        conn.autocommit = False  # Use transaction
        
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                # 1. Resolve category by name
                cur.execute(
                    "SELECT id FROM business_categories WHERE category = %s",
                    (request.category,)
                )
                category = cur.fetchone()
                if not category:
                    conn.rollback()
                    raise HTTPException(
                        status_code=404,
                        detail=f"Category '{request.category}' not found"
                    )
                category_id = category["id"]
                
                # 2. Geocode address
                try:
                    lng, lat, place_name = geocode_address(request.address)
                except ValueError as e:
                    conn.rollback()
                    raise HTTPException(status_code=400, detail=str(e))
                
                # Use provided location_name or geocoded place_name
                location_name = request.location_name or place_name
                
                # 3. Insert business
                cur.execute(
                    """
                    INSERT INTO businesses (name, category_id, is_verified)
                    VALUES (%s, %s, false)
                    RETURNING id
                    """,
                    (request.name, category_id)
                )
                business_id = cur.fetchone()["id"]
                
                # 4. Insert location
                cur.execute(
                    """
                    INSERT INTO business_locations (
                        business_id,
                        location,
                        location_name,
                        location_index,
                        is_public
                    )
                    VALUES (
                        %s,
                        ST_SetSRID(ST_MakePoint(%s, %s), 4326)::geography,
                        %s,
                        1,
                        true
                    )
                    RETURNING id
                    """,
                    (business_id, lng, lat, location_name)
                )
                location_id = cur.fetchone()["id"]
                
                # 5. Insert opening hours
                opening_hours = parse_opening_hours_csv(
                    request.oh_monday,
                    request.oh_tuesday,
                    request.oh_wednesday,
                    request.oh_thursday,
                    request.oh_friday,
                    request.oh_saturday,
                    request.oh_sunday
                )
                
                for hour in opening_hours:
                    cur.execute(
                        """
                        INSERT INTO business_location_opening_hours (
                            location_id,
                            day_of_week,
                            open_time,
                            close_time,
                            is_closed
                        )
                        VALUES (%s, %s, %s, %s, %s)
                        """,
                        (
                            location_id,
                            hour["day_of_week"],
                            hour["open_time"],
                            hour["close_time"],
                            hour["is_closed"]
                        )
                    )
                
                # 6. Insert social links (if any provided)
                if any([request.website, request.x_url, request.instagram_url, 
                       request.facebook_url, request.tiktok_url]):
                    cur.execute(
                        """
                        INSERT INTO business_web_links (
                            business_id,
                            primary_website_url,
                            x_url,
                            instagram_url,
                            facebook_url,
                            tiktok_url
                        )
                        VALUES (%s, %s, %s, %s, %s, %s)
                        """,
                        (
                            business_id,
                            request.website,
                            request.x_url,
                            request.instagram_url,
                            request.facebook_url,
                            request.tiktok_url
                        )
                    )
                
                # 7. Insert logo (if provided)
                if request.logo_url:
                    cur.execute(
                        """
                        INSERT INTO business_images (business_id, image_type, image_index, url)
                        VALUES (%s, 'logo', 0, %s)
                        """,
                        (business_id, request.logo_url)
                    )
                
                # 8. Insert features (if provided)
                if request.features:
                    for feature_name in request.features:
                        if not feature_name or feature_name.strip() == "":
                            continue
                        
                        cur.execute(
                            "SELECT id FROM business_features WHERE feature = %s",
                            (feature_name.strip(),)
                        )
                        feature = cur.fetchone()
                        if feature:
                            cur.execute(
                                """
                                INSERT INTO business_feature_proposals (
                                    business_id,
                                    feature_id,
                                    feature_score,
                                    proposal_status
                                )
                                VALUES (%s, %s, 0, 'pending')
                                """,
                                (business_id, feature["id"])
                            )
                
                # Commit transaction
                conn.commit()
                
                return {
                    "business_id": business_id,
                    "location_id": location_id,
                    "category_id": category_id,
                    "latitude": lat,
                    "longitude": lng,
                    "location_name": location_name,
                    "opening_hours_count": len(opening_hours),
                    "message": "Business imported successfully"
                }
                
        except HTTPException:
            if conn:
                conn.rollback()
            raise
        except Exception as e:
            if conn:
                conn.rollback()
            import traceback
            traceback.print_exc()
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            if conn:
                conn.autocommit = True
                conn.close()
    except HTTPException:
        raise
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")


# For local development - Railway uses Procfile
if __name__ == "__main__":
    import uvicorn
    # Use PORT from environment (Railway sets this) or default to 8000 for local
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

