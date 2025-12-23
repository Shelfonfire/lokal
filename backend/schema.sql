-- SQL schema for businesses table
-- Run this in your Supabase SQL editor to create the table
-- Note: PostGIS extension must be enabled in your Supabase project

CREATE TABLE IF NOT EXISTS businesses (
  id SERIAL PRIMARY KEY,
  name TEXT,
  location GEOGRAPHY(POINT, 4326), -- PostGIS point
  details JSONB, -- Social links, description
  is_verified BOOLEAN
);

-- Create a spatial index on the location column for better query performance
CREATE INDEX IF NOT EXISTS idx_businesses_location ON businesses USING GIST (location);

-- Example data inserts
INSERT INTO businesses (name, location, details, is_verified) VALUES
(
  'River Cam Coffee Co',
  ST_SetSRID(ST_MakePoint(0.1195, 52.2056), 4326)::geography,
  '{
    "description": "Independent riverside coffee shop serving locally roasted beans.",
    "website": "https://rivercamcoffee.fake",
    "instagram": "@rivercamcoffee"
  }',
  true
),
(
  'Mill Road Cycles',
  ST_SetSRID(ST_MakePoint(0.1342, 52.2031), 4326)::geography,
  '{
    "description": "Bicycle repairs and sales for commuters and students.",
    "website": "https://millroadcycles.fake",
    "facebook": "millroadcycles"
  }',
  true
),
(
  'Cambridge Artisan Bakery',
  ST_SetSRID(ST_MakePoint(0.1231, 52.2094), 4326)::geography,
  '{
    "description": "Sourdough bread and pastries baked fresh every morning.",
    "instagram": "@camartisanbakery"
  }',
  false
),
(
  'Fenland Digital Studio',
  ST_SetSRID(ST_MakePoint(0.1168, 52.2109), 4326)::geography,
  '{
    "description": "Web design and branding studio for small businesses.",
    "website": "https://fenlanddigital.fake",
    "linkedin": "fenland-digital-studio"
  }',
  true
),
(
  'Market Square Florist',
  ST_SetSRID(ST_MakePoint(0.1212, 52.2086), 4326)::geography,
  '{
    "description": "Seasonal flowers and bespoke bouquets in the city centre.",
    "instagram": "@marketsquareflorist"
  }',
  false
),
(
  'Grantchester Yoga Room',
  ST_SetSRID(ST_MakePoint(0.1097, 52.1978), 4326)::geography,
  '{
    "description": "Small yoga studio offering mindfulness and vinyasa classes.",
    "website": "https://grantchesteryoga.fake"
  }',
  true
),
(
  'Cam Tech Repairs',
  ST_SetSRID(ST_MakePoint(0.1304, 52.2121), 4326)::geography,
  '{
    "description": "Phone and laptop repairs with same-day service.",
    "facebook": "camtechrepairs"
  }',
  true
),
(
  'Green Street Vintage',
  ST_SetSRID(ST_MakePoint(0.1246, 52.2072), 4326)::geography,
  '{
    "description": "Curated vintage clothing and accessories.",
    "instagram": "@greenstreetvintage"
  }',
  false
);
