const User = require('../models/User');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');

exports.registrar = async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    const hash = await argon2.hash(senha);

    const novoUsuario = new User({ nome, email, senha: hash, tipo });
    await novoUsuario.save();

    res.status(201).json({ msg: 'Usuário registrado com sucesso!' });
  } catch (err) {
    res.status(400).json({ erro: 'Erro ao registrar', detalhe: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const senhaValida = await argon2.verify(user.senha, senha);
    if (!senhaValida) return res.status(401).json({ erro: 'Senha inválida' });

    const token = jwt.sign({ id: user._id, tipo: user.tipo }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { id: user._id, nome: user.nome, tipo: user.tipo } });
    
  } catch (err) {
    res.status(500).json({ erro: 'Erro no login', detalhe: err.message });
  }
};

// NOVO: Listar apenas usuários do tipo 'aluno'
exports.listarUsuarios = async (req, res) => {
  try {
    const users = await User.find().select('nome email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar usuários', detalhe: err.message });
  }
};