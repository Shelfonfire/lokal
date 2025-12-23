'use client';

import { useState, useRef } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import BusinessMap from '@/components/BusinessMap';
import type { MapRef } from 'react-map-gl/mapbox';

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('');
  const mapRef = useRef<MapRef>(null);
  
  // Get Mapbox access token from environment variable
  const mapboxAccessToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || '';

  if (!mapboxAccessToken) {
    return (
      <div className="w-full h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-6 bg-white rounded-lg shadow-md">
          <p className="text-red-600 mb-2">Mapbox access token is missing</p>
          <p className="text-sm text-gray-600">
            Please set NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN in your .env.local file
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col relative bg-warm-cream">
      <Header 
        onSearch={setSearchQuery} 
        mapRef={mapRef}
        mapboxAccessToken={mapboxAccessToken}
      />
      
      {/* Map Section - Hero */}
      <main className="flex-grow w-full relative h-[85vh] mt-20"> {/* mt-20 to account for fixed header */}
        <BusinessMap 
          mapboxAccessToken={mapboxAccessToken} 
          searchQuery={searchQuery}
          mapRef={mapRef}
        />
      </main>

      {/* Footer - Visible on Scroll */}
      <Footer />
    </div>
  );
}
