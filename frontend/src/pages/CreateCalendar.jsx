import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const rangeLabels5 = ['Bardzo źle', 'Źle', 'Umiarkowanie', 'Dobrze', 'Bardzo dobrze'];
const rangeLabels3 = ['Nigdy', 'Okazjonalnie', 'Często'];

function CreateCalendar() {
  const navigate = useNavigate();

  useEffect(() => {
    sessionStorage.removeItem('life-calendar-saved');
    sessionStorage.removeItem('life-calendar-viewing');
  }, []);
  
  const [formData, setFormData] = useState({
    name: 'Mój Kalendarz',
    birthDate: '',
    gender: '',
    sleepQuality: 3,
    physicalActivity: 3,
    nutrition: 3,
    stressLevel: 3,
    smoking: 1,
    alcohol: 1
  });

  const [validationError, setValidationError] = useState(null);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    setValidationError(null);

    // Walidacja nazwy
    if (!formData.name || formData.name.trim().length === 0) {
      setValidationError('Nazwa kalendarza jest wymagana');
      return false;
    }

    if (formData.name.trim().length > 30) {
      setValidationError('Nazwa kalendarza nie może przekraczać 30 znaków');
      return false;
    }

    // Walidacja daty urodzenia
    if (!formData.birthDate) {
      setValidationError('Data urodzenia jest wymagana');
      return false;
    }

    const birthDate = new Date(formData.birthDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (birthDate > today) {
      setValidationError('Data urodzenia nie może być w przyszłości');
      return false;
    }

    // Walidacja maksymalnego wieku (120 lat)
    const ageInYears = Math.floor((today - birthDate) / (365.25 * 24 * 60 * 60 * 1000));
    if (ageInYears >= 120) {
      setValidationError('Maksymalny dopuszczalny wiek to 120 lat');
      return false;
    }

    // Walidacja płci
    if (!formData.gender || (formData.gender !== 'male' && formData.gender !== 'female')) {
      setValidationError('Wybierz płeć');
      return false;
    }

    // Walidacja zakresów (powinny być w zakresie 1-5 lub 1-3)
    if (formData.sleepQuality < 1 || formData.sleepQuality > 5 ||
        formData.physicalActivity < 1 || formData.physicalActivity > 5 ||
        formData.nutrition < 1 || formData.nutrition > 5 ||
        formData.stressLevel < 1 || formData.stressLevel > 5) {
      setValidationError('Nieprawidłowe wartości w sekcji "Styl życia"');
      return false;
    }

    if (formData.smoking < 1 || formData.smoking > 3 ||
        formData.alcohol < 1 || formData.alcohol > 3) {
      setValidationError('Nieprawidłowe wartości w sekcji "Używki"');
      return false;
    }

    return true;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Walidacja przed przekierowaniem
    if (!validateForm()) {
      // Przewiń do góry, aby użytkownik zobaczył błąd
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    // Przekierowanie do strony wyników z danymi kalendarza
    navigate('/wynik', { state: { calendarData: formData } });
  };

  return (
    <main className="form-page">
      <div className="form-container">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Powrót
        </button>
        
        <div className="form-header">
          <h1>Stwórz swój kalendarz</h1>
          <p>Odpowiedz na kilka pytań, aby spersonalizować swój kalendarz życia</p>
        </div>

        {validationError && (
          <div className="form-error" style={{ 
            marginBottom: '1.5rem', 
            padding: '1rem', 
            background: '#fef2f2', 
            border: '1px solid #fecaca', 
            borderRadius: '8px',
            color: '#991b1b'
          }}>
            {validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="calendar-form">
          
          {/* Nazwa kalendarza */}
          <div className="form-section">
            <h2 className="section-title">Podstawowe informacje</h2>
            
            <div className="form-group">
              <label htmlFor="name">Nazwa kalendarza <span className="required">*</span></label>
              <div className="calendar-name-input-wrapper">
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  placeholder="Mój Kalendarz"
                  maxLength={30}
                  required
                />
                <span className="char-counter">{formData.name.length}/30</span>
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="birthDate">Data urodzenia <span className="required">*</span></label>
              <input
                type="date"
                id="birthDate"
                value={formData.birthDate}
                onChange={(e) => handleChange('birthDate', e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Płeć <span className="required">*</span></label>
              <div className="radio-group">
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="female"
                    checked={formData.gender === 'female'}
                    onChange={(e) => handleChange('gender', e.target.value)}
                    required
                  />
                  <span className="radio-label">Kobieta</span>
                </label>
                <label className="radio-option">
                  <input
                    type="radio"
                    name="gender"
                    value="male"
                    checked={formData.gender === 'male'}
                    onChange={(e) => handleChange('gender', e.target.value)}
                  />
                  <span className="radio-label">Mężczyzna</span>
                </label>
              </div>
            </div>
          </div>

          {/* Styl życia */}
          <div className="form-section">
            <h2 className="section-title">Styl życia</h2>
            
            <div className="form-group">
              <label>Jakość snu</label>
              <div className="range-container">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.sleepQuality}
                  onChange={(e) => handleChange('sleepQuality', parseInt(e.target.value))}
                  className="range-input"
                />
                <span className="range-value">{rangeLabels5[formData.sleepQuality - 1]}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Aktywność fizyczna</label>
              <div className="range-container">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.physicalActivity}
                  onChange={(e) => handleChange('physicalActivity', parseInt(e.target.value))}
                  className="range-input"
                />
                <span className="range-value">{rangeLabels5[formData.physicalActivity - 1]}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Jakość odżywiania</label>
              <div className="range-container">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.nutrition}
                  onChange={(e) => handleChange('nutrition', parseInt(e.target.value))}
                  className="range-input"
                />
                <span className="range-value">{rangeLabels5[formData.nutrition - 1]}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Poziom stresu</label>
              <div className="range-container">
                <input
                  type="range"
                  min="1"
                  max="5"
                  value={formData.stressLevel}
                  onChange={(e) => handleChange('stressLevel', parseInt(e.target.value))}
                  className="range-input"
                />
                <span className="range-value">{rangeLabels5[formData.stressLevel - 1]}</span>
              </div>
            </div>
          </div>

          {/* Używki */}
          <div className="form-section">
            <h2 className="section-title">Używki</h2>
            
            <div className="form-group">
              <label>Palenie tytoniu</label>
              <div className="range-container">
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={formData.smoking}
                  onChange={(e) => handleChange('smoking', parseInt(e.target.value))}
                  className="range-input range-3"
                />
                <span className="range-value">{rangeLabels3[formData.smoking - 1]}</span>
              </div>
            </div>

            <div className="form-group">
              <label>Spożycie alkoholu</label>
              <div className="range-container">
                <input
                  type="range"
                  min="1"
                  max="3"
                  value={formData.alcohol}
                  onChange={(e) => handleChange('alcohol', parseInt(e.target.value))}
                  className="range-input range-3"
                />
                <span className="range-value">{rangeLabels3[formData.alcohol - 1]}</span>
              </div>
            </div>
          </div>

          <button type="submit" className="btn-submit">
            Dalej
          </button>
        </form>
      </div>
    </main>
  );
}

export default CreateCalendar;
