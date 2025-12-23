# Business API Backend

FastAPI application for managing business data with Supabase PostgreSQL.

## Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Create a `.env` file in the backend directory with your Supabase database credentials:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
```

Or use individual components:
```env
DB_HOST=db.your-project.supabase.co
DB_PORT=5432
DB_NAME=postgres
DB_USER=postgres
DB_PASSWORD=your-password-here
```

3. Make sure your Supabase database has a `businesses` table with the following columns:
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




