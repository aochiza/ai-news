import { useEffect, useState } from 'react';

interface AppFooterProps {
  totalNews: number;
  categoriesCount: number;
}

export function AppFooter({ totalNews, categoriesCount }: AppFooterProps) {
  const [currentYear] = useState(new Date().getFullYear());
  const [lastGenerated, setLastGenerated] = useState<string>('');

  useEffect(() => {
    setLastGenerated(new Date().toLocaleString());
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="app-footer">
      <div className="footer-gradient-bg"></div>
      <div className="footer-content">
        <div className="footer-section">
          <h4>AI News</h4>
          <p>Данные получаются через text.pollinations.ai</p>
        </div>

        <div className="footer-section">
          <h4>Статистика</h4>
          <ul className="stats-list">
            <li>
              <span className="stat-label">Всего новостей:</span>
              <span className="stat-value">{totalNews}</span>
            </li>
            <li>
              <span className="stat-label">Категорий:</span>
              <span className="stat-value">{categoriesCount}</span>
            </li>
            <li>
              <span className="stat-label">Последнее обновление:</span>
              <span className="stat-value">{lastGenerated}</span>
            </li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Полезные ссылки</h4>
          <ul className="links-list">
            <li><a href="#" onClick={(e) => { e.preventDefault(); scrollToTop(); }}>↑ Наверх</a></li>
            <li><a href="#">О проекте</a></li>
            <li><a href="#">Политика конфиденциальности</a></li>
            <li><a href="#">Контакты</a></li>
          </ul>
        </div>

        <div className="footer-section">
          <h4>Технологии</h4>
          <div className="tech-stack">
            <span className="tech-badge">React 18</span>
            <span className="tech-badge">TypeScript</span>
            <span className="tech-badge">OpenAI API</span>
          </div>
        </div>
      </div>

      <div className="footer-bottom">
        <div className="footer-bottom-content">
          <p>&copy; {currentYear} AI News Generator. Все права защищены.</p>
          <div className="disclaimer">
            <span className="disclaimer-icon">⚠️</span>
            <span>Новости сгенерированы ИИ и могут содержать неточности</span>
          </div>
        </div>
      </div>
    </footer>
  );
}