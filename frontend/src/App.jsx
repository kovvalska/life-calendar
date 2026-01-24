import { useState, useEffect } from 'react';

// URL backendu - lokalnie localhost, na produkcji zmienna środowiskowa
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function App() {
  const [backendMessage, setBackendMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pobierz wiadomość z backendu
    fetch(`${API_URL}/`)
      .then(res => res.json())
      .then(data => {
        setBackendMessage(data.message);
        setLoading(false);
      })
      .catch(err => {
        console.error('Błąd połączenia z backendem:', err);
        setBackendMessage('Backend niedostępny');
        setLoading(false);
      });
  }, []);

  return (
    <div className="app">
      <header className="header">
        <h1>🗓️ Life Calendar</h1>
        <p className="subtitle">Hello World!</p>
      </header>
      
      <main className="main">
        <div className="card">
          <h2>Frontend (React)</h2>
          <p className="status success">✅ Działa!</p>
        </div>
        
        <div className="card">
          <h2>Backend (Express)</h2>
          {loading ? (
            <p className="status loading">⏳ Ładowanie...</p>
          ) : (
            <p className={`status ${backendMessage.includes('niedostępny') ? 'error' : 'success'}`}>
              {backendMessage}
            </p>
          )}
        </div>
      </main>
      
      <footer className="footer">
        <p>Stack: React + Node.js + Express + MongoDB</p>
      </footer>
    </div>
  );
}

export default App;
