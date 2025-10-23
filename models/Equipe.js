const mongoose = require('mongoose');

const equipeSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: {type: String},
  vinculoEmpresarial: { type: String },
  membros: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }],
  projetos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Projeto' }],
}, { timestamps: true });

module.exports = mongoose.model('Equipe', equipeSchema);