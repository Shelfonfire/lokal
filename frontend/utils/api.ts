// API base URL - uses environment variable or falls back to localhost
// For Next.js, use NEXT_PUBLIC_API_URL in your .env.local file
// Note: Next.js requires NEXT_PUBLIC_ prefix for client-side env vars
export const API_URL = 
  process.env.NEXT_PUBLIC_API_URL || 
  'http://localhost:8000';

// Helper function for API calls
export const fetchAPI = async (endpoint: string, options: RequestInit = {}) => {
  // Ensure endpoint starts with /
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${normalizedEndpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`API call failed: ${response.statusText}`);
  }

  return response.json();
};

