import { createContext, useContext, useState, useEffect } from 'react';
import * as authAPI from '../api/auth';
import * as calendarAPI from '../api/calendar';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Sprawdź token przy starcie
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const data = await authAPI.getMe(token);
          setUser(data.user);
        } catch (error) {
          // Token nieważny
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Rejestracja
  const register = async (email, password) => {
    return await authAPI.register(email, password);
  };

  // Weryfikacja kodu
  const verify = async (email, code) => {
    const data = await authAPI.verify(email, code);
    
    // Zapisz token i użytkownika
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    
    return data;
  };

  // Logowanie
  const login = async (email, password) => {
    try {
      const data = await authAPI.login(email, password);
      
      // Zapisz token i użytkownika
      localStorage.setItem('token', data.token);
      setToken(data.token);
      setUser(data.user);
      
      return data;
    } catch (error) {
      // Przekaż błąd z requiresVerification jeśli występuje
      throw error;
    }
  };

  // Ponowne wysłanie kodu
  const resendCode = async (email) => {
    return await authAPI.resendCode(email);
  };

  // Wylogowanie
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Zapisz kalendarz
  const saveCalendar = async (calendarData, result) => {
    return await calendarAPI.saveCalendar(calendarData, result, token);
  };

  // Pobierz pojedynczy kalendarz
  const getCalendar = async (id) => {
    return await calendarAPI.getCalendar(id, token);
  };

  // Pobierz kalendarze użytkownika
  const getCalendars = async () => {
    return await calendarAPI.getCalendars(token);
  };

  // Usuń kalendarz
  const deleteCalendar = async (calendarId) => {
    return await calendarAPI.deleteCalendar(calendarId, token);
  };

  const value = {
    user,
    token,
    loading,
    isAuthenticated: !!user,
    register,
    verify,
    login,
    resendCode,
    logout,
    saveCalendar,
    getCalendar,
    getCalendars,
    deleteCalendar
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
