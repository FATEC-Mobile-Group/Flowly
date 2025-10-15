const Projeto = require('../models/Projeto');

// Criar projeto
exports.criarProjeto = async (req, res) => {
  try {
    const { nome, descricao, equipe } = req.body;

    if (!nome || !equipe) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes: nome e equipe' });
    }

    const projeto = new Projeto({ nome, descricao, equipe });
    await projeto.save();

    res.status(201).json(projeto);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar projeto', detalhe: err.message });
  }
};

// Listar projetos
exports.listarProjetos = async (req, res) => {
  try {
    const { equipe } = req.query;
    const filtro = {};
    if (equipe) filtro.equipe = equipe;

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
    const projeto = await Projeto.findById(req.params.id).populate('equipe', 'nome');
    if (!projeto) return res.status(404).json({ erro: 'Projeto não encontrado' });
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


