from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
from database import get_db_connection
import json

load_dotenv()

app = FastAPI(title="Business API", version="1.0.0")

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
                        bc.svg as category_svg,
                        bl.location_name,
                        ST_Y(bl.location::geometry) as latitude,
                        ST_X(bl.location::geometry) as longitude
                    FROM businesses b
                    LEFT JOIN business_locations bl ON b.id = bl.business_id AND bl.is_public = true AND bl.location_index = 1
                    LEFT JOIN business_categories bc ON b.category_id = bc.id
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
                        socialLinks=SocialLinks(**social_by_business[business_id]) if business_id in social_by_business else None,
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


# For local development - Railway uses Procfile
if __name__ == "__main__":
    import uvicorn
    # Use PORT from environment (Railway sets this) or default to 8000 for local
    port = int(os.getenv("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)

