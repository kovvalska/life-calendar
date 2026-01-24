function App() {
  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-spacer"></div>
        <h1 className="navbar-title">Kalendarz Życia</h1>
        <button className="btn-login">Zaloguj</button>
      </nav>

      {/* Hero Section */}
      <main className="hero">
        <h1 className="hero-title">Twoje życie w jednym spojrzeniu</h1>
        <h2 className="hero-subtitle">
          Wizualizuj swoją przeszłość i zaplanuj przyszłość w prosty sposób
        </h2>

        {/* Options */}
        <div className="options">
          <div className="option-card">
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

      {/* Footer */}
      <footer className="footer">
        <p>Autor: Martyna Jastrzębska 2026</p>
      </footer>
    </div>
  );
}

export default App;
