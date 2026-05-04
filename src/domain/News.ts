export interface News {
  id: string;
  title: string;
  content: string;
  category: NewsItemCategory;
  createdAt: string;
  imageUrl: string;
  cardSize: CardSize;
}

export type NewsItemCategory = 'tech' | 'science' | 'sports' | 'business';
export type FeedCategory = NewsItemCategory | 'all';
export type CardSize = 'size-sm' | 'size-md' | 'size-lg';

export const DEFAULT_CATEGORIES: NewsItemCategory[] = [
  'tech',
  'science',
  'sports',
  'business',
];

export const CARD_SIZES: CardSize[] = ['size-sm', 'size-md', 'size-lg'];
