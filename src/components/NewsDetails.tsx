import { useEffect, useState } from 'react';
import type { News } from '../domain/News';
import { getCategoryLabel } from '../domain/NewsRepository';
import { CommentSection } from './CommentSection';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = 'http://localhost:8080/api';

type NewsDetailsProps = {
  news: News;
  onBack: () => void;
  onLikeUpdate?: (newsId: string, likesCount: number, isLiked: boolean) => void;
  onCommentUpdate?: (newsId: string, commentsCount: number) => void;
};

export function NewsDetails({ news, onBack, onLikeUpdate, onCommentUpdate }: NewsDetailsProps) {
  const [isVisible, setIsVisible] = useState(false);
  const { token } = useAuth();
  const [isLiked, setIsLiked] = useState(news?.isLiked || false);
  const [likesCount, setLikesCount] = useState(news?.likesCount || 0);
  const [viewsCount, setViewsCount] = useState(news?.viewsCount || 0);
  const [currentNews, setCurrentNews] = useState(news);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Проверяем, что news существует
    if (!news || !news.id) {
      console.error('NewsDetails: news is undefined or missing id', news);
      setError('Новость не найдена');
      return;
    }
    
    console.log('NewsDetails mounted with news:', news.id);
    setTimeout(() => setIsVisible(true), 10);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    loadFreshNewsData();
  }, [news?.id]);

  const loadFreshNewsData = async () => {
    if (!news?.id) return;
    
    try {
      const response = await fetch(`${BACKEND_URL}/posts/${news.id}`);
      if (response.ok) {
        const freshNews = await response.json();
        console.log('Fresh news data:', freshNews);
        setCurrentNews(freshNews);
        setLikesCount(freshNews.likes_count || 0);
        setViewsCount(freshNews.views_count || 0);
        if (token) {
          checkIfLiked(freshNews.id);
        }
      }
    } catch (error) {
      console.error('Failed to load fresh news data:', error);
    }
  };

  const checkIfLiked = async (postId: string) => {
    if (!token) return;
    try {
      const response = await fetch(`${BACKEND_URL}/posts/liked/me`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const liked = data.liked_post_ids?.includes(postId) || false;
        setIsLiked(liked);
      }
    } catch (error) {
      console.error('Failed to check like status:', error);
    }
  };

  const handleLike = async () => {
    if (!token) {
      alert('Войдите, чтобы ставить лайки');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);
    const previousLiked = isLiked;
    const previousCount = likesCount;
    
    setIsLiked(!isLiked);
    setLikesCount(prev => !isLiked ? prev + 1 : prev - 1);

    try {
      const response = await fetch(`${BACKEND_URL}/posts/${news.id}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setIsLiked(data.liked);
        setLikesCount(data.likes_count);
        onLikeUpdate?.(news.id, data.likes_count, data.liked);
        setCurrentNews(prev => ({
          ...prev,
          isLiked: data.liked,
          likesCount: data.likes_count
        }));
      } else {
        setIsLiked(previousLiked);
        setLikesCount(previousCount);
        const error = await response.json();
        console.error('Like failed:', error);
        alert('Не удалось поставить лайк');
      }
    } catch (error) {
      setIsLiked(previousLiked);
      setLikesCount(previousCount);
      console.error('Failed to like:', error);
      alert('Ошибка соединения');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setIsVisible(false);
    setTimeout(() => onBack(), 300);
  };

  // Проверка на ошибку
  if (error) {
    return (
      <section className="news-details">
        <button type="button" className="back-button" onClick={handleBack}>
          ← Назад к ленте
        </button>
        <div className="error-message">
          <h3>Ошибка</h3>
          <p>{error}</p>
        </div>
      </section>
    );
  }

  // Проверка, что news существует
  if (!news || !news.id) {
    return (
      <section className="news-details">
        <button type="button" className="back-button" onClick={handleBack}>
          ← Назад к ленте
        </button>
        <div className="loading-message">Загрузка новости...</div>
      </section>
    );
  }

  return (
    <section className={`news-details ${isVisible ? 'visible' : ''}`}>
      <button type="button" className="back-button" onClick={handleBack}>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        Назад к ленте
      </button>
      
      <article className="news-details-card">
        <div className="news-details-image-wrapper">
          <img 
            className="news-details-image" 
            src={currentNews?.imageUrl || news.imageUrl} 
            alt={currentNews?.title || news.title} 
          />
          <span className="news-details-category">{getCategoryLabel(currentNews?.category || news.category)}</span>
          <div className="news-stats-badge">
            <span className="views-badge">👁️ {viewsCount}</span>
          </div>
          <button 
            className={`like-button-details ${isLiked ? 'liked' : ''} ${isLoading ? 'loading' : ''}`} 
            onClick={handleLike}
            disabled={isLoading}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            <span>{likesCount}</span>
          </button>
        </div>
        
        <div className="news-details-content">
          <h2>{currentNews?.title || news.title}</h2>
          <div className="news-details-meta">
            <div className="news-details-date">
              📅 {new Date(currentNews?.createdAt || news.createdAt).toLocaleDateString('ru-RU', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </div>
            <div className="news-details-stats">
              <span>❤️ {likesCount} лайков</span>
              <span>👁️ {viewsCount} просмотров</span>
            </div>
          </div>
          <div className="news-details-text">
            {(currentNews?.content || news.content).split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>

      <CommentSection 
        postId={news.id} 
        onCommentCountUpdate={(count) => {
          onCommentUpdate?.(news.id, count);
        }}
      />
    </section>
  );
}