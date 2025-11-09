const User = require('../models/User');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const Token = require('../models/Token.js');
const sendEmail = require('../utils/sendEmail.js');
const crypt = require('crypto');
const validatePassword = require('../utils/validatePassword.js');

require('dotenv').config();

exports.registrar = async (req, res) => {
  try {
    const { nome, email, genero, senha } = req.body;

    // Validação da senha
    const passwordValidationResult = validatePassword(senha);
    if (passwordValidationResult !== true) {
      return res.status(400).json({ erro: passwordValidationResult });
    }

    const usuarioExistente = await User.findOne({ email });
    if (usuarioExistente) {
      return res.status(400).json({ erro: 'Email já registrado' });
    }

    const hash = await argon2.hash(senha);
    const novoUsuario = new User({ nome, email, genero, senha: hash, verificado: false });
    

    const token = await new Token({
      userId: novoUsuario._id,
      token: crypt.randomBytes(32).toString('hex'),
      expiresAt: Date.now() + 3600000, // 1 hora
    }).save();

    const url = `${process.env.BASE_URL}auth/verify/${novoUsuario._id}/${token.token}`;

    try {
      await sendEmail(novoUsuario.email, 'Verificação de Email', `<p>Olá ${novoUsuario.nome},</p>
        <p>Por favor, verifique seu email clicando no link: <a href="${url}">${url}</a></p>
        <p>Obrigado!</p>`);
      await novoUsuario.save();
      res.status(201).send({ message: "Um email foi enviado para verificação." });
    } catch (err) {
      console.error('Erro ao enviar email de verificação:', err.message);
    }

  } catch (err) {
    res.status(400).json({ erro: 'Erro ao registrar', detalhe: err.message });
  }
};

exports.verificarEmail = async (req, res) => {
  try {
    const { userId, token } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ erro: 'Usuário inválido' });

    const tokenDoc = await Token.findOne({ userId: user._id, token });
    if (!tokenDoc) return res.status(400).json({ erro: 'Token inválido ou expirado' });
    

    await User.updateOne({ _id: user._id }, { $set: { verificado: true } });
    await Token.deleteOne({ _id: tokenDoc._id });

    res.status(200).json({ message: 'Email verificado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao verificar email', detalhe: err.message });
  }
}; 

exports.login = async (req, res) => {
  try {
    const { email, senha } = req.body;
    const user = await User.findOne({ email });

    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const verificar = user.verificado;
    if (!verificar) return res.status(401).json({ erro: 'Email não verificado, por favor confirme seu email' });
    const senhaValida = await argon2.verify(user.senha, senha);
    if (!senhaValida) return res.status(401).json({ erro: 'Senha inválida' });

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    res.json({ token, user: { id: user._id, nome: user.nome } });

  } catch (err) {
    res.status(500).json({ erro: 'Erro no login', detalhe: err.message });
  }
};

exports.listarUsuarios = async (req, res) => {
  try {
    const users = await User.find().select('nome email');
    res.json(users);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar usuários', detalhe: err.message });
  }
};