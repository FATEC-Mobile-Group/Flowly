const Projeto = require('../models/Projeto');
const Equipe = require('../models/Equipe');

exports.isAdmin = async (req, res, next) => {
    try {
        const userId = req.user.id;
        let equipeId = null;

        if (req.body && req.body.equipe) {
            equipeId = req.body.equipe;
        } else if (req.params && req.params.equipeId) {
            equipeId = req.params.equipeId;
        } else if (req.params && req.params.projetoId) {
            const projeto = await Projeto.findById(req.params.projetoId);
            if (!projeto) return res.status(404).json({ erro: 'Projeto não encontrado' });
            equipeId = projeto.equipe;
        } else if (req.params && req.params.id) {
            const maybeProjeto = await Projeto.findById(req.params.id);
            if (maybeProjeto) {
                equipeId = maybeProjeto.equipe;
            } else {
                equipeId = req.params.id;
            }
        }

        if (!equipeId) {
            return res.status(400).json({ erro: 'Equipe ou projeto não informado para verificação de administrador' });
        }

        const equipe = await Equipe.findById(equipeId);
        if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada' });

        const membro = equipe.membros.find(m => m.user.toString() === userId);
        if (!membro || membro.role !== 'admin') {
            return res.status(403).json({ erro: 'Acesso restrito a administradores da equipe' });
        }
        next();
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao verificar papel de administrador' });
    }
};