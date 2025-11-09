const nodemailer = require('nodemailer');
require('dotenv').config();

module.exports = async (email, subject, text) => {
    try {
        // Configuração do transporte de e-mail
        const transporter = nodemailer.createTransport({
            host: process.env.HOST, // SMTP host
            port: process.env.EMAIL_PORT, // porta
            secure: process.env.SECURE, // true para SSL (465), false para TLS
            auth: {
                user: process.env.AUTH_EMAIL,
                pass: process.env.AUTH_PASS
            }
        });

        const info = await transporter.sendMail({
            from: process.env.AUTH_EMAIL,
            to: email,
            subject: subject,
            text: text
        });

        return info;
    } catch (error) {
        // Repassar o erro para o controlador tratar e enviar a resposta HTTP
        throw error;
    }
}