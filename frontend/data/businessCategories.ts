/**
 * Business Categories - Fetched from API
 * 
 * This file fetches business categories from the backend API.
 */

import { fetchAPI } from '@/utils/api';

export interface Category {
  id: number;
  category: string;
  description?: string;
  svg?: string;
}

let categoriesCache: Category[] | null = null;

/**
 * Fetch categories from the API
 */
export async function fetchCategories(): Promise<Category[]> {
  if (categoriesCache) {
    return categoriesCache;
  }
  
  try {
    const data = await fetchAPI('/categories');
    categoriesCache = data;
    return data;
  } catch (error) {
    console.error('Error fetching categories:', error);
    return [];
  }
}

/**
 * Get category names as a simple string array
 */
export async function getBusinessCategories(): Promise<string[]> {
  const categories = await fetchCategories();
  return categories.map(cat => cat.category).sort();
}

/**
 * Get filtered categories based on search query
 */
export async function getFilteredCategories(query: string): Promise<string[]> {
  const categories = await getBusinessCategories();
  
  if (!query) return categories;
  
  const lowerQuery = query.toLowerCase();
  return categories.filter(category =>
    category.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Clear the categories cache (useful for testing or refresh)
 */
export function clearCategoriesCache(): void {
  categoriesCache = null;
}


