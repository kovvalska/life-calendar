const jwt = require('jsonwebtoken');

/**
 * Middleware do weryfikacji tokenu JWT
 * Dodaje req.userId do requestu jeśli token jest prawidłowy
 */
const authMiddleware = async (req, res, next) => {
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

    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Nieprawidłowy token' 
    });
  }
};

module.exports = { authMiddleware };
