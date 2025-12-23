'use client';

import { useRef } from 'react';
import LocationSearch from './LocationSearch';
import BusinessTypeSearch from './BusinessTypeSearch';
import type { MapRef } from 'react-map-gl/mapbox';

interface HeaderProps {
  onSearch: (query: string) => void;
  mapRef?: React.RefObject<MapRef>;
  mapboxAccessToken?: string;
}

export default function Header({ onSearch, mapRef, mapboxAccessToken }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-cream/90 backdrop-blur-sm border-b border-soft-gray-green/20 px-6 py-4 flex items-center justify-between shadow-sm h-20">
      {/* Brand */}
      <div className="flex-shrink-0">
        <h1 className="font-heading text-3xl font-bold text-forest-green tracking-tight">Lokal</h1>
      </div>

      {/* Dual Search Bar */}
      <div className="flex-1 max-w-4xl mx-8">
        <div className="flex gap-4 items-center">
          {/* Location Search */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-deep-earth-brown/70 mb-1.5 font-body">
              Location
            </label>
            {mapRef && mapboxAccessToken ? (
              <LocationSearch
                mapRef={mapRef}
                accessToken={mapboxAccessToken}
                placeholder="Search for a location..."
              />
            ) : (
              <input
                type="text"
                className="search-input"
                placeholder="Location search unavailable"
                disabled
              />
            )}
          </div>

          {/* Business Type Search */}
          <div className="flex-1">
            <label className="block text-xs font-medium text-deep-earth-brown/70 mb-1.5 font-body">
              Business Type
            </label>
            <BusinessTypeSearch
              onSearch={onSearch}
              placeholder="Search by business type..."
            />
          </div>
        </div>
      </div>

      {/* Placeholder for right side (Profile/Menu) - Optional based on brief */}
      <div className="w-20"></div>
    </header>
  );
}


