import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';

const BACKEND_URL = 'http://localhost:8080/api';

type Comment = {
  id: number;
  user_id: string;
  username: string;
  content: string;
  created_at: string;
};

type CommentSectionProps = {
  postId: string;
  onCommentCountUpdate?: (count: number) => void;
};

export function CommentSection({ postId, onCommentCountUpdate }: CommentSectionProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { token, user } = useAuth();

  useEffect(() => {
    if (postId) {
      loadComments();
    }
  }, [postId]);

  const loadComments = async () => {
    if (!postId) return;
    
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`${BACKEND_URL}/posts/${postId}/comments`);
      if (response.ok) {
        const data = await response.json();
        const commentsArray = Array.isArray(data) ? data : [];
        setComments(commentsArray);
        onCommentCountUpdate?.(commentsArray.length);
      }
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) {
      setError('Войдите, чтобы оставить комментарий');
      return;
    }
    
    if (!newComment.trim()) {
      setError('Введите текст комментария');
      return;
    }

    setSubmitting(true);
    setError(null);
    
    try {
      const response = await fetch(`${BACKEND_URL}/posts/${postId}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment }),
      });

      if (response.ok) {
        const comment = await response.json();
        const commentWithUsername = {
          ...comment,
          username: user?.username || 'Вы'
        };
        setComments(prev => [commentWithUsername, ...prev]);
        setNewComment('');
        onCommentCountUpdate?.(comments.length + 1);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Не удалось отправить комментарий');
      }
    } catch (error) {
      console.error('Error posting comment:', error);
      setError('Ошибка соединения');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="comments-loading">Загрузка комментариев...</div>;
  }

  // Показываем форму только если пользователь авторизован
  const showCommentForm = token;
  // Показываем сообщение о входе только если нет комментариев и нет формы
  const showLoginMessage = !token && comments.length === 0;
  // Показываем сообщение "нет комментариев" только если есть форма и нет комментариев
  const showEmptyMessage = showCommentForm && comments.length === 0;

  return (
    <div className="comment-section">
      <h3>Комментарии ({comments.length})</h3>
      
      {error && (
        <div className="comment-error">{error}</div>
      )}
      
      {showCommentForm && (
        <form onSubmit={handleSubmit} className="comment-form">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Напишите комментарий..."
            rows={3}
            disabled={submitting}
          />
          <button 
            type="submit" 
            disabled={submitting || !newComment.trim()}
          >
            {submitting ? 'Отправка...' : 'Отправить'}
          </button>
        </form>
      )}
      
      {showLoginMessage && (
        <p className="login-to-comment">Войдите, чтобы оставить комментарий</p>
      )}
      
      <div className="comments-list">
        {showEmptyMessage && (
          <p className="no-comments">Пока нет комментариев. Будьте первым!</p>
        )}
        {comments.map((comment) => (
          <div key={comment.id} className="comment-item">
            <div className="comment-header">
              <strong>{comment.username || 'Пользователь'}</strong>
              <span>{new Date(comment.created_at).toLocaleDateString('ru-RU')}</span>
            </div>
            <div className="comment-content">{comment.content}</div>
          </div>
        ))}
      </div>
    </div>
  );
}