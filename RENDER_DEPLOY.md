# Deploy Kalendarz Życia na Render.com – analiza i instrukcja

## 1. Analiza gotowości

### Co jest już w porządku

| Element | Status |
|--------|--------|
| **Backend** | `PORT` z `process.env.PORT` (Render ustawia go automatycznie) |
| **Backend** | Nasłuchiwanie na `0.0.0.0` – poprawne dla Render |
| **Backend** | `MONGODB_URI` z env – gotowe na MongoDB Atlas |
| **Backend** | Endpoint `/api/health` – można użyć do health check |
| **Frontend** | `VITE_API_URL` – API z env, fallback na localhost w dev |
| **Struktura** | Oddzielny `backend/` i `frontend/` – wygodne dla dwóch usług |
| **.gitignore** | `.env` wykluczone – brak commita sekretów |

### Wymagane poprawki do deploy

1. **SPA (React Router)**  
   Ścieżki `/stworz-kalendarz`, `/logowanie`, `/dashboard`, `/wynik` – przy odświeżeniu lub wejściu z zewnątrz serwer zwróci 404, jeśli każda ścieżka nie będzie zwracać `index.html`.  
   **Rozwiązanie:** reguła rewrite w Render (np. `/*` → `/index.html`) – w `render.yaml` przez `routes` lub w Dashboard w „Redirects/Rewrites”.

2. **JWT_SECRET w produkcji**  
   W `auth.js` jest fallback `'default-secret-change-in-production'`. W produkcji **musi** być ustawione własne, silne `JWT_SECRET`.  
   **Rozwiązanie:** w `server.js` na starcie: jeśli `NODE_ENV=production` i brak `JWT_SECRET` (lub jest to wartość domyślna) → `process.exit(1)` lub throw.

3. **Dokumentacja zmiennych środowiskowych**  
   Żeby wiedzieć, co ustawić w Render.  
   **Rozwiązanie:** pliki `.env.example` w `backend/` i `frontend/`.

### Zalecane (nie blokujące)

4. **Email (rejestracja)**  
   Gdy `EMAIL_HOST` nie jest ustawione, używany jest Ethereal (`createTestAccount()`). W produkcji maile **nie trafią** do użytkowników.  
   **Działanie:** W produkcji ustaw `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS` (i ewentualnie `EMAIL_PORT`, `EMAIL_SECURE`, `EMAIL_FROM`). Bez tego rejestracja „wyśle” maila tylko do testowego konta Ethereal.

5. **CORS**  
   `app.use(cors())` dopuszcza dowolne origin. Na start wystarczy; w przyszłości można ograniczyć np. do `FRONTEND_URL`.

6. **Wersja Node**  
   Dodanie `engines` w `package.json` (np. `"node": ">=18"`) ułatwia spójność z Render.

---

## 2. Zmienne środowiskowe

### Backend (Web Service)

| Zmienna | Wymagane | Opis |
|---------|----------|------|
| `MONGODB_URI` | tak | Connection string MongoDB Atlas (np. `mongodb+srv://user:pass@cluster.mongodb.net/dbname?retryWrites=true&w=majority`) |
| `JWT_SECRET` | tak | Długi, losowy ciąg do podpisywania JWT (np. `openssl rand -base64 32`) |
| `NODE_ENV` | zalecane | `production` |
| `EMAIL_HOST` | dla maili | Host SMTP (np. Gmail, SendGrid, Mailgun) |
| `EMAIL_PORT` | opcjonalne | Port SMTP (domyślnie 587) |
| `EMAIL_SECURE` | opcjonalne | `true` dla 465 |
| `EMAIL_USER` | dla maili | Login SMTP |
| `EMAIL_PASS` | dla maili | Hasło SMTP |
| `EMAIL_FROM` | opcjonalne | Nadawca, np. `"Kalendarz Życia" <noreply@domena.pl>` |

### Frontend (Static Site)

