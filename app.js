const express = require('express');
const cors = require('cors');
require('dotenv').config();
const mongoose = require('mongoose');
const authRoutes = require('./routes/authRoutes');
const equipeRoutes = require('./routes/equipeRoutes');
const tarefaRoutes = require('./routes/tarefaRoutes');
const projetoRoutes = require('./routes/projetoRoutes');
const conviteRoutes = require('./routes/conviteRoutes');

const app = express();

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => console.error(err));
  
// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
}));
app.use(express.json());
app.set('trust proxy', true);
app.use(express.urlencoded({ extended: true }));

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