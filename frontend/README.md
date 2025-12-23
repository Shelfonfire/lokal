# Business Map Frontend

Next.js 14 application with a full-screen Mapbox map displaying businesses from the FastAPI backend.

## Features

- Full-screen interactive Mapbox map
- Business markers displayed on the map
- Click markers to see business name and description in a popup
- Responsive design with Tailwind CSS

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env.local` file in the frontend directory:
```env
NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=your_mapbox_access_token_here
NEXT_PUBLIC_API_URL=http://localhost:8000
```

   Get your Mapbox access token from: https://account.mapbox.com/access-tokens/

3. Make sure the FastAPI backend is running on `http://localhost:8000` (or update `NEXT_PUBLIC_API_URL` accordingly)

## Running the Application

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

- `app/page.tsx` - Main page component
- `components/BusinessMap.tsx` - Map component with markers and popups
- `types/business.ts` - TypeScript types for business data

## Technologies

- Next.js 14 (App Router)
- React Map GL (Mapbox integration)
- Tailwind CSS
- TypeScript
