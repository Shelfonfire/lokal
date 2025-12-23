/**
 * Business Categories Cache
 * 
 * This file contains the list of business categories used for filtering.
 * Update this list periodically as the database of business categories expands.
 */

export const businessCategories = [
  'Arts & Crafts',
  'Automotive',
  'Beauty & Wellness',
  'Education',
  'Entertainment',
  'Fashion & Apparel',
  'Finance',
  'Food & Beverage',
  'Healthcare',
  'Home & Garden',
  'Hospitality',
  'Legal Services',
  'Manufacturing',
  'Pet Services',
  'Real Estate',
  'Retail',
  'Services',
  'Sports & Recreation',
  'Technology',
  'Transportation',
].sort(); // Sort alphabetically

/**
 * Get filtered categories based on search query
 */
export function getFilteredCategories(query: string): string[] {
  if (!query) return businessCategories;
  
  const lowerQuery = query.toLowerCase();
  return businessCategories.filter(category =>
    category.toLowerCase().includes(lowerQuery)
  );
}


