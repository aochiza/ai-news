import type { News } from '../domain/News';
import { NewsCard } from './NewsCard';

type NewsFeedProps = {
  items: News[];
  onOpenNews: (news: News) => void;
};

export function NewsFeed({ items, onOpenNews }: NewsFeedProps) {
  return (
    <div id="newsFeed">
      {items.map((item) => (
        <NewsCard key={item.id} item={item} onOpen={onOpenNews} />
      ))}
    </div>
  );
}
