'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Map, Source, Layer, Marker, Popup } from 'react-map-gl/mapbox';
import type { MapRef } from 'react-map-gl/mapbox';
import { Business } from '@/types/business';
import BusinessCard from './BusinessCard';
import BusinessMarker from './BusinessMarker';
import { getRandomIcon } from '@/utils/categoryIcons';
import { generateRandomFeatures } from '@/utils/businessFeatures';
import { fetchAPI } from '@/utils/api';

import ExternalLinkModal from './ExternalLinkModal';

interface BusinessMapProps {
  mapboxAccessToken: string;
  searchQuery?: string;
  mapRef?: React.RefObject<MapRef>;
}

interface MapInteractionHandlersProps {
  mapRef: React.RefObject<MapRef>;
  onMarkerClick: (business: Business | null) => void;
  enrichedBusinesses: Business[];
  setHoveredBusinessId: (id: string | null) => void;
  hoveredBusinessId: string | null;
  cursorLocation: { lng: number; lat: number } | null;
}

// Helper function to add dummy data to businesses
function enrichBusinessData(businesses: Business[]): Business[] {
  const categories = ['Food & Beverage', 'Retail', 'Services', 'Manufacturing', 'Technology'];
  const carbonSavedOptions = ['1.2 tons', '2.5 tons', '3.8 tons', '1.8 tons', '2.1 tons'];
  const localSourcingOptions = ['85%', '92%', '100%', '78%', '95%'];
  const wasteReductionOptions = ['75%', '85%', '90%', '80%', '88%'];
  const renewableEnergyOptions = ['95%', '100%', '85%', '90%', '100%'];
  
  return businesses.map((business, index) => ({
    ...business,
    category: categories[index % categories.length],
    icon: getRandomIcon(), // Assign random icon for now
    isVerified: index % 3 !== 0, // Most businesses verified
    impactMetrics: {
      carbonSaved: carbonSavedOptions[index % carbonSavedOptions.length],
      localSourcing: localSourcingOptions[index % localSourcingOptions.length],
      wasteReduction: wasteReductionOptions[index % wasteReductionOptions.length],
      renewableEnergy: renewableEnergyOptions[index % renewableEnergyOptions.length],
    },
    socialLinks: {
      website: `https://${business.name.toLowerCase().replace(/\s+/g, '')}.example.com`,
      facebook: index % 2 === 0 ? `https://facebook.com/${business.name.toLowerCase().replace(/\s+/g, '')}` : undefined,
      instagram: `https://instagram.com/${business.name.toLowerCase().replace(/\s+/g, '')}`,
      twitter: index % 3 === 0 ? `https://x.com/${business.name.toLowerCase().replace(/\s+/g, '')}` : undefined,
      tiktok: index % 4 === 0 ? `https://tiktok.com/@${business.name.toLowerCase().replace(/\s+/g, '')}` : undefined,
    },
    relatedBusinesses: index < businesses.length - 1 ? [businesses[index + 1].name] : [],
    features: generateRandomFeatures(index), // Generate 1-2 random features per business
    openingHours: [
      { day: 'Monday', start: '9:00', end: '17:00' },
      { day: 'Tuesday', start: '9:00', end: '17:00' },
      { day: 'Wednesday', start: '9:00', end: '17:00' },
      { day: 'Thursday', start: '9:00', end: '17:00' },
      { day: 'Friday', start: '9:00', end: '17:00' },
      { day: 'Saturday', start: '10:00', end: '15:00' },
    ],
  }));
}

// Convert businesses to GeoJSON format
function businessesToGeoJSON(businesses: Business[]) {
  return {
    type: 'FeatureCollection' as const,
    features: businesses.map((business, index) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [business.longitude, business.latitude],
      },
      properties: {
        id: `business-${index}`,
        name: business.name,
        description: business.description || '',
        category: business.category || 'Business',
        impactMetrics: business.impactMetrics || {},
        relatedBusinesses: business.relatedBusinesses || [],
        icon: business.icon || '',
      },
    })),
  };
}

