import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import CreateCalendar from './pages/CreateCalendar';

function App() {
  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-spacer"></div>
        <h1 className="navbar-title">Kalendarz Życia</h1>
        <button className="btn-login">Zaloguj</button>
      </nav>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/stworz-kalendarz" element={<CreateCalendar />} />
      </Routes>

      {/* Footer */}
      <footer className="footer">
        <p>Autor: Martyna Jastrzębska 2026</p>
      </footer>
    </div>
  );
}

export default App;
