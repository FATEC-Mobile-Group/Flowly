const jwt = require('jsonwebtoken');

// Chave secreta usada para assinar o token (deve ser a mesma usada no login)
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_secreta';

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  // Verifica se o header existe e começa com "Bearer "
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ mensagem: 'Token não fornecido.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    // Verifica e decodifica o token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Adiciona os dados do usuário no `req` para uso posterior
    req.usuario = decoded;
    
    next(); // Continua para o próximo middleware ou controller
  } catch (err) {
    return res.status(401).json({ mensagem: 'Token inválido.' });
  }
}

module.exports = authMiddleware;