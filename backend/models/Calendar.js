const mongoose = require('mongoose');

const calendarSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    default: 'Mój Kalendarz'
  },
  // Dane z formularza
  birthDate: {
    type: Date,
    required: true
  },
  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true
  },
  sleepQuality: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  physicalActivity: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  nutrition: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  stressLevel: {
    type: Number,
    min: 1,
    max: 5,
    required: true
  },
  smoking: {
    type: Number,
    min: 1,
    max: 3,
    required: true
  },
  alcohol: {
    type: Number,
    min: 1,
    max: 3,
    required: true
  },
  // Wyniki obliczeń
  expectedLifespan: {
    type: Number,
    required: true
  },
  currentAge: {
    type: Number,
    required: true
  },
  remainingYears: {
    type: Number,
    required: true
  },
  livedWeeks: {
    type: Number,
    required: true
  },
  remainingWeeks: {
    type: Number,
    required: true
  },
  totalWeeks: {
    type: Number,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Aktualizuj updatedAt przed zapisem
calendarSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('Calendar', calendarSchema);
