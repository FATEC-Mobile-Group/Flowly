const Equipe = require('../models/Equipe');
const User = require('../models/User');

exports.criarEquipe = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ erro: "Usuário não logado" });

    const { nome, descricao, vinculoEmpresarial, membros} = req.body;

    // Validação do nome da equipe
    if (!nome || nome.trim() === "") {
      return res.status(400).json({ erro: "O nome da equipe é obrigatório" });
    }

    // Gerar código único de 4 dígitos
    async function gerarCodigoUnico() {
      for (let i = 0; i < 30; i++) {
        const code = String(Math.floor(Math.random() * 9000) + 1000);
        const existente = await Equipe.findOne({ code }).lean();
        if (!existente) return code;
      }
      throw new Error('Não foi possível gerar código único');
    }

    const code = await gerarCodigoUnico();

    // Criar a equipe
    const novaEquipe = new Equipe({ nome, descricao, vinculoEmpresarial, code, membros });
    await novaEquipe.save();

    // Adicionar o criador como membro da equipe com papel de 'admin'
    novaEquipe.membros.push({ user: userId, role: 'admin' });
    await novaEquipe.save();

    try {
      user.equipes = user.equipes || [];
      user.equipes.push(novaEquipe._id);
      await user.save();
    } catch (err) {
      console.error('Erro ao atualizar usuário com equipe:', err.message);
    }

    // Retornar a equipe criada com os dados populados
    const equipePopulada = await Equipe.findById(novaEquipe._id).populate('membros', 'nome email');
    res.status(201).json(equipePopulada);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao criar equipe", detalhe: err.message });
  }
};

exports.listarEquipes = async (req, res) => {
  try {
    const userId = req.user && req.user.id;
    const equipes = await Equipe.find({ 'membros.user': userId }).populate('membros', 'nome descricao');
    res.json(equipes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar equipes' });
  }
};

exports.obterEquipe = async (req, res) => {
  try {
    const id = req.params.equipeId || req.params.id;
    const equipe = await Equipe.findById(id).populate('membros', 'nome descricao');
    if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada' });
    const userId = req.user && req.user.id;
    const membro = (equipe.membros || []).some(m => String(m.user?._id || m.user) === String(userId));
    if (!membro) return res.status(403).json({ erro: 'Acesso negado: não é membro da equipe' });
    res.json(equipe);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar equipe' });
  }
};

exports.editarEquipe = async (req, res) => {
  try {
    const { nome, descricao, vinculoEmpresarial} = req.body;
    const id = req.params.equipeId || req.params.id;

    const equipeAtualizada = await Equipe.findByIdAndUpdate(
      id,
      { nome, descricao, vinculoEmpresarial },
      { new: true }
    ).populate('membros', 'nome descricao');

    if (!equipeAtualizada) {
      return res.status(404).json({ erro: 'Equipe não encontrada' });
    }

    res.json(equipeAtualizada);
  } catch (err) {
    console.error('Erro ao editar equipe:', err.message);
    res.status(500).json({ erro: 'Erro ao editar equipe', detalhe: err.message });
  }
};


exports.excluirEquipe = async (req, res) => {
  try {
    const id = req.params.equipeId || req.params.id;
    await Equipe.findByIdAndDelete(id);
    res.json({ msg: 'Equipe excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir equipe' });
  }
};

exports.obterMembrosEquipe = async (req, res) => {
  try {
    const id = req.params.equipeId || req.params.id;
    const userId = req.user && req.user.id;
    const pertence = await Equipe.exists({ _id: id, 'membros.user': userId });
    const equipe = await Equipe.findById(id).lean();
    if (!equipe) return res.status(404).json({ erro: "Equipe não encontrada" });
    if (!pertence) return res.status(403).json({ erro: 'Acesso negado: não é membro da equipe' });
    const ids = (equipe.membros || []).map(m => m.user).filter(Boolean);
    const usuarios = await User.find({ _id: { $in: ids } }).select('nome email').lean();
    const membros = usuarios.map(u => ({ nome: u.nome || '', email: u.email || '' }));
    res.json(membros);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar membros da equipe" });
  }
};

// Buscar equipe por código
exports.obterEquipePorCodigo = async (req, res) => {
  try {
    const code = String(req.query.code || '');
    if (!/^[0-9]{4}$/.test(code)) return res.status(400).json({ erro: 'Código inválido' });
    const equipe = await Equipe.findOne({ code }).populate('membros', 'nome descricao');
    if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada' });
    res.json(equipe);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar por código' });
  }
};

// Entrar na equipe
exports.entrarNaEquipe = async (req, res) => {
  try {
    const id = req.params.equipeId || req.params.id;
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ erro: 'Não autenticado' });
    const equipe = await Equipe.findById(id);
    if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada' });
    const jaMembro = (equipe.membros || []).some(m => String(m.user) === String(userId));
    if (jaMembro) return res.status(409).json({ erro: 'Usuário já é membro da equipe' });
    equipe.membros.push({ user: userId, role: 'membro' });
    await equipe.save();
    res.status(200).json({ message: 'Entrada na equipe realizada com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao entrar na equipe' });
  }
};
