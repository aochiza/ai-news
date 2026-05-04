import type { News } from '../domain/News';
import { getCategoryLabel } from '../domain/NewsRepository';

type FeaturedSidebarProps = {
  items: News[];
  selectedNewsId: string | null;
  onOpenNews: (id: string) => void;
};

export function FeaturedSidebar({
  items,
  selectedNewsId,
  onOpenNews,
}: FeaturedSidebarProps) {
  return (
    <aside className="featured-sidebar">
      <div className="featured-sticky">
        <h3>Главные новости</h3>
        {items.length === 0 ? (
          <p className="featured-empty">Пока нет новостей.</p>
        ) : (
          <ul className="featured-list">
            {items.map((item) => (
              <li key={`featured-${item.id}`}>
                <button
                  type="button"
                  className={`featured-item${selectedNewsId === item.id ? ' active' : ''}`}
                  onClick={() => onOpenNews(item.id)}
                >
                  <span className="featured-category">{getCategoryLabel(item.category)}</span>
                  <span className="featured-title">{item.title}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </aside>
  );
}
