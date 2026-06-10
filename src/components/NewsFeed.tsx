import type { News } from '../domain/News';
import { NewsCard } from './NewsCard';

type NewsFeedProps = {
  items: News[];
  onOpenNews: (news: News) => void;
  onLikeUpdate?: (newsId: string, likesCount: number, isLiked: boolean) => void;
};

export function NewsFeed({ items, onOpenNews, onLikeUpdate }: NewsFeedProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div id="newsFeed">
      {items.map((item) => (
        <NewsCard
          key={item.id}
          item={item}
          onOpen={onOpenNews}
          onLikeUpdate={onLikeUpdate}
        />
      ))}
    </div>
  );
}