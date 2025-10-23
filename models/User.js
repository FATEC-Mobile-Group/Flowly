const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  senha: { type: String, required: true },
  equipes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Equipe' }],
  tarefas: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tarefa' }],
  projetos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Projeto' }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);