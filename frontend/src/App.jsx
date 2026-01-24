import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import HomePage from './pages/HomePage';
import CreateCalendar from './pages/CreateCalendar';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import CalendarResult from './pages/CalendarResult';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, user, logout, loading } = useAuth();
  const isHomePage = location.pathname === '/';

  if (loading) {
    return (
      <div className="app">
        <div className="loading-screen">
          <p>Ładowanie...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-spacer"></div>
        <h1 className="navbar-title" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          Kalendarz Życia
        </h1>
        {isHomePage ? (
          isAuthenticated ? (
            <button className="btn-login" onClick={() => navigate('/dashboard')}>Panel</button>
          ) : (
            <button className="btn-login" onClick={() => navigate('/logowanie')}>Zaloguj</button>
          )
        ) : (
          <div className="navbar-spacer"></div>
        )}
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stworz-kalendarz" element={<CreateCalendar />} />
        <Route path="/logowanie" element={<AuthPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/wynik" element={<CalendarResult />} />
      </Routes>

      {/* Footer */}
      <footer className="footer">
        <p>Autor: Martyna Jastrzębska 2026</p>
      </footer>
    </div>
  );
}

export default App;
