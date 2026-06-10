import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { DEFAULT_CATEGORIES } from '../domain/News';
import { getCategoryLabel } from '../domain/NewsRepository';

interface LoginModalProps {
  onClose: () => void;
  onLogin: () => void;
}

export function LoginModal({ onClose, onLogin }: LoginModalProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login, register } = useAuth();

  const toggleInterest = (category: string) => {
    setSelectedInterests(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
      } else {
        if (!username.trim()) {
          throw new Error('Введите имя пользователя');
        }
        await register(username, email, password);
      }
      onLogin();
      onClose();
    } catch (err) {
      console.error('Auth error:', err);
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <div className="modal-header">
          <div className="modal-tabs">
            <button 
              className={`modal-tab ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Вход
            </button>
            <button 
              className={`modal-tab ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Регистрация
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit}>
          {!isLogin && (
            <div className="modal-field">
              <input
                type="text"
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                minLength={3}
              />
            </div>
          )}
          
          <div className="modal-field">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          
          <div className="modal-field">
            <input
              type="password"
              placeholder="Пароль"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          
          {!isLogin && (
            <div className="modal-interests">
              <label>Интересы (выберите категории)</label>
              <div className="interests-grid">
                {DEFAULT_CATEGORIES.map(cat => (
                  <button
                    key={cat}
                    type="button"
                    className={`interest-chip ${selectedInterests.includes(cat) ? 'active' : ''}`}
                    onClick={() => toggleInterest(cat)}
                  >
                    {getCategoryLabel(cat)}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {error && <div className="modal-error">{error}</div>}
          
          <button type="submit" className="modal-submit" disabled={isLoading}>
            {isLoading ? (
              <span className="loading-spinner-small"></span>
            ) : (
              isLogin ? 'Войти' : 'Создать аккаунт'
            )}
          </button>
        </form>
        
        <div className="modal-footer">
          <button type="button" className="modal-switch" onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? 'Нет аккаунта? Создать' : 'Уже есть аккаунт? Войти'}
          </button>
        </div>
      </div>
    </div>
  );
}