'use client';

import { useState, useEffect, useRef } from 'react';
import { getFilteredCategories } from '@/data/businessCategories';

interface BusinessTypeSearchProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function BusinessTypeSearch({ 
  onSearch, 
  placeholder = 'Search by business type or category...' 
}: BusinessTypeSearchProps) {
  const [query, setQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const searchRef = useRef<HTMLDivElement>(null);

  // Update filtered categories when query changes
  useEffect(() => {
    const updateCategories = async () => {
      const filtered = await getFilteredCategories(query);
      // Limit to 5 results, already sorted alphabetically
      setFilteredCategories(filtered.slice(0, 5));
      if (query.length > 0) {
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    };
    updateCategories();
  }, [query]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    // Call parent search handler for filtering businesses
    onSearch(value);
  };

  const handleSelectCategory = (category: string) => {
    setQuery(category);
    setShowSuggestions(false);
    // Call parent search handler with selected category
    onSearch(category);
  };

  const handleClear = () => {
    setQuery('');
    setFilteredCategories([]);
    setShowSuggestions(false);
    onSearch('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setShowSuggestions(false);
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

  return (
    <div className="business-type-search relative" ref={searchRef}>
      <div className="search-input-wrapper">
        <input
          type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredCategories.length > 0 || query.length > 0) {
              setShowSuggestions(true);
            }
          }}
        />
        
        {query && (
          <button 
            className="search-clear"
            onClick={handleClear}
            aria-label="Clear search"
            type="button"
          >
            ✕
          </button>
        )}
      </div>

      {showSuggestions && filteredCategories.length > 0 && (
        <ul className="search-suggestions">
          {filteredCategories.map((category, index) => (
            <li
              key={`category-${index}`}
              className="suggestion-item"
              onClick={() => handleSelectCategory(category)}
              onKeyDown={(e) => e.key === 'Enter' && handleSelectCategory(category)}
              tabIndex={0}
              role="button"
            >
              <span className="suggestion-icon">🏷️</span>
              <div className="suggestion-content">
                <div className="suggestion-name">{category}</div>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {showSuggestions && query.length > 0 && filteredCategories.length === 0 && (
        <div className="search-no-results">
          <p>No categories found for &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}

