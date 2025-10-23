const mongoose = require('mongoose');

const tarefaSchema = new mongoose.Schema({
  nome: { type: String, required: true },
  descricao: { type: String }, 
  prazo: { type: Date, required: true },
  dificuldade: {
    type: String,
    enum: ['definir','facil', 'media', 'dificil'],
    default: 'definir'
  },
  prioridade: {
    type: String,
    enum: ['definir','alta', 'media', 'baixa'],
    default: 'definir'
  },
  associado: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  status: {
    type: String,
    enum: ['pendente', 'em_andamento', 'concluido'],
    default: 'pendente'
  },
  projeto: { type: mongoose.Schema.Types.ObjectId, ref: 'Projeto', required: true },
  tempoExcedido: { type: Boolean, default: false },
  ativo: { type: Boolean, default: true },
  visivelAtodos: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('Tarefa', tarefaSchema);