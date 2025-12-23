/**
 * Business Features Utility
 * Maps feature names from CSV to JSON schema keys and provides SVG icons
 */

// Map CSV feature names to JSON schema keys
const featureNameToKey: Record<string, string> = {
  'Employee Count': 'employee_count',
  'Number of Locations': 'location_count',
  'Years in Business': 'years_in_business',
  'Business Ownership Type': 'ownership_type',
  'Local Sourcing & Production Score': 'local_sourcing_production_score',
  'Plastic-Free': 'plastic_free',
  'Production Method': 'production_method',
  'Plant-Based Options': 'plant_based',
  'Meat-Free Options': 'meat_free',
  'Organic Certified': 'organic_certified',
  'Allergen-Friendly Options': 'allergen_friendly',
};

// Feature SVGs from CSV (parsed)
const featureSVGs: Record<string, string> = {
  'Employee Count': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-user"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M8 7a4 4 0 1 0 8 0a4 4 0 0 0 -8 0" /><path d="M6 21v-2a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4v2" /></svg>',
  'Number of Locations': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-store-icon lucide-store"><path d="M15 21v-5a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v5"/><path d="M17.774 10.31a1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.451 0 1.12 1.12 0 0 0-1.548 0 2.5 2.5 0 0 1-3.452 0 1.12 1.12 0 0 0-1.549 0 2.5 2.5 0 0 1-3.77-3.248l2.889-4.184A2 2 0 0 1 7 2h10a2 2 0 0 1 1.653.873l2.895 4.192a2.5 2.5 0 0 1-3.774 3.244"/><path d="M4 10.95V19a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8.05"/></svg>',
  'Business Ownership Type': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-briefcase-business-icon lucide-briefcase-business"><path d="M12 12h.01"/><path d="M16 6V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><path d="M22 13a18.15 18.15 0 0 1-20 0"/><rect width="20" height="14" x="2" y="6" rx="2"/></svg>',
  'Plastic-Free': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-shopping-bag-icon lucide-shopping-bag"><path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/></svg>',
  'Local Sourcing & Production Score': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-world-pin"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M20.972 11.291a9 9 0 1 0 -8.322 9.686" /><path d="M3.6 9h16.8" /><path d="M3.6 15h8.9" /><path d="M11.5 3a17 17 0 0 0 0 18" /><path d="M12.5 3a16.986 16.986 0 0 1 2.578 9.018" /><path d="M21.121 20.121a3 3 0 1 0 -4.242 0c.418 .419 1.125 1.045 2.121 1.879c1.051 -.89 1.759 -1.516 2.121 -1.879z" /><path d="M19 18v.01" /></svg>',
  'Production Method': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-pickaxe-icon lucide-pickaxe"><path d="m14 13-8.381 8.38a1 1 0 0 1-3.001-3L11 9.999"/><path d="M15.973 4.027A13 13 0 0 0 5.902 2.373c-1.398.342-1.092 2.158.277 2.601a19.9 19.9 0 0 1 5.822 3.024"/><path d="M16.001 11.999a19.9 19.9 0 0 1 3.024 5.824c.444 1.369 2.26 1.676 2.603.278A13 13 0 0 0 20 8.069"/><path d="M18.352 3.352a1.205 1.205 0 0 0-1.704 0l-5.296 5.296a1.205 1.205 0 0 0 0 1.704l2.296 2.296a1.205 1.205 0 0 0 1.704 0l5.296-5.296a1.205 1.205 0 0 0 0-1.704z"/></svg>',
  'Plant-Based Options': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-plant"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 15h10v4a2 2 0 0 1 -2 2h-6a2 2 0 0 1 -2 -2v-4z" /><path d="M12 9a6 6 0 0 0 -6 -6h-3v2a6 6 0 0 0 6 6h3" /><path d="M12 11a6 6 0 0 1 6 -6h3v1a6 6 0 0 1 -6 6h-3" /><path d="M12 15l0 -6" /></svg>',
  'Meat-Free Options': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-meat-off"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M13.62 8.382l1.966 -1.967a2 2 0 1 1 3.414 -1.415a2 2 0 1 1 -1.413 3.414l-1.82 1.821" /><path d="M5.904 18.596c2.733 2.734 5.9 4 7.07 2.829c1.172 -1.172 -.094 -4.338 -2.828 -7.071c-2.733 -2.734 -5.9 -4 -7.07 -2.829c-1.172 1.172 .094 4.338 2.828 7.071z" /><path d="M7.5 16l1 1" /><path d="M12.975 21.425c1.582 -1.582 2.679 -3.407 3.242 -5.2" /><path d="M16.6 12.6c-.16 -1.238 -.653 -2.345 -1.504 -3.195c-.85 -.85 -1.955 -1.344 -3.192 -1.503" /><path d="M8.274 8.284c-1.792 .563 -3.616 1.66 -5.198 3.242" /><path d="M3 3l18 18" /></svg>',
  'Organic Certified': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-dna-2"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M17 3v1c-.01 3.352 -1.68 6.023 -5.008 8.014c-3.328 1.99 3.336 -2 .008 -.014c-3.328 1.99 -5 4.662 -5.008 8.014v1" /><path d="M17 21.014v-1c-.01 -3.352 -1.68 -6.023 -5.008 -8.014c-3.328 -1.99 3.336 2 .008 .014c-3.328 -1.991 -5 -4.662 -5.008 -8.014v-1" /><path d="M7 4h10" /><path d="M7 20h10" /><path d="M8 8h8" /><path d="M8 16h8" /></svg>',
  'Allergen-Friendly Options': '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-nut-off-icon lucide-nut-off"><path d="M12 4V2"/><path d="M5 10v4a7.004 7.004 0 0 0 5.277 6.787c.412.104.802.292 1.102.592L12 22l.621-.621c.3-.3.69-.488 1.102-.592a7.01 7.01 0 0 0 4.125-2.939"/><path d="M19 10v3.343"/><path d="M12 12c-1.349-.573-1.905-1.005-2.5-2-.546.902-1.048 1.353-2.5 2-1.018-.644-1.46-1.08-2-2-1.028.71-1.69.918-3 1 1.081-1.048 1.757-2.03 2-3 .194-.776.84-1.551 1.79-2.21m11.654 5.997c.887-.457 1.28-.891 1.556-1.787 1.032.916 1.683 1.157 3 1-1.297-1.036-1.758-2.03-2-3-.5-2-4-4-8-4-.74 0-1.461.068-2.15.192"/><line x1="2" x2="22" y1="2" y2="22"/></svg>',
};

