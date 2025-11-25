const User = require('../models/User');
const argon2 = require('argon2');
const jwt = require('jsonwebtoken');
const Token = require('../models/Token.js');
const sendEmail = require('../utils/sendEmail.js');
const crypt = require('crypto');
const validatePassword = require('../utils/validatePassword.js');

require('dotenv').config();

exports.registrar = async (req, res) => {
  
  function generateCode(length = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  const bytes = crypt.randomBytes(length);
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars[bytes[i] % chars.length];
  }
  return result;
}
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
      uniqueCode: generateCode(6),
      expiresAt: Date.now() + 3600000, // 1 hora
    }).save();

    const html = `<!DOCTYPE html>
    <html><head><meta charset="utf-8"/>
    <style>
      body{background:#F0F4FF;margin:0;font-family:Arial,sans-serif;color:#0E1F44}
      .wrap{max-width:600px;margin:24px auto;background:#fff;border:1px solid #337BFF;border-radius:12px;overflow:hidden}
      .head{background:#337BFF;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold}
      .content{padding:24px}
      .code{display:inline-block;background:#EAF2FF;color:#0E1F44;border:1px dashed #337BFF;border-radius:8px;font-size:24px;letter-spacing:2px;padding:12px 16px}
      .foot{padding:16px 24px;color:#6B6B6B;font-size:12px}
    </style></head>
    <body>
      <div class="wrap">
        <div class="head">Flowly • Verificação</div>
        <div class="content">
          <p>Olá, somos da equipe Flowly, para prosseguir com o cadastro confirme que esse email é seu, desde já agradecemos pela atenção.</p>
          <p>Seu código de verificação:</p>
          <div class="code">${token.uniqueCode}</div>
        </div>
        <div class="foot">Se você não solicitou, ignore este email.</div>
      </div>
    </body></html>`;

    try {
      await sendEmail(novoUsuario.email, 'Verificação de Email', null, html);
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

exports.verificarEmailCodigo = async (req, res) => {
  try {
    const { userId, uniqueCode } = req.params;

    const user = await User.findById(userId);
    if (!user) return res.status(400).json({ erro: 'Usuário inválido' });

    const tokenDoc = await Token.findOne({ userId: user._id, uniqueCode });
    if (!tokenDoc) return res.status(400).json({ erro: 'Código inválido ou expirado' });

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

// Retorna dados básicos do usuário autenticado
exports.me = async (req, res) => {
  try {
    const userId = (req.user && req.user.id) || (req.usuario && req.usuario.id);
    if (!userId) return res.status(401).json({ erro: 'Não autenticado' });

    const user = await User.findById(userId).select('nome email');
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });

    res.json({ id: user._id, nome: user.nome, email: user.email });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao obter usuário', detalhe: err.message });
  }
};

// Alterar senha do usuário autenticado
exports.alterarSenha = async (req, res) => {
  try {
    const userId = (req.user && req.user.id) || (req.usuario && req.usuario.id);
    if (!userId) return res.status(401).json({ erro: 'Não autenticado' });

    const { novaSenha, confirmarSenha } = req.body;
    if (!novaSenha || !confirmarSenha) {
      return res.status(400).json({ erro: 'Informe novaSenha e confirmarSenha.' });
    }
    if (novaSenha !== confirmarSenha) {
      return res.status(400).json({ erro: 'As senhas não coincidem.' });
    }

    const valid = validatePassword(novaSenha);
    if (valid !== true) {
      return res.status(400).json({ erro: valid });
    }

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });

    const hash = await argon2.hash(novaSenha);
    user.senha = hash;
    await user.save();

    res.status(200).json({ message: 'Senha alterada com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao alterar senha', detalhe: err.message });
  }
};

exports.verificarEmailCodigoPost = async (req, res) => {
  try {
    const { email, codigo } = req.body || {};
    if (!email || !codigo) {
      return res.status(400).json({ erro: 'Informe email e código.' });
    }

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ erro: 'Usuário inválido' });

    const tokenDoc = await Token.findOne({ userId: user._id, uniqueCode: codigo });
    if (!tokenDoc) return res.status(400).json({ erro: 'Código inválido ou expirado' });

    await User.updateOne({ _id: user._id }, { $set: { verificado: true } });
    await Token.deleteOne({ _id: tokenDoc._id });

    res.status(200).json({ message: 'Email verificado com sucesso!' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao verificar email', detalhe: err.message });
  }
};

exports.reenviarCodigo = async (req, res) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ erro: 'Informe o email.' });

    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ erro: 'Usuário não encontrado' });
    if (user.verificado) return res.status(400).json({ erro: 'Usuário já está verificado' });

    let tokenDoc = await Token.findOne({ userId: user._id });
    const newCode = crypt.randomBytes(3).toString('hex').toUpperCase();
    const formatCode = newCode.slice(0, 6);

    if (!tokenDoc) {
      tokenDoc = await new Token({
        userId: user._id,
        token: crypt.randomBytes(32).toString('hex'),
        uniqueCode: formatCode,
        expiresAt: Date.now() + 3600000,
      }).save();
    } else {
      tokenDoc.uniqueCode = formatCode;
      tokenDoc.expiresAt = Date.now() + 3600000;
      await tokenDoc.save();
    }

    const html = `<!DOCTYPE html>
    <html><head><meta charset="utf-8"/>
    <style>
      body{background:#F0F4FF;margin:0;font-family:Arial,sans-serif;color:#0E1F44}
      .wrap{max-width:600px;margin:24px auto;background:#fff;border:1px solid #337BFF;border-radius:12px;overflow:hidden}
      .head{background:#337BFF;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold}
      .content{padding:24px}
      .code{display:inline-block;background:#EAF2FF;color:#0E1F44;border:1px dashed #337BFF;border-radius:8px;font-size:24px;letter-spacing:2px;padding:12px 16px}
      .foot{padding:16px 24px;color:#6B6B6B;font-size:12px}
    </style></head>
    <body>
      <div class="wrap">
        <div class="head">Flowly • Verificação</div>
        <div class="content">
          <p>Olá, somos da equipe Flowly, para prosseguir com o cadastro confirme que esse email é seu, desde já agradecemos pela atenção.</p>
          <p>Seu novo código de verificação:</p>
          <div class="code">${tokenDoc.uniqueCode}</div>
        </div>
        <div class="foot">Se você não solicitou, ignore este email.</div>
      </div>
    </body></html>`;

    await sendEmail(user.email, 'Novo código de verificação', null, html);

    res.status(200).json({ message: 'Código reenviado com sucesso.' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao reenviar código', detalhe: err.message });
  }
};