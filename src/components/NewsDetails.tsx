import { useEffect, useState } from 'react';
import type { News } from '../domain/News';
import { getCategoryLabel } from '../domain/NewsRepository';

type NewsDetailsProps = {
  news: News;
  onBack: () => void;
};

export function NewsDetails({ news, onBack }: NewsDetailsProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Анимация появления
    setTimeout(() => setIsVisible(true), 10);
    // Плавная прокрутка к началу новости
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleBack = () => {
    setIsVisible(false);
    setTimeout(() => {
      onBack();
    }, 300);
  };

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
            src={news.imageUrl} 
            alt={news.title}
            loading="lazy"
          />
          <span className="news-details-category">{getCategoryLabel(news.category)}</span>
        </div>
        <div className="news-details-content">
          <h2>{news.title}</h2>
          <div className="news-details-date">
             {new Date(news.createdAt).toLocaleDateString('ru-RU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </div>
          <div className="news-details-text">
            {news.content.split('\n').map((paragraph, idx) => (
              <p key={idx}>{paragraph}</p>
            ))}
          </div>
        </div>
      </article>
    </section>
  );
}