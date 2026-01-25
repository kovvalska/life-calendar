import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout, getCalendars, deleteCalendar } = useAuth();
  const [calendars, setCalendars] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleDelete = async (calendarId) => {
    if (window.confirm('Czy na pewno chcesz usunąć ten kalendarz?')) {
      try {
        await deleteCalendar(calendarId);
        setCalendars(calendars.filter(c => c._id !== calendarId));
      } catch (error) {
        console.error('Delete error:', error);
      }
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pl-PL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const handleViewCalendar = (calendar) => {
    const id = calendar?._id;
    navigate(id ? `/wynik?calendar=${id}` : '/wynik', {
      state: { savedCalendar: calendar, fromDashboard: true }
    });
  };

  return (
    <main className="form-page">
      <div className="form-container dashboard-container">
        <div className="dashboard-header">
          <h1>Twój panel</h1>
          <p>Witaj, {user?.email}</p>
        </div>

        <div className="dashboard-content">
          {/* Akcje */}
          <div className="dashboard-actions">
            <button 
              className="btn-submit" 
              onClick={() => navigate('/stworz-kalendarz')}
            >
              Stwórz nowy kalendarz
            </button>
            <button 
              className="btn-logout" 
              onClick={handleLogout}
            >
              Wyloguj się
            </button>
          </div>

          {/* Lista kalendarzy */}
          <div className="calendars-section">
            <h2 className="section-title">Twoje kalendarze</h2>
            
            {loading ? (
              <p className="calendars-loading">Ładowanie...</p>
            ) : calendars.length === 0 ? (
              <p className="calendars-empty">Nie masz jeszcze żadnych kalendarzy</p>
            ) : (
              <div className="calendars-list">
                {calendars.map((calendar) => (
                  <div 
                    key={calendar._id} 
                    className="calendar-card clickable"
                    onClick={() => handleViewCalendar(calendar)}
                  >
                    <div className="calendar-info">
                      <h3 className="calendar-name">{calendar.name}</h3>
                      <p className="calendar-stats">
                        Szacowana długość życia: <strong>{calendar.expectedLifespan} lat</strong>
                      </p>
                      <p className="calendar-date">
                        Utworzono: {formatDate(calendar.createdAt)}
                      </p>
                    </div>
                    <div className="calendar-actions">
                      <button 
                        className="btn-delete"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(calendar._id);
                        }}
                        title="Usuń kalendarz"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </main>
  );
}

export default Dashboard;
