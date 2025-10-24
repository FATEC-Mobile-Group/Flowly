const Tarefa = require('../models/Tarefa');
const User = require('../models/User');
const Projeto = require('../models/Projeto');

// ADMIN cria tarefa
exports.criarTarefa = async (req, res) => {
  try {
    const { nome, descricao, prazo, dificuldade, prioridade, associado, status, projeto, visivelAtodos } = req.body;

    const user = await User.findById(aluno);
    if (!user || user.tipo !== 'aluno') return res.status(400).json({ erro: 'Aluno inválido' });

    const tarefa = new Tarefa({ 
      nome,
      descricao,
      prazo,
      dificuldade,
      prioridade,
      associado,
      status,
      projeto,
      visivelAtodos
    });
    await tarefa.save();

    res.status(201).json(tarefa);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar tarefa', detalhe: err.message });
  }
};

// MEMBRO: listar tarefas publicas
exports.listarTarefas = async (req, res) => {
  try {
    const tarefas = await Tarefa.find({ visivelAtodos: true })
      .populate('equipe', 'nome')
        .sort({ createdAt: -1 });
    res.status(200).json(tarefas);
    } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar tarefas' });
  }
};

// ADMIN: listar tarefas
exports.listarTarefasPrivadas = async (req, res) => {
  try {
    const tarefas = await Tarefa.find({ visivelAtodos: false })
      .populate('equipe', 'nome')
      .sort({ createdAt: -1 });
    res.status(200).json(tarefas);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar tarefas' });
  }
};

// ADMIN: editar tarefa
exports.editarTarefa = async (req, res) => {
    const id = req.params.id;
  try {
    const tarefa = await Tarefa.findById(id);
    if (!tarefa) {
      return res.status(404).json({ erro: 'Tarefa não encontrada' });
    }

    const tarefaAtualizada = await Tarefa.findByIdAndUpdate(
        id, { ...req.body }, { new: true }
    );
    
    res.status(200).json({message: "Tarefa atualizada com sucesso", tarefaAtualizada});

  } catch (err) {
    res.status(500).json({ erro: 'Erro ao editar tarefa' });
  }
};

// ADMIN: excluir
exports.excluirTarefa = async (req, res) => {
  try {
    await Tarefa.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Tarefa excluída' });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao excluir tarefa' });
  }
};

// MEMBRO: visualizar suas tarefas
exports.listarMinhasTarefas = async (req, res) => {
  try {
    const tarefas = await Tarefa.find({ associado: req.user.id })
      .populate('equipe', 'nome');
    res.json(tarefas);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao buscar suas tarefas' });
  }
};


// MEMBRO: associar tarefa a si mesmo
exports.associarTarefa = async (req, res) => {
  try {
    const tarefa = await Tarefa.findById(req.params.id);
    if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada' });

    tarefa.associado = req.user.id;
    tarefa.status = 'em_andamento';
    await tarefa.save();

    res.status(200).json({ message: 'Tarefa associada com sucesso', tarefa });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao associar tarefa' });
  }
};

// MEMBRO: desassociar tarefa de si mesmo
exports.desassociarTarefa = async (req, res) => {
  try {
    const tarefa = await Tarefa.findById(req.params.id);
    if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada' });

    tarefa.associado = null;
    tarefa.status = 'pendente';
    await tarefa.save();

    res.status(200).json({ message: 'Tarefa desassociada com sucesso', tarefa });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao desassociar tarefa' });
  }
};

