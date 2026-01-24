import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function AuthPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, verify, login, resendCode, isAuthenticated } = useAuth();
  
  const [isLogin, setIsLogin] = useState(true);
  const [showVerification, setShowVerification] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Dane z formularza kalendarza (przekazane przez state)
  const calendarData = location.state?.calendarData;
  const hasCalendarData = !!calendarData;

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    verificationCode: ''
  });

  // Przekieruj jeśli już zalogowany
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (showVerification) {
        // Weryfikacja kodu
        await verify(formData.email, formData.verificationCode);
        navigate('/dashboard');
      } else if (isLogin) {
        // Logowanie
        await login(formData.email, formData.password);
        navigate('/dashboard');
      } else {
        // Rejestracja
        if (formData.password !== formData.confirmPassword) {
          throw new Error('Hasła nie są identyczne');
        }
        
        const result = await register(formData.email, formData.password);
        
        if (result.requiresVerification) {
          setShowVerification(true);
          setSuccess('Kod weryfikacyjny został wysłany na Twój email');
        }
      }
    } catch (err) {
      if (err.requiresVerification) {
        setShowVerification(true);
        setError(err.message);
      } else {
        setError(err.message || 'Wystąpił błąd');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resendCode(formData.email);
      setSuccess('Nowy kod został wysłany');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsLogin(!isLogin);
    setShowVerification(false);
    setError('');
    setSuccess('');
    setFormData({ email: '', password: '', confirmPassword: '', verificationCode: '' });
  };

  const backFromVerification = () => {
    setShowVerification(false);
    setFormData(prev => ({ ...prev, verificationCode: '' }));
    setError('');
    setSuccess('');
  };

  // Dynamiczne teksty w zależności od kontekstu
  const getTitle = () => {
    if (showVerification) return 'Wprowadź kod';
    if (isLogin) return 'Zaloguj się';
    return 'Utwórz konto';
  };

  const getSubtitle = () => {
    if (showVerification) {
      return `Kod weryfikacyjny został wysłany na ${formData.email}`;
    }
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
        <button 
          className="btn-back" 
          onClick={() => {
            if (showVerification) {
              backFromVerification();
            } else {
              navigate(hasCalendarData ? '/stworz-kalendarz' : '/');
            }
          }}
        >
          ← Powrót
        </button>

        <div className="form-header">
          <h1>{getTitle()}</h1>
          <p>{getSubtitle()}</p>
        </div>

        {hasCalendarData && !showVerification && (
          <div className="calendar-info">
            <span className="calendar-info-icon">📅</span>
            <span>Kalendarz „{calendarData.name}" zostanie zapisany po zalogowaniu</span>
          </div>
        )}

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-section">
            {showVerification ? (
              // Formularz weryfikacji
              <div className="form-group">
                <label htmlFor="verificationCode">Kod weryfikacyjny (4 cyfry)</label>
                <input
                  type="text"
                  id="verificationCode"
                  value={formData.verificationCode}
                  onChange={(e) => handleChange('verificationCode', e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder="0000"
                  maxLength={4}
                  className="verification-input"
                  required
                  autoFocus
                />
              </div>
            ) : (
              // Formularz logowania/rejestracji
              <>
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
                    minLength={6}
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
                      minLength={6}
                      required
                    />
                  </div>
                )}

                {isLogin && (
                  <div className="forgot-password">
                    <a href="#" onClick={(e) => e.preventDefault()}>Zapomniałeś hasła?</a>
                  </div>
                )}
              </>
            )}
          </div>

          <button type="submit" className="btn-submit btn-auth" disabled={loading}>
            {loading ? 'Proszę czekać...' : (
              showVerification ? 'Zweryfikuj' : (isLogin ? 'Zaloguj się' : 'Zarejestruj się')
            )}
          </button>

          {showVerification && (
            <button 
              type="button" 
              className="btn-resend" 
              onClick={handleResendCode}
              disabled={loading}
            >
              Wyślij kod ponownie
            </button>
          )}

          {!showVerification && (
            <>
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
            </>
          )}
        </form>
      </div>
    </main>
  );
}

export default AuthPage;
