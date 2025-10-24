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

    // Criar a equipe
    const novaEquipe = new Equipe({ nome, descricao, vinculoEmpresarial, membros });
    await novaEquipe.save();

    // Adicionar o criador como membro da equipe com papel de 'admin'
    novaEquipe.membros.push({ user: userId, role: 'admin' });
    await novaEquipe.save();

    // Retornar a equipe criada com os dados populados
    const equipePopulada = await Equipe.findById(novaEquipe._id).populate('membros', 'nome email');
    res.status(201).json(equipePopulada);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao criar equipe", detalhe: err.message });
  }
};

exports.listarEquipes = async (req, res) => {
  try {
    const equipes = await Equipe.find().populate('membros', 'nome descricao');
    res.json(equipes);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar equipes' });
  }
};

exports.obterEquipe = async (req, res) => {
  try {
    const equipe = await Equipe.findById(req.params.id).populate('membros', 'nome descricao');
    if (!equipe) return res.status(404).json({ erro: 'Equipe não encontrada' });
    res.json(equipe);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar equipe' });
  }
};

exports.editarEquipe = async (req, res) => {
  try {
    const { nome, descricao, vinculoEmpresarial} = req.body;

    const equipeAtualizada = await Equipe.findByIdAndUpdate(
      req.params.id,
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
    await Equipe.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Equipe excluída com sucesso' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir equipe' });
  }
};

exports.getMembrosEquipe = async (req, res) => {
  try {
    const equipe = await Equipe.findById(req.params.id).populate("membros", "nome");
    if (!equipe) return res.status(404).json({ erro: "Equipe não encontrada" });
    res.json(equipe.membros);
  } catch (err) {
    res.status(500).json({ erro: "Erro ao buscar membros da equipe" });
  }
};
