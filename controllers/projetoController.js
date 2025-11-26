const Projeto = require('../models/Projeto');
const Equipe = require('../models/Equipe');
const User = require('../models/User');

// Criar projeto
exports.criarProjeto = async (req, res) => {
  try {
    const { nome, descricao, equipe } = req.body;

    if (!nome || !equipe) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes: nome e equipe' });
    }

    const equipeDoc = await Equipe.findById(equipe);
    if (!equipeDoc) return res.status(404).json({ erro: 'Equipe não encontrada' });

    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ erro: 'Usuário não autenticado' });

    const membro = equipeDoc.membros.find(m => m.user.toString() === userId);
    if (!membro || membro.role !== 'admin') {
      return res.status(403).json({ erro: 'Acesso restrito a administradores da equipe' });
    }

    const projeto = new Projeto({ nome, descricao, equipe });
    await projeto.save();

    try {
      equipeDoc.projetos = equipeDoc.projetos || [];
      equipeDoc.projetos.push(projeto._id);
      await equipeDoc.save();
    } catch (err) {
      console.error('Erro ao atualizar equipe com projeto:', err.message);
    }

    try {
      for (const membro of equipeDoc.membros) {
        const membroId = membro.user;
        if (!membroId) continue;
        const membroUser = await User.findById(membroId);
        if (!membroUser) continue;
        membroUser.equipes = membroUser.equipes || [];
        const hasEquipe = membroUser.equipes.some(eid => eid.toString() === equipeDoc._id.toString());
        if (!hasEquipe) {
          membroUser.equipes.push(equipeDoc._id);
          await membroUser.save();
        }
      }
    } catch (err) {
      console.error('Erro ao sincronizar equipes nos usuários da equipe:', err.message);
    }
    
    res.status(201).json(projeto);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar projeto', detalhe: err.message });
  }
};

// Listar projetos
exports.listarProjetos = async (req, res) => {
  try {
    const { equipe } = req.query;
    const userId = req.user && req.user.id;
    const filtro = {};
    if (equipe) {
      filtro.equipe = equipe;
      const equipeDoc = await Equipe.findById(equipe);
      if (!equipeDoc) return res.status(404).json({ erro: 'Equipe não encontrada' });
      const membro = (equipeDoc.membros || []).some(m => String(m.user) === String(userId));
      if (!membro) return res.status(403).json({ erro: 'Acesso negado: não é membro da equipe' });
    } else {
      // Sem equipe específica: listar apenas projetos das equipes do usuário
      const equipesDoUsuario = await Equipe.find({ 'membros.user': userId }).select('_id');
      filtro.equipe = { $in: equipesDoUsuario.map(e => e._id) };
    }

    const projetos = await Projeto.find(filtro)
      .populate('equipe', 'nome')
      .sort({ createdAt: -1 });
    res.json(projetos);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar projetos' });
  }
};

// Obter projeto por ID
exports.obterProjeto = async (req, res) => {
  try {
    const projeto = await Projeto.findById(req.params.id).populate('equipe', 'nome membros');
    if (!projeto) return res.status(404).json({ erro: 'Projeto não encontrado' });
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ erro: 'Usuário não autenticado' });
    const equipeDoc = await Equipe.findById(projeto.equipe);
    if (!equipeDoc) return res.status(404).json({ erro: 'Equipe não encontrada' });
    const membro = (equipeDoc.membros || []).some(m => String(m.user) === String(userId));
    if (!membro) return res.status(403).json({ erro: 'Acesso negado: não é membro da equipe' });
    res.json(projeto);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar projeto' });
  }
};

// Editar projeto
exports.editarProjeto = async (req, res) => {
  try {
    const { nome, descricao, equipe } = req.body;
    const atualizado = await Projeto.findByIdAndUpdate(
      req.params.id,
      { nome, descricao, equipe },
      { new: true }
    ).populate('equipe', 'nome');

    if (!atualizado) return res.status(404).json({ erro: 'Projeto não encontrado' });
    res.json(atualizado);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao editar projeto' });
  }
};

// Excluir projeto
exports.excluirProjeto = async (req, res) => {
  try {
    await Projeto.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Projeto excluído com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir projeto' });
  }
};


