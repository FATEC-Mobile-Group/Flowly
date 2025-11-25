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
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <style>
        body{background:#F0F4FF;margin:0;font-family:Arial,sans-serif;color:#0E1F44}
        .wrap{max-width:600px;margin:24px auto;background:#fff;border:1px solid #337BFF;border-radius:12px;overflow:hidden}
        .head{background:#337BFF;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold}
        .content{padding:24px}
        a.button{display:inline-block;background:#337BFF;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px}
        </style></head><body>
        <div class="wrap">
          <div class="head">Flowly • Convite de equipe</div>
          <div class="content">
            <p>Você foi convidado para participar da equipe!</p>
            <p><a class="button" href="${url}" target="_blank">Aceitar convite</a></p>
            <p style="color:#6B6B6B;font-size:12px">Este link expira em 24 horas.</p>
          </div>
        </div>
        </body></html>`;
        await sendEmail(email, 'Convite para participar de uma equipe', null, html);
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

    if (convite.aceito)
      return res.status(400).send("<h2>Convite já aceito anteriormente.</h2>");

    if (Date.now() > convite.expiresAt)
      return res.status(400).send("<h2>Convite expirado.</h2>");

    const user = await User.findOne({ email: decoded.email });
    if (!user)
      return res.status(404).send("<h2>Usuário não encontrado. Crie uma conta primeiro.</h2>");

    // Adiciona o usuário à equipe
    await Equipe.findByIdAndUpdate(convite.equipe, {
      $addToSet: { membros: { user: user._id, role: 'membro' } },
    });

    convite.aceito = true;
    await convite.save();
    res.send("<h2>Convite aceito! Agora você faz parte da equipe. ✅</h2>");
  } catch (err) {
    res.status(400).send("<h2>Link inválido ou expirado.</h2>");
  }
};
