type FeedStatusProps = {
  loading: boolean;
  error: string | null;
  hasNews: boolean;
  hasFilteredNews: boolean;
};

export function FeedStatus({
  loading,
  error,
  hasNews,
  hasFilteredNews,
}: FeedStatusProps) {
  if (loading && !hasNews) {
    return (
      <div className="feed-message">
        <h2>Загрузка…</h2>
        <p>Генерируем новости по категориям.</p>
      </div>
    );
  }

  if (error && !hasNews) {
    return (
      <div className="feed-message">
        <h2>Ошибка загрузки</h2>
        <p>Не удалось загрузить новости</p>
        <p className="feed-error-detail">{error}</p>
      </div>
    );
  }

  if (!hasFilteredNews && hasNews) {
    return (
      <div className="feed-message">
        <h2>Новостей не найдено</h2>
        <p>Попробуйте выбрать другую категорию или изменить поисковый запрос.</p>
      </div>
    );
  }

  return null;
}
