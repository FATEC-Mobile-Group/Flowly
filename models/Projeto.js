const mongoose = require('mongoose');

const projetoSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String },
  equipe: { type: mongoose.Schema.Types.ObjectId, ref: 'Equipe', required: true },
  tarefas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tarefa' }]
}, { timestamps: true });

module.exports = mongoose.model('Projeto', projetoSchema);


