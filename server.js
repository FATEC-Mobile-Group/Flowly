const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const fs = require('fs');

console.log("Conteúdo da pasta /controllers na produção:");
try {
    console.log(fs.readdirSync("./controllers"));
} catch (err) {
    console.log("Erro ao acessar /controllers:", err.message);
    
}

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => console.error(err));