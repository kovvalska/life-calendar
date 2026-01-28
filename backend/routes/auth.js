const express = require('express');
const jwt = require('jsonwebtoken');
const { body } = require('express-validator');
const User = require('../models/User');
const { sendVerificationEmail } = require('../utils/sendEmail');
const { validateRegister, validateLogin, validateVerify, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// Generowanie JWT
const generateToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.JWT_SECRET || 'default-secret-change-in-production',
    { expiresIn: '7d' }
  );
};

// POST /api/auth/register - Rejestracja
router.post('/register', validateRegister, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Sprawdź czy użytkownik istnieje
    const existingUser = await User.findOne({ email });
    
    if (existingUser) {
      if (existingUser.isVerified) {
        return res.status(400).json({ 
          success: false, 
          message: 'Użytkownik z tym adresem email już istnieje' 
        });
      } else {
        // Użytkownik istnieje ale nie jest zweryfikowany - wyślij nowy kod
        const code = existingUser.generateVerificationCode();
        await existingUser.save();
        
        await sendVerificationEmail(email, code);
        
        return res.json({ 
          success: true, 
          message: 'Wysłano nowy kod weryfikacyjny',
          requiresVerification: true
        });
      }
    }

    // Utwórz nowego użytkownika
    const user = new User({ email, password });
    const code = user.generateVerificationCode();
    await user.save();

    // Wyślij email z kodem
    await sendVerificationEmail(email, code);

    res.status(201).json({ 
      success: true, 
      message: 'Konto utworzone. Sprawdź email, aby uzyskać kod weryfikacyjny.',
      requiresVerification: true
    });

  } catch (error) {
    console.error('Register error:', error.message, error.response || '', error.stack);
    res.status(500).json({ 
      success: false, 
      message: 'Błąd serwera podczas rejestracji' 
    });
  }
});

// POST /api/auth/verify - Weryfikacja kodu
router.post('/verify', validateVerify, async (req, res) => {
  try {
    const { email, code } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Użytkownik nie znaleziony' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Konto jest już zweryfikowane' 
      });
    }

    // Sprawdź kod i czas ważności
    if (user.verificationCode !== code) {
      return res.status(400).json({ 
        success: false, 
        message: 'Nieprawidłowy kod weryfikacyjny' 
      });
    }

    if (user.verificationCodeExpires < new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Kod weryfikacyjny wygasł. Zarejestruj się ponownie.' 
      });
    }

    // Weryfikuj użytkownika
    user.isVerified = true;
    user.verificationCode = null;
    user.verificationCodeExpires = null;
    await user.save();

    // Wygeneruj token
    const token = generateToken(user._id);

    res.json({ 
      success: true, 
      message: 'Konto zweryfikowane pomyślnie',
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Verify error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Błąd serwera podczas weryfikacji' 
    });
  }
});

// POST /api/auth/login - Logowanie
router.post('/login', validateLogin, async (req, res) => {
  try {
    const { email, password } = req.body;

    // Znajdź użytkownika
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({ 
        success: false, 
        message: 'Nieprawidłowy email lub hasło' 
      });
    }

    // Sprawdź czy zweryfikowany
    if (!user.isVerified) {
      // Wyślij nowy kod weryfikacyjny
      const code = user.generateVerificationCode();
      await user.save();
      await sendVerificationEmail(email, code);

      return res.status(403).json({ 
        success: false, 
        message: 'Konto nie jest zweryfikowane. Wysłano nowy kod na email.',
        requiresVerification: true
      });
    }

    // Sprawdź hasło
    const isMatch = await user.comparePassword(password);

    if (!isMatch) {
      return res.status(401).json({ 
        success: false, 
        message: 'Nieprawidłowy email lub hasło' 
      });
    }

    // Wygeneruj token
    const token = generateToken(user._id);

    res.json({ 
      success: true, 
      message: 'Zalogowano pomyślnie',
      token,
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Błąd serwera podczas logowania' 
    });
  }
});

// POST /api/auth/resend-code - Ponowne wysłanie kodu
router.post('/resend-code', [
  body('email')
    .isEmail()
    .withMessage('Podaj prawidłowy adres email')
    .normalizeEmail(),
  handleValidationErrors
], async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Użytkownik nie znaleziony' 
      });
    }

    if (user.isVerified) {
      return res.status(400).json({ 
        success: false, 
        message: 'Konto jest już zweryfikowane' 
      });
    }

    const code = user.generateVerificationCode();
    await user.save();
    await sendVerificationEmail(email, code);

    res.json({ 
      success: true, 
      message: 'Nowy kod weryfikacyjny został wysłany' 
    });

  } catch (error) {
    console.error('Resend code error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Błąd serwera' 
    });
  }
});

// GET /api/auth/me - Pobierz dane zalogowanego użytkownika
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ 
        success: false, 
        message: 'Brak tokenu autoryzacji' 
      });
    }

    const token = authHeader.split(' ')[1];
    
    const decoded = jwt.verify(
      token, 
      process.env.JWT_SECRET || 'default-secret-change-in-production'
    );

    const user = await User.findById(decoded.userId).select('-password -verificationCode');

    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'Użytkownik nie znaleziony' 
      });
    }

    res.json({ 
      success: true, 
      user: {
        id: user._id,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Auth me error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Nieprawidłowy token' 
    });
  }
});

module.exports = router;