export default function BusinessMap({ mapboxAccessToken, searchQuery = '', mapRef: externalMapRef }: BusinessMapProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [enrichedBusinesses, setEnrichedBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredBusinessId, setHoveredBusinessId] = useState<string | null>(null);
  const [cursorLocation, setCursorLocation] = useState<{ lng: number; lat: number } | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  
  // External Link Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [pendingLink, setPendingLink] = useState<{ url: string; destination: string } | null>(null);
  
  // Use external mapRef if provided, otherwise create internal one
  const internalMapRef = useRef<MapRef>(null);
  const mapRef = externalMapRef || internalMapRef;

  const handleExternalLink = (url: string, destination: string) => {
    setPendingLink({ url, destination });
    setIsModalOpen(true);
    
    // Disable map interactions when modal opens
    const mapInstance = mapRef.current;
    if (mapInstance) {
      const map = (mapInstance as any)._map || (mapInstance as any).getMap?.();
      if (map) {
        map.boxZoom.disable();
        map.scrollZoom.disable();
        map.dragPan.disable();
        map.dragRotate.disable();
        map.keyboard.disable();
        map.doubleClickZoom.disable();
        map.touchZoomRotate.disable();
      }
    }
  };

  const confirmExternalLink = () => {
    if (pendingLink) {
      window.open(pendingLink.url, '_blank', 'noopener,noreferrer');
    }
    setIsModalOpen(false);
    setPendingLink(null);
    
    // Re-enable map interactions when modal closes
    const mapInstance = mapRef.current;
    if (mapInstance) {
      const map = (mapInstance as any)._map || (mapInstance as any).getMap?.();
      if (map) {
        map.boxZoom.enable();
        map.scrollZoom.enable();
        map.dragPan.enable();
        map.dragRotate.enable();
        map.keyboard.enable();
        map.doubleClickZoom.enable();
        map.touchZoomRotate.enable();
      }
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setPendingLink(null);
    
    // Re-enable map interactions when modal closes
    const mapInstance = mapRef.current;
    if (mapInstance) {
      const map = (mapInstance as any)._map || (mapInstance as any).getMap?.();
      if (map) {
        map.boxZoom.enable();
        map.scrollZoom.enable();
        map.dragPan.enable();
        map.dragRotate.enable();
        map.keyboard.enable();
        map.doubleClickZoom.enable();
        map.touchZoomRotate.enable();
      }
    }
  };

  // Map center: 52.1951° N, 0.1313° E
  const [viewState, setViewState] = useState({
    longitude: 0.1313,
    latitude: 52.1951,
    zoom: 12,
  });

  useEffect(() => {
    fetchBusinesses();
  }, []);

  const fetchBusinesses = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use the API helper function
      const data = await fetchAPI('/businesses');
      setBusinesses(data);
      
      // Add dummy data
      const enriched = enrichBusinessData(data);
      setEnrichedBusinesses(enriched);
      setFilteredBusinesses(enriched);
      
      // Center map on specified location
      setViewState({
        longitude: 0.1313,
        latitude: 52.1951,
        zoom: 12,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch businesses');
      console.error('Error fetching businesses:', err);
    } finally {
      setLoading(false);
    }
  };

  // Filter businesses when search query changes (category search)
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBusinesses(enrichedBusinesses);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    // Filter by category match (exact or contains)
    const filtered = enrichedBusinesses.filter(b => 
      b.category?.toLowerCase().includes(query) ||
      b.category?.toLowerCase() === query
    );
    setFilteredBusinesses(filtered);
  }, [searchQuery, enrichedBusinesses]);

  const handleMarkerClick = useCallback((business: Business | null) => {
    console.log('handleMarkerClick called with:', business?.name || 'null');
    setSelectedBusiness(business);
  }, []);

  const handleClosePopup = useCallback(() => {
    setSelectedBusiness(null);
  }, []);

  // Get color based on sustainability score
  const getMarkerColor = (score: number): string => {
    if (score >= 90) return '#D4A574'; // golden ochre
    if (score >= 50) return '#2D5F3F'; // forest green
    return '#8BA888'; // sage green
  };

  if (loading) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: '#FCF8F0' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: '#2D5F3F' }}></div>
          <p style={{ color: '#4A3829', fontFamily: 'var(--font-body)' }}>Loading businesses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full h-screen flex items-center justify-center" style={{ backgroundColor: '#FCF8F0' }}>
        <div className="text-center p-6 rounded-lg shadow-md" style={{ backgroundColor: '#FDFCFA', boxShadow: '0 4px 12px rgba(45, 95, 63, 0.12)' }}>
          <p className="mb-4" style={{ color: '#C86B4B', fontFamily: 'var(--font-body)' }}>Error: {error}</p>
          <button
            onClick={fetchBusinesses}
            className="px-4 py-2 rounded hover:opacity-90 transition-opacity"
            style={{ backgroundColor: '#2D5F3F', color: '#F5F1E8', fontFamily: 'var(--font-body)' }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const geoJSONData = businessesToGeoJSON(filteredBusinesses);

  return (
    <div className="w-full h-full relative">
      <Map
        ref={mapRef}
        {...viewState}
        onMove={(evt) => {
          // Disable map movement when modal is open
          if (!isModalOpen) {
            setViewState(evt.viewState);
          }
          // Track cursor for proximity effect
          // Note: mapRef.current.getMap().on('mousemove') is handled in MapInteractionHandlers
        }}
        mapboxAccessToken={mapboxAccessToken}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/shelf/cmjfrqfwx001e01sdb9924le0"
        onLoad={(e) => {
          // Map loaded - set flag to allow sources to be added
          setMapLoaded(true);
        }}
      >
        {/* Only render sources after map is loaded */}
        {mapLoaded && (
          <>
        {/* Feature 1: Clustering */}
        <Source
          id="businesses"
          type="geojson"
          data={geoJSONData}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          {/* Cluster circles */}
          <Layer
            id="clusters"
            type="circle"
            filter={['has', 'point_count']}
            paint={{
              'circle-radius': [
                'step',
                ['get', 'point_count'],
                20,
                10, 25,
                20, 30,
              ],
              'circle-color': [
                'step',
                ['get', 'point_count'],
                '#8BA888', // sage green
                10, '#2D5F3F', // forest green
              ],
              'circle-opacity': 0.8,
              'circle-stroke-width': 2,
              'circle-stroke-color': '#F5F1E8', // cream
            }}
          />
          
          {/* Cluster count labels */}
          <Layer
            id="cluster-count"
            type="symbol"
            filter={['has', 'point_count']}
            layout={{
              'text-field': '{point_count_abbreviated}',
              'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
              'text-size': 14,
            }}
            paint={{
              'text-color': '#F5F1E8', // cream
            }}
          />
          
          {/* Individual business markers - Hidden, using Marker components instead */}
          <Layer
            id="business-markers"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-opacity': 0, // Hidden - using Marker components for SVG icons
            }}
          />
        </Source>

        {/* Feature 4: Connecting lines between related businesses */}
        {enrichedBusinesses.length > 0 && (
          <Source
            id="connections"
            type="geojson"
            data={{
              type: 'FeatureCollection',
              features: enrichedBusinesses.flatMap((business, index) => {
                const related = business.relatedBusinesses || [];
                return related.map((relatedName) => {
                  const relatedBusiness = enrichedBusinesses.find((b) => b.name === relatedName);
                  if (!relatedBusiness) return null;
                  return {
                    type: 'Feature' as const,
                    geometry: {
                      type: 'LineString' as const,
                      coordinates: [
                        [business.longitude, business.latitude],
                        [relatedBusiness.longitude, relatedBusiness.latitude],
                      ],
                    },
                    properties: {
                      from: business.name,
                      to: relatedName,
                    },
                  };
                }).filter(Boolean) as any[];
              }),
            }}
          >
            <Layer
              id="connection-lines"
              type="line"
              layout={{
                'line-join': 'round',
                'line-cap': 'round',
              }}
              paint={{
                'line-color': '#8BA888', // sage green
                'line-width': 2,
                'line-opacity': 0.4,
                'line-dasharray': [2, 2],
              }}
            />
          </Source>
        )}

        {/* Feature 2: Pulse animation layer (will be controlled via hover) */}
        <Source
          id="business-pulse"
          type="geojson"
          data={geoJSONData}
        >
          <Layer
            id="pulse-layer"
            type="circle"
            filter={['!', ['has', 'point_count']]}
            paint={{
              'circle-radius': hoveredBusinessId ? [
                'case',
                ['==', ['get', 'id'], hoveredBusinessId],
                20, // pulse size
                0,
              ] : 0,
              'circle-color': '#C86B4B', // terracotta
              'circle-opacity': hoveredBusinessId ? 0.3 : 0,
              'circle-stroke-width': 0,
            }}
          />
        </Source>

        {/* Individual business markers with SVG icons */}
        {enrichedBusinesses.map((business, index) => {
          const businessId = `business-${index}`;
          // Check if this business matches the category filter
          const matchesFilter = !searchQuery.trim() || 
            business.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            business.category?.toLowerCase() === searchQuery.toLowerCase();
          
          return (
            <BusinessMarker
              key={businessId}
              business={business}
              onClick={() => {
                handleMarkerClick(business);
              }}
              isHovered={hoveredBusinessId === businessId}
              cursorLocation={cursorLocation}
              isSelected={selectedBusiness?.name === business.name}
              hasPopupOpen={!!selectedBusiness}
              isFiltered={!matchesFilter}
            />
          );
        })}

        {/* Map interaction handlers will be set up after map loads */}
        <MapInteractionHandlers
          mapRef={mapRef}
          onMarkerClick={handleMarkerClick}
          enrichedBusinesses={enrichedBusinesses}
          setHoveredBusinessId={setHoveredBusinessId}
          hoveredBusinessId={hoveredBusinessId}
          cursorLocation={cursorLocation}
          setCursorLocation={setCursorLocation}
        />

        {/* Popup */}
        {selectedBusiness && (
          <Popup
            longitude={selectedBusiness.longitude}
            latitude={selectedBusiness.latitude}
            anchor="bottom"
            onClose={handleClosePopup}
            closeOnClick={true}
            closeOnMove={false}
            closeButton={false}
            className="custom-popup"
            maxWidth="380px"
          >
            <BusinessCard 
              business={selectedBusiness} 
              variant="compact" 
              onExternalLink={handleExternalLink}
            />
          </Popup>
        )}
        
        {/* Proximity Sphere Visualization */}
        {cursorLocation && (
          <Source
            id="cursor-proximity"
            type="geojson"
            data={{
              type: 'Feature',
              geometry: {
                type: 'Point',
                coordinates: [cursorLocation.lng, cursorLocation.lat],
              },
              properties: {},
            }}
          >
            {/* Inner glow */}
            <Layer
              id="cursor-glow"
              type="circle"
              paint={{
                'circle-radius': {
                  stops: [[10, 100], [15, 300]] // Scales with zoom
                },
                'circle-color': '#F5F1E8', // cream
                'circle-opacity': 0.15,
                'circle-blur': 0.8,
              }}
            />
            {/* Outer ring */}
            <Layer
              id="cursor-ring"
              type="circle"
              paint={{
                'circle-radius': {
                  stops: [[10, 100], [15, 300]]
                },
                'circle-color': '#2D5F3F', // forest green
                'circle-opacity': 0.05,
                'circle-stroke-width': 1,
                'circle-stroke-color': '#2D5F3F',
                'circle-stroke-opacity': 0.1,
              }}
            />
          </Source>
        )}
          </>
        )}
      </Map>
      
      {/* External Link Warning Modal */}
      {selectedBusiness && (
        <ExternalLinkModal
          isOpen={isModalOpen}
          onClose={handleCloseModal}
          onConfirm={confirmExternalLink}
          businessName={selectedBusiness.name}
          destination={pendingLink?.destination || 'website'}
        />
      )}
    </div>
  );
}

