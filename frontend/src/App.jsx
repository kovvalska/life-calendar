import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateCalendar from './pages/CreateCalendar';
import AuthPage from './pages/AuthPage';

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-spacer"></div>
        <h1 className="navbar-title" onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          Kalendarz Życia
        </h1>
        {isHomePage ? (
          <button className="btn-login" onClick={() => navigate('/logowanie')}>Zaloguj</button>
        ) : (
          <div className="navbar-spacer"></div>
        )}
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stworz-kalendarz" element={<CreateCalendar />} />
        <Route path="/logowanie" element={<AuthPage />} />
      </Routes>

      {/* Footer */}
      <footer className="footer">
        <p>Autor: Martyna Jastrzębska 2026</p>
      </footer>
    </div>
  );
}

export default App;
