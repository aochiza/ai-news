import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { AppHeader } from './AppHeader';
import { AppNavigation } from './AppNavigation';
import { AppFooter } from './AppFooter';
import { DEFAULT_CATEGORIES } from '../domain/News';
import type { FeedCategory } from '../domain/News';

const BACKEND_URL = 'http://localhost:8080/api';
const NAV_ITEMS: FeedCategory[] = ['all', ...DEFAULT_CATEGORIES];

export function ProfilePage() {
  const { token, user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [username, setUsername] = useState('');

  useEffect(() => {
    console.log('🔵 ProfilePage: token=', !!token, 'user=', user);
    
    if (!token) {
      navigate('/');
      return;
    }
    
    // Если есть user из контекста, показываем его сразу
    if (user) {
      setProfile(user);
      setUsername(user.username || '');
    }
    
    loadProfile();
  }, [token]);

  const loadProfile = async () => {
    try {
      console.log('🔵 Loading profile from server...');
      const response = await fetch(`${BACKEND_URL}/user/profile`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Profile loaded:', data);
        setProfile(data);
        setUsername(data.username || '');
      } else if (response.status === 404) {
        console.log('⚠️ Profile not found, using auth user');
        setProfile(user);
        setUsername(user?.username || '');
      } else {
        setError('Не удалось загрузить профиль');
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Ошибка загрузки профиля');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      console.log('🔵 Updating profile:', { username });
      
      const response = await fetch(`${BACKEND_URL}/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ username }),
      });
      
      if (response.ok) {
        const updated = await response.json();
        console.log('✅ Profile updated:', updated);
        setProfile(updated);
        
        // Обновляем localStorage
        const storedUser = localStorage.getItem('auth_user');
        if (storedUser) {
          const userData = JSON.parse(storedUser);
          userData.username = username;
          localStorage.setItem('auth_user', JSON.stringify(userData));
        }
        
        setEditing(false);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Не удалось обновить профиль');
      }
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Ошибка обновления');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  if (!token) {
    return null;
  }

  if (loading) {
    return (
      <div className="app-wrapper">
        <div className="sticky-header">
          <AppHeader />
          <AppNavigation
            navItems={NAV_ITEMS}
            currentCategory="all"
            onSelectCategory={() => navigate('/')}
            searchVisible={false}
            searchInput=""
            onSearchInputChange={() => {}}
            onToggleSearch={() => {}}
            searchInputRef={{ current: null }}
            user={user}
            onLoginClick={() => {}}
            onLogoutClick={handleLogout}
            onProfileClick={() => navigate('/profile')}
          />
        </div>
        <div className="profile-loading">
          <div className="loading-spinner"></div>
          <p>Загрузка профиля...</p>
        </div>
        <AppFooter totalNews={0} categoriesCount={DEFAULT_CATEGORIES.length} />
      </div>
    );
  }

  const displayUser = profile || user;

  return (
    <div className="app-wrapper">
      <div className="sticky-header">
        <AppHeader />
        <AppNavigation
          navItems={NAV_ITEMS}
          currentCategory="all"
          onSelectCategory={() => navigate('/')}
          searchVisible={false}
          searchInput=""
          onSearchInputChange={() => {}}
          onToggleSearch={() => {}}
          searchInputRef={{ current: null }}
          user={user}
          onLoginClick={() => {}}
          onLogoutClick={handleLogout}
          onProfileClick={() => navigate('/profile')}
        />
      </div>
      
      <main className="profile-page-new">
        <div className="profile-background">
          <div className="profile-background-gradient"></div>
        </div>
        
        <div className="profile-content">
          <button className="profile-back-btn" onClick={() => navigate('/')}>
            ← На главную
          </button>
          
          <div className="profile-card">
            <div className="profile-avatar-large">
              <div className="avatar-initial">
                {displayUser?.username?.charAt(0).toUpperCase() || '👤'}
              </div>
            </div>
            
            {error && <div className="profile-error">{error}</div>}
            
            {editing ? (
              <form onSubmit={handleUpdate} className="profile-edit-form">
                <div className="form-field">
                  <label>Имя пользователя</label>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    required
                  />
                </div>
                
                <div className="form-field">
                  <label>Email</label>
                  <input
                    type="email"
                    value={displayUser?.email || ''}
                    disabled
                    className="disabled-field"
                  />
                  <span className="field-hint">Email нельзя изменить</span>
                </div>
                
                <div className="form-actions">
                  <button type="submit" className="save-btn" disabled={loading}>
                    {loading ? 'Сохранение...' : 'Сохранить'}
                  </button>
                  <button type="button" className="cancel-btn" onClick={() => setEditing(false)}>
                    Отмена
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="profile-info-card">
                  <div className="info-row">
                    <span className="info-label">Имя пользователя</span>
                    <span className="info-value">{displayUser?.username}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Email</span>
                    <span className="info-value">{displayUser?.email}</span>
                  </div>
                </div>
                
                <div className="profile-actions">
                  <button className="edit-profile-btn" onClick={() => setEditing(true)}>
                    ✏️ Редактировать профиль
                  </button>
                  <button className="logout-profile-btn" onClick={handleLogout}>
                    🚪 Выйти из аккаунта
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
      
      <AppFooter totalNews={0} categoriesCount={DEFAULT_CATEGORIES.length} />
    </div>
  );
}