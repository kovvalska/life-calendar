import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function HomePage() {
  const navigate = useNavigate();
  const { isAuthenticated, getCalendars } = useAuth();
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchCalendars = async () => {
        try {
          const data = await getCalendars();
          setCalendars(data);
        } catch (error) {
          console.error('Error fetching calendars:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchCalendars();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, getCalendars]);

  const handleCreateCalendar = () => {
    if (isAuthenticated && calendars.length >= 3) {
      alert('Możesz mieć maksymalnie 3 kalendarze. Usuń jeden z istniejących, aby utworzyć nowy.');
      return;
    }
    navigate('/stworz-kalendarz');
  };

  return (
    <>
      {/* Hero Section */}
      <main className="hero">
        <h1 className="hero-title">Twoje życie w jednym spojrzeniu</h1>
        <h2 className="hero-subtitle">
          Wizualizuj swoją przeszłość i zaplanuj przyszłość w prosty sposób
        </h2>

        {/* Options */}
        <div className="options">
          <div className="option-card" onClick={handleCreateCalendar}>
            <h3 className="option-title">Stwórz własny kalendarz</h3>
            <p className="option-description">Spersonalizuj swoje życie</p>
            <button className="btn-select">Wybierz</button>
          </div>

          <div className="option-card">
            <h3 className="option-title">Szybka wizualizacja</h3>
            <p className="option-description">Zobacz demo w kilka sekund</p>
            <button className="btn-select">Wybierz</button>
          </div>
        </div>
      </main>
    </>
  );
}

export default HomePage;