| Zmienna | Wymagane | Opis |
|---------|----------|------|
| `VITE_API_URL` | tak | Pełny URL backendu, np. `https://life-calendar-api.onrender.com` (używane w momencie `npm run build`) |

---

## 3. Kroki deploy na Render.com

### Krok 1: MongoDB Atlas

1. Załóż konto: [mongodb.com/atlas](https://www.mongodb.com/atlas).
2. Utwórz darmowy klaster (np. M0).
3. W **Database Access** dodaj użytkownika (hasło zapisz).
4. W **Network Access** dodaj `0.0.0.0/0` (dostęp z internetu), ewentualnie później ogranicz do IP Render.
5. W **Database** → **Connect** → **Drivers** skopiuj connection string. Podmień `<password>` na hasło użytkownika i ewentualnie nazwę bazy (np. `life-calendar`).

Przykład:  
`mongodb+srv://user:TwojeHaslo@cluster0.xxxxx.mongodb.net/life-calendar?retryWrites=true&w=majority`

---

### Krok 2: Repozytorium Git

Upewnij się, że projekt jest w GitHub (lub GitLab) i że w repo są:

- `backend/`
- `frontend/`
- `render.yaml` (jeśli zdecydujesz się na Blueprint – patrz niżej)

---

### Krok 3: Backend (Web Service)

1. W [dashboard.render.com](https://dashboard.render.com) → **New** → **Web Service**.
2. Połącz repozytorium i wybierz projekt.
3. Ustawienia:
   - **Name:** np. `life-calendar-api`
   - **Region:** np. Frankfurt (lub inny)
   - **Root Directory:** `backend`
   - **Runtime:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Instance Type:** Free (lub wyższy)
4. **Environment** – dodaj:
   - `NODE_ENV` = `production`
   - `MONGODB_URI` = connection string z Atlas
   - `JWT_SECRET` = wygenerowane hasło (np. `openssl rand -base64 32`)
   - Opcjonalnie: `EMAIL_HOST`, `EMAIL_USER`, `EMAIL_PASS`, `EMAIL_FROM` itd.
5. **Advanced** → **Health Check Path:** `api/health` (bez `/` na początku, jeśli Render tak wymaga – w Render zwykle `api/health` lub `/api/health`).
6. **Create Web Service** i poczekaj na deploy. Skopiuj URL, np.  
   `https://life-calendar-api.onrender.com`

---

### Krok 4: Frontend (Static Site)

1. **New** → **Static Site**.
2. To samo repozytorium, ten sam projekt.
3. Ustawienia:
   - **Name:** np. `life-calendar`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm install && npm run build`
   - **Publish Directory:** `dist`
4. **Environment** – dodaj:
   - `VITE_API_URL` = `https://life-calendar-api.onrender.com`  
     (dokładnie ten URL, który dostał backend).
5. **Create Static Site** i poczekaj na build.

---

### Krok 5: SPA – Rewrite (React Router)

Bez tego odświeżenie na `/stworz-kalendarz`, `/logowanie` itd. da 404.

**Jeśli używasz `render.yaml` (Blueprint):** reguła rewrite jest już w `routes` – nic nie musisz dodawać w Dashboard.

**Jeśli tworzysz usługi ręcznie (bez Blueprint):**

1. Otwórz swój Static Site w Dashboard.
2. **Redirects/Rewrites** (lub **Settings** → **Redirects/Rewrites**).
3. **Add Rule:**
   - **Type:** Rewrite  
   - **Source:** `/*`  
   - **Destination:** `/index.html`

Zapisz. Odświeżenie na dowolnej ścieżce powinno zwracać `index.html`, a routowanie przejmie React Router.

---

### Krok 6: (Opcjonalnie) Blueprint `render.yaml`

Jeśli wrzucisz `render.yaml` do katalogu głównego repo, możesz:

- W **Dashboard** → **New** → **Blueprint** wybrać repozytorium.
- Render utworzy obie usługi (backend + frontend) według opisu z pliku.

W `render.yaml` trzeba:

- Dla backendu: `rootDir`, `buildCommand`, `startCommand`, `healthCheckPath`, `envVars` (np. `NODE_ENV`; `MONGODB_URI`, `JWT_SECRET` lepiej dodać w Dashboard jako **Secret** lub przez `sync: false`).
- Dla frontendu: `runtime: static`, `rootDir`, `buildCommand`, `staticPublishPath`, `routes` z rewritem `/*` → `/index.html`, `envVars` z `VITE_API_URL`.

W takim Blueprint sekrety (`MONGODB_URI`, `JWT_SECRET`) zwykle ustawia się w Render po utworzeniu usług albo przez `sync: false` przy pierwszym deployu.

---

## 4. Ważne informacje

### Free tier (Web Service)

- Serwis „zasypia” po ok. 15 minutach bez ruchu.
- Pierwsze requesty po wybudzeniu mogą trwać 30–60 s. To ograniczenie planu Free.

### Kolejność deployu

1. Najpierw backend (żeby mieć URL).
2. Potem frontend z `VITE_API_URL` ustawionym na ten URL.  
   Jeśli najpierw zbudujesz frontend bez `VITE_API_URL`, trzeba będzie zmienić zmienną i zrobić **ręczny redeploy** (build), żeby nowy URL został wstawiony do JS.

### Ethereal (brak `EMAIL_*`)

- Bez `EMAIL_HOST` w produkcji maile trafiają tylko do Ethereal. Rejestracja „działa”, ale użytkownik nie dostanie kodu.
- Aby naprawdę wysyłać maile: skonfiguruj SMTP (Gmail, SendGrid, Mailgun, inny) i uzupełnij `EMAIL_*`.

### Sprawdzenie po deployu

- Backend: `https://<twoj-backend>.onrender.com/api/health` → JSON z `status: "OK"` i `database: "connected"` (przy poprawnym `MONGODB_URI`).
- Frontend: wejście na główną, logowanie, `/stworz-kalendarz`, `/dashboard`, odświeżenie na tych ścieżkach – wszystko powinno działać, a requesty iść na `VITE_API_URL`.

---

## 5. Proponowane zmiany w repozytorium

| Plik | Zmiana |
|------|--------|
| `backend/server.js` | Na start: jeśli `NODE_ENV=production` i brak/wyzerowanie `JWT_SECRET` → `process.exit(1)` i komunikat. |
| `backend/.env.example` | Lista zmiennych: `MONGODB_URI`, `JWT_SECRET`, `NODE_ENV`, `EMAIL_*` z krótkimi opisami. |
| `frontend/.env.example` | `VITE_API_URL` z przykładem. |
| `render.yaml` (nowy) | Definicja Web Service (backend) i Static Site (frontend) z `routes` (rewrite `/*` → `/index.html`) i `healthCheckPath` dla backendu. Sekrety (`MONGODB_URI`, `JWT_SECRET`) do ustawienia w Dashboard lub przez `sync: false`. Plik jest w repo. |

Możesz wprowadzić te poprawki ręcznie lub skorzystać z gotowych fragmentów/plików z dalszej części (jeśli je dodam w repo).

---

## 6. Podsumowanie

- Aplikacja nadaje się do deployu na Render po:
  - ustawieniu rewrites dla SPA,
  - wymuszeniu `JWT_SECRET` w produkcji,
  - podaniu `MONGODB_URI` i `VITE_API_URL`.
- Opcjonalnie: `EMAIL_*` dla prawdziwych maili, `engines` w `package.json`, zaostrzenie CORS.
- Kolejność: MongoDB Atlas → deploy backendu → deploy frontendu z `VITE_API_URL` → konfiguracja Rewrite dla SPA.

Jeśli chcesz, mogę w kolejnym kroku doprecyzować konkretne fragmenty `server.js`, `render.yaml` oraz treść `.env.example` pod twój projekt (nazwy serwisów, ścieżki, itp.).
