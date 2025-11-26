const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

const fs = require('fs');

try {
  console.log("Conteúdo da pasta /routes na produção:");
  console.log(fs.readdirSync("./routes"));
} catch (e) {
  console.log("Não consegui ler a pasta /routes");
}


mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => console.error(err));