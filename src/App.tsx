import { useEffect, useMemo, useRef, useState } from 'react';
import { AppHeader } from './components/AppHeader';
import { AppNavigation } from './components/AppNavigation';
import { FeedStatus } from './components/FeedStatus';
import { FeaturedSidebar } from './components/FeaturedSidebar';
import { NewsDetails } from './components/NewsDetails';
import { NewsFeed } from './components/NewsFeed';
import { AppFooter } from './components/AppFooter';
import type { FeedCategory, News } from './domain/News';
import { DEFAULT_CATEGORIES } from './domain/News';
import { useNewsFeed } from './hooks/useNewsFeed';
import './App.css';

const NAV_ITEMS: FeedCategory[] = ['all', ...DEFAULT_CATEGORIES];

function App() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<string | null>(null);
  const {
    currentCategory,
    selectCategory,
    searchInput,
    setSearchInput,
    searchVisible,
    toggleSearch,
    filteredNews,
    loading,
    error,
    allNews,
  } = useNewsFeed();

  useEffect(() => {
    if (searchVisible) {
      searchInputRef.current?.focus();
    }
  }, [searchVisible]);

  const selectedNews = useMemo<News | null>(
    () => allNews.find((item) => item.id === selectedNewsId) ?? null,
    [allNews, selectedNewsId],
  );
  const featuredNews = useMemo(
    () =>
      [...allNews]
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        )
        .slice(0, 5),
    [allNews],
  );

  return (
    <div className="app-wrapper">
      <div className="sticky-header">
        <AppHeader />
        <AppNavigation
          navItems={NAV_ITEMS}
          currentCategory={currentCategory}
          onSelectCategory={selectCategory}
          searchVisible={searchVisible}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onToggleSearch={toggleSearch}
          searchInputRef={searchInputRef}
        />
      </div>
      <main className="layout">
        <section className="main-column">
          {!selectedNews ? (
            <FeedStatus
              loading={loading}
              error={error}
              hasNews={allNews.length > 0}
              hasFilteredNews={filteredNews.length > 0}
            />
          ) : null}
          {selectedNews ? <NewsDetails news={selectedNews} onBack={() => setSelectedNewsId(null)} /> : null}
          {!selectedNews && filteredNews.length > 0 ? <NewsFeed items={filteredNews} onOpenNews={(news) => setSelectedNewsId(news.id)} /> : null}
        </section>
        <FeaturedSidebar
          items={featuredNews}
          selectedNewsId={selectedNewsId}
          onOpenNews={setSelectedNewsId}
        />
      </main>
      <AppFooter 
        totalNews={allNews.length}
        categoriesCount={DEFAULT_CATEGORIES.length}
      />
    </div>
  );
}

export default App;