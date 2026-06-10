import { useCallback, useEffect, useMemo, useState, useRef } from 'react';
import type { FeedCategory, News } from '../domain/News';
import { DEFAULT_CATEGORIES } from '../domain/News';
import {
  normalizeNewsItem,
  generateNews,
  getCategoryLabel,
} from '../domain/NewsRepository';

// Кэш для данных
let cachedAllNews: News[] = [];
let cachedTrendingNews: News[] = [];
let cachedRecommendedNews: News[] = [];
let isLoadingNews = false;
let isLoadingTrending = false;

// Конфигурация бэкенда
const BACKEND_URL = 'http://localhost:8080/api';

// Хранилище токена
let authToken: string | null = localStorage.getItem('auth_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) {
    localStorage.setItem('auth_token', token);
  } else {
    localStorage.removeItem('auth_token');
  }
}

async function fetchWithAuth(url: string, options: RequestInit = {}) {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (options.headers) {
    const existingHeaders = options.headers as Record<string, string>;
    for (const key in existingHeaders) {
      headers[key] = existingHeaders[key];
    }
  }
  
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }
  
  const response = await fetch(`${BACKEND_URL}${url}`, {
    ...options,
    headers,
  });
  
  if (response.status === 401) {
    setAuthToken(null);
    throw new Error('Unauthorized. Please login again.');
  }
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  return response.json();
}

