const jwt = require("jsonwebtoken");
const Convite = require("../models/Convite.js");
const Equipe = require("../models/Equipe.js");
const User = require("../models/User.js");
const sendEmail = require("../utils/sendEmail.js");

exports.convidarMembro = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ erro: "Usuário não logado" });
    const { equipeId } = req.params;

    const equipe = await Equipe.findById(equipeId);
    if (!equipe) {
      return res.status(404).json({ message: "Equipe não encontrada." });
    }

    const codigoEquipe = equipe.code;

    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ message: "Email é obrigatório." });
    }
    
    const convidado = await User.findOne({ email: email });
    if (convidado) {
      const jaMembro = equipe.membros.some(
        (m) => String(m.user) === String(convidado._id)
      );

      if (jaMembro) {
        return res.status(400).json({ message: "Usuário já é membro da equipe." });
      }
      
      try{
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"/>
        <style>
        body{background:#F0F4FF;margin:0;font-family:Arial,sans-serif;color:#0E1F44}
        .wrap{max-width:600px;margin:24px auto;background:#fff;border:1px solid #337BFF;border-radius:12px;overflow:hidden}
        .head{background:#337BFF;color:#fff;padding:18px 24px;font-size:20px;font-weight:bold}
        .content{padding:24px}
        .code{display:inline-block;background:#EAF2FF;color:#0E1F44;border:1px dashed #337BFF;border-radius:8px;font-size:24px;letter-spacing:2px;padding:12px 16px}
        a.button{display:inline-block;background:#337BFF;color:#fff;text-decoration:none;padding:10px 16px;border-radius:8px}
        </style></head><body>
        <div class="wrap">
          <div class="head">Flowly • Convite de equipe</div>
          <div class="content">
            <p>Você foi convidado para participar da equipe!</p>
            <p>Informe o código abaixo no app para entrar na equipe:</p>
            <div class="code">${codigoEquipe}</div>
            <p style="color:#6B6B6B;font-size:12px">Este código expira em 24 horas.</p>
          </div>
        </div>
        </body></html>`;
        await sendEmail(email, 'Convite para participar de uma equipe', null, html);
    } catch (err) {
      console.error('Erro ao enviar email de convite:', err.message);
    }

    res.status(200).json({ message: "Convite enviado com sucesso!" });
    } else {
      res.status(404).json({ message: "Usuário com esse email não encontrado." });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};