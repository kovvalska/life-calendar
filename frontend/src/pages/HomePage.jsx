import { useNavigate } from 'react-router-dom';

function HomePage() {
  const navigate = useNavigate();

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
          <div className="option-card" onClick={() => navigate('/stworz-kalendarz')}>
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
