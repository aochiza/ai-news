import { useState } from 'react';
import type { News } from '../domain/News';
import { getCategoryLabel, getPicsumImageUrl } from '../domain/NewsRepository';

type NewsCardProps = {
  item: News;
  onOpen?: (item: News) => void;
};

export function NewsCard({ item, onOpen }: NewsCardProps) {
  const [mediaLoaded, setMediaLoaded] = useState(false);
  const [imageSrc, setImageSrc] = useState(item.imageUrl);

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
      </div>
      <div className="news-content">
        <h2>{item.title}</h2>
        <p>{item.content}</p>
      </div>
    </article>
  );
}
