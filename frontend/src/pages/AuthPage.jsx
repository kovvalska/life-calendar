import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(true);
  
  // Dane z formularza kalendarza (przekazane przez state)
  const calendarData = location.state?.calendarData;
  const hasCalendarData = !!calendarData;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: ''
  });

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Auth data:', formData);
    if (hasCalendarData) {
      console.log('Calendar data:', calendarData);
    }
    // TODO: Implementacja logowania/rejestracji
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setFormData({ email: '', password: '', confirmPassword: '' });
  };

  // Dynamiczne teksty w zależności od kontekstu
  const getTitle = () => {
    if (isLogin) return 'Zaloguj się';
    return 'Utwórz konto';
  };

  const getSubtitle = () => {
    if (isLogin) {
      return hasCalendarData 
        ? 'Zaloguj się, aby zapisać swój kalendarz' 
        : 'Zaloguj się, aby uzyskać dostęp do swoich kalendarzy';
    }
    return hasCalendarData 
      ? 'Zarejestruj się, aby zapisać swój kalendarz' 
      : 'Zarejestruj się, aby rozpocząć tworzenie kalendarzy';
  };

  return (
    <main className="form-page">
      <div className="form-container auth-container">
        <button className="btn-back" onClick={() => navigate(hasCalendarData ? '/stworz-kalendarz' : '/')}>
          ← Powrót
        </button>

        <div className="form-header">
          <h1>{getTitle()}</h1>
          <p>{getSubtitle()}</p>
        </div>

        {hasCalendarData && (
          <div className="calendar-info">
            <span className="calendar-info-icon">📅</span>
            <span>Kalendarz „{calendarData.name}" zostanie zapisany po zalogowaniu</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-section">
            <div className="form-group">
              <label htmlFor="email">Adres e-mail</label>
              <input
                type="email"
                id="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="twoj@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Hasło</label>
              <input
                type="password"
                id="password"
                value={formData.password}
                onChange={(e) => handleChange('password', e.target.value)}
                placeholder="••••••••"
                required
              />
            </div>

            {!isLogin && (
              <div className="form-group">
                <label htmlFor="confirmPassword">Powtórz hasło</label>
                <input
                  type="password"
                  id="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  placeholder="••••••••"
                  required
                />
              </div>
            )}

            {isLogin && (
              <div className="forgot-password">
                <a href="#" onClick={(e) => e.preventDefault()}>Zapomniałeś hasła?</a>
              </div>
            )}
          </div>

          <button type="submit" className="btn-submit btn-auth">
            {isLogin ? 'Zaloguj się' : 'Zarejestruj się'}
          </button>

          <div className="auth-divider">
            <span>lub</span>
          </div>

          <div className="auth-switch">
            <p>
              {isLogin ? 'Nie masz jeszcze konta?' : 'Masz już konto?'}
              <button type="button" className="btn-link" onClick={toggleMode}>
                {isLogin ? 'Zarejestruj się' : 'Zaloguj się'}
              </button>
            </p>
          </div>
        </form>
      </div>
    </main>
  );
}

export default AuthPage;