export interface BusinessFeature {
  key: string;
  name: string;
  value: string | boolean;
  svg: string;
}

/**
 * Get all available feature names
 */
export function getAvailableFeatures(): string[] {
  return Object.keys(featureNameToKey);
}

/**
 * Get feature SVG by feature name
 */
export function getFeatureSVG(featureName: string): string | undefined {
  return featureSVGs[featureName];
}

/**
 * Get feature key by feature name
 */
export function getFeatureKey(featureName: string): string | undefined {
  return featureNameToKey[featureName];
}

/**
 * Generate random features for a business (1-2 features)
 */
export function generateRandomFeatures(businessIndex: number): BusinessFeature[] {
  const availableFeatures = getAvailableFeatures();
  const numFeatures = Math.random() < 0.5 ? 1 : 2; // 50% chance of 1 or 2 features
  
  // Use business index as seed for consistent randomness
  const selectedFeatures: BusinessFeature[] = [];
  const shuffled = [...availableFeatures].sort(() => Math.random() - 0.5);
  
  for (let i = 0; i < numFeatures && i < shuffled.length; i++) {
    const featureName = shuffled[i];
    const key = getFeatureKey(featureName);
    const svg = getFeatureSVG(featureName);
    
    if (key && svg) {
      // Generate a random value based on feature type
      let value: string | boolean = '';
      
      // For boolean features, randomly set true/false
      if (key === 'plastic_free' || key === 'organic_certified' || key === 'allergen_friendly') {
        value = Math.random() > 0.5;
      } else {
        // For select features, pick a random option (simplified - just use the key for now)
        value = key;
      }
      
      selectedFeatures.push({
        key,
        name: featureName,
        value,
        svg,
      });
    }
  }
  
  return selectedFeatures;
}


