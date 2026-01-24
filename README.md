# Life Calendar

Aplikacja full-stack z React, Node.js, Express i MongoDB.

## Struktura projektu

```
life-calendar/
├── backend/          # Serwer API (Node.js + Express)
│   ├── server.js     # Główny plik serwera
│   ├── package.json
│   └── .env.example  # Przykładowa konfiguracja
├── frontend/         # Aplikacja kliencka (React + Vite)
│   ├── src/
│   │   ├── App.jsx   # Główny komponent React
│   │   ├── main.jsx  # Punkt wejścia
│   │   └── styles.css
│   ├── index.html
│   └── package.json
└── README.md
```

## Uruchomienie

### 1. Zainstaluj zależności

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd frontend
npm install
```

### 2. Uruchom serwery

**Backend (w jednym terminalu):**
```bash
cd backend
npm run dev
```
Serwer będzie dostępny na: http://localhost:5000

**Frontend (w drugim terminalu):**
```bash
cd frontend
npm run dev
```
Aplikacja będzie dostępna na: http://localhost:3000

## MongoDB (opcjonalnie)

Aby używać MongoDB:

1. Zainstaluj MongoDB lokalnie lub użyj MongoDB Atlas
2. Skopiuj `.env.example` do `.env` w folderze backend
3. Ustaw `MONGODB_URI` w pliku `.env`

## Technologie

- **Frontend:** React 18, Vite, CSS
- **Backend:** Node.js, Express
- **Baza danych:** MongoDB + Mongoose
