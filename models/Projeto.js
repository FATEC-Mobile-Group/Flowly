const mongoose = require('mongoose');

const projetoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String },
  equipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipe', required: true }
}, { timestamps: true });

module.exports = mongoose.model('Projeto', projetoSchema);


