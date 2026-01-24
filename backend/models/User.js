const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  verificationCode: {
    type: String,
    default: null
  },
  verificationCodeExpires: {
    type: Date,
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Hashowanie hasła przed zapisem
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Metoda do porównywania haseł
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Metoda do generowania kodu weryfikacyjnego
userSchema.methods.generateVerificationCode = function() {
  const code = Math.floor(1000 + Math.random() * 9000).toString();
  this.verificationCode = code;
  this.verificationCodeExpires = new Date(Date.now() + 15 * 60 * 1000); // 15 minut
  return code;
};

module.exports = mongoose.model('User', userSchema);
