const express = require('express');
const mongoose = require('mongoose');
const Calendar = require('../models/Calendar');
const Event = require('../models/Event');
const { authMiddleware } = require('../middleware/auth');
const { validateCalendar, validateObjectId, handleValidationErrors } = require('../middleware/validation');

const router = express.Router();

// POST /api/calendar - Zapisz nowy kalendarz
router.post('/', authMiddleware, validateCalendar, async (req, res) => {
  try {
    // Sprawdź ile kalendarzy ma użytkownik
    const calendarCount = await Calendar.countDocuments({ userId: req.userId });
    if (calendarCount >= 3) {
      return res.status(400).json({
        success: false,
        message: 'Możesz mieć maksymalnie 3 kalendarze. Usuń jeden z istniejących, aby utworzyć nowy.'
      });
    }

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
router.get('/:id', authMiddleware, validateObjectId('id'), handleValidationErrors, async (req, res) => {
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

// DELETE /api/calendar/:id - Usuń kalendarz (z transakcją usuwa też wydarzenia)
router.delete('/:id', authMiddleware, validateObjectId('id'), handleValidationErrors, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    // Sprawdź czy kalendarz istnieje i należy do użytkownika
    const calendar = await Calendar.findOne({ 
      _id: req.params.id, 
      userId: req.userId 
    }).session(session);

    if (!calendar) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({
        success: false,
        message: 'Kalendarz nie znaleziony'
      });
    }

    // Usuń wszystkie wydarzenia powiązane z kalendarzem
    await Event.deleteMany({ calendarId: req.params.id }).session(session);

    // Usuń kalendarz
    await Calendar.findByIdAndDelete(req.params.id).session(session);

    await session.commitTransaction();
    session.endSession();

    res.json({
      success: true,
      message: 'Kalendarz usunięty'
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Delete calendar error:', error);
    res.status(500).json({
      success: false,
      message: 'Błąd podczas usuwania kalendarza'
    });
  }
});

module.exports = router;
