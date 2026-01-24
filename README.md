# Life Calendar

Aplikacja full-stack z React, Node.js, Express i MongoDB.

## Struktura projektu

```
life-calendar/
├── backend/          # Serwer API (Node.js + Express)
│   ├── server.js     # Główny plik serwera
│   ├── package.json
│   └── .env          # Konfiguracja (nie commituj!)
├── frontend/         # Aplikacja kliencka (React + Vite)
│   ├── src/
│   │   ├── App.jsx   # Główny komponent React
│   │   ├── main.jsx  # Punkt wejścia
│   │   └── styles.css
│   ├── index.html
│   └── package.json
└── README.md
```

## Uruchomienie lokalne

### 1. Zainstaluj zależności

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 2. Uruchom serwery

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

- Frontend: http://localhost:3000
- Backend: http://localhost:5000

## Deploy na Render.com

### Backend (Web Service)

1. Utwórz **New Web Service**
2. Połącz z repozytorium Git
3. Ustawienia:
   - **Root Directory:** `backend`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
4. Environment Variables:
   - `MONGODB_URI` = twój connection string MongoDB Atlas
   - `NODE_ENV` = `production`

### Frontend (Static Site)

1. Utwórz **New Static Site**
2. Połącz z repozytorium Git
3. Ustawienia:
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. Environment Variables:
   - `VITE_API_URL` = URL twojego backend service (np. `https://life-calendar-api.onrender.com`)

## Technologie

- **Frontend:** React 18, Vite, CSS
- **Backend:** Node.js, Express
- **Baza danych:** MongoDB Atlas
