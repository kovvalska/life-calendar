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

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
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
