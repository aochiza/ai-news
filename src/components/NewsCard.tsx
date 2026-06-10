import { useState } from 'react';
import type { News } from '../domain/News';
import { getCategoryLabel, getPicsumImageUrl } from '../domain/NewsRepository';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = 'http://localhost:8080/api';

type NewsCardProps = {
  item: News;
  onOpen?: (item: News) => void;
  onLikeUpdate?: (newsId: string, likesCount: number, isLiked: boolean) => void;
};

export function NewsCard({ item, onOpen, onLikeUpdate }: NewsCardProps) {
  const { token, user } = useAuth();
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(item.imageUrl);
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likesCount ?? 0);
  const [isLoadingLike, setIsLoadingLike] = useState(false);

  const handleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!token) {
      alert('Войдите, чтобы ставить лайки');
      return;
    }

    setIsLoadingLike(true);
    try {
      const response = await fetch(`${BACKEND_URL}/posts/${item.id}/like`, {
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
        onLikeUpdate?.(item.id, data.likes_count, data.liked);
      }
    } catch (error) {
      console.error('Failed to like:', error);
    } finally {
      setIsLoadingLike(false);
    }
  };

  return (
    <article
      className={`news-card ${item.cardSize}`}
      data-id={item.id}
      role="button"
      tabIndex={0}
      onClick={() => onOpen?.(item)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen?.(item);
        }
      }}
    >
      <div className={`news-media ${mediaLoaded ? 'loaded' : 'skeleton'}`}>
        <span className="news-category-badge">
          {getCategoryLabel(item.category)}
        </span>
        <img
          className={`news-image ${mediaLoaded ? 'loaded' : ''}`}
          src={imageSrc}
          alt={item.title}
          loading="lazy"
          onLoad={() => setMediaLoaded(true)}
          onError={() => {
            setImageSrc(getPicsumImageUrl(`fallback-${item.id}`));
          }}
        />
        <button 
          className={`like-button ${isLiked ? 'liked' : ''}`} 
          onClick={handleLike}
          disabled={isLoadingLike}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill={isLiked ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
          </svg>
          <span>{likesCount}</span>
        </button>
      </div>
      <div className="news-content">
        <h2>{item.title}</h2>
        <p>{item.content}</p>
        <div className="news-meta">
          
        </div>
      </div>
    </article>
  );
}