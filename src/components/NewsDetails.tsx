import type { News } from '../domain/News';
import { getCategoryLabel } from '../domain/NewsRepository';

type NewsDetailsProps = {
  news: News;
  onBack: () => void;
};

export function NewsDetails({ news, onBack }: NewsDetailsProps) {
  return (
    <section className="news-details">
      <button type="button" className="back-button" onClick={onBack}>
        Назад к ленте
      </button>
      <article className="news-details-card">
        <img className="news-details-image" src={news.imageUrl} alt={news.title} />
        <div className="news-details-content">
          <span className="news-details-category">{getCategoryLabel(news.category)}</span>
          <h2>{news.title}</h2>
          <p>{news.content}</p>
        </div>
      </article>
    </section>
  );
}
