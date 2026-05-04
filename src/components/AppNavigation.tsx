import type { RefObject } from 'react';
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
  searchInputRef: RefObject<HTMLInputElement | null>;
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
}: AppNavigationProps) {
  return (
    <nav>
      <ul>
        {navItems.map((cat) => (
          <li key={cat}>
            <button
              type="button"
              className={`nav-button${currentCategory === cat ? ' active' : ''}`}
              data-category={cat}
              onClick={() => onSelectCategory(cat)}
            >
              {getCategoryLabel(cat)}
            </button>
          </li>
        ))}
        <li>
          <button
            type="button"
            className="search-button"
            aria-label="Поиск"
            onClick={onToggleSearch}
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              aria-hidden
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </button>
          <input
            ref={searchInputRef}
            type="search"
            className={`search-field${searchVisible ? ' visible' : ''}`}
            placeholder="Поиск…"
            value={searchInput}
            onChange={(e) => onSearchInputChange(e.target.value)}
            aria-label="Поиск по новостям"
          />
        </li>
      </ul>
    </nav>
  );
}
