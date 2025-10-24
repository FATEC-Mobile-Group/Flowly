const express = require('express');
const cors = require('cors');
require('dotenv').config();
const authRoutes = require('./routes/authRoutes');
const equipeRoutes = require('./routes/equipeRoutes');
const tarefaRoutes = require('./routes/tarefaRoutes');
const projetoRoutes = require('./routes/projetoRoutes');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Rotas
app.use('/api/auth', authRoutes);
app.use('/api/equipes', equipeRoutes); // Certifique-se de que o arquivo equipesRoutes.js existe
app.use('/api/tarefas', tarefaRoutes); // Certifique-se de que o arquivo tarefaRoutes.js existe
app.use('/api/projetos', projetoRoutes); // Certifique-se de que o arquivo projetoRoutes.js existe

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