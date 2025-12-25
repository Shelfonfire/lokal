# Business API Backend

FastAPI application for managing business data with Supabase PostgreSQL.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the backend directory with your Supabase database credentials:

**Option 1: Connection Pooler (Recommended - avoids IPv6 issues)**
```env
# Use connection pooler URL (port 6543) - recommended for Railway/Vercel
DATABASE_POOLER_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:6543/postgres
```

**Option 2: Standard URL (auto-converted to pooler)**
```env
# Standard URL - will be automatically converted to use pooler (port 6543)
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

**Option 3: Individual components**
```env
DB_HOST=db.your-project.supabase.co
DB_PORT=6543  # Use 6543 for connection pooler, 5432 for direct connection
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password-here
```

**Note:** The connection pooler (port 6543) is recommended because it:
- Avoids IPv6 connection issues
- Works better with serverless environments (Railway, Vercel)
- Provides better connection management
- Uses pgbouncer for efficient pooling

3. Configure CORS for frontend access:
```env
# Main production frontend URL (required for Railway deployment)
FRONTEND_URL=https://lokal-tau.vercel.app

# Additional frontend URLs (optional, comma-separated)
# Use this for preview deployments or multiple domains
FRONTEND_URLS=https://preview-branch.vercel.app,https://staging.example.com
```

4. Make sure your Supabase database has a `businesses` table with the following columns:
   - `name` (text)
   - `description` (text)
   - `latitude` (numeric/float)
   - `longitude` (numeric/float)

## Running the Application

```bash
uvicorn main:app --reload
```

The API will be available at `http://localhost:8000`

## API Endpoints

- `GET /` - Root endpoint
- `GET /health` - Health check
- `GET /businesses` - Get all businesses

## API Documentation

Once running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Testing Database Connection

Test the connection pooler:
```bash
python test_pooler_connection.py
```

Test standard database connection:
```bash
python test_db_connection.py
```




