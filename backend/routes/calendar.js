const express = require('express');
const jwt = require('jsonwebtoken');
const Calendar = require('../models/Calendar');

const router = express.Router();

// Middleware do weryfikacji tokenu
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

// POST /api/calendar - Zapisz nowy kalendarz
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      birthDate,
      gender,
      sleepQuality,
      physicalActivity,
      nutrition,
      stressLevel,
      smoking,
      alcohol,
      expectedLifespan,
      currentAge,
      remainingYears,
      livedWeeks,
      remainingWeeks,
      totalWeeks
    } = req.body;

    const calendar = new Calendar({
      userId: req.userId,
      name,
      birthDate,
      gender,
      sleepQuality,
      physicalActivity,
      nutrition,
      stressLevel,
      smoking,
      alcohol,
      expectedLifespan,
      currentAge,
      remainingYears,
      livedWeeks,
      remainingWeeks,
      totalWeeks
    });

    await calendar.save();

    res.status(201).json({
      success: true,
      message: 'Kalendarz zapisany',
      calendar
    });

  } catch (error) {
    console.error('Save calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas zapisywania kalendarza'
    });
  }
});

// GET /api/calendar - Pobierz wszystkie kalendarze użytkownika
router.get('/', authMiddleware, async (req, res) => {
  try {
    const calendars = await Calendar.find({ userId: req.userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      calendars
    });

  } catch (error) {
    console.error('Get calendars error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas pobierania kalendarzy'
    });
  }
});

// GET /api/calendar/:id - Pobierz konkretny kalendarz
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const calendar = await Calendar.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Kalendarz nie znaleziony'
      });
    }

    res.json({
      success: true,
      calendar
    });

  } catch (error) {
    console.error('Get calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas pobierania kalendarza'
    });
  }
});

// DELETE /api/calendar/:id - Usuń kalendarz
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const calendar = await Calendar.findOneAndDelete({ 
      _id: req.params.id, 
      userId: req.userId 
    });

    if (!calendar) {
      return res.status(404).json({
        success: false,
        message: 'Kalendarz nie znaleziony'
      });
    }

    res.json({
      success: true,
      message: 'Kalendarz usunięty'
    });

  } catch (error) {
    console.error('Delete calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas usuwania kalendarza'
    });
  }
});

module.exports = router;
