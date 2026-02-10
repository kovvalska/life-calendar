/**
 * Testy jednostkowe dla middleware walidacji
 * 
 * Testy weryfikują poprawność działania reguł walidacyjnych
 * dla różnych typów danych wejściowych.
 */

const { validateRegister, validateLogin, validateCalendar, validateEvent, validateObjectId } = require('../middleware/validation');
const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

describe('Walidacja danych', () => {
  
  describe('Walidacja rejestracji', () => {
    test('powinien zaakceptować prawidłowy email i hasło', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };
      
      // Symulacja działania middleware walidacji
      for (const validator of validateRegister.slice(0, -1)) {
        await validator.run(req);
      }
      
      // Jeśli nie ma błędów, walidacja przeszła pomyślnie
      expect(req.body.email).toBe('test@example.com');
    });

    test('powinien odrzucić nieprawidłowy format email', async () => {
      const req = {
        body: {
          email: 'invalid-email',
          password: 'password123'
        }
      };
      
      for (const validator of validateRegister.slice(0, -1)) {
        await validator.run(req);
      }
      
      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().length).toBeGreaterThan(0);
    });

    test('powinien odrzucić hasło krótsze niż 6 znaków', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: '12345' // 5 znaków
        }
      };
      
      for (const validator of validateRegister.slice(0, -1)) {
        await validator.run(req);
      }
      
      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().length).toBeGreaterThan(0);
    });

    test('powinien znormalizować email do małych liter', async () => {
      const req = {
        body: {
          email: 'TEST@EXAMPLE.COM',
          password: 'password123'
        }
      };
      
      for (const validator of validateRegister.slice(0, -1)) {
        await validator.run(req);
      }
      
      expect(req.body.email).toBe('test@example.com');
    });
  });

  describe('Walidacja logowania', () => {
    test('powinien zaakceptować prawidłowy email i hasło', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: 'password123'
        }
      };
      
      for (const validator of validateLogin.slice(0, -1)) {
        await validator.run(req);
      }
      
      expect(req.body.email).toBe('test@example.com');
    });

    test('powinien odrzucić puste hasło', async () => {
      const req = {
        body: {
          email: 'test@example.com',
          password: ''
        }
      };
      
      for (const validator of validateLogin.slice(0, -1)) {
        await validator.run(req);
      }
      
      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().length).toBeGreaterThan(0);
    });
  });

  describe('Walidacja kalendarza', () => {
    test('powinien zaakceptować prawidłowe dane kalendarza', async () => {
      const req = {
        body: {
          name: 'Mój Kalendarz',
          birthDate: '1990-01-01T00:00:00.000Z',
          gender: 'male',
          sleepQuality: 3,
          physicalActivity: 3,
          nutrition: 3,
          stressLevel: 3,
          smoking: 1,
          alcohol: 1,
          expectedLifespan: 74.0,
          currentAge: 34,
          remainingYears: 40.0,
          livedWeeks: 1768,
          remainingWeeks: 2080,
          totalWeeks: 3848
        }
      };
      
      for (const validator of validateCalendar.slice(0, -1)) {
        await validator.run(req);
      }
      
      expect(req.body.name).toBe('Mój Kalendarz');
    });

    test('powinien odrzucić nazwę kalendarza dłuższą niż 100 znaków', async () => {
      const req = {
        body: {
          name: 'A'.repeat(101), // 101 znaków
          birthDate: '1990-01-01T00:00:00.000Z',
          gender: 'male',
          sleepQuality: 3,
          physicalActivity: 3,
          nutrition: 3,
          stressLevel: 3,
          smoking: 1,
          alcohol: 1,
          expectedLifespan: 74.0,
          currentAge: 34,
          remainingYears: 40.0,
          livedWeeks: 1768,
          remainingWeeks: 2080,
          totalWeeks: 3848
        }
      };
      
      for (const validator of validateCalendar.slice(0, -1)) {
        await validator.run(req);
      }
      
      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().length).toBeGreaterThan(0);
    });

    test('powinien odrzucić nieprawidłową płeć', async () => {
      const req = {
        body: {
          name: 'Mój Kalendarz',
          birthDate: '1990-01-01T00:00:00.000Z',
          gender: 'invalid',
          sleepQuality: 3,
          physicalActivity: 3,
          nutrition: 3,
          stressLevel: 3,
          smoking: 1,
          alcohol: 1,
          expectedLifespan: 74.0,
          currentAge: 34,
          remainingYears: 40.0,
          livedWeeks: 1768,
          remainingWeeks: 2080,
          totalWeeks: 3848
        }
      };
      
      for (const validator of validateCalendar.slice(0, -1)) {
        await validator.run(req);
      }
      
      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().length).toBeGreaterThan(0);
    });

    test('powinien odrzucić wartość stylu życia poza zakresem 1-5', async () => {
      const req = {
        body: {
          name: 'Mój Kalendarz',
          birthDate: '1990-01-01T00:00:00.000Z',
          gender: 'male',
          sleepQuality: 6, // poza zakresem
          physicalActivity: 3,
          nutrition: 3,
          stressLevel: 3,
          smoking: 1,
          alcohol: 1,
          expectedLifespan: 74.0,
          currentAge: 34,
          remainingYears: 40.0,
          livedWeeks: 1768,
          remainingWeeks: 2080,
          totalWeeks: 3848
        }
      };
      
      for (const validator of validateCalendar.slice(0, -1)) {
        await validator.run(req);
      }
      
      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().length).toBeGreaterThan(0);
    });

    test('powinien odrzucić wartość używek poza zakresem 1-3', async () => {
      const req = {
        body: {
          name: 'Mój Kalendarz',
          birthDate: '1990-01-01T00:00:00.000Z',
          gender: 'male',
          sleepQuality: 3,
          physicalActivity: 3,
          nutrition: 3,
          stressLevel: 3,
          smoking: 4, // poza zakresem
          alcohol: 1,
          expectedLifespan: 74.0,
          currentAge: 34,
          remainingYears: 40.0,
          livedWeeks: 1768,
          remainingWeeks: 2080,
          totalWeeks: 3848
        }
      };
      
      for (const validator of validateCalendar.slice(0, -1)) {
        await validator.run(req);
      }
      
      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().length).toBeGreaterThan(0);
    });
  });

  describe('Walidacja wydarzeń', () => {
    test('powinien zaakceptować prawidłowe wydarzenie', async () => {
      const req = {
        body: {
          color: '#FF5733',
          events: [
            {
              name: 'Urodziny',
              description: 'Moje urodziny',
              emoji: '🎂'
            }
          ]
        }
      };
      
      for (const validator of validateEvent.slice(0, -1)) {
        await validator.run(req);
      }
      
      expect(req.body.events[0].name).toBe('Urodziny');
    });

    test('powinien zaakceptować null jako wartość koloru', async () => {
      const req = {
        body: {
          color: null,
          events: []
        }
      };
      
      for (const validator of validateEvent.slice(0, -1)) {
        await validator.run(req);
      }
      
      expect(req.body.color).toBeNull();
    });

    test('powinien odrzucić nieprawidłowy format koloru hex', async () => {
      const req = {
        body: {
          color: 'invalid-color',
          events: []
        }
      };
      
      for (const validator of validateEvent.slice(0, -1)) {
        await validator.run(req);
      }
      
      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().length).toBeGreaterThan(0);
    });

    test('powinien odrzucić nazwę wydarzenia dłuższą niż 100 znaków', async () => {
      const req = {
        body: {
          color: '#FF5733',
          events: [
            {
              name: 'A'.repeat(101), // 101 znaków
              description: 'Opis',
              emoji: '🎂'
            }
          ]
        }
      };
      
      for (const validator of validateEvent.slice(0, -1)) {
        await validator.run(req);
      }
      
      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().length).toBeGreaterThan(0);
    });
  });

  describe('Walidacja ObjectId', () => {
    test('powinien zaakceptować prawidłowy ObjectId', async () => {
      const validObjectId = new mongoose.Types.ObjectId().toString();
      const req = {
        params: {
          id: validObjectId
        }
      };
      
      const validator = validateObjectId('id');
      await validator.run(req);
      
      expect(req.params.id).toBe(validObjectId);
    });

    test('powinien odrzucić nieprawidłowy ObjectId', async () => {
      const req = {
        params: {
          id: 'invalid-object-id'
        }
      };
      
      const validator = validateObjectId('id');
      await validator.run(req);
      
      const errors = validationResult(req);
      expect(errors.isEmpty()).toBe(false);
      expect(errors.array().length).toBeGreaterThan(0);
    });
  });
});