// Component to handle map interactions
function MapInteractionHandlers({
  mapRef,
  onMarkerClick,
  enrichedBusinesses,
  setHoveredBusinessId,
  hoveredBusinessId,
  cursorLocation,
  setCursorLocation,
}: MapInteractionHandlersProps & {
  cursorLocation: { lng: number; lat: number } | null;
  setCursorLocation: (loc: { lng: number; lat: number } | null) => void;
}) {
  useEffect(() => {
    const mapRefInstance = mapRef.current;
    if (!mapRefInstance) return;
    
    let map: any = null;
    let cleanup: (() => void) | null = null;
    
    // In react-map-gl, the ref gives direct access to map methods
    // We need to wait for the map to be ready
    const checkMap = () => {
      map = (mapRefInstance as any)._map || (mapRefInstance as any).getMap?.();
      if (!map || !map.loaded()) {
        setTimeout(checkMap, 100);
        return;
      }
      cleanup = setupMapHandlers(map);
    };
    
    function setupMapHandlers(mapInstance: any): () => void {
      
      const handleMarkerClick = (e: any) => {
        const feature = e.features?.[0];
        if (!feature) return;
        
        // Prevent event from bubbling to map click handler
        e.originalEvent?.stopPropagation();
        
        const business = enrichedBusinesses.find(
          (b) => b.name === feature.properties.name
        );
        if (business) {
          onMarkerClick(business);
        }
      };

      const handleMapClick = (e: any) => {
      // Close popup when clicking on map (not on markers or clusters)
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['business-markers', 'clusters'],
      });
      
      // Only close if not clicking on a marker or cluster
      if (features.length === 0) {
        onMarkerClick(null); // Close the popup
      }
    };

      const handleMarkerEnter = (e: any) => {
      if (map.getCanvas()) {
        map.getCanvas().style.cursor = 'pointer';
      }
      const feature = e.features?.[0];
      if (feature) {
        setHoveredBusinessId(feature.properties.id);
        
        // Update marker color to terracotta on hover
        map.setPaintProperty('business-markers', 'circle-color', [
          'case',
          ['==', ['get', 'id'], feature.properties.id],
          '#C86B4B', // terracotta
          [
            'interpolate',
            ['linear'],
            ['get', 'sustainabilityScore'],
            0, '#8BA888',
            50, '#2D5F3F',
            90, '#D4A574',
          ],
        ]);
      }
    };

      const handleMarkerLeave = () => {
      if (map.getCanvas()) {
        map.getCanvas().style.cursor = '';
      }
      setHoveredBusinessId(null);
      
      // Reset marker colors
        map.setPaintProperty('business-markers', 'circle-color', '#8BA888');
    };

      const handleClusterClick = (e: any) => {
      // Prevent event from bubbling to map click handler
      e.originalEvent?.stopPropagation();
      
      const features = map.queryRenderedFeatures(e.point, {
        layers: ['clusters'],
      });
      
      if (features.length === 0) return;
      
      const clusterId = features[0].properties?.cluster_id;
      const source = map.getSource('businesses') as any;
      
      if (source && source.getClusterExpansionZoom) {
        source.getClusterExpansionZoom(clusterId, (err: any, zoom: number) => {
          if (err) return;
          
          map.easeTo({
            center: features[0].geometry.coordinates as [number, number],
            zoom: zoom,
            duration: 500,
          });
        });
      }
    };

      const handleMouseMove = (e: any) => {
        setCursorLocation(e.lngLat);
      };

      map.on('click', 'business-markers', handleMarkerClick);
      map.on('mouseenter', 'business-markers', handleMarkerEnter);
      map.on('mouseleave', 'business-markers', handleMarkerLeave);
      map.on('click', 'clusters', handleClusterClick);
      map.on('click', handleMapClick);
      map.on('mousemove', handleMouseMove);
      map.on('mouseenter', 'clusters', () => {
        if (map.getCanvas()) {
          map.getCanvas().style.cursor = 'pointer';
        }
      });
      map.on('mouseleave', 'clusters', () => {
        if (map.getCanvas()) {
          map.getCanvas().style.cursor = '';
        }
      });

      // Return cleanup function
      return () => {
        if (map) {
          map.off('click', 'business-markers', handleMarkerClick);
          map.off('mouseenter', 'business-markers', handleMarkerEnter);
          map.off('mouseleave', 'business-markers', handleMarkerLeave);
          map.off('click', 'clusters', handleClusterClick);
          map.off('click', handleMapClick);
          map.off('mousemove', handleMouseMove);
          map.off('mouseenter', 'clusters');
          map.off('mouseleave', 'clusters');
        }
      };
    }
    
    checkMap();
    
    // Return cleanup for useEffect
    return () => {
      if (cleanup) {
        cleanup();
      }
    };
  }, [mapRef, onMarkerClick, enrichedBusinesses, setHoveredBusinessId, setCursorLocation]);

  // Feature 2: Pulse animation effect
  useEffect(() => {
    const mapInstance = mapRef.current;
    if (!mapInstance || !hoveredBusinessId) return;
    
    const getMap = () => {
      return (mapInstance as any)._map || (mapInstance as any).getMap?.();
    };
    
    const map = getMap();
    if (!map) return;

    let animationFrame: number;
    let startTime = performance.now();
    const duration = 2000; // 2 seconds

    const animate = (currentTime: number) => {
      if (!hoveredBusinessId) {
        map.setPaintProperty('pulse-layer', 'circle-opacity', 0);
        return;
      }

      const elapsed = (currentTime - startTime) % duration;
      const progress = elapsed / duration;
      
      // Pulse grows from 12 to 32 and fades from 0.4 to 0
      const radius = 12 + (progress * 20);
      const opacity = (1 - progress) * 0.4;

      map.setPaintProperty('pulse-layer', 'circle-radius', [
        'case',
        ['==', ['get', 'id'], hoveredBusinessId],
        radius,
        0,
      ]);
      
      map.setPaintProperty('pulse-layer', 'circle-opacity', [
        'case',
        ['==', ['get', 'id'], hoveredBusinessId],
        opacity,
        0,
      ]);

      animationFrame = requestAnimationFrame(animate);
    };

    animationFrame = requestAnimationFrame(animate);

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [mapRef, hoveredBusinessId]);

  return null;
}

