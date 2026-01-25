const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Zapisz nowy kalendarz
 */
export async function saveCalendar(calendarData, result, token) {
  const response = await fetch(`${API_URL}/api/calendar`, {
    method: 'POST',
    headers: getAuthHeaders(token),
    body: JSON.stringify({
      name: calendarData.name,
      birthDate: calendarData.birthDate,
      gender: calendarData.gender,
      sleepQuality: calendarData.sleepQuality,
      physicalActivity: calendarData.physicalActivity,
      nutrition: calendarData.nutrition,
      stressLevel: calendarData.stressLevel,
      smoking: calendarData.smoking,
      alcohol: calendarData.alcohol,
      expectedLifespan: result.expectedLifespan,
      currentAge: result.currentAge,
      remainingYears: result.remainingYears,
      livedWeeks: result.livedWeeks,
      remainingWeeks: result.remainingWeeks,
      totalWeeks: result.totalWeeks
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd zapisywania kalendarza');
  }
  
  return data;
}

/**
 * Pobierz pojedynczy kalendarz
 */
export async function getCalendar(id, token) {
  const response = await fetch(`${API_URL}/api/calendar/${id}`, {
    headers: getAuthHeaders(token)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd pobierania kalendarza');
  }
  
  return data.calendar;
}

/**
 * Pobierz wszystkie kalendarze użytkownika
 */
export async function getCalendars(token) {
  const response = await fetch(`${API_URL}/api/calendar`, {
    headers: getAuthHeaders(token)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd pobierania kalendarzy');
  }
  
  return data.calendars;
}

/**
 * Usuń kalendarz
 */
export async function deleteCalendar(calendarId, token) {
  const response = await fetch(`${API_URL}/api/calendar/${calendarId}`, {
    method: 'DELETE',
    headers: getAuthHeaders(token)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd usuwania kalendarza');
  }
  
  return data;
}
