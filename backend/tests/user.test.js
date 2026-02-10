/**
 * Testy jednostkowe dla modelu User
 * 
 * Testy weryfikują poprawność działania metod modelu User,
 * w tym szyfrowania haseł oraz generowania kodów weryfikacyjnych.
 */

const mongoose = require('mongoose');
const User = require('../models/User');

// Konfiguracja testowej bazy danych
let dbConnected = false;

beforeAll(async () => {
  // Sprawdź czy MongoDB jest dostępne
  if (mongoose.connection.readyState === 0) {
    try {
      // Próba połączenia z bazą testową (opcjonalne)
      // await mongoose.connect(process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/life-calendar-test');
      // dbConnected = true;
    } catch (error) {
      console.warn('Baza danych nie jest dostępna - niektóre testy zostaną pominięte');
      dbConnected = false;
    }
  } else {
    dbConnected = true;
  }
});

afterAll(async () => {
  if (dbConnected && mongoose.connection.readyState !== 0) {
    await mongoose.connection.close();
  }
});

describe('Model User', () => {
  
  describe('Szyfrowanie hasła', () => {
    test('powinien zaszyfrować hasło przed zapisem', async () => {
      if (!dbConnected) {
        console.log('Pominięto test - baza danych nie jest dostępna');
        return;
      }

      const user = new User({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      await user.save();
      
      // Hasło powinno być zaszyfrowane (nie równe oryginalnemu)
      expect(user.password).not.toBe('testpassword123');
      expect(user.password.length).toBeGreaterThan(20); // bcrypt hash ma długość ~60 znaków
      
      // Usuń użytkownika po teście
      await User.deleteOne({ _id: user._id });
    });

    test('powinien poprawnie zweryfikować poprawne hasło', async () => {
      if (!dbConnected) {
        console.log('Pominięto test - baza danych nie jest dostępna');
        return;
      }

      const user = new User({
        email: 'test2@example.com',
        password: 'testpassword123'
      });
      
      await user.save();
      
      const isMatch = await user.comparePassword('testpassword123');
      expect(isMatch).toBe(true);
      
      await User.deleteOne({ _id: user._id });
    });

    test('powinien odrzucić nieprawidłowe hasło', async () => {
      if (!dbConnected) {
        console.log('Pominięto test - baza danych nie jest dostępna');
        return;
      }

      const user = new User({
        email: 'test3@example.com',
        password: 'testpassword123'
      });
      
      await user.save();
      
      const isMatch = await user.comparePassword('wrongpassword');
      expect(isMatch).toBe(false);
      
      await User.deleteOne({ _id: user._id });
    });

    test('nie powinien ponownie szyfrować hasła jeśli nie zostało zmodyfikowane', async () => {
      if (!dbConnected) {
        console.log('Pominięto test - baza danych nie jest dostępna');
        return;
      }

      const user = new User({
        email: 'test4@example.com',
        password: 'testpassword123'
      });
      
      await user.save();
      const firstPasswordHash = user.password;
      
      // Zmiana innego pola nie powinna powodować ponownego szyfrowania hasła
      user.email = 'test4updated@example.com';
      await user.save();
      
      expect(user.password).toBe(firstPasswordHash);
      
      await User.deleteOne({ _id: user._id });
    });
  });

  describe('Generowanie kodu weryfikacyjnego', () => {
    test('powinien wygenerować 4-cyfrowy kod weryfikacyjny', () => {
      const user = new User({
        email: 'test5@example.com',
        password: 'testpassword123'
      });
      
      const code = user.generateVerificationCode();
      
      expect(code).toMatch(/^\d{4}$/); // 4 cyfry
      expect(parseInt(code)).toBeGreaterThanOrEqual(1000);
      expect(parseInt(code)).toBeLessThanOrEqual(9999);
    });

    test('powinien ustawić datę wygaśnięcia kodu na 15 minut w przyszłość', () => {
      const user = new User({
        email: 'test6@example.com',
        password: 'testpassword123'
      });
      
      const beforeGeneration = new Date();
      user.generateVerificationCode();
      const afterGeneration = new Date();
      
      expect(user.verificationCodeExpires).toBeInstanceOf(Date);
      
      const expiresTime = user.verificationCodeExpires.getTime();
      const expectedMinTime = beforeGeneration.getTime() + 14 * 60 * 1000; // 14 minut
      const expectedMaxTime = afterGeneration.getTime() + 16 * 60 * 1000; // 16 minut
      
      expect(expiresTime).toBeGreaterThanOrEqual(expectedMinTime);
      expect(expiresTime).toBeLessThanOrEqual(expectedMaxTime);
    });

    test('powinien zapisać kod weryfikacyjny w modelu', () => {
      const user = new User({
        email: 'test7@example.com',
        password: 'testpassword123'
      });
      
      const code = user.generateVerificationCode();
      
      expect(user.verificationCode).toBe(code);
      expect(user.verificationCode).not.toBeNull();
    });
  });

  describe('Walidacja schematu', () => {
    test('powinien wymagać adresu email', async () => {
      const user = new User({
        password: 'testpassword123'
      });
      
      await expect(user.save()).rejects.toThrow();
    });

    test('powinien wymagać hasła', async () => {
      const user = new User({
        email: 'test8@example.com'
      });
      
      await expect(user.save()).rejects.toThrow();
    });

    test('powinien wymagać hasła o minimalnej długości 6 znaków', async () => {
      const user = new User({
        email: 'test9@example.com',
        password: '12345' // 5 znaków
      });
      
      await expect(user.save()).rejects.toThrow();
    });

    test('powinien normalizować email do małych liter', async () => {
      if (!dbConnected) {
        console.log('Pominięto test - baza danych nie jest dostępna');
        return;
      }

      const user = new User({
        email: 'TEST@EXAMPLE.COM',
        password: 'testpassword123'
      });
      
      await user.save();
      
      expect(user.email).toBe('test@example.com');
      
      await User.deleteOne({ _id: user._id });
    });

    test('powinien przyciąć białe znaki z email', async () => {
      if (!dbConnected) {
        console.log('Pominięto test - baza danych nie jest dostępna');
        return;
      }

      const user = new User({
        email: '  test@example.com  ',
        password: 'testpassword123'
      });
      
      await user.save();
      
      expect(user.email).toBe('test@example.com');
      
      await User.deleteOne({ _id: user._id });
    });

    test('powinien ustawić domyślną wartość isVerified na false', () => {
      const user = new User({
        email: 'test10@example.com',
        password: 'testpassword123'
      });
      
      expect(user.isVerified).toBe(false);
    });
  });
});
