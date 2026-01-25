const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/** GET /api/events/calendar/:calendarId – mapa weekIndex → { color, events } */
export async function getEvents(calendarId, token) {
  const res = await fetch(`${API_URL}/api/events/calendar/${calendarId}`, {
    headers: getAuthHeaders(token)
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Błąd pobierania wydarzeń');
  }
  const eventsMap = await res.json();
  const out = {};
  Object.keys(eventsMap).forEach((k) => {
    const v = eventsMap[k];
    out[k] = { color: v.color ?? null, events: v.events ?? [] };
  });
  return out;
}

/** PUT /api/events/calendar/:calendarId/week/:weekIndex – zapisz/aktualizuj tydzień */
export async function putWeek(calendarId, weekIndex, { color, events }, token) {
  const res = await fetch(
    `${API_URL}/api/events/calendar/${calendarId}/week/${weekIndex}`,
    {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ color: color ?? null, events: events ?? [] })
    }
  );
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Błąd zapisu wydarzeń');
  }
  return res.json();
}