// Получить новости из бэкенда (доступно всем)
async function fetchNewsFromBackend(): Promise<News[]> {
  try {
    const response = await fetch(`${BACKEND_URL}/posts?limit=100`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return data.posts.map((post: any) => normalizeNewsItem({
      id: post.id,
      title: post.title,
      content: post.content,
      category: post.category || 'tech',
      imageUrl: post.image_url,
      createdAt: post.created_at,
      likesCount: post.likes_count,
      commentsCount: post.comments_count,
      isLiked: post.is_liked || false,
      viewsCount: post.views_count || 0,
    }));
  } catch (error) {
    console.error('Failed to fetch news from backend:', error);
    return [];
  }
}

// Сохранить новость в бэкенд и вернуть сохраненную новость (с ID из БД)
async function saveNewsToBackend(news: News): Promise<News | null> {
  try {
    const response = await fetch(`${BACKEND_URL}/posts/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: news.title,
        content: news.content,
        image_url: news.imageUrl,
        category: news.category,
      }),
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const savedPost = await response.json();
    console.log(`✅ Новость сохранена с ID из БД: ${savedPost.id}`);
    
    return normalizeNewsItem({
      id: savedPost.id,
      title: savedPost.title,
      content: savedPost.content,
      category: savedPost.category,
      imageUrl: savedPost.image_url,
      createdAt: savedPost.created_at,
      likesCount: savedPost.likes_count,
      commentsCount: savedPost.comments_count,
      viewsCount: savedPost.views_count || 0,
    });
  } catch (error) {
    console.error('Failed to save news to backend:', error);
    return null;
  }
}

// Генерировать и сохранить одну новость
async function generateAndSaveSingleNews(): Promise<News | null> {
  try {
    const randomCategory = DEFAULT_CATEGORIES[Math.floor(Math.random() * DEFAULT_CATEGORIES.length)];
    console.log(`🔄 Генерация новой новости для категории: ${getCategoryLabel(randomCategory)}`);
    
    const generatedNews = await generateNews(randomCategory, 1);
    
    if (generatedNews.length > 0) {
      const savedNews = await saveNewsToBackend(generatedNews[0]);
      if (savedNews) {
        console.log(`✅ Сгенерирована и сохранена новость с ID: ${savedNews.id}`);
        return savedNews;
      }
    }
  } catch (error) {
    console.error('❌ Ошибка генерации новости:', error);
  }
  
  return null;
}

// Генерировать и сохранить новости для всех категорий
async function generateAndSaveAllNews(): Promise<News[]> {
  const allNewNews: News[] = [];
  
  for (const category of DEFAULT_CATEGORIES) {
    console.log(`Генерация новостей для категории: ${getCategoryLabel(category)}`);
    const generatedNews = await generateNews(category, 4);
    
    for (const news of generatedNews) {
      const savedNews = await saveNewsToBackend(news);
      if (savedNews) {
        allNewNews.push(savedNews);
      }
    }
  }
  
  console.log(`Сгенерировано и сохранено ${allNewNews.length} новостей`);
  return allNewNews;
}

// Основной хук
export function useNewsFeed() {
  const [allNews, setAllNews] = useState<News[]>(cachedAllNews);
  const [currentCategory, setCurrentCategory] = useState<FeedCategory>('all');
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [searchVisible, setSearchVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(!!authToken);
  const [trendingNews, setTrendingNews] = useState<News[]>(cachedTrendingNews);
  const [recommendedNews, setRecommendedNews] = useState<News[]>(cachedRecommendedNews);
  const [initialLoadDone, setInitialLoadDone] = useState(cachedAllNews.length > 0);
  const loadInProgress = useRef(false);

  const loadTrending = useCallback(async () => {
    // Если есть кэш, используем его
    if (cachedTrendingNews.length > 0) {
      console.log('Using cached trending news');
      setTrendingNews(cachedTrendingNews);
      return;
    }
    
    if (isLoadingTrending) return;
    isLoadingTrending = true;
    
    try {
      console.log('🔵 Loading trending news...');
      const response = await fetch(`${BACKEND_URL}/posts/trending?limit=5`);
      
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          const normalized = data.map((post: any) => normalizeNewsItem({
            id: post.id,
            title: post.title,
            content: post.content,
            category: post.category || 'tech',
            imageUrl: post.image_url,
            createdAt: post.created_at,
            likesCount: post.likes_count || 0,
            commentsCount: post.comments_count || 0,
            viewsCount: post.views_count || 0,
            isLiked: false,
          }));
          cachedTrendingNews = normalized;
          setTrendingNews(normalized);
        } else {
          setTrendingNews([]);
        }
      }
    } catch (err) {
      console.error('Failed to load trending:', err);
      setTrendingNews([]);
    } finally {
      isLoadingTrending = false;
    }
  }, []);

  const loadRecommended = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;
    
    // Если есть кэш, используем его
    if (cachedRecommendedNews.length > 0) {
      setRecommendedNews(cachedRecommendedNews);
      return;
    }
    
    try {
      const response = await fetch(`${BACKEND_URL}/posts/recommended`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data && Array.isArray(data)) {
          const normalized = data.map((post: any) => normalizeNewsItem(post));
          cachedRecommendedNews = normalized;
          setRecommendedNews(normalized);
        }
      }
    } catch (err) {
      console.error('Failed to load recommendations:', err);
    }
  }, []);

  const loadNews = useCallback(async () => {
    // Предотвращаем повторную загрузку
    if (loadInProgress.current) {
      console.log('⚠️ Загрузка уже выполняется, пропускаем...');
      return;
    }
    
    // Если есть кэш, используем его
    if (cachedAllNews.length > 0) {
      console.log('Using cached news, count:', cachedAllNews.length);
      setAllNews(cachedAllNews);
      setInitialLoadDone(true);
      return;
    }
    
    loadInProgress.current = true;
    setLoading(true);
    setError(null);
    
    try {
      let news: News[] = await fetchNewsFromBackend();
      
      if (news.length === 0) {
        console.log('БД пуста, генерируем начальные новости...');
        news = await generateAndSaveAllNews();
      }
      
      cachedAllNews = news;
      setAllNews(news);
      setInitialLoadDone(true);
      await loadTrending();
      if (authToken) await loadRecommended();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('Ошибка загрузки новостей:', err);
      setError(msg);
    } finally {
      setLoading(false);
      loadInProgress.current = false;
    }
  }, [loadTrending, loadRecommended]);

  // Загружаем новости ТОЛЬКО ОДИН РАЗ при монтировании
  useEffect(() => {
    if (!initialLoadDone && !loadInProgress.current) {
      console.log('🟢 Первичная загрузка новостей...');
      loadNews();
    }
  }, []); // Пустой массив - только при монтировании

  // Дебаунс поиска
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

  // Проверка авторизации
  useEffect(() => {
    const checkAuth = () => {
      setIsAuthenticated(!!localStorage.getItem('auth_token'));
    };
    
    window.addEventListener('storage', checkAuth);
    return () => window.removeEventListener('storage', checkAuth);
  }, []);

  const selectCategory = useCallback((category: FeedCategory) => {
    setCurrentCategory(category);
  }, []);

  const updateNewsViews = useCallback((newsId: string) => {
    console.log('👁️ Updating views for news:', newsId);
    
    const updateFn = (prev: News[]) =>
      prev.map(news => 
        news.id === newsId 
          ? { ...news, viewsCount: (news.viewsCount || 0) + 1 }
          : news
      );
    
    setAllNews(updateFn);
    setTrendingNews(updateFn);
    setRecommendedNews(updateFn);
    
    // Обновляем кэш
    cachedAllNews = updateFn(cachedAllNews);
    cachedTrendingNews = updateFn(cachedTrendingNews);
    cachedRecommendedNews = updateFn(cachedRecommendedNews);
  }, []);

  const toggleSearch = useCallback(() => {
    setSearchVisible((v) => {
      if (v) {
        setSearchInput('');
      }
      return !v;
    });
  }, []);

  const updateNewsLikes = useCallback((newsId: string, likesCount: number, isLiked: boolean) => {
    const updateFn = (prev: News[]) =>
      prev.map(news => 
        news.id === newsId 
          ? { ...news, likesCount, isLiked }
          : news
      );
    
    setAllNews(updateFn);
    setTrendingNews(updateFn);
    setRecommendedNews(updateFn);
    
    // Обновляем кэш
    cachedAllNews = updateFn(cachedAllNews);
    cachedTrendingNews = updateFn(cachedTrendingNews);
    cachedRecommendedNews = updateFn(cachedRecommendedNews);
  }, []);

  const refreshNews = useCallback(async () => {
    console.log('🔄 Принудительное обновление новостей...');
    // Очищаем кэш
    cachedAllNews = [];
    cachedTrendingNews = [];
    cachedRecommendedNews = [];
    await loadNews();
  }, [loadNews]);

  return {
    allNews,
    updateNewsLikes,
    updateNewsViews,
    currentCategory,
    selectCategory,
    searchInput,
    setSearchInput,
    searchVisible,
    toggleSearch,
    filteredNews,
    loading,
    error,
    isAuthenticated,
    refreshNews,
    trendingNews,
    recommendedNews,
  };
}