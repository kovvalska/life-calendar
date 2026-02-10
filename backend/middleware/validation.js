const { body, param, validationResult } = require('express-validator');
const mongoose = require('mongoose');

/**
 * Middleware do obsługi błędów walidacji
 */
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Błąd walidacji danych',
      errors: errors.array()
    });
  }
  next();
};

/**
 * Walidacja ObjectId
 */
const validateObjectId = (paramName) => {
  return param(paramName).custom((value) => {
    if (!mongoose.Types.ObjectId.isValid(value)) {
      throw new Error(`Nieprawidłowy format ${paramName}`);
    }
    return true;
  });
};

/**
 * Walidacja rejestracji
 */
const validateRegister = [
  body('email')
    .isEmail()
    .withMessage('Podaj prawidłowy adres email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Hasło musi mieć minimum 6 znaków'),
  handleValidationErrors
];

/**
 * Walidacja logowania
 */
const validateLogin = [
  body('email')
    .isEmail()
    .withMessage('Podaj prawidłowy adres email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Hasło jest wymagane'),
  handleValidationErrors
];

/**
 * Walidacja weryfikacji
 */
const validateVerify = [
  body('email')
    .isEmail()
    .withMessage('Podaj prawidłowy adres email')
    .normalizeEmail(),
  body('code')
    .isLength({ min: 4, max: 4 })
    .withMessage('Kod weryfikacyjny musi mieć 4 cyfry')
    .isNumeric()
    .withMessage('Kod weryfikacyjny musi składać się z cyfr'),
  handleValidationErrors
];

/**
 * Walidacja kalendarza
 */
const validateCalendar = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Nazwa kalendarza jest wymagana')
    .isLength({ max: 30 })
    .withMessage('Nazwa kalendarza może mieć maksymalnie 30 znaków'),
  body('birthDate')
    .isISO8601()
    .withMessage('Podaj prawidłową datę urodzenia'),
  body('gender')
    .isIn(['male', 'female'])
    .withMessage('Płeć musi być "male" lub "female"'),
  body('sleepQuality')
    .isInt({ min: 1, max: 5 })
    .withMessage('Jakość snu musi być w zakresie 1-5'),
  body('physicalActivity')
    .isInt({ min: 1, max: 5 })
    .withMessage('Aktywność fizyczna musi być w zakresie 1-5'),
  body('nutrition')
    .isInt({ min: 1, max: 5 })
    .withMessage('Jakość odżywiania musi być w zakresie 1-5'),
  body('stressLevel')
    .isInt({ min: 1, max: 5 })
    .withMessage('Poziom stresu musi być w zakresie 1-5'),
  body('smoking')
    .isInt({ min: 1, max: 3 })
    .withMessage('Palenie tytoniu musi być w zakresie 1-3'),
  body('alcohol')
    .isInt({ min: 1, max: 3 })
    .withMessage('Spożycie alkoholu musi być w zakresie 1-3'),
  body('expectedLifespan')
    .isFloat({ min: 1, max: 150 })
    .withMessage('Szacowana długość życia musi być w zakresie 1-150'),
  body('currentAge')
    .isFloat({ min: 0, max: 150 })
    .withMessage('Obecny wiek musi być w zakresie 0-150'),
  body('remainingYears')
    .isFloat({ min: 0, max: 150 })
    .withMessage('Pozostałe lata muszą być w zakresie 0-150'),
  body('livedWeeks')
    .isInt({ min: 0 })
    .withMessage('Przeżyte tygodnie muszą być liczbą całkowitą >= 0'),
  body('remainingWeeks')
    .isInt({ min: 0 })
    .withMessage('Pozostałe tygodnie muszą być liczbą całkowitą >= 0'),
  body('totalWeeks')
    .isInt({ min: 1 })
    .withMessage('Całkowita liczba tygodni musi być >= 1'),
  handleValidationErrors
];

/**
 * Walidacja wydarzenia
 */
const validateEvent = [
  body('color')
    .optional({ nullable: true, checkFalsy: true })
    .custom((value) => {
      if (value === null || value === undefined || value === '') {
        return true; // null jest dozwolony
      }
      // Sprawdź czy to hex color (z # lub bez)
      const hexPattern = /^#?([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
      if (!hexPattern.test(value)) {
        throw new Error('Kolor musi być w formacie hex (np. #FF5733 lub FF5733)');
      }
      return true;
    }),
  body('events')
    .optional()
    .isArray()
    .withMessage('Wydarzenia muszą być tablicą'),
  body('events.*.name')
    .if(body('events').isArray())
    .trim()
    .notEmpty()
    .withMessage('Nazwa wydarzenia jest wymagana')
    .isLength({ max: 50 })
    .withMessage('Nazwa wydarzenia może mieć maksymalnie 50 znaków'),
  body('events.*.description')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Opis może mieć maksymalnie 200 znaków'),
  body('events.*.emoji')
    .optional()
    .isLength({ max: 10 })
    .withMessage('Emoji może mieć maksymalnie 10 znaków'),
  handleValidationErrors
];

module.exports = {
  handleValidationErrors,
  validateObjectId,
  validateRegister,
  validateLogin,
  validateVerify,
  validateCalendar,
  validateEvent
};
