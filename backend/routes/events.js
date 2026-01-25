const express = require('express');
const router = express.Router();
const Event = require('../models/Event');
const Calendar = require('../models/Calendar');
const { authMiddleware } = require('../middleware/auth');
const { validateObjectId, validateEvent, handleValidationErrors } = require('../middleware/validation');

// Pobierz wszystkie wydarzenia dla kalendarza
router.get('/calendar/:calendarId', authMiddleware, validateObjectId('calendarId'), handleValidationErrors, async (req, res) => {
  try {
    const { calendarId } = req.params;

    // Sprawdź czy kalendarz należy do użytkownika
    const calendar = await Calendar.findOne({ _id: calendarId, userId: req.userId });
    if (!calendar) {
      return res.status(404).json({ message: 'Kalendarz nie znaleziony' });
    }

    const events = await Event.find({ calendarId });
    
    // Zwróć jako obiekt z weekIndex jako kluczem dla łatwego dostępu
    const eventsMap = {};
    events.forEach(event => {
      eventsMap[event.weekIndex] = event;
    });

    res.json(eventsMap);
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Pobierz wydarzenie dla konkretnego tygodnia
router.get('/calendar/:calendarId/week/:weekIndex', authMiddleware, validateObjectId('calendarId'), handleValidationErrors, async (req, res) => {
  try {
    const { calendarId, weekIndex } = req.params;

    // Sprawdź czy kalendarz należy do użytkownika
    const calendar = await Calendar.findOne({ _id: calendarId, userId: req.userId });
    if (!calendar) {
      return res.status(404).json({ message: 'Kalendarz nie znaleziony' });
    }

    const event = await Event.findOne({ calendarId, weekIndex: parseInt(weekIndex) });
    res.json(event || { weekIndex: parseInt(weekIndex), color: null, events: [] });
  } catch (error) {
    console.error('Get week event error:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Zapisz/aktualizuj wydarzenie dla tygodnia
router.put('/calendar/:calendarId/week/:weekIndex', authMiddleware, validateObjectId('calendarId'), validateEvent, async (req, res) => {
  try {
    const { calendarId, weekIndex } = req.params;
    const { color, events } = req.body;

    // Sprawdź czy kalendarz należy do użytkownika
    const calendar = await Calendar.findOne({ _id: calendarId, userId: req.userId });
    if (!calendar) {
      return res.status(404).json({ message: 'Kalendarz nie znaleziony' });
    }

    // Upsert - aktualizuj jeśli istnieje, stwórz jeśli nie
    const event = await Event.findOneAndUpdate(
      { calendarId, weekIndex: parseInt(weekIndex) },
      { 
        calendarId, 
        weekIndex: parseInt(weekIndex), 
        color: color || null, 
        events: events || [] 
      },
      { upsert: true, new: true }
    );

    res.json(event);
  } catch (error) {
    console.error('Save event error:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

// Usuń wydarzenie z tygodnia
router.delete('/calendar/:calendarId/week/:weekIndex', authMiddleware, validateObjectId('calendarId'), handleValidationErrors, async (req, res) => {
  try {
    const { calendarId, weekIndex } = req.params;

    // Sprawdź czy kalendarz należy do użytkownika
    const calendar = await Calendar.findOne({ _id: calendarId, userId: req.userId });
    if (!calendar) {
      return res.status(404).json({ message: 'Kalendarz nie znaleziony' });
    }

    await Event.findOneAndDelete({ calendarId, weekIndex: parseInt(weekIndex) });
    res.json({ message: 'Wydarzenie usunięte' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ message: 'Błąd serwera' });
  }
});

module.exports = router;
