'use client';

import { useMemo } from 'react';
import { Marker } from 'react-map-gl/mapbox';
import { Business } from '@/types/business';

interface BusinessMarkerProps {
  business: Business;
  onClick: () => void;
  isHovered?: boolean;
  cursorLocation: { lng: number; lat: number } | null;
  isSelected?: boolean;
  hasPopupOpen?: boolean;
  isFiltered?: boolean; // True if business doesn't match category filter
}

// Function to calculate distance between two coordinates in km (Haversine formula)
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c; // Distance in km
  return d;
}

function deg2rad(deg: number): number {
  return deg * (Math.PI / 180);
}

export default function BusinessMarker({ business, onClick, isHovered = false, cursorLocation, isSelected = false, hasPopupOpen = false, isFiltered = false }: BusinessMarkerProps) {
  // Proximity Effect: Calculate opacity/scale based on distance to cursor
  const proximityEffect = useMemo(() => {
    if (!cursorLocation) return { opacity: 1, scale: 1 };
    
    const distance = calculateDistance(
      business.latitude, 
      business.longitude, 
      cursorLocation.lat, 
      cursorLocation.lng
    );
    
    // Define proximity radius (e.g., 5km)
    const radius = 5; 
    
    if (distance > radius) {
      // Outside radius: fade out
      return { opacity: 0.4, scale: 0.8 };
    } else {
      // Inside radius: full visibility, slight scale up
      const factor = 1 - (distance / radius); // 1 at center, 0 at edge
      return { opacity: 1, scale: 1 + (factor * 0.2) }; // Scale up to 1.2x at center
    }
  }, [business.latitude, business.longitude, cursorLocation]);

  // Filter effect: Apply visual changes based on filter state
  const filterEffect = useMemo(() => {
    if (isFiltered) {
      // Filtered out: 15% smaller, grey color
      return { scale: 0.85, opacity: 0.5, color: '#888888' }; // Grey
    } else {
      // Matches filter: 15% bigger, keep original color
      return { scale: 1.15, opacity: 1, color: null }; // null means use original color
    }
  }, [isFiltered]);

  // Default light green color (sage green from color scheme)
  const baseMarkerColor = '#8BA888'; // sage green - light green
  
  // Use filter effect color if filtered, otherwise use base color
  const markerColor = filterEffect.color || baseMarkerColor;

  // Create SVG with colored icon
  const iconSvg = useMemo(() => {
    if (!business.icon) return null;
    
    // Replace stroke color in SVG with marker color (or use terracotta if hovered)
    // If filtered, use grey; if hovered, use terracotta; otherwise use marker color
    const color = isFiltered ? '#888888' : (isHovered ? '#C86B4B' : markerColor);
    const coloredSvg = business.icon
      .replace(/stroke="currentColor"/g, `stroke="${color}"`)
      .replace(/stroke="[^"]*"/g, `stroke="${color}"`)
      .replace(/fill="currentColor"/g, `fill="${color}"`)
      .replace(/fill="none"/g, `fill="none"`);
    
    return coloredSvg;
  }, [business.icon, markerColor, isHovered, isFiltered]);

  if (!iconSvg) return null;

  const handleClick = (e?: React.MouseEvent | { stopPropagation?: () => void; originalEvent?: { stopPropagation?: () => void }; nativeEvent?: { stopPropagation?: () => void } }) => {
    // Try to stop event propagation if the event object supports it
    if (e) {
      if (typeof e.stopPropagation === 'function') {
        e.stopPropagation();
      }
      if ('originalEvent' in e && e.originalEvent && typeof e.originalEvent.stopPropagation === 'function') {
        e.originalEvent.stopPropagation();
      }
      // For React synthetic events
      if ('nativeEvent' in e && e.nativeEvent && typeof e.nativeEvent.stopPropagation === 'function') {
        e.nativeEvent.stopPropagation();
      }
    }
    onClick();
  };

  // Calculate z-index: lower when popup is open (unless this is the selected marker)
  const getZIndex = () => {
    if (isSelected) return 1000; // Selected marker should be visible
    if (hasPopupOpen) return 0; // Other markers should be behind popup
    if (isHovered) return 10; // Hovered marker slightly higher
    return 1; // Default
  };

  // Calculate final size: base size * proximity effect * filter effect
  const baseSize = 32;
  const proximityScale = cursorLocation ? proximityEffect.scale : 1;
  const finalScale = proximityScale * filterEffect.scale;
  const finalSize = isHovered ? 40 : baseSize * finalScale;
  
  // Calculate final opacity: proximity effect * filter effect
  const finalOpacity = (isHovered ? 1 : proximityEffect.opacity) * filterEffect.opacity;

  return (
    <Marker
      longitude={business.longitude}
      latitude={business.latitude}
      anchor="center"
      onClick={handleClick}
      style={{ 
        opacity: finalOpacity, 
        zIndex: getZIndex() 
      }}
    >
      <div
        className="business-marker-icon"
        onClick={handleClick}
        style={{
          width: `${finalSize}px`,
          height: `${finalSize}px`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F5F1E8', // cream background
          borderRadius: '50%',
          padding: '4px',
          cursor: 'pointer',
          transition: 'width 0.3s ease, height 0.3s ease, opacity 0.3s ease, border-color 0.3s ease, box-shadow 0.3s ease, filter 0.3s ease, transform 0.3s ease',
          boxShadow: isHovered 
            ? '0 8px 24px rgba(45, 95, 63, 0.4)' 
            : '0 4px 12px rgba(45, 95, 63, 0.2)',
          border: `2px solid ${isHovered ? '#C86B4B' : markerColor}`,
          transform: `scale(${isHovered ? 1.1 : 1})`,
          filter: isFiltered ? 'grayscale(100%)' : 'none', // Apply grayscale filter for filtered markers
        }}
        dangerouslySetInnerHTML={{ __html: iconSvg }}
      />
    </Marker>
  );
}

