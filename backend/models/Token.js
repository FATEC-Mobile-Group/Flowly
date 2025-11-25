const mongoose = require('mongoose');

const TokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, 
  required: true, ref: "User", unique: true },
  token: { type: String, required: true, unique: true },
  uniqueCode: { type: String, required: true, unique: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

module.exports = mongoose.model('Token', TokenSchema);