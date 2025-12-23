from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from pydantic import BaseModel
import os
from dotenv import load_dotenv
from psycopg2.extras import RealDictCursor
from database import get_db_connection

load_dotenv()

app = FastAPI(title="Business API", version="1.0.0")

# CORS middleware - allow requests from frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class Business(BaseModel):
    name: str
    description: str
    latitude: float
    longitude: float


@app.get("/businesses", response_model=List[Business])
def get_businesses():
    """
    Get a list of all businesses from the database.
    Returns businesses with name, description, latitude, and longitude.
    Extracts coordinates from PostGIS GEOGRAPHY(POINT) and description from JSONB details.
    """
    try:
        conn = get_db_connection()
        try:
            with conn.cursor(cursor_factory=RealDictCursor) as cur:
                cur.execute(
                    """
                    SELECT 
                        name,
                        details->>'description' as description,
                        ST_Y(location::geometry) as latitude,
                        ST_X(location::geometry) as longitude
                    FROM businesses
                    ORDER BY name
                    """
                )
                rows = cur.fetchall()
                businesses = [
                    Business(
                        name=row["name"] or "",
                        description=row["description"] or "",
                        latitude=float(row["latitude"]),
                        longitude=float(row["longitude"])
                    )
                    for row in rows
                ]
                return businesses
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

