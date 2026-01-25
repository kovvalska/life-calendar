import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  // Sprawdź token przy starcie
  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const response = await fetch(`${API_URL}/api/auth/me`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            setUser(data.user);
          } else {
            // Token nieważny
            localStorage.removeItem('token');
            setToken(null);
            setUser(null);
          }
        } catch (error) {
          console.error('Auth check error:', error);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, [token]);

  // Rejestracja
  const register = async (email, password) => {
    const response = await fetch(`${API_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    return data;
  };

  // Weryfikacja kodu
  const verify = async (email, code) => {
    const response = await fetch(`${API_URL}/api/auth/verify`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, code })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    // Zapisz token i użytkownika
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    
    return data;
  };

  // Logowanie
  const login = async (email, password) => {
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
      throw new Error(data.message);
    }
    
    // Zapisz token i użytkownika
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    
    return data;
  };

  // Ponowne wysłanie kodu
  const resendCode = async (email) => {
    const response = await fetch(`${API_URL}/api/auth/resend-code`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    return data;
  };

  // Wylogowanie
  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  // Zapisz kalendarz
  const saveCalendar = async (calendarData, result) => {
    const response = await fetch(`${API_URL}/api/calendar`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
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
      throw new Error(data.message);
    }
    
    return data;
  };

  // Pobierz pojedynczy kalendarz
  const getCalendar = async (id) => {
    const response = await fetch(`${API_URL}/api/calendar/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || 'Błąd pobierania kalendarza');
    return data.calendar;
  };

  // Pobierz kalendarze użytkownika
  const getCalendars = async () => {
    const response = await fetch(`${API_URL}/api/calendar`, {
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    return data.calendars;
  };

  // Usuń kalendarz
  const deleteCalendar = async (calendarId) => {
    const response = await fetch(`${API_URL}/api/calendar/${calendarId}`, {
      method: 'DELETE',
      headers: { 
        'Authorization': `Bearer ${token}`
      }
    });
    
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message);
    }
    
    return data;
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
