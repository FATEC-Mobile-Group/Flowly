const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const equipeRoutes = require('./routes/equipeRoutes');
const tarefaRoutes = require('./routes/tarefaRoutes');
const projetoRoutes = require('./routes/projetoRoutes');
const conviteRoutes = require('./routes/conviteRoutes');

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
app.set('trust proxy', true);

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/equipes', equipeRoutes);
app.use('/api/tarefas', tarefaRoutes);
app.use('/api/projetos', projetoRoutes); 
app.use('/api/convites', conviteRoutes);

// Tratamento de erros para rotas não encontradas
app.use((req, res, next) => {
  res.status(404).json({ error: 'Rota não encontrada' });
});

// Tratamento de erros gerais
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Erro interno do servidor' });
});

module.exports = app;