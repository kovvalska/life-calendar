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
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, index: 0 });
  const [dragOffset, setDragOffset] = useState(0);
  const carouselRef = useRef(null);
  const lastIndexChangeRef = useRef(0);
  const trackRef = useRef(null);
  const [isTransitioning, setIsTransitioning] = useState(true);
  const dragStartIndexRef = useRef(0); // Oryginalny indeks na początku przeciągania

  const [validationError, setValidationError] = useState(null);

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
      // Walidacja danych przed obliczeniem
      if (!calendarData.birthDate) {
        setValidationError('Data urodzenia jest wymagana');
        return { birthDate: null, name: '', expectedLifespan: 90, livedWeeks: 0, totalWeeks: 4680, lifeResult: null };
      }

      if (!calendarData.gender || (calendarData.gender !== 'male' && calendarData.gender !== 'female')) {
        setValidationError('Nieprawidłowa wartość płci');
        return { birthDate: null, name: '', expectedLifespan: 90, livedWeeks: 0, totalWeeks: 4680, lifeResult: null };
      }

      const birth = new Date(calendarData.birthDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (isNaN(birth.getTime())) {
        setValidationError('Nieprawidłowa data urodzenia');
        return { birthDate: null, name: '', expectedLifespan: 90, livedWeeks: 0, totalWeeks: 4680, lifeResult: null };
      }

      if (birth > today) {
        setValidationError('Data urodzenia nie może być w przyszłości');
        return { birthDate: null, name: '', expectedLifespan: 90, livedWeeks: 0, totalWeeks: 4680, lifeResult: null };
      }

      // Walidacja maksymalnego wieku (120 lat)
      const ageInYears = Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
      if (ageInYears > 120) {
        setValidationError('Maksymalny dopuszczalny wiek to 120 lat');
        return { birthDate: null, name: '', expectedLifespan: 90, livedWeeks: 0, totalWeeks: 4680, lifeResult: null };
      }

      try {
        const result = calculateLifeExpectancy(calendarData);
        
        // Oblicz wiek osoby
        const birth = new Date(calendarData.birthDate);
        const today = new Date();
        const ageInYears = Math.floor((today - birth) / (365.25 * 24 * 60 * 60 * 1000));
        
        // Jeśli szacowany wiek jest niższy niż wiek osoby, ustaw na wiek osoby + 2
        let finalExpectedLifespan = result.expectedLifespan;
        if (finalExpectedLifespan < ageInYears) {
          finalExpectedLifespan = ageInYears + 2;
        }
        
        // Walidacja maksymalnego wieku (120 lat)
        if (finalExpectedLifespan > 120) {
          setValidationError('Szacowany wiek przekracza maksymalny dopuszczalny wiek (120 lat)');
          return { birthDate: null, name: '', expectedLifespan: 90, livedWeeks: 0, totalWeeks: 4680, lifeResult: null };
        }
        
        // Przelicz totalWeeks na podstawie poprawionego wieku
        const totalWeeks = Math.round(finalExpectedLifespan * WEEKS_PER_YEAR);
        
        setValidationError(null);
        return {
          birthDate: calendarData.birthDate,
          name: calendarData.name || 'Mój Kalendarz',
          expectedLifespan: finalExpectedLifespan,
          livedWeeks: result.livedWeeks,
          totalWeeks: totalWeeks,
          lifeResult: { ...result, expectedLifespan: finalExpectedLifespan }
        };
      } catch (error) {
        setValidationError(error.message || 'Błąd obliczania długości życia');
        return { birthDate: null, name: '', expectedLifespan: 90, livedWeeks: 0, totalWeeks: 4680, lifeResult: null };
      }
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
    if (isDragging) {
      if (carouselTimerRef.current) {
        clearInterval(carouselTimerRef.current);
        carouselTimerRef.current = null;
      }
    } else {
      carouselTimerRef.current = setInterval(() => {
        setCarouselIndex((i) => i + 1);
      }, CAROUSEL_AUTO_MS);
    }
    return () => {
      if (carouselTimerRef.current) clearInterval(carouselTimerRef.current);
    };
  }, [isDragging]);

  // Obsługa płynnego przejścia z ostatniego na pierwszy
  useEffect(() => {
    if (!trackRef.current || isDragging) return;
    
    const handleTransitionEnd = () => {
      // Jeśli jesteśmy na duplikacie ostatniego elementu (indeks >= SUGGESTIONS.length)
      if (carouselIndex >= SUGGESTIONS.length) {
        trackRef.current.style.transition = 'none';
        setCarouselIndex(0);
        setTimeout(() => {
          if (trackRef.current) {
            trackRef.current.style.transition = '';
          }
        }, 50);
      }
      // Jeśli jesteśmy na duplikacie pierwszego elementu (indeks < 0)
      else if (carouselIndex < 0) {
        trackRef.current.style.transition = 'none';
        setCarouselIndex(SUGGESTIONS.length - 1);
        setTimeout(() => {
          if (trackRef.current) {
            trackRef.current.style.transition = '';
          }
        }, 50);
      }
    };

    const track = trackRef.current;
    track.addEventListener('transitionend', handleTransitionEnd);
    
    return () => {
      track.removeEventListener('transitionend', handleTransitionEnd);
    };
  }, [carouselIndex, isDragging]);

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

  const goCarouselPrev = () => {
    setCarouselIndex((i) => i - 1);
  };
  
  const goCarouselNext = () => {
    setCarouselIndex((i) => i + 1);
  };

  const getClientX = (e) => {
    return e.touches ? e.touches[0].clientX : e.clientX;
  };

  const handleCarouselStart = (e) => {
    setIsDragging(true);
    const clientX = getClientX(e);
    dragStartIndexRef.current = carouselIndex; // Zapisz oryginalny indeks
    setDragStart({ x: clientX, index: carouselIndex });
    setDragOffset(0);
    lastIndexChangeRef.current = carouselIndex;
  };

  const handleCarouselMove = (e) => {
    if (!isDragging) return;
    // preventDefault tylko dla mouse events, dla touch events jest w addEventListener
    if (!e.touches) {
      e.preventDefault();
    }
    const clientX = getClientX(e);
    const deltaX = clientX - dragStart.x;
    
    if (carouselRef.current) {
      const cardWidth = carouselRef.current.offsetWidth;
      const originalStartIndex = dragStartIndexRef.current; // Oryginalny indeks na początku przeciągania
      
      // Ogranicz dragOffset do maksymalnie jednej karty w każdą stronę
      // Zapobiega to widzeniu kart 3, 4, 5 itd. podczas przeciągania
      let limitedDeltaX = deltaX;
      if (deltaX < 0) {
        // Przeciąganie w lewo - nie pozwól zobaczyć więcej niż jedną następną kartę
        limitedDeltaX = Math.max(deltaX, -cardWidth);
      } else {
        // Przeciąganie w prawo - nie pozwól zobaczyć więcej niż jedną poprzednią kartę
        limitedDeltaX = Math.min(deltaX, cardWidth);
      }
      
      // Aktualizuj wizualny offset (ograniczony) - NIE zmieniaj indeksu podczas przeciągania
      setDragOffset(limitedDeltaX);
    }
  };

  const handleCarouselEnd = () => {
    if (!isDragging) return;
    
    // Zmień indeks tylko na końcu przeciągania, jeśli przeciągnięto wystarczająco daleko
    if (carouselRef.current && Math.abs(dragOffset) > 0) {
      const cardWidth = carouselRef.current.offsetWidth;
      const threshold = cardWidth * 0.3; // Próg do zmiany karty (30%)
      const startIndex = dragStartIndexRef.current; // Oryginalny indeks
      
      if (Math.abs(dragOffset) >= threshold) {
        // Przeciągnięto wystarczająco daleko - zmień indeks
        let newIndex;
        if (dragOffset > 0) {
          // Przeciągnięcie w prawo = poprzednia sugestia
          newIndex = startIndex - 1;
        } else {
          // Przeciągnięcie w lewo = następna sugestia
          newIndex = startIndex + 1;
        }
        
        // Zmień indeks tylko o 1
        if (Math.abs(newIndex - startIndex) === 1) {
          setCarouselIndex(newIndex);
          lastIndexChangeRef.current = newIndex;
        }
      }
      // Jeśli przeciągnięto mniej niż próg, pozostaje na aktualnej karcie (dragOffset zostanie zresetowany)
    }
    
    setIsDragging(false);
    setDragOffset(0);
  };

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

  // Wyświetl błąd walidacji zamiast kalendarza
  if (validationError && calendarData) {
    return (
      <main className="form-page">
        <div className="form-container">
          <button className="btn-back" onClick={() => navigate('/stworz-kalendarz')}>
            ← Powrót do formularza
          </button>
          <div className="form-header">
            <h1>Błąd walidacji danych</h1>
            <div className="form-error" style={{ 
              marginTop: '1rem', 
              padding: '1rem', 
              background: '#fef2f2', 
              border: '1px solid #fecaca', 
              borderRadius: '8px',
              color: '#991b1b'
            }}>
              {validationError}
            </div>
            <p style={{ marginTop: '1rem' }}>
              Wróć do formularza i popraw błędy, aby utworzyć kalendarz.
            </p>
          </div>
        </div>
      </main>
    );
  }

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

  const currentSuggestion = SUGGESTIONS[carouselIndex % SUGGESTIONS.length];

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
              <div className="calendar-result-stats">
                {birthDate && (
                  <span>Urodzony: {new Date(birthDate).toLocaleDateString('pl-PL')}</span>
                )}
                <span>Przeżyte tygodnie: <strong>{livedWeeks.toLocaleString('pl-PL')}</strong></span>
                {expectedLifespan && (
                  <span>Szacowana długość życia: <strong>{expectedLifespan} lat</strong></span>
                )}
              </div>
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
              <div 
                className="suggestions-carousel"
                onMouseDown={handleCarouselStart}
                onMouseMove={handleCarouselMove}
                onMouseUp={handleCarouselEnd}
                onMouseLeave={handleCarouselEnd}
                onTouchStart={handleCarouselStart}
                onTouchMove={handleCarouselMove}
                onTouchEnd={handleCarouselEnd}
              >
                <button type="button" className="carousel-btn carousel-prev" onClick={goCarouselPrev} aria-label="Poprzednia">‹</button>
                <div className={`suggestions-carousel-wrapper ${isDragging ? 'dragging' : ''}`} ref={carouselRef}>
                  <div 
                    ref={trackRef}
                    className={`suggestions-carousel-track ${isDragging ? 'dragging' : ''}`}
                    style={{ 
                      transform: `translateX(calc(-${(carouselIndex + 1) * 100}% + ${dragOffset}px))`,
                      transition: isDragging ? 'none' : 'transform 0.4s ease-in-out'
                    }}
                  >
                    {/* Duplikat ostatniego elementu na początku */}
                    {SUGGESTIONS.length > 0 && (
                      <div 
                        className="suggestion-card" 
                        style={{ '--suggestion-color': SUGGESTIONS[SUGGESTIONS.length - 1]?.color ?? '#e5e5e5' }}
                      >
                        <div className="suggestion-card-header">
                          <span className="suggestion-card-emoji">{SUGGESTIONS[SUGGESTIONS.length - 1].emoji}</span>
                          <span className="suggestion-card-title">{SUGGESTIONS[SUGGESTIONS.length - 1].title}</span>
                        </div>
                        <p className="suggestion-card-desc">{SUGGESTIONS[SUGGESTIONS.length - 1].description}</p>
                        <button
                          type="button"
                          className="btn-add-suggestion"
                          onClick={() => handleSuggestionAdd(SUGGESTIONS[SUGGESTIONS.length - 1])}
                          disabled={!calendarId || !token}
                        >
                          Dodaj
                        </button>
                      </div>
                    )}
                    {SUGGESTIONS.map((suggestion, index) => (
                      <div 
                        key={index}
                        className="suggestion-card" 
                        style={{ '--suggestion-color': suggestion?.color ?? '#e5e5e5' }}
                      >
                        <div className="suggestion-card-header">
                          <span className="suggestion-card-emoji">{suggestion.emoji}</span>
                          <span className="suggestion-card-title">{suggestion.title}</span>
                        </div>
                        <p className="suggestion-card-desc">{suggestion.description}</p>
                        <button
                          type="button"
                          className="btn-add-suggestion"
                          onClick={() => handleSuggestionAdd(suggestion)}
                          disabled={!calendarId || !token}
                        >
                          Dodaj
                        </button>
                      </div>
                    ))}
                    {/* Duplikat pierwszego elementu na końcu */}
                    {SUGGESTIONS.length > 0 && (
                      <div 
                        className="suggestion-card" 
                        style={{ '--suggestion-color': SUGGESTIONS[0]?.color ?? '#e5e5e5' }}
                      >
                        <div className="suggestion-card-header">
                          <span className="suggestion-card-emoji">{SUGGESTIONS[0].emoji}</span>
                          <span className="suggestion-card-title">{SUGGESTIONS[0].title}</span>
                        </div>
                        <p className="suggestion-card-desc">{SUGGESTIONS[0].description}</p>
                        <button
                          type="button"
                          className="btn-add-suggestion"
                          onClick={() => handleSuggestionAdd(SUGGESTIONS[0])}
                          disabled={!calendarId || !token}
                        >
                          Dodaj
                        </button>
                      </div>
                    )}
                  </div>
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
              <span className="legend-dot lived"></span> Przeżyte
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
            {/* Etykiety kolumn - co druga kolumna (1, 3, 5, ..., 25) */}
            <div
              className="calendar-year-label"
              style={{ gridColumn: 1, gridRow: 1 }}
            >
            </div>
            {Array.from({ length: CELLS_PER_ROW / 2 }, (_, i) => {
              const colNum = i * 2 + 1; // 1, 3, 5, ..., 25
              const gridCol = (i * 2) + 2; // Kolumna w gridzie: 2, 4, 6, ..., 26
              return (
                <div
                  key={`col-${colNum}`}
                  className="calendar-year-label calendar-column-label"
                  style={{ gridColumn: gridCol, gridRow: 1 }}
                >
                  {colNum}
                </div>
              );
            })}
            {Array.from({ length: totalYears }, (_, year) => {
              const yearNum = year + 1;
              const baseIdx = year * WEEKS_PER_YEAR;
              const row1 = 2 * year + 2; // +1 bo pierwszy wiersz to etykiety kolumn
              const row2 = 2 * year + 3;
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
