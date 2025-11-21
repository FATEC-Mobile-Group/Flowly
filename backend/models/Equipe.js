const mongoose = require('mongoose');

const equipeSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: {type: String},
  vinculoEmpresarial: { type: String },
  code: { type: String, required: true, unique: true, minlength: 4, maxlength: 4 },
  membros: [{ 
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true} , 
    role: { type: String, enum: ['admin', 'membro'], default: 'membro' }
  }],
  projetos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Projeto' }],
}, { timestamps: true });

equipeSchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.model('Equipe', equipeSchema);