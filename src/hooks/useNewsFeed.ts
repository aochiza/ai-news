import { useCallback, useEffect, useMemo, useState } from 'react';
import type { FeedCategory, News, NewsItemCategory } from '../domain/News';
import { DEFAULT_CATEGORIES } from '../domain/News';
import {
  CACHE_TTL_MS,
  fetchAllCategoriesNews,
  fetchCategoryNews,
  getCategoryNews,
  normalizeNewsItem,
  readNewsCache,
  saveNewsCache,
} from '../domain/NewsRepository';

let initStarted = false;

export function useNewsFeed() {
  const [allNews, setAllNews] = useState<News[]>([]);
  const [currentCategory, setCurrentCategory] = useState<FeedCategory>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 300);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  const filteredNews = useMemo(
    () =>
      allNews
        .filter(
          (item) => currentCategory === 'all' || item.category === currentCategory,
        )
        .filter((item) => {
          if (!debouncedSearch) return true;
          const haystack = `${item.title} ${item.content}`.toLowerCase();
          return haystack.includes(debouncedSearch.toLowerCase());
        })
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [allNews, currentCategory, debouncedSearch],
  );

  useEffect(() => {
    if (initStarted) return;
    initStarted = true;

    console.log('Инициализация приложения...');
    const cache = readNewsCache();
    const hasFreshCache = Boolean(
      cache && Date.now() - cache.timestamp < CACHE_TTL_MS,
    );

    if (cache?.news?.length) {
      setAllNews(cache.news.map((item, index) => normalizeNewsItem(item, index)));
      console.log(`Загружено из кэша: ${cache.news.length} новостей`);
    }

    if (hasFreshCache) {
      console.log('Фоновое обновление кэша...');
      void fetchAllCategoriesNews()
        .then((next) => {
          setAllNews(next);
          saveNewsCache(next);
        })
        .catch(console.error);
      return;
    }

    void (async () => {
      try {
        setLoading(true);
        setError(null);
        const next = await fetchAllCategoriesNews();
        setAllNews(next);
        saveNewsCache(next);
        console.log(`Загружено ${next.length} новостей`);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error('Критическая ошибка:', e);
        setError(msg);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selectCategory = useCallback((category: FeedCategory) => {
    setCurrentCategory(category);
    if (category === 'all') return;

    setAllNews((prev) => {
      if (
        getCategoryNews(prev, category).length > 0 ||
        !DEFAULT_CATEGORIES.includes(category)
      ) {
        return prev;
      }

      void (async () => {
        console.log(`Загрузка категории ${category}...`);
        try {
          const next = await fetchCategoryNews(category, prev);
          setAllNews(next);
          saveNewsCache(next);
        } catch (err) {
          console.error(err);
        }
      })();

      return prev;
    });
  }, []);

  const toggleSearch = useCallback(() => {
    setSearchVisible((v) => {
      if (v) {
        setSearchInput('');
      }
      return !v;
    });
  }, []);

  return {
    allNews,
    currentCategory,
    selectCategory,
    searchInput,
    setSearchInput,
    searchVisible,
    toggleSearch,
    filteredNews,
    loading,
    error,
  };
}
