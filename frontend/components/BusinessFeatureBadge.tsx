'use client';

import React from 'react';
import { BusinessFeature } from '@/utils/businessFeatures';

interface FeatureBadgeProps {
  feature: BusinessFeature;
}

export default function BusinessFeatureBadge({ feature }: FeatureBadgeProps) {
  // Overhaul SVG processing: Force it to be an outline only
  const processedSvg = feature.svg
    .replace(/<svg/, '<svg fill="none" stroke-width="2" ') // Force stroke weight
    .replace(/stroke="currentColor"/gi, 'stroke="#F5F1E8"') // Use your cream color
    .replace(/fill="currentColor"/gi, 'fill="none"')        // Prevent solid blocks
    .replace(/width="24"/g, 'width="100%"')                // Responsive
    .replace(/height="24"/g, 'height="100%"');

  return (
    <div 
      className="feature-badge-overhaul" 
      title={feature.name}
      aria-label={feature.name}
    >
      <div 
        className="feature-badge-icon-wrapper"
        dangerouslySetInnerHTML={{ __html: processedSvg }}
      />
    </div>
  );
}


