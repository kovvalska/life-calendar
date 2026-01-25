const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

function getAuthHeaders(token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Rejestracja użytkownika
 */
export async function register(email, password) {
  const response = await fetch(`${API_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd rejestracji');
  }
  
  return data;
}

/**
 * Weryfikacja kodu aktywacyjnego
 */
export async function verify(email, code) {
  const response = await fetch(`${API_URL}/api/auth/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, code })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd weryfikacji');
  }
  
  return data;
}

/**
 * Logowanie użytkownika
 */
export async function login(email, password) {
  const response = await fetch(`${API_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    if (data.requiresVerification) {
      throw { message: data.message, requiresVerification: true };
    }
    throw new Error(data.message || 'Błąd logowania');
  }
  
  return data;
}

/**
 * Ponowne wysłanie kodu weryfikacyjnego
 */
export async function resendCode(email) {
  const response = await fetch(`${API_URL}/api/auth/resend-code`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email })
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd wysyłania kodu');
  }
  
  return data;
}

/**
 * Pobierz dane zalogowanego użytkownika
 */
export async function getMe(token) {
  const response = await fetch(`${API_URL}/api/auth/me`, {
    headers: getAuthHeaders(token)
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.message || 'Błąd pobierania danych użytkownika');
  }
  
  return data;
}
