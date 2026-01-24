import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <main className="form-page">
      <div className="form-container dashboard-container">
        <div className="dashboard-header">
          <h1>Zalogowany</h1>
          <p>Witaj w swoim panelu!</p>
        </div>

        <div className="dashboard-content">
          <div className="user-info-card">
            <div className="user-avatar">
              <span>👤</span>
            </div>
            <div className="user-details">
              <p className="user-email">{user?.email}</p>
              <p className="user-status">Konto zweryfikowane ✓</p>
            </div>
          </div>

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
        </div>
      </div>
    </main>
  );
}

export default Dashboard;
