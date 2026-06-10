import type { RefObject } from 'react';
import { useState, useEffect } from 'react';
import type { FeedCategory } from '../domain/News';
import { getCategoryLabel } from '../domain/NewsRepository';

type AppNavigationProps = {
  navItems: FeedCategory[];
  currentCategory: FeedCategory;
  onSelectCategory: (category: FeedCategory) => void;
  searchVisible: boolean;
  searchInput: string;
  onSearchInputChange: (value: string) => void;
  onToggleSearch: () => void;
  searchInputRef: React.RefObject<HTMLInputElement>;
  isLoading?: boolean;
  user?: { username: string } | null;
  onLoginClick: () => void;
  onLogoutClick: () => void;
  onProfileClick: () => void;
};

export function AppNavigation({
  navItems,
  currentCategory,
  onSelectCategory,
  searchVisible,
  searchInput,
  onSearchInputChange,
  onToggleSearch,
  searchInputRef,
  isLoading = false,
  user,
  onLoginClick,
  onLogoutClick,
  onProfileClick,
}: AppNavigationProps) {
  const [hoveredCategory, setHoveredCategory] = useState<FeedCategory | null>(null);
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [searchResultsCount, setSearchResultsCount] = useState(0);

  useEffect(() => {
    if (searchInput.length > 0) {
      setSearchResultsCount(Math.floor(Math.random() * 20) + 1);
    } else {
      setSearchResultsCount(0);
    }
  }, [searchInput]);

  const handleCategoryClick = (category: FeedCategory) => {
    onSelectCategory(category);
    if (window.navigator && window.navigator.vibrate) {
      window.navigator.vibrate(50);
    }
  };

  const handleSearchToggle = () => {
    onToggleSearch();
    setIsSearchExpanded(!isSearchExpanded);
    if (!searchVisible && searchInputRef.current) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 300);
    }
  };

  const handleSearchClear = () => {
    onSearchInputChange('');
    searchInputRef.current?.focus();
  };

  return (
    <nav className="app-navigation">
      <div className="nav-container">
        <ul className="nav-list">
          {navItems.map((cat, index) => (
            <li key={cat} className="nav-item" style={{ animationDelay: `${index * 0.05}s` }}>
              <button
                type="button"
                className={`nav-button${currentCategory === cat ? ' active' : ''}`}
                data-category={cat}
                onClick={() => handleCategoryClick(cat)}
                onMouseEnter={() => setHoveredCategory(cat)}
                onMouseLeave={() => setHoveredCategory(null)}
              >
                <span className="nav-button-content">
                  <span className="nav-button-text">
                    {getCategoryLabel(cat)}
                  </span>
                  {currentCategory === cat && (
                    <span className="nav-button-active-indicator" />
                  )}
                </span>
              </button>
              {hoveredCategory === cat && currentCategory !== cat && (
                <span className="nav-tooltip">{getCategoryLabel(cat)}</span>
              )}
            </li>
          ))}
          
          <li className="nav-item search-container">
            <button
              type="button"
              className={`search-button ${searchVisible ? 'active' : ''}`}
              aria-label="Поиск"
              onClick={handleSearchToggle}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden
              >
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </button>
            <div className={`search-wrapper ${searchVisible ? 'visible' : ''}`}>
              <div className="search-field-container">
                <input
                  ref={searchInputRef}
                  type="search"
                  className={`search-field ${searchVisible ? 'visible' : ''}`}
                  placeholder="Поиск новостей..."
                  value={searchInput}
                  onChange={(e) => onSearchInputChange(e.target.value)}
                  aria-label="Поиск по новостям"
                />
                
                {isLoading && searchVisible && (
                  <div className="search-loader">
                    <div className="loader-dot" />
                    <div className="loader-dot" />
                    <div className="loader-dot" />
                  </div>
                )}
              </div>
              {searchVisible && searchInput && (
                <div className="search-suggestions">
                  <div className="suggestions-header">
                    <span>Результаты поиска</span>
                    <span className="suggestions-count">{searchResultsCount}</span>
                  </div>
                  <div className="suggestions-list">
                    <div className="suggestion-item">
                      <span>Новости по запросу "{searchInput}"</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </li>

          <li className="nav-item user-menu">
            {user ? (
              <button className="profile-button" onClick={onProfileClick}>
                👤 {user.username}
              </button>
            ) : (
              <button className="login-button" onClick={onLoginClick}>
                Войти
              </button>
            )}
          </li>
        </ul>
      </div>
      
      {isLoading && (
        <div className="nav-loading-bar">
          <div className="loading-progress" />
        </div>
      )}
    </nav>
  );
}