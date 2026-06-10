import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import type { News } from '../domain/News';
import { getCategoryLabel } from '../domain/NewsRepository';

const BACKEND_URL = 'http://localhost:8080/api';

type FeaturedSidebarProps = {
  trendingNews: News[];
  recommendedNews: News[];
  user: { username: string } | null;
  selectedNewsId: string | null;
  onOpenNews: (news: News) => void;
  onLikeUpdate?: (newsId: string, likesCount: number, isLiked: boolean) => void;
  onViewUpdate?: (newsId: string, newViewsCount: number) => void;
};

export function FeaturedSidebar({ 
  trendingNews, 
  recommendedNews, 
  user, 
  selectedNewsId, 
  onOpenNews,
  onLikeUpdate,
  onViewUpdate
}: FeaturedSidebarProps) {
  const { token } = useAuth();
  // Используем пропсы напрямую, без локального состояния для синхронизации
  const [localTrending, setLocalTrending] = useState(trendingNews);
  const [localRecommended, setLocalRecommended] = useState(recommendedNews);

  // Обновляем локальное состояние при изменении пропсов
  useEffect(() => {
    console.log('🟢 Trending news updated:', trendingNews?.length || 0);
    console.log('🟢 First trending item:', trendingNews?.[0]);
    setLocalTrending(trendingNews);
    setLocalRecommended(recommendedNews);
  }, [trendingNews, recommendedNews]);

  const handleLike = async (e: React.MouseEvent, news: News) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!token) {
      alert('Войдите, чтобы поставить лайк');
      return;
    }

    // Оптимистичное обновление UI
    const newLikedState = !news.isLiked;
    const newLikesCount = newLikedState ? (news.likesCount || 0) + 1 : (news.likesCount || 0) - 1;
    
    // Обновляем локально
    const updateNews = (list: News[]) =>
      list.map(item =>
        item.id === news.id
          ? { ...item, isLiked: newLikedState, likesCount: newLikesCount }
          : item
      );
    setLocalTrending(updateNews);
    setLocalRecommended(updateNews);

    try {
      const response = await fetch(`${BACKEND_URL}/posts/${news.id}/like`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Обновляем с реальными данными от сервера
        const finalUpdateNews = (list: News[]) =>
          list.map(item =>
            item.id === news.id
              ? { ...item, isLiked: data.liked, likesCount: data.likes_count }
              : item
          );
        setLocalTrending(finalUpdateNews);
        setLocalRecommended(finalUpdateNews);
        onLikeUpdate?.(news.id, data.likes_count, data.liked);
      } else {
        // Откат при ошибке
        const rollbackNews = (list: News[]) =>
          list.map(item =>
            item.id === news.id
              ? { ...item, isLiked: news.isLiked, likesCount: news.likesCount }
              : item
          );
        setLocalTrending(rollbackNews);
        setLocalRecommended(rollbackNews);
      }
    } catch (error) {
      console.error('Like error:', error);
      // Откат при ошибке
      const rollbackNews = (list: News[]) =>
        list.map(item =>
          item.id === news.id
            ? { ...item, isLiked: news.isLiked, likesCount: news.likesCount }
            : item
        );
      setLocalTrending(rollbackNews);
      setLocalRecommended(rollbackNews);
    }
  };

  const handleOpenNews = (news: News) => {
    console.log('Opening news from sidebar:', news.id, 'Views:', news.viewsCount);
    
    // Уведомляем родителя об открытии (просмотры обновятся в деталях)
    onOpenNews(news);
  };

  // Функция для получения стабильного URL изображения
  const getImageUrl = (news: News) => {
    if (news.imageUrl) return news.imageUrl;
    // Если нет imageUrl, генерируем на основе ID
    const seed = news.id || news.title;
    const numericSeed = Math.abs(
      seed.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 0) % 100
    );
    return `https://picsum.photos/id/${numericSeed}/300/200`;
  };

  return (
    <aside className="featured-sidebar">
      <div className="featured-sticky">
        <h3>🔥 Популярное сегодня</h3>
        {!localTrending || localTrending.length === 0 ? (
          <p className="featured-empty">Нет популярных новостей</p>
        ) : (
          <ul className="featured-list">
            {localTrending.map((item) => (
              <li
                key={item.id}
                className={`featured-item ${selectedNewsId === item.id ? 'active' : ''}`}
                onClick={() => handleOpenNews(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="featured-image">
                  <img 
                    src={getImageUrl(item)} 
                    alt={item.title} 
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/600x400/667eea/white?text=News';
                    }}
                  />
                </div>
                <div className="featured-content">
                  <span className="featured-category">{getCategoryLabel(item.category)}</span>
                  <span className="featured-title">{item.title}</span>
                  <div className="featured-stats">
                    <button 
                      className={`like-button-small ${item.isLiked ? 'liked' : ''}`}
                      onClick={(e) => handleLike(e, item)}
                    >
                      ❤️ {item.likesCount || 0}
                    </button>
                    <span className="views-count">👁️ {item.viewsCount || 0}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {user && localRecommended && localRecommended.length > 0 && (
        <div className="featured-sticky">
          <h3>🎯 Рекомендации для вас</h3>
          <ul className="featured-list">
            {localRecommended.map((item) => (
              <li
                key={item.id}
                className={`featured-item ${selectedNewsId === item.id ? 'active' : ''}`}
                onClick={() => handleOpenNews(item)}
                style={{ cursor: 'pointer' }}
              >
                <div className="featured-image">
                  <img 
                    src={getImageUrl(item)} 
                    alt={item.title} 
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.src = 'https://placehold.co/600x400/667eea/white?text=News';
                    }}
                  />
                </div>
                <div className="featured-content">
                  <span className="featured-category">{getCategoryLabel(item.category)}</span>
                  <span className="featured-title">{item.title}</span>
                  <div className="featured-stats">
                    <button 
                      className={`like-button-small ${item.isLiked ? 'liked' : ''}`}
                      onClick={(e) => handleLike(e, item)}
                    >
                      ❤️ {item.likesCount || 0}
                    </button>
                    <span className="views-count">👁️ {item.viewsCount || 0}</span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  );
}