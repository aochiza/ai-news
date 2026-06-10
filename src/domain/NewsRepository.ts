import type { CardSize, News, NewsItemCategory } from './News';
import { CARD_SIZES, DEFAULT_CATEGORIES } from './News';

const API_URL = 'https://gen.pollinations.ai/v1/chat/completions';
const BACKEND_URL = 'http://localhost:8080/api';
export const CACHE_KEY = 'aiNewsCacheV1';
export const CACHE_TTL_MS = 5 * 60 * 1000;

const CATEGORY_LABELS: Record<NewsItemCategory | 'all' | 'culture', string> = {
  tech: 'Технологии',
  science: 'Наука',
  sports: 'Спорт',
  business: 'Экономика',
  culture: 'Культура',
  all: 'Все',
};

export function getCategoryLabel(category: string): string {
  return CATEGORY_LABELS[category as keyof typeof CATEGORY_LABELS] ?? category;
}

export function getPicsumImageUrl(seed: string): string {
  // Детерминированный seed чтобы картинка не менялась при ре-рендере
  const numericSeed = Math.abs(
    seed.split('').reduce((acc, ch) => acc * 31 + ch.charCodeAt(0), 0) % 1000,
  );
  return `https://picsum.photos/id/${numericSeed}/400/300`;
}

export function getCardSize(index: number, seed: string): CardSize {
  const hash = `${seed}-${index}`;
  let total = 0;
  for (let i = 0; i < hash.length; i += 1) {
    total += hash.charCodeAt(i);
  }
  return CARD_SIZES[total % CARD_SIZES.length]!;
}

function asItemCategory(value: string | undefined): NewsItemCategory {
  if (value && DEFAULT_CATEGORIES.includes(value as NewsItemCategory)) {
    return value as NewsItemCategory;
  }
  return 'tech';
}

export function normalizeNewsItem(raw: any): News {
  // Используем ID для генерации стабильного URL изображения
  const imageSeed = raw.id || raw.title || Math.random().toString();
  
  return {
    id: raw.id,
    title: raw.title,
    content: raw.content,
    category: raw.category || 'technology',
    imageUrl: raw.imageUrl || getPicsumImageUrl(imageSeed), // Используем seed из ID
    cardSize: 'size-md',
    createdAt: raw.createdAt || new Date().toISOString(),
    likesCount: raw.likesCount ?? 0,
    isLiked: raw.isLiked ?? false,
    commentsCount: raw.commentsCount ?? 0,
    viewsCount: raw.viewsCount ?? 0,
  };
}

export function parseNewsText(
  rawText: string | undefined,
  category: NewsItemCategory,
): News[] {
  if (!rawText || typeof rawText !== 'string') return [];

  const chunks = rawText
    .split('---')
    .map((part) => part.trim())
    .filter(Boolean);

  if (chunks.length === 0) {
    const match = rawText.match(/\*\*(.+?)\*\*\s*([\s\S]*)/);
    if (match) {
      const title = match[1]!.trim();
      return [
        normalizeNewsItem({
          id: `${category}-${Date.now()}-${Math.random()}`,
          title,
          content: match[2]!.trim().substring(0, 500),
          category,
          createdAt: new Date().toISOString(),
          imageUrl: getPicsumImageUrl(`${category}-${Date.now()}`),
          cardSize: getCardSize(0, `${category}-${Date.now()}`),
        }),
      ];
    }
    return [];
  }

  return chunks.map((chunk, index) => {
    const match = chunk.match(/\*\*(.+?)\*\*\s*([\s\S]*)/);
    const title = match?.[1]?.trim() ?? `Новость #${index + 1}`;
    const content =
      match?.[2]?.trim() ?? chunk.replaceAll('**', '').trim();
    const trimmedContent =
      content.length > 500 ? `${content.substring(0, 500)}...` : content;
    const id = `${category}-${Date.now()}-${index}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
    return normalizeNewsItem({
      id,
      title: title.substring(0, 100),
      content: trimmedContent,
      category,
      createdAt: new Date().toISOString(),
      imageUrl: getPicsumImageUrl(`${category}-${title}-${index}`),
      cardSize: getCardSize(index, id),
    });
  });
}

export async function generateNews(
  category: NewsItemCategory,
  count = 4,
): Promise<News[]> {
  const prompt = `Напиши ${count} короткие новости на тему "${getCategoryLabel(category)}". 
Формат каждой новости: 
**Заголовок**
Текст новости (3-4 предложения, около 50-80 слов).
Раздели новости строкой "---". Язык: русский.`;

  try {
    // ✅ ФИКС: POST-запрос к OpenAI-совместимому endpoint pollinations
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer pk_HDH1lmceS1EC2tv8` },
      body: JSON.stringify({
        model: 'openai-fast',
        messages: [{ role: 'user', content: prompt }],
        seed: 42,
        private: false,
      }),
    });


    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const json = (await response.json()) as {
      choices?: { message?: { content?: string } }[];
    };
    
    const rawText = json?.choices?.[0]?.message?.content ?? '';
    console.log(`=== РЕАЛЬНЫЙ ОТВЕТ ДЛЯ ${category} ===`);
    console.log(rawText);
    console.log('=== КОНЕЦ ОТВЕТА ===');

    console.log(
      `✅ Категория ${category}, длина ответа: ${rawText.length} символов`,
    );

    const news = parseNewsText(rawText, category);

    if (news.length === 0) {
      console.warn(
        `Не удалось распарсить новости для ${category}, создаю заглушку`,
      );
      return [
        normalizeNewsItem({
          id: `${category}-fallback-${Date.now()}`,
          title: `Новости из области ${getCategoryLabel(category)}`,
          content:
            'Это автоматически сгенерированная новость. Сервис временно недоступен, но мы работаем над этим. Попробуйте обновить страницу позже.',
          category,
          createdAt: new Date().toISOString(),
          imageUrl: getPicsumImageUrl(`fallback-${category}`),
          cardSize: getCardSize(0, `fallback-${category}`),
        }),
      ];
    }

    return news;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Ошибка загрузки ${category}:`, error);
    return [
      normalizeNewsItem({
        id: `${category}-error-${Date.now()}`,
        title: `Ошибка загрузки новостей: ${getCategoryLabel(category)}`,
        content: `Не удалось загрузить новости. Проверь подключение к интернету и попробуй обновить страницу. Ошибка: ${message}`,
        category,
        createdAt: new Date().toISOString(),
        imageUrl: getPicsumImageUrl(`error-${category}`),
        cardSize: 'size-md',
      }),
    ];
  }
  
}

export function getCategoryNews(
  allNews: News[],
  category: NewsItemCategory,
): News[] {
  return allNews.filter((item) => item.category === category);
}

export async function fetchAllCategoriesNews(): Promise<News[]> {
  const batches = await Promise.all(
    DEFAULT_CATEGORIES.map((category) => generateNews(category)),
  );
  return batches.flat().map((item, index) => normalizeNewsItem(item));
}

export interface NewsCachePayload {
  timestamp: number;
  news: News[];
}

export function saveNewsCache(news: News[]): void {
  const payload: NewsCachePayload = {
    timestamp: Date.now(),
    news: news.map((item, index) => normalizeNewsItem(item)),
  };
  localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
}

export function readNewsCache(): NewsCachePayload | null {
  const raw = localStorage.getItem(CACHE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      !Array.isArray((parsed as NewsCachePayload).news) ||
      typeof (parsed as NewsCachePayload).timestamp !== 'number'
    ) {
      return null;
    }
    return parsed as NewsCachePayload;
  } catch {
    return null;
  }
}

export async function fetchCategoryNews(
  category: NewsItemCategory,
  existing: News[],
): Promise<News[]> {
  const fresh = await generateNews(category);
  const without = existing.filter((item) => item.category !== category);
  return without.concat(
    fresh.map((item, index) => normalizeNewsItem(item)),
  );
}

export async function saveNewsToBackend(news: News, token: string): Promise<void> {
  try {
    await fetch(`${BACKEND_URL}/posts/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: news.title,
        content: news.content,
        image_url: news.imageUrl,
        category: news.category,
      }),
    });
  } catch (error) {
    console.error('Failed to save news to backend:', error);
  }
}

export async function fetchNewsFromBackend(token: string): Promise<News[]> {
  const response = await fetch(`${BACKEND_URL}/posts?limit=50`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  
  const data = await response.json();
  return data.posts.map((post: any) => normalizeNewsItem({
    id: post.id,
    title: post.title,
    content: post.content,
    category: post.category || 'tech',
    imageUrl: post.image_url,
    createdAt: post.created_at,
     isLiked: post.isLiked ?? post.is_liked ?? false,
  }));
}