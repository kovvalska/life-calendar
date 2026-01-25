import { useState, useMemo, useEffect, useRef, Fragment } from 'react';
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom';
import { calculateLifeExpectancy } from '../utils/lifeExpectancy';
import WeekModal from '../components/WeekModal';
import { useAuth } from '../context/AuthContext';
import { getEvents, putWeek } from '../api/events';
import { SUGGESTIONS } from '../data/suggestions';

const WEEKS_PER_YEAR = 52;
const CELLS_PER_ROW = 26;
const STORAGE_VIEWING = 'life-calendar-viewing';
const CAROUSEL_AUTO_MS = 5000;

function CalendarResult() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { saveCalendar, getCalendar, isAuthenticated, loading: authLoading, token } = useAuth();
  const { calendarData, savedCalendar, fromDashboard, alreadySaved } = location.state || {};

  const [saveStatus, setSaveStatus] = useState('idle');
  const [saveError, setSaveError] = useState(null);
  const [createdCalendar, setCreatedCalendar] = useState(null);
  const [restoredCalendar, setRestoredCalendar] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [restoreError, setRestoreError] = useState(null);
  const [eventsLoadError, setEventsLoadError] = useState(null);
  const [eventsLoading, setEventsLoading] = useState(false);
  const hasSavedRef = useRef(false);
  const hasRedirectedRef = useRef(false);

  const displayCalendar = savedCalendar ?? createdCalendar ?? restoredCalendar;
  const calendarId = displayCalendar?._id != null ? String(displayCalendar._id) : null;

  const [weeksData, setWeeksData] = useState({});
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedWeek, setSelectedWeek] = useState(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [suggestionModalOpen, setSuggestionModalOpen] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(null);
  const carouselTimerRef = useRef(null);

  const { birthDate, name, expectedLifespan, livedWeeks, totalWeeks, lifeResult } = useMemo(() => {
    const cal = displayCalendar;
    if (cal) {
      const birth = cal.birthDate ? new Date(cal.birthDate) : null;
      const total = Math.round((cal.expectedLifespan || 90) * WEEKS_PER_YEAR);
      let lived = 0;
      if (birth) {
        const diff = (Date.now() - birth.getTime()) / (7 * 24 * 60 * 60 * 1000);
        lived = Math.max(0, Math.floor(diff));
      }
      return {
        birthDate: cal.birthDate,
        name: cal.name || 'Kalendarz',
        expectedLifespan: cal.expectedLifespan || 90,
        livedWeeks: lived,
        totalWeeks: total,
        lifeResult: null
      };
    }
    if (calendarData) {
      const result = calculateLifeExpectancy(calendarData);
      return {
        birthDate: calendarData.birthDate,
        name: calendarData.name || 'Mój Kalendarz',
        expectedLifespan: result.expectedLifespan,
        livedWeeks: result.livedWeeks,
        totalWeeks: result.totalWeeks,
        lifeResult: result
      };
    }
    return { birthDate: null, name: '', expectedLifespan: 90, livedWeeks: 0, totalWeeks: 4680, lifeResult: null };
  }, [displayCalendar, calendarData]);

  useEffect(() => {
    if (!calendarId) return;
    sessionStorage.setItem(STORAGE_VIEWING, calendarId);
    const params = new URLSearchParams(window.location.search);
    if (params.get('calendar') === calendarId) return;
    params.set('calendar', calendarId);
    const base = window.location.pathname;
    window.history.replaceState(null, '', `${base}?${params.toString()}`);
  }, [calendarId]);

  useEffect(() => {
    if (authLoading || hasRedirectedRef.current) return;
    if (calendarData && !isAuthenticated && !fromDashboard) {
      hasRedirectedRef.current = true;
      navigate('/logowanie', { replace: true, state: { calendarData } });
    }
  }, [authLoading, calendarData, isAuthenticated, fromDashboard, navigate]);

  useEffect(() => {
    if (authLoading || !token) return;
    if (calendarData || savedCalendar || restoredCalendar) return;
    const fromUrl = searchParams.get('calendar') || new URLSearchParams(window.location.search).get('calendar');
    const storedId = fromUrl || sessionStorage.getItem(STORAGE_VIEWING);
    if (!storedId) {
      setRestoreLoading(false);
      return;
    }
    setRestoreLoading(true);
    setRestoreError(null);
    getCalendar(storedId)
      .then((cal) => {
        setRestoredCalendar(cal);
        setRestoreLoading(false);
      })
      .catch((err) => {
        sessionStorage.removeItem(STORAGE_VIEWING);
        const base = window.location.pathname;
        window.history.replaceState(null, '', base);
        setRestoreError(err.message || 'Błąd przywracania kalendarza');
        setRestoreLoading(false);
      });
  }, [authLoading, token, calendarData, savedCalendar, restoredCalendar, searchParams, getCalendar, navigate]);

  useEffect(() => {
    if (!calendarData || !lifeResult || !isAuthenticated || fromDashboard || alreadySaved || hasSavedRef.current) return;
    const saveHash = `${calendarData.name}|${calendarData.birthDate}|${calendarData.gender}`;
    if (sessionStorage.getItem('life-calendar-saved') === saveHash) return;
    hasSavedRef.current = true;
    setSaveStatus('saving');
    setSaveError(null);
    saveCalendar(calendarData, lifeResult)
      .then((data) => {
        if (data?.calendar) setCreatedCalendar(data.calendar);
        sessionStorage.setItem('life-calendar-saved', saveHash);
        setSaveStatus('saved');
      })
      .catch((err) => {
        const errorMessage = err.message || 'Błąd zapisu';
        setSaveError(errorMessage);
        setSaveStatus('error');
        hasSavedRef.current = false;
        // Jeśli błąd dotyczy limitu kalendarzy, pokaż alert
        if (errorMessage.includes('maksymalnie 3 kalendarze')) {
          alert(errorMessage);
        }
      });
  }, [calendarData, lifeResult, isAuthenticated, fromDashboard, alreadySaved, saveCalendar]);

  useEffect(() => {
    if (!calendarId || !token) return;
    setEventsLoadError(null);
    setEventsLoading(true);
    getEvents(calendarId, token)
      .then((data) => {
        setWeeksData(data);
        setEventsLoading(false);
      })
      .catch((err) => {
        setEventsLoadError(err.message || 'Błąd ładowania wydarzeń');
        setEventsLoading(false);
      });
  }, [calendarId, token]);

  useEffect(() => {
    carouselTimerRef.current = setInterval(() => {
      setCarouselIndex((i) => (i + 1) % SUGGESTIONS.length);
    }, CAROUSEL_AUTO_MS);
    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, []);

  const totalYears = Math.ceil(expectedLifespan) || 90;

  function weekIndexFromDate(birthDateVal, dateStr) {
    if (!birthDateVal || !dateStr) return null;
    const birth = new Date(birthDateVal);
    birth.setHours(0, 0, 0, 0);
    const sel = new Date(dateStr + 'T12:00:00');
    const diffMs = sel - birth;
    const diffWeeks = diffMs / (7 * 24 * 60 * 60 * 1000);
    const idx = Math.floor(diffWeeks);
    return idx >= 0 && idx < totalWeeks ? idx : null;
  }

  const getCellStatus = (index) => {
    if (index < 0) return 'empty';
    if (index < livedWeeks) return 'lived';
    return 'future';
  };

  const handleCellClick = (index) => {
    const data = weeksData[index] || { color: null, events: [] };
    setSelectedWeek({ weekIndex: index, ...data });
    setModalOpen(true);
  };

  const handleSaveWeek = async (payload) => {
    if (!calendarId || !token) throw new Error('Brak zapisanego kalendarza – zapisz kalendarz, aby dodawać wydarzenia.');
    await putWeek(calendarId, payload.weekIndex, { color: payload.color, events: payload.events ?? [] }, token);
    setWeeksData((prev) => ({
      ...prev,
      [payload.weekIndex]: { color: payload.color ?? null, events: payload.events || [] }
    }));
    setModalOpen(false);
    setSelectedWeek(null);
  };

  const handleAddFromSuggestion = async (dateStr, { color: suggestionColor, events: newEvents }) => {
    if (!calendarId || !token || !birthDate) throw new Error('Brak kalendarza lub daty urodzenia.');
    const weekIdx = weekIndexFromDate(birthDate, dateStr);
    if (weekIdx == null) throw new Error('Data poza zakresem kalendarza życia. Wybierz inną.');
    const existing = weeksData[weekIdx] || { color: null, events: [] };
    const mergedEvents = [...(existing.events || []), ...(newEvents || [])];
    const color = suggestionColor ?? existing.color;
    await putWeek(calendarId, weekIdx, { color: color ?? null, events: mergedEvents }, token);
    setWeeksData((prev) => ({
      ...prev,
      [weekIdx]: { color: color ?? null, events: mergedEvents }
    }));
    setSuggestionModalOpen(false);
    setSelectedSuggestion(null);
  };

  const handleSuggestionAdd = (s) => {
    setSelectedSuggestion(s);
    setSuggestionModalOpen(true);
  };

  const goCarouselPrev = () => setCarouselIndex((i) => (i - 1 + SUGGESTIONS.length) % SUGGESTIONS.length);
  const goCarouselNext = () => setCarouselIndex((i) => (i + 1) % SUGGESTIONS.length);

  const handleRetrySave = () => {
    if (!calendarData || !lifeResult || !isAuthenticated) return;
    const saveHash = `${calendarData.name}|${calendarData.birthDate}|${calendarData.gender}`;
    setSaveError(null);
    setSaveStatus('saving');
    saveCalendar(calendarData, lifeResult)
      .then((data) => {
        if (data?.calendar) setCreatedCalendar(data.calendar);
        sessionStorage.setItem('life-calendar-saved', saveHash);
        setSaveStatus('saved');
      })
      .catch((err) => {
        const errorMessage = err.message || 'Błąd zapisu';
        setSaveError(errorMessage);
        setSaveStatus('error');
        // Jeśli błąd dotyczy limitu kalendarzy, pokaż alert
        if (errorMessage.includes('maksymalnie 3 kalendarze')) {
          alert(errorMessage);
        }
      });
  };

  if (!calendarData && !savedCalendar && !restoredCalendar) {
    if (restoreLoading) {
      return (
        <main className="form-page">
          <div className="form-container">
            <button className="btn-back" onClick={() => navigate('/')}>← Powrót</button>
            <div className="form-header">
              <p className="save-status saving">Ładowanie kalendarza…</p>
            </div>
          </div>
        </main>
      );
    }
    return (
      <main className="form-page">
        <div className="form-container">
          <button className="btn-back" onClick={() => navigate('/')}>
            ← Powrót
          </button>
          <div className="form-header">
            <h1>Brak danych kalendarza</h1>
            <p>
              {restoreError
                ? `Nie udało się przywrócić kalendarza. ${restoreError} Stwórz nowy lub wybierz z panelu.`
                : 'Stwórz kalendarz lub wybierz zapisany z panelu, aby zobaczyć wynik.'}
            </p>
          </div>
        </div>
      </main>
    );
  }

  if (calendarData && !isAuthenticated && !fromDashboard) {
    return (
      <main className="form-page">
        <div className="form-container">
          <div className="form-header">
            <p className="save-status saving">Przekierowujemy do logowania…</p>
          </div>
        </div>
      </main>
    );
  }

  const currentSuggestion = SUGGESTIONS[carouselIndex];

  return (
    <main className="calendar-result-page">
      <div className="calendar-result-container">
        <button className="btn-back" onClick={() => navigate(fromDashboard || restoredCalendar ? '/dashboard' : '/')}>
          ← Powrót
        </button>

        <div className="calendar-result-block calendar-result-info">
          <div className="info-and-carousel-row">
            <div className="calendar-result-data">
              <h1 className="calendar-result-title">{name}</h1>
              <p className="calendar-result-stats">
                {birthDate && (
                  <>
                    Urodzony: {new Date(birthDate).toLocaleDateString('pl-PL')} ·{' '}
                  </>
                )}
                Przeżyte tygodnie: <strong>{livedWeeks.toLocaleString('pl-PL')}</strong>
                {expectedLifespan && (
                  <> · Szacowana długość życia: <strong>{expectedLifespan} lat</strong></>
                )}
              </p>
              {calendarData && !fromDashboard && isAuthenticated && (
                <div className="calendar-save-status">
                  {saveStatus === 'saving' && <span className="save-status saving">Zapisywanie kalendarza…</span>}
                  {(saveStatus === 'saved' || alreadySaved) && <span className="save-status saved">✓ Kalendarz zapisany w panelu</span>}
                  {saveStatus === 'error' && saveError && (
                    <span className="save-status error">
                      Nie udało się zapisać: {saveError}. <button type="button" className="btn-link" onClick={handleRetrySave}>Spróbuj ponownie</button>
                    </span>
                  )}
                </div>
              )}
              {calendarId && eventsLoadError && (
                <p className="save-status error" style={{ marginTop: '0.5rem' }}>
                  Wydarzenia: {eventsLoadError}
                </p>
              )}
            </div>

            <div className="suggestions-carousel-inline">
              <span className="suggestions-label">Sugestie</span>
              <div className="suggestions-carousel">
                <button type="button" className="carousel-btn carousel-prev" onClick={goCarouselPrev} aria-label="Poprzednia">‹</button>
                <div className="suggestion-card" style={{ '--suggestion-color': currentSuggestion?.color ?? '#e5e5e5' }}>
                  {currentSuggestion && (
                    <>
                      <div className="suggestion-card-header">
                        <span className="suggestion-card-emoji">{currentSuggestion.emoji}</span>
                        <span className="suggestion-card-title">{currentSuggestion.title}</span>
                      </div>
                      <p className="suggestion-card-desc">{currentSuggestion.description}</p>
                      <button
                        type="button"
                        className="btn-add-suggestion"
                        onClick={() => handleSuggestionAdd(currentSuggestion)}
                        disabled={!calendarId || !token}
                      >
                        Dodaj
                      </button>
                    </>
                  )}
                </div>
                <button type="button" className="carousel-btn carousel-next" onClick={goCarouselNext} aria-label="Następna">›</button>
              </div>
              <div className="carousel-dots">
                {SUGGESTIONS.map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    className={`carousel-dot ${i === carouselIndex ? 'active' : ''}`}
                    onClick={() => setCarouselIndex(i)}
                    aria-label={`Sugestia ${i + 1}`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="calendar-result-block calendar-result-calendar">
          <div className="calendar-legend">
            <span className="legend-item">
              <span className="legend-dot lived"></span> Przeżyte (kliknij, aby edytować)
            </span>
            <span className="legend-item">
              <span className="legend-dot future"></span> Przyszłe
            </span>
          </div>
          {calendarId && eventsLoading ? (
            <p className="save-status saving" style={{ marginTop: '1rem' }}>Ładowanie wydarzeń…</p>
          ) : (
          <div
            className="calendar-grid"
            role="img"
            aria-label="Kalendarz życia"
            style={{
              display: 'grid',
              gridTemplateColumns: `auto repeat(${CELLS_PER_ROW}, 1fr)`,
              gridAutoRows: 'auto',
              gap: '2px'
            }}
          >
            {Array.from({ length: totalYears }, (_, year) => {
              const yearNum = year + 1;
              const baseIdx = year * WEEKS_PER_YEAR;
              const row1 = 2 * year + 1;
              const row2 = 2 * year + 2;
              return (
                <Fragment key={year}>
                  <div
                    className="calendar-year-label"
                    style={{ gridColumn: 1, gridRow: `${row1} / span 2` }}
                  >
                    {yearNum}
                  </div>
                  {Array.from({ length: WEEKS_PER_YEAR }, (_, week) => {
                    const idx = baseIdx + week;
                    const status = getCellStatus(idx);
                    const wd = weeksData[idx];
                    const customColor = wd?.color ?? null;
                    const bg = customColor || (status === 'lived' ? '#2a2a2a' : null);
                    const hasEvents = wd?.events?.length > 0;
                    const emoji = hasEvents ? (wd.events[0].emoji || '📌') : null;
                    const r = week < CELLS_PER_ROW ? row1 : row2;
                    const c = (week % CELLS_PER_ROW) + 2;
                    const titleParts = [`Rok ${yearNum}, tydzień ${week + 1}`];
                    if (hasEvents) titleParts.push(wd.events.map(e => `${e.emoji || '📌'} ${e.name}`).join(' · '));
                    return (
                      <div
                        key={idx}
                        className={`calendar-cell ${status}`}
                        style={{
                          gridColumn: c,
                          gridRow: r,
                          ...(bg ? { background: bg } : {})
                        }}
                        title={titleParts.join('\n')}
                        onClick={() => handleCellClick(idx)}
                      >
                        {emoji && <span className="calendar-cell-emoji" aria-hidden="true">{emoji}</span>}
                      </div>
                    );
                  })}
                </Fragment>
              );
            })}
          </div>
          )}
        </div>
      </div>

      {selectedWeek && (
        <WeekModal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setSelectedWeek(null);
          }}
          weekData={selectedWeek}
          onSave={handleSaveWeek}
          birthDate={birthDate}
        />
      )}

      {selectedSuggestion && (
        <WeekModal
          isOpen={suggestionModalOpen}
          onClose={() => {
            setSuggestionModalOpen(false);
            setSelectedSuggestion(null);
          }}
          suggestion={selectedSuggestion}
          birthDate={birthDate}
          totalWeeks={totalWeeks}
          onAddFromSuggestion={handleAddFromSuggestion}
        />
      )}
    </main>
  );
}

export default CalendarResult;
