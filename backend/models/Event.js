const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
  calendarId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Calendar',
    required: true
  },
  weekIndex: {
    type: Number,
    required: true
  },
  // Kolor tła kwadracika (opcjonalny)
  color: {
    type: String,
    default: null
  },
  // Wydarzenia w danym tygodniu
  events: [{
    name: {
      type: String,
      required: true,
      maxlength: 100
    },
    description: {
      type: String,
      maxlength: 500
    },
    emoji: {
      type: String,
      maxlength: 10
    }
  }]
}, {
  timestamps: true
});

// Indeks dla szybkiego wyszukiwania
eventSchema.index({ calendarId: 1, weekIndex: 1 }, { unique: true });

module.exports = mongoose.model('Event', eventSchema);
