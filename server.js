const app = require('./app');
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = process.env.PORT || 5000;

console.log("### ARQUIVO PRINCIPAL EXECUTADO PELA AZURE ###");
console.log(__filename);
console.log("### DIRETÓRIO ATUAL ###");
console.log(__dirname);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('MongoDB conectado');
    app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
  })
  .catch((err) => console.error(err));