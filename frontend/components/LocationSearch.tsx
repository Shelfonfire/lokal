'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import type { MapRef } from 'react-map-gl/mapbox';

interface LocationSearchProps {
  mapRef: React.RefObject<MapRef>;
  onLocationSelect?: (locationData: {
    coordinates: [number, number];
    placeName: string;
    placeType: string;
    zoom: number;
  }) => void;
  accessToken: string;
  placeholder?: string;
}

interface LocationFeature {
  id: string;
  text: string;
  place_name: string;
  geometry: {
    coordinates: [number, number];
  };
  place_type: string[];
}

export default function LocationSearch({ 
  mapRef, 
  onLocationSelect,
  accessToken,
  placeholder = 'Search for a location...'
}: LocationSearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<LocationFeature[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  /**
   * Fetch location suggestions from Mapbox Geocoding API
   */
  const searchLocations = useCallback(async (searchQuery: string) => {
    if (!searchQuery || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Get map center for proximity bias
      const mapInstance = mapRef.current;
      let center = { lng: 0.1313, lat: 52.1951 }; // Default to Cambridge, UK
      
      if (mapInstance) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const map = (mapInstance as any)._map || (mapInstance as any).getMap?.();
        if (map && map.getCenter) {
          const mapCenter = map.getCenter();
          center = { lng: mapCenter.lng, lat: mapCenter.lat };
        }
      }

      // Mapbox Geocoding API endpoint
      const endpoint = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json`;
      
      const response = await fetch(
        `${endpoint}?` + new URLSearchParams({
          access_token: accessToken,
          proximity: `${center.lng},${center.lat}`,
          country: 'gb', // Limit to UK
          types: 'place,address,poi,locality',
          language: 'en',
          limit: '5',
          autocomplete: 'true'
        })
      );

      const data = await response.json();
      
      if (data.features) {
        setSuggestions(data.features);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Geocoding error:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  }, [mapRef, accessToken]);

  // Debounced search
  useEffect(() => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer - only search after user stops typing for 300ms
    debounceTimer.current = setTimeout(() => {
      searchLocations(query);
    }, 300);

    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, [query, accessToken, searchLocations]);

  /**
   * Handle location selection
   */
  const handleSelectLocation = (location: LocationFeature) => {
    const coords = location.geometry.coordinates; // [lng, lat]
    const placeName = location.place_name;
    
    // Update input
    setQuery(location.text || placeName);
    setShowSuggestions(false);
    
    // Determine appropriate zoom level based on place type
    const zoomLevels: Record<string, number> = {
      'country': 5,
      'region': 7,
      'postcode': 12,
      'district': 11,
      'place': 12,
      'locality': 13,
      'neighborhood': 14,
      'address': 16,
      'poi': 16
    };
    
    const placeType = location.place_type?.[0] || 'place';
    const zoom = zoomLevels[placeType] || 12;
    
    // Animate map to location
    const mapInstance = mapRef.current;
    if (mapInstance) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const map = (mapInstance as any)._map || (mapInstance as any).getMap?.();
      if (map && map.flyTo) {
        map.flyTo({
          center: coords,
          zoom: zoom,
          duration: 1500,
          easing: (t: number) => t * (2 - t), // ease-out quad
          essential: true
        });
      }
    }
    
    // Callback for parent component
    if (onLocationSelect) {
      onLocationSelect({
        coordinates: coords,
        placeName: placeName,
        placeType: placeType,
        zoom: zoom
      });
    }
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
      setQuery('');
    }
  };

  return (
    <div className="location-search" ref={searchRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
        />
        
        {isLoading && (
          <div className="search-loading">
            <span className="loading-spinner"></span>
          </div>
        )}
        
        {query && !isLoading && (
          <button 
            className="search-clear"
            onClick={() => {
              setQuery('');
              setSuggestions([]);
              setShowSuggestions(false);
            }}
            aria-label="Clear search"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="search-suggestions">
          {suggestions.map((location, index) => (
            <li
              key={`${location.id}-${index}`}
              className="suggestion-item"
              onClick={() => handleSelectLocation(location)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectLocation(location)}
              tabIndex={0}
              role="button"
            >
              <span className="suggestion-icon">📍</span>
              <div className="suggestion-content">
                <div className="suggestion-name">{location.text}</div>
                <div className="suggestion-context">{location.place_name}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {showSuggestions && query.length > 0 && suggestions.length === 0 && !isLoading && (
        <div className="search-no-results">
          <p>No locations found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}


