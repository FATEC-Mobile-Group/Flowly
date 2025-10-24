exports.isAdmin = async (req, res, next) => {
    try {
        const userId = req.user.id;
        const { projetoId } = req.params;

        const projeto = await Projeto.findById(projetoId);
        if (!projeto) {
            return res.status(404).json({ erro: 'Projeto não encontrado' });
        }

        const equipe = await Equipe.findById(projeto.equipe);
        const membro = equipe.membros.find(m => m.user.toString() === userId);
        if (!membro || membro.role !== 'admin') {
            return res.status(403).json({ erro: 'Acesso restrito a administradores da equipe do projeto' });
        }

        next();
    } catch (err) {
        res.status(500).json({ erro: 'Erro ao verificar papel de administrador' });
    }
};

  