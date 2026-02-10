/**
 * Testy jednostkowe dla modelu predykcji długości życia
 * 
 * Testy weryfikują poprawność obliczeń oczekiwanej długości życia
 * na podstawie różnych kombinacji danych wejściowych.
 */

const { calculateLifeExpectancy } = require('../utils/lifeExpectancy');

describe('Model predykcji długości życia', () => {
  
  describe('Bazowa długość życia', () => {
    test('powinien zwrócić 81 lat dla płci żeńskiej z wartościami neutralnymi', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'female',
        sleepQuality: 4, // neutralne (0)
        physicalActivity: 3, // neutralne (0)
        nutrition: 3, // neutralne (0)
        stressLevel: 4, // neutralne (0)
        smoking: 1, // neutralne (0)
        alcohol: 1 // neutralne (0)
      };
      
      const result = calculateLifeExpectancy(formData);
      expect(result.baseExpectancy).toBe(81);
      expect(result.totalModifier).toBe(0);
      expect(result.expectedLifespan).toBe(81);
    });

    test('powinien zwrócić 74 lata dla płci męskiej z wartościami neutralnymi', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'male',
        sleepQuality: 4, // neutralne (0)
        physicalActivity: 3, // neutralne (0)
        nutrition: 3, // neutralne (0)
        stressLevel: 4, // neutralne (0)
        smoking: 1, // neutralne (0)
        alcohol: 1 // neutralne (0)
      };
      
      const result = calculateLifeExpectancy(formData);
      expect(result.baseExpectancy).toBe(74);
      expect(result.totalModifier).toBe(0);
      expect(result.expectedLifespan).toBe(74);
    });

    test('powinien zwrócić średnią 77 lat dla nieznanej płci z wartościami neutralnymi', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'unknown',
        sleepQuality: 4, // neutralne (0)
        physicalActivity: 3, // neutralne (0)
        nutrition: 3, // neutralne (0)
        stressLevel: 4, // neutralne (0)
        smoking: 1, // neutralne (0)
        alcohol: 1 // neutralne (0)
      };
      
      const result = calculateLifeExpectancy(formData);
      expect(result.baseExpectancy).toBe(77);
      expect(result.totalModifier).toBe(0);
      expect(result.expectedLifespan).toBe(77);
    });

    test('powinien zastosować modyfikatory dla wartości 3 w sleepQuality i stressLevel', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'female',
        sleepQuality: 3, // modyfikator -0.5
        physicalActivity: 3, // neutralne (0)
        nutrition: 3, // neutralne (0)
        stressLevel: 3, // modyfikator -0.5
        smoking: 1, // neutralne (0)
        alcohol: 1 // neutralne (0)
      };
      
      const result = calculateLifeExpectancy(formData);
      expect(result.baseExpectancy).toBe(81);
      expect(result.modifiers.sleepQuality).toBe(-0.5);
      expect(result.modifiers.stressLevel).toBe(-0.5);
      expect(result.totalModifier).toBe(-1);
      expect(result.expectedLifespan).toBe(80); // 81 - 1
    });
  });

  describe('Modyfikatory stylu życia', () => {
    test('powinien zastosować modyfikator -4 lata dla braku aktywności fizycznej', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'male',
        sleepQuality: 4, // neutralne (0)
        physicalActivity: 1, // bardzo źle (-4)
        nutrition: 3, // neutralne (0)
        stressLevel: 4, // neutralne (0)
        smoking: 1, // neutralne (0)
        alcohol: 1 // neutralne (0)
      };
      
      const result = calculateLifeExpectancy(formData);
      expect(result.modifiers.physicalActivity).toBe(-4);
      expect(result.expectedLifespan).toBe(70); // 74 - 4
    });

    test('powinien zastosować modyfikator +3.5 lat dla bardzo dobrej aktywności fizycznej', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'male',
        sleepQuality: 4, // neutralne (0)
        physicalActivity: 5, // bardzo dobrze (+3.5)
        nutrition: 3, // neutralne (0)
        stressLevel: 4, // neutralne (0)
        smoking: 1, // neutralne (0)
        alcohol: 1 // neutralne (0)
      };
      
      const result = calculateLifeExpectancy(formData);
      expect(result.modifiers.physicalActivity).toBe(3.5);
      expect(result.expectedLifespan).toBe(77.5); // 74 + 3.5
    });

    test('powinien zastosować modyfikator -10 lat dla częstego palenia', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'male',
        sleepQuality: 4, // neutralne (0)
        physicalActivity: 3, // neutralne (0)
        nutrition: 3, // neutralne (0)
        stressLevel: 4, // neutralne (0)
        smoking: 3, // często (-10)
        alcohol: 1 // neutralne (0)
      };
      
      const result = calculateLifeExpectancy(formData);
      expect(result.modifiers.smoking).toBe(-10);
      expect(result.expectedLifespan).toBe(64); // 74 - 10
    });

    test('powinien zastosować modyfikator -6 lat dla częstego spożycia alkoholu', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'male',
        sleepQuality: 4, // neutralne (0)
        physicalActivity: 3, // neutralne (0)
        nutrition: 3, // neutralne (0)
        stressLevel: 4, // neutralne (0)
        smoking: 1, // neutralne (0)
        alcohol: 3 // często (-6)
      };
      
      const result = calculateLifeExpectancy(formData);
      expect(result.modifiers.alcohol).toBe(-6);
      expect(result.expectedLifespan).toBe(68); // 74 - 6
    });
  });

  describe('Sumowanie modyfikatorów', () => {
    test('powinien poprawnie zsumować wszystkie modyfikatory', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'female',
        sleepQuality: 4, // modyfikator 0
        physicalActivity: 5, // modyfikator +3.5
        nutrition: 5, // modyfikator +3
        stressLevel: 5, // modyfikator +0.5
        smoking: 1, // modyfikator 0
        alcohol: 1 // modyfikator 0
      };
      
      const result = calculateLifeExpectancy(formData);
      const expectedTotalModifier = 0 + 3.5 + 3 + 0.5 + 0 + 0; // 7
      expect(result.totalModifier).toBeCloseTo(expectedTotalModifier, 1);
      expect(result.expectedLifespan).toBeCloseTo(88, 1); // 81 + 7
    });

    test('powinien poprawnie obliczyć oczekiwaną długość życia dla skrajnie negatywnych wartości', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'male',
        sleepQuality: 1, // modyfikator -3.5
        physicalActivity: 1, // modyfikator -4
        nutrition: 1, // modyfikator -5
        stressLevel: 1, // modyfikator -2.5
        smoking: 3, // modyfikator -10
        alcohol: 3 // modyfikator -6
      };
      
      const result = calculateLifeExpectancy(formData);
      const expectedTotalModifier = -3.5 - 4 - 5 - 2.5 - 10 - 6; // -31
      expect(result.totalModifier).toBeCloseTo(expectedTotalModifier, 1);
      expect(result.expectedLifespan).toBeCloseTo(43, 1); // 74 - 31
    });
  });

  describe('Obliczanie wieku i tygodni', () => {
    test('powinien poprawnie obliczyć wiek użytkownika', () => {
      const today = new Date();
      const birthYear = today.getFullYear() - 25;
      const formData = {
        birthDate: `${birthYear}-01-01`,
        gender: 'male',
        sleepQuality: 3,
        physicalActivity: 3,
        nutrition: 3,
        stressLevel: 3,
        smoking: 1,
        alcohol: 1
      };
      
      const result = calculateLifeExpectancy(formData);
      expect(result.currentAge).toBe(25);
    });

    test('powinien poprawnie obliczyć pozostałe tygodnie życia', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'male',
        sleepQuality: 3,
        physicalActivity: 3,
        nutrition: 3,
        stressLevel: 3,
        smoking: 1,
        alcohol: 1
      };
      
      const result = calculateLifeExpectancy(formData);
      // Sprawdź czy pozostałe tygodnie są obliczone jako remainingYears * 52
      const expectedRemainingWeeks = Math.round(result.remainingYears * 52);
      expect(result.remainingWeeks).toBe(expectedRemainingWeeks);
    });

    test('powinien poprawnie obliczyć całkowitą liczbę tygodni', () => {
      const formData = {
        birthDate: '1990-01-01',
        gender: 'female',
        sleepQuality: 3,
        physicalActivity: 3,
        nutrition: 3,
        stressLevel: 3,
        smoking: 1,
        alcohol: 1
      };
      
      const result = calculateLifeExpectancy(formData);
      const expectedTotalWeeks = Math.round(result.expectedLifespan * 52);
      expect(result.totalWeeks).toBe(expectedTotalWeeks);
    });
  });

  describe('Obliczanie dla użytkowników starszych niż bazowa długość życia', () => {
    test('powinien poprawnie obliczyć wartości dla użytkownika starszego niż bazowa długość życia', () => {
      // Symulacja użytkownika starszego niż bazowa długość życia
      const oldDate = new Date();
      oldDate.setFullYear(oldDate.getFullYear() - 85);
      
      const formData = {
        birthDate: oldDate.toISOString().split('T')[0],
        gender: 'male',
        sleepQuality: 4, // neutralne (0)
        physicalActivity: 3, // neutralne (0)
        nutrition: 3, // neutralne (0)
        stressLevel: 4, // neutralne (0)
        smoking: 1, // neutralne (0)
        alcohol: 1 // neutralne (0)
      };
      
      const result = calculateLifeExpectancy(formData);
      
      // Funkcja calculateLifeExpectancy nie implementuje reguły korekty
      // (jest to robione w komponencie CalendarResult.jsx)
      // Test weryfikuje tylko poprawność obliczeń
      expect(result.currentAge).toBeGreaterThan(result.baseExpectancy);
      expect(result.expectedLifespan).toBe(result.baseExpectancy); // 74 dla mężczyzny
      // remainingYears jest ograniczone do minimum 0 przez Math.max(0, ...)
      expect(result.remainingYears).toBe(0); // 0, bo wiek przekracza oczekiwaną długość
      expect(result.remainingWeeks).toBe(0); // również 0
    });
  });
});
