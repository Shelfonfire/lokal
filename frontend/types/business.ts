import { BusinessFeature } from '@/utils/businessFeatures';

export interface Business {
  name: string;
  description: string;
  latitude: number;
  longitude: number;
  // Dummy data fields (hardcoded for now)
  sustainabilityScore?: number; // 0-100
  category?: string;
  logo?: string; // URL to business logo
  icon?: string; // SVG icon for map marker
  isVerified?: boolean; // Verified business badge
  impactMetrics?: {
    carbonSaved?: string;
    localSourcing?: string;
    wasteReduction?: string;
    renewableEnergy?: string;
  };
  socialLinks?: {
    website?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    tiktok?: string;
  };
  relatedBusinesses?: string[]; // Array of business names for connections
  features?: BusinessFeature[]; // Business features with icons
  openingHours?: {
    day: string;
    start: string;
    end: string;
  }[];
}


