const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');

// Konfiguracja zmiennych środowiskowych
dotenv.config();

// W produkcji JWT_SECRET musi być ustawione (bezpieczeństwo)
if (process.env.NODE_ENV === 'production') {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret === 'default-secret-change-in-production') {
    console.error('❌ Ustaw JWT_SECRET w zmiennych środowiskowych (produkcja).');
    process.exit(1);
  }
  if (!process.env.EMAIL_HOST) {
    console.warn('⚠️  EMAIL_HOST nie ustawione – kody rejestracji nie trafią do użytkowników (użyj EMAIL_* w env).');
  }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Połączenie z MongoDB
const connectDB = async () => {
  try {
    if (process.env.MONGODB_URI) {
      await mongoose.connect(process.env.MONGODB_URI);
      console.log('✅ Połączono z MongoDB');
    } else {
      console.log('⚠️  Brak MONGODB_URI - uruchamianie bez bazy danych');
    }
  } catch (error) {
    console.error('❌ Błąd połączenia z MongoDB:', error.message);
  }
};

// Routes
const authRoutes = require('./routes/auth');
const calendarRoutes = require('./routes/calendar');
const eventsRoutes = require('./routes/events');
app.use('/api/auth', authRoutes);
app.use('/api/calendar', calendarRoutes);
app.use('/api/events', eventsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Hello World! 🌍 Backend działa!' });
});

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Uruchomienie serwera
connectDB().then(() => {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Serwer działa na porcie ${PORT}`);
    console.log(`📍 http://localhost:${PORT}`);
  });
});
