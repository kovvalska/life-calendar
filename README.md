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

Szczegółowa analiza, wymagane poprawki i **krok po kroku** są w **[RENDER_DEPLOY.md](./RENDER_DEPLOY.md)**.

**W skrócie:**
- Backend: Web Service, `rootDir: backend`, `npm install` / `npm start`, zmienne: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`.
- Frontend: Static Site, `rootDir: frontend`, `npm install && npm run build`, `dist`, `VITE_API_URL` = URL backendu.
- SPA: reguła rewrite `/*` → `/index.html` (w `render.yaml` lub w Dashboard).
- Opcjonalnie: **Blueprint** – `New → Blueprint`, połącz repo z `render.yaml`; Render utworzy obie usługi.

## Technologie

- **Frontend:** React 18, Vite, CSS
- **Backend:** Node.js, Express
- **Baza danych:** MongoDB Atlas
