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
    const date = new Date(dateString);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleViewCalendar = (calendar) => {
    const id = calendar?._id;
    navigate(id ? `/wynik?calendar=${id}` : '/wynik', {
      state: { savedCalendar: calendar, fromDashboard: true }
    });
  };

  const handleCreateCalendar = () => {
    if (calendars.length >= 3) {
      alert('Możesz mieć maksymalnie 3 kalendarze. Usuń jeden z istniejących, aby utworzyć nowy.');
      return;
    }
    navigate('/stworz-kalendarz');
  };

  return (
    <main className="form-page">
      <div className="form-container dashboard-container">
        <button className="btn-back" onClick={() => navigate('/')}>
          ← Powrót
        </button>

        <div className="form-header">
          <h1>Twój panel</h1>
          <p>Witaj, {user?.email}</p>
        </div>

        <div className="dashboard-content">
          {/* Akcje */}
          <div className="dashboard-actions">
            <button 
              className="btn-submit" 
              onClick={handleCreateCalendar}
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
            <h2 className="section-title">Twoje kalendarze {calendars.length > 0 && `(${calendars.length})`}</h2>
            
            {loading ? (
              <p className="calendars-loading">Ładowanie...</p>
            ) : calendars.length === 0 ? (
              <p className="calendars-empty">Nie masz jeszcze żadnych kalendarzy</p>
            ) : (
              <div className="calendars-list">
                {calendars.map((calendar) => (
                  <div 
                    key={calendar._id} 
                    className="calendar-item clickable"
                    onClick={() => handleViewCalendar(calendar)}
                  >
                    <div className="calendar-info">
                      <h3 className="calendar-name">{calendar.name}</h3>
                      <div className="calendar-meta">
                        <p className="calendar-date">
                          {formatDate(calendar.createdAt)}
                        </p>
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
