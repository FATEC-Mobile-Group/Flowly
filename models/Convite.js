const mongoose = require('mongoose');

const conviteSchema = new mongoose.Schema({
    equipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipe', required: true },
    email: { type: String, required: true },
    role: { type: String, enum: ['membro', 'admin'], default: 'membro' },
    token: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
    aceito: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Convite', conviteSchema);