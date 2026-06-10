import { useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams } from 'react-router-dom';
import { AppHeader } from './components/AppHeader';
import { AppNavigation } from './components/AppNavigation';
import { FeedStatus } from './components/FeedStatus';
import { FeaturedSidebar } from './components/FeaturedSidebar';
import { NewsDetails } from './components/NewsDetails';
import { NewsFeed } from './components/NewsFeed';
import { AppFooter } from './components/AppFooter';
import { LoginModal } from './components/LoginModal';
import { ProfilePage } from './components/ProfilePage';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import type { FeedCategory, News } from './domain/News';
import { DEFAULT_CATEGORIES } from './domain/News';
import { useNewsFeed, setAuthToken } from './hooks/useNewsFeed';
import { ScrollButtons } from './components/ScrollButtons';
import './App.css';

const NAV_ITEMS: FeedCategory[] = ['all', ...DEFAULT_CATEGORIES];

// Компонент для главной страницы
function HomePage() {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user, token, logout, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();
  
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
    refreshNews,
    trendingNews,
    recommendedNews,
    updateNewsLikes,
  } = useNewsFeed();

  useEffect(() => {
    setAuthToken(token);
    if (token) {
      refreshNews();
    }
  }, [token, refreshNews]);

  useEffect(() => {
    if (searchVisible && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchVisible]);

  const handleSelectCategory = (category: FeedCategory) => {
    selectCategory(category);
  };

  const handleLikeUpdate = (newsId: string, likesCount: number, isLiked: boolean) => {
    updateNewsLikes(newsId, likesCount, isLiked);
  };

  const handleOpenNews = (news: News) => {
    navigate(`/news/${news.id}`);
  };

  return (
    <div className="app-wrapper">
      {showLoginModal && (
        <LoginModal 
          onClose={() => setShowLoginModal(false)} 
          onLogin={() => {
            setShowLoginModal(false);
            refreshNews();
          }}
        />
      )}
      
      <div className="sticky-header">
        <AppHeader />
        <AppNavigation
          navItems={NAV_ITEMS}
          currentCategory={currentCategory}
          onSelectCategory={handleSelectCategory}
          searchVisible={searchVisible}
          searchInput={searchInput}
          onSearchInputChange={setSearchInput}
          onToggleSearch={toggleSearch}
          searchInputRef={searchInputRef}
          user={user}
          onLoginClick={() => setShowLoginModal(true)}
          onLogoutClick={() => {
            logout();
            navigate('/');
            refreshNews();
          }}
          onProfileClick={() => navigate('/profile')}
        />
      </div>
      
      <main className="layout">
        <section className="main-column">
          <FeedStatus
            loading={loading || authLoading}
            error={error}
            hasNews={allNews.length > 0}
            hasFilteredNews={filteredNews.length > 0}
          />
          
          {filteredNews.length > 0 && (
            <NewsFeed 
              items={filteredNews} 
              onOpenNews={handleOpenNews}
              onLikeUpdate={handleLikeUpdate}
            />
          )}
        </section>
        
        <FeaturedSidebar
          trendingNews={trendingNews || []}
          recommendedNews={recommendedNews || []}
          user={user}
          selectedNewsId={null}
          onOpenNews={handleOpenNews}
          onLikeUpdate={handleLikeUpdate}
        />
      </main>
      
      <AppFooter 
        totalNews={allNews.length}
        categoriesCount={DEFAULT_CATEGORIES.length}
      />
      
      <ScrollButtons />
    </div>
  );
}

// Компонент для страницы новости
function NewsPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const searchInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const { 
    allNews, 
    updateNewsLikes, 
    trendingNews, 
    recommendedNews 
  } = useNewsFeed();
  const [news, setNews] = useState<News | null>(null);

  useEffect(() => {
    if (id && allNews.length > 0) {
      const found = allNews.find(item => item.id === id);
      setNews(found || null);
    }
  }, [id, allNews]);

  const handleLikeUpdate = (newsId: string, likesCount: number, isLiked: boolean) => {
    updateNewsLikes(newsId, likesCount, isLiked);
    if (news && news.id === newsId) {
      setNews({ ...news, likesCount, isLiked });
    }
  };

  const handleBack = () => {
    navigate('/');
  };

  const handleOpenNews = (newsItem: News) => {
    navigate(`/news/${newsItem.id}`);
  };

  if (!news) {
    return (
      <div className="app-wrapper">
        <div className="sticky-header">
          <AppHeader />
        </div>
        <main className="layout">
          <div className="loading">Загрузка новости...</div>
        </main>
        <AppFooter totalNews={0} categoriesCount={DEFAULT_CATEGORIES.length} />
        <ScrollButtons />
      </div>
    );
  }

  return (
    <div className="app-wrapper">
      <div className="sticky-header">
        <AppHeader />
        <AppNavigation
          navItems={NAV_ITEMS}
          currentCategory="all"
          onSelectCategory={() => navigate('/')}
          searchVisible={false}
          searchInput=""
          onSearchInputChange={() => {}}
          onToggleSearch={() => {}}
          searchInputRef={searchInputRef}
          user={user}
          onLoginClick={() => {}}
          onLogoutClick={() => {}}
          onProfileClick={() => navigate('/profile')}
        />
      </div>
      
      <main className="layout">
        <section className="main-column">
          <NewsDetails 
            news={news} 
            onBack={handleBack}
            onLikeUpdate={handleLikeUpdate}
          />
        </section>
        
        <FeaturedSidebar
          trendingNews={trendingNews || []}
          recommendedNews={recommendedNews || []}
          user={user}
          selectedNewsId={news.id}
          onOpenNews={handleOpenNews}
          onLikeUpdate={handleLikeUpdate}
        />
      </main>
      
      <AppFooter 
        totalNews={allNews.length}
        categoriesCount={DEFAULT_CATEGORIES.length}
      />
      
      <ScrollButtons />
    </div>
  );
}

// Компонент App с роутингом
function AppContent() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/news/:id" element={<NewsPage />} />
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;