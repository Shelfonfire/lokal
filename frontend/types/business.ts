import { BusinessFeature } from '@/utils/businessFeatures';

export interface Business {
  id?: number;
  name: string;
  description?: string;
  latitude: number;
  longitude: number;
  category?: string;
  categorySvg?: string;
  logo?: string; // URL to business logo
  icon?: string; // SVG icon for map marker (assigned client-side)
  isVerified?: boolean; // Verified business badge
  socialLinks?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  features?: BusinessFeature[]; // Business features with icons from database
  openingHours?: {
    day: string;
    start: string;
    end: string;
  }[];
  // Legacy fields (kept for backward compatibility, not used with new schema)
  sustainabilityScore?: number; // 0-100
  impactMetrics?: {
    carbonSaved?: string;
    localSourcing?: string;
    wasteReduction?: string;
    renewableEnergy?: string;
  };
  relatedBusinesses?: string[]; // Array of business names for connections
}


