import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

// 7 kolorów wyróżniających się na tle #e0e0e0 i #2a2a2a
const AVAILABLE_COLORS = [
  { id: 'green', value: '#4ade80', name: 'Zielony' },
  { id: 'red', value: '#f87171', name: 'Czerwony' },
  { id: 'blue', value: '#60a5fa', name: 'Niebieski' },
  { id: 'yellow', value: '#facc15', name: 'Żółty' },
  { id: 'purple', value: '#c084fc', name: 'Fioletowy' },
  { id: 'orange', value: '#fb923c', name: 'Pomarańczowy' },
  { id: 'cyan', value: '#22d3d1', name: 'Turkusowy' }
];

// Popularne emotki
const POPULAR_EMOJIS = [
  '📌', '🎉', '💪', '❤️', '⭐', '🎂', '✈️', '🏠', '💼', '📚', 
  '🎓', '💍', '👶', '🏆', '🎯', '🌟', '🔥', '😊', '🎵', '🏥', 
  '💔', '🚗', '🌴', '💰', '🎮', '🎨', '📝', '🏃', '🎁', '🌍',
  '🎪', '🎬', '📸', '🎤', '🎸', '🎹', '🏖️', '⛰️', '🌊', '🌸',
  '🍕', '☕', '🍰', '🎈', '🎊', '💐', '🌹', '💀','👽','🎃','🐱','🐶',
  '⚽', '🏀', '🎭', '📷', '🎥', '🏋️', '🧘', '🎲', '🎰', '🎯', '💩',
  '🌈','⚡️','🛒'
];

