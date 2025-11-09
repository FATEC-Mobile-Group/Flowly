const jwt = require("jsonwebtoken");
const Convite = require("../models/Convite.js");
const Equipe = require("../models/Equipe.js");
const User = require("../models/User.js");
const sendEmail = require("../utils/sendEmail.js");

exports.convidarMembro = async (req, res) => {
  try {
    const { email, equipeId } = req.body;

    // Gera token de convite (expira em 1 dia)
    const token = jwt.sign({ email, equipeId }, process.env.JWT_SECRET, {
      expiresIn: "1d",
    });

    const convite = await Convite.create({
      email,
      equipe: equipeId,
      token,
      expiresAt: Date.now() + 24 * 60 * 60 * 1000, // 1 dia
    });

    const url = `${process.env.BASE_URL}/convite/aceitar/${token}`;

    try{
        await sendEmail(
        email,
        `
        <h2>Convite para participar de uma equipe</h2>
        <p>Você foi convidado para participar da equipe!</p>
        <p>Clique abaixo para aceitar o convite:</p>
        <a href="${url}" target="_blank">${url}</a>
        <p>Este link expira em 24 horas.</p>
        `
        );
        await convite.save();
    } catch (err) {
      console.error('Erro ao enviar email de convite:', err.message);
    }

    res.status(200).json({ message: "Convite enviado com sucesso!" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.aceitarConvite = async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const convite = await Convite.findOne({ token });
    if (!convite)
      return res.status(404).send("<h2>Convite inválido ou não encontrado.</h2>");

    if (convite.accepted)
      return res.status(400).send("<h2>Convite já aceito anteriormente.</h2>");

    if (Date.now() > convite.expiresAt)
      return res.status(400).send("<h2>Convite expirado.</h2>");

    const user = await User.findOne({ email: decoded.email });
    if (!user)
      return res.status(404).send("<h2>Usuário não encontrado. Crie uma conta primeiro.</h2>");

    // Adiciona o usuário à equipe
    await Equipe.findByIdAndUpdate(convite.equipe, {
      $addToSet: { membros: user._id },
    });

    convite.aceito = true;
    await convite.save();
    res.send("<h2>Convite aceito! Agora você faz parte da equipe. ✅</h2>");
  } catch (err) {
    res.status(400).send("<h2>Link inválido ou expirado.</h2>");
  }
};
