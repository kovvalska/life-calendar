import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { calculateLifeExpectancy } from '../utils/lifeExpectancy';

function CalendarResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const [result, setResult] = useState(null);

  // Dane kalendarza z poprzedniej strony
  const calendarData = location.state?.calendarData;

  useEffect(() => {
    if (!calendarData) {
      navigate('/');
      return;
    }

    const calculationResult = calculateLifeExpectancy(calendarData);
    setResult(calculationResult);
  }, [calendarData, navigate]);

  if (!result) {
    return (
      <main className="form-page">
        <div className="loading-screen">
          <p>Obliczanie...</p>
        </div>
      </main>
    );
  }

  // Procent przeżytego życia
  const livedPercent = Math.round((result.livedWeeks / result.totalWeeks) * 100);

  return (
    <main className="form-page">
      <div className="form-container result-container">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Strona główna
        </button>

        <div className="form-header">
          <h1>{calendarData.name}</h1>
          <p>Twój spersonalizowany kalendarz życia</p>
        </div>

        {/* Główna statystyka */}
        <div className="result-hero">
          <div className="result-main-stat">
            <span className="stat-number">{result.expectedLifespan}</span>
            <span className="stat-label">szacowanych lat życia</span>
          </div>
          
          <div className="result-progress">
            <div className="progress-bar">
              <div 
                className="progress-fill" 
                style={{ width: `${livedPercent}%` }}
              ></div>
            </div>
            <div className="progress-labels">
              <span>{result.currentAge} lat przeżytych</span>
              <span>{result.remainingYears} lat pozostało</span>
            </div>
          </div>
        </div>

        {/* Statystyki w tygodniach */}
        <div className="result-section">
          <h2 className="section-title">W tygodniach</h2>
          <div className="stats-grid">
            <div className="stat-card">
              <span className="stat-value">{result.livedWeeks.toLocaleString()}</span>
              <span className="stat-desc">tygodni przeżytych</span>
            </div>
            <div className="stat-card highlight">
              <span className="stat-value">{result.remainingWeeks.toLocaleString()}</span>
              <span className="stat-desc">tygodni pozostało</span>
            </div>
            <div className="stat-card">
              <span className="stat-value">{result.totalWeeks.toLocaleString()}</span>
              <span className="stat-desc">tygodni łącznie</span>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="disclaimer">
          <p>
            ⚠️ To jest jedynie szacunek oparty na danych statystycznych i badaniach naukowych. 
            Rzeczywista długość życia zależy od wielu czynników, w tym genetyki, dostępu do opieki zdrowotnej 
            i nieprzewidzianych okoliczności. Ten kalkulator ma charakter edukacyjny.
          </p>
        </div>

        {/* Akcje */}
        <div className="result-actions">
          <button 
            className="btn-submit"
            onClick={() => navigate('/kalendarz-wizualizacja', { state: { calendarData, result } })}
          >
            Zobacz kalendarz wizualnie
          </button>
          <button 
            className="btn-secondary"
            onClick={() => navigate('/stworz-kalendarz')}
          >
            Stwórz nowy kalendarz
          </button>
        </div>
      </div>
    </main>
  );
}

export default CalendarResult;