function WeekModal({ isOpen, onClose, weekData, onSave, birthDate, suggestion, onAddFromSuggestion, totalWeeks }) {
  const [color, setColor] = useState(null);
  const [events, setEvents] = useState([]);
  const [newEvent, setNewEvent] = useState({ name: '', description: '', emoji: '📌' });
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingIndex, setEditingIndex] = useState(null);
  const [eventDate, setEventDate] = useState('');
  const [addError, setAddError] = useState('');

  const isSuggestionMode = !!suggestion;

  // Zablokuj scroll przy otwartym modalu
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (weekData) {
      setColor(weekData.color || null);
      setEvents(weekData.events || []);
      setShowAddForm(false);
      setEditingIndex(null);
      setNewEvent({ name: '', description: '', emoji: '📌' });
      setEventDate('');
      setAddError('');
    }
  }, [weekData]);

  useEffect(() => {
    if (suggestion) {
      setColor(suggestion.color || null);
      setNewEvent({
        name: suggestion.title || '',
        description: suggestion.description || '',
        emoji: suggestion.emoji || '📌'
      });
      setShowAddForm(true);
      setEventDate('');
      setAddError('');
    }
  }, [suggestion]);

  if (!isOpen) return null;
  if (!weekData && !suggestion) return null;

  // Oblicz zakres dat dla tygodnia
  const getWeekDateRange = () => {
    if (!birthDate) return 'Brak daty urodzenia';
    
    const birth = new Date(birthDate);
    const weekStart = new Date(birth);
    weekStart.setDate(birth.getDate() + (weekData.weekIndex * 7));
    
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const formatDate = (date) => {
      return date.toLocaleDateString('pl-PL', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric' 
      });
    };

    return `${formatDate(weekStart)} - ${formatDate(weekEnd)}`;
  };

  const handleAddEvent = () => {
    if (!newEvent.name.trim()) return;
    
    if (editingIndex !== null) {
      const updatedEvents = [...events];
      updatedEvents[editingIndex] = { ...newEvent };
      setEvents(updatedEvents);
      setEditingIndex(null);
    } else {
      setEvents([...events, { ...newEvent }]);
    }
    
    setNewEvent({ name: '', description: '', emoji: '📌' });
    setShowEmojiPicker(false);
    setShowAddForm(false);
  };

  const handleEditEvent = (index) => {
    const eventToEdit = events[index];
    setNewEvent({
      name: eventToEdit.name,
      description: eventToEdit.description || '',
      emoji: eventToEdit.emoji || '📌'
    });
    setEditingIndex(index);
    setShowAddForm(true);
  };

  const handleCancelEdit = () => {
    setEditingIndex(null);
    setNewEvent({ name: '', description: '', emoji: '📌' });
    setShowAddForm(false);
    setShowEmojiPicker(false);
  };

  const handleRemoveEvent = (index) => {
    const updatedEvents = events.filter((_, i) => i !== index);
    setEvents(updatedEvents);
    
    // Jeśli wszystkie wydarzenia zostały usunięte, usuń również kolor
    if (updatedEvents.length === 0) {
      setColor(null);
    }
    
    if (editingIndex === index) {
      setEditingIndex(null);
      setNewEvent({ name: '', description: '', emoji: '📌' });
      setShowAddForm(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Jeśli nie ma wydarzeń, usuń również kolor
      const finalColor = events.length === 0 ? null : color;
      await onSave({
        weekIndex: weekData.weekIndex,
        color: finalColor,
        events
      });
      onClose();
    } catch (error) {
      console.error('Save error:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleClearColor = () => {
    setColor(null);
  };

  const handleAddFromSuggestionSubmit = async () => {
    setAddError('');
    if (!newEvent.name.trim()) {
      setAddError('Podaj nazwę wydarzenia.');
      return;
    }
    if (!eventDate) {
      setAddError('Wybierz datę wydarzenia.');
      return;
    }
    setSaving(true);
    try {
      await onAddFromSuggestion(eventDate, {
        color,
        events: [{ name: newEvent.name.trim(), description: newEvent.description?.trim() || '', emoji: newEvent.emoji || '📌' }]
      });
      onClose();
    } catch (e) {
      setAddError(e.message || 'Nie udało się dodać wydarzenia.');
    } finally {
      setSaving(false);
    }
  };

  const yearNumber = weekData ? Math.floor(weekData.weekIndex / 52) + 1 : 0;
  const weekInYear = weekData ? (weekData.weekIndex % 52) + 1 : 0;

  const modalMarkup = (
    <div 
      className="modal-overlay" 
      onClick={onClose}
    >
      <div
        className={`modal-content week-modal ${isSuggestionMode ? 'week-modal--suggestion' : ''}`}
        style={isSuggestionMode && suggestion?.color ? { '--suggestion-accent': suggestion.color } : undefined}
        onClick={e => e.stopPropagation()}
      >
        <button className="modal-close" onClick={onClose}>×</button>
        
        {isSuggestionMode ? (
          <div className="week-modal-header week-modal-header--suggestion">
            <h2>Dodaj wydarzenie</h2>
            <p className="week-modal-hint">Edytuj treść, wybierz datę i zatwierdź.</p>
          </div>
        ) : (
          <div className="week-modal-header">
            <h2>Tydzień {weekInYear}, Rok {yearNumber}</h2>
            <p className="week-date-range">{getWeekDateRange()}</p>
            <span className="week-index-info">Tydzień życia #{weekData.weekIndex + 1}</span>
          </div>
        )}

        {!isSuggestionMode && (
          <div className="week-section">
            <h3>Wydarzenia w tym tygodniu</h3>
            {events.length === 0 ? (
              <p className="no-events">Brak wydarzeń</p>
            ) : (
              <div className="events-list">
                {events.map((event, index) => (
                  <div key={index} className={`event-item ${editingIndex === index ? 'editing' : ''}`}>
                    <span className="event-emoji">{event.emoji || '📌'}</span>
                    <div className="event-details">
                      <span className="event-name">{event.name}</span>
                      {event.description && (
                        <span className="event-description">{event.description}</span>
                      )}
                    </div>
                    <div className="event-actions">
                      <button className="event-edit" onClick={() => handleEditEvent(index)} title="Edytuj">✎</button>
                      <button className="event-remove" onClick={() => handleRemoveEvent(index)} title="Usuń">×</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {(showAddForm || isSuggestionMode) && (
          <div className={`week-section add-event-section ${isSuggestionMode ? 'add-event-section--suggestion' : ''}`}>
            {!isSuggestionMode && (
              <div className="add-event-header">
                <h3>{editingIndex !== null ? 'Edytuj wydarzenie' : 'Nowe wydarzenie'}</h3>
                <button className="btn-close-form" onClick={handleCancelEdit}>×</button>
              </div>
            )}

            {isSuggestionMode && (
              <>
                <div className="form-field form-field--date">
                  <label>Data wydarzenia <span className="required">*</span></label>
                  <input
                    type="date"
                    className="date-input-suggestion"
                    value={eventDate}
                    onChange={e => { setEventDate(e.target.value); setAddError(''); }}
                    min={(() => {
                      if (!birthDate) return undefined;
                      const d = new Date(birthDate);
                      if (isNaN(d.getTime())) return undefined;
                      const y = d.getFullYear();
                      const m = String(d.getMonth() + 1).padStart(2, '0');
                      const day = String(d.getDate()).padStart(2, '0');
                      return `${y}-${m}-${day}`;
                    })()}
                  />
                  <span className="form-field-hint">Przypisz wydarzenie do wybranego tygodnia życia.</span>
                </div>

                <div className="form-field">
                  <label>Kolor tygodnia</label>
                  <div className="color-picker">
                    <button className={`color-option color-default ${!color ? 'selected' : ''}`} onClick={handleClearColor} title="Bez koloru">
                      <span className="color-preview default"></span>
                    </button>
                    {AVAILABLE_COLORS.map(c => (
                      <button
                        key={c.id}
                        className={`color-option ${color === c.value ? 'selected' : ''}`}
                        onClick={() => setColor(c.value)}
                        title={c.name}
                      >
                        <span className="color-preview" style={{ background: c.value }}></span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field">
                  <label>Nazwa wydarzenia</label>
                  <div className="event-input-row">
                    <button className="emoji-trigger" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Wybierz ikonę">
                      {newEvent.emoji}
                    </button>
                    <div className="event-input-wrapper">
                      <input
                        type="text"
                        placeholder="Np. Ukończenie studiów"
                        value={newEvent.name}
                        onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                        maxLength={50}
                      />
                      <span className="char-counter">{newEvent.name.length}/50</span>
                    </div>
                  </div>
                  {showEmojiPicker && (
                    <div className="emoji-picker">
                      {POPULAR_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          className={`emoji-option ${newEvent.emoji === emoji ? 'selected' : ''}`}
                          onClick={() => { setNewEvent({ ...newEvent, emoji }); setShowEmojiPicker(false); }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label>Opis (opcjonalnie)</label>
                  <div className="event-textarea-wrapper">
                    <textarea
                      placeholder="Dodaj szczegóły..."
                      value={newEvent.description}
                      onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                      maxLength={200}
                      rows={4}
                    />
                    <span className="char-counter">{newEvent.description.length}/200</span>
                  </div>
                </div>

                {addError && <p className="add-event-error">{addError}</p>}
              </>
            )}

            {!isSuggestionMode && (
              <>
                <div className="form-field">
                  <label>Kolor tygodnia</label>
                  <div className="color-picker">
                    <button className={`color-option color-default ${!color ? 'selected' : ''}`} onClick={handleClearColor} title="Bez koloru">
                      <span className="color-preview default"></span>
                    </button>
                    {AVAILABLE_COLORS.map(c => (
                      <button
                        key={c.id}
                        className={`color-option ${color === c.value ? 'selected' : ''}`}
                        onClick={() => setColor(c.value)}
                        title={c.name}
                      >
                        <span className="color-preview" style={{ background: c.value }}></span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-field">
                  <label>Wydarzenie</label>
                  <div className="event-input-row">
                    <button className="emoji-trigger" onClick={() => setShowEmojiPicker(!showEmojiPicker)} title="Wybierz ikonę">
                      {newEvent.emoji}
                    </button>
                    <div className="event-input-wrapper">
                      <input
                        type="text"
                        placeholder="Co się wydarzyło?"
                        value={newEvent.name}
                        onChange={e => setNewEvent({ ...newEvent, name: e.target.value })}
                        maxLength={50}
                      />
                      <span className="char-counter">{newEvent.name.length}/50</span>
                    </div>
                  </div>
                  {showEmojiPicker && (
                    <div className="emoji-picker">
                      {POPULAR_EMOJIS.map(emoji => (
                        <button
                          key={emoji}
                          className={`emoji-option ${newEvent.emoji === emoji ? 'selected' : ''}`}
                          onClick={() => { setNewEvent({ ...newEvent, emoji }); setShowEmojiPicker(false); }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <div className="form-field">
                  <label>Opis (opcjonalnie)</label>
                  <div className="event-textarea-wrapper">
                    <textarea
                      placeholder="Dodaj szczegóły..."
                      value={newEvent.description}
                      onChange={e => setNewEvent({ ...newEvent, description: e.target.value })}
                      maxLength={200}
                      rows={5}
                    />
                    <span className="char-counter">{newEvent.description.length}/200</span>
                  </div>
                </div>

                <button
                  className="btn-add-event"
                  onClick={handleAddEvent}
                  disabled={!newEvent.name.trim()}
                >
                  {editingIndex !== null ? 'Zapisz zmiany' : 'Dodaj'}
                </button>
              </>
            )}
          </div>
        )}

        {!isSuggestionMode && !showAddForm && (
          <button className="btn-show-add-form" onClick={() => setShowAddForm(true)}>
            + Dodaj wydarzenie
          </button>
        )}

        <div className="week-modal-actions">
          <button className="btn-secondary" onClick={onClose}>Anuluj</button>
          {isSuggestionMode ? (
            <button
              className="btn-submit"
              onClick={handleAddFromSuggestionSubmit}
              disabled={saving || !newEvent.name.trim() || !eventDate}
            >
              {saving ? 'Zapisywanie...' : 'Dodaj'}
            </button>
          ) : (
            <button className="btn-submit" onClick={handleSave} disabled={saving}>
              {saving ? 'Zapisywanie...' : 'Zapisz'}
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return createPortal(modalMarkup, document.body);
}

export default WeekModal;
