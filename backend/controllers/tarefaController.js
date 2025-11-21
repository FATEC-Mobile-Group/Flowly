const Tarefa = require('../models/Tarefa');
const User = require('../models/User');
const Projeto = require('../models/Projeto');
const Equipe = require('../models/Equipe');

// ADMIN cria tarefa
exports.criarTarefa = async (req, res) => {
  try {
    const { nome, descricao, prazo, dificuldade, prioridade, associado, status, projeto, visivelAtodos } = req.body;

    if (!nome || !prazo || !projeto) {
      return res.status(400).json({ erro: 'Campos obrigatórios ausentes: nome, prazo e projeto' });
    }

    if (associado) {
      const user = await User.findById(associado);
      if (!user) return res.status(400).json({ erro: 'Usuário associado inválido' });
    }

    const proj = await Projeto.findById(projeto);
    if (!proj) return res.status(400).json({ erro: 'Projeto inválido' });

    const equipeId = proj.equipe;
    if (!equipeId) return res.status(400).json({ erro: 'Projeto não pertence a nenhuma equipe' });

    const equipeDoc = await Equipe.findById(equipeId);
    if (!equipeDoc) return res.status(404).json({ erro: 'Equipe do projeto não encontrada' });

    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ erro: 'Usuário não autenticado' });

    const membro = equipeDoc.membros.find(m => m.user.toString() === userId);
    if (!membro || membro.role !== 'admin') {
      return res.status(403).json({ erro: 'Acesso restrito a administradores da equipe' });
    }

    const tarefa = new Tarefa({ 
      nome,
      descricao,
      prazo,
      dificuldade,
      prioridade,
      associado: associado || null,
      status: status || 'pendente',
      projeto,
      visivelAtodos: visivelAtodos !== undefined ? visivelAtodos : true
    });
    await tarefa.save();

    res.status(201).json(tarefa);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao criar tarefa', detalhe: err.message });
  }
};

// MEMBRO: listar tarefas públicas
exports.listarTarefas = async (req, res) => {
  try {
    const tarefas = await Tarefa.find({ visivelAtodos: true })
      .sort({ createdAt: -1 });
    res.status(200).json(tarefas);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar tarefas', detalhe: err.message });
  }
};

// ADMIN: listar tarefas
exports.listarTarefasPrivadas = async (req, res) => {
  try {
    const tarefas = await Tarefa.find({ visivelAtodos: false })
      .sort({ createdAt: -1 });
    res.status(200).json(tarefas);
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao listar tarefas', detalhe: err.message });
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
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ erro: 'Usuário não autenticado' });
    const proj = await Projeto.findById(tarefa.projeto);
    if (!proj) return res.status(400).json({ erro: 'Projeto inválido' });
    const equipeDoc = await Equipe.findById(proj.equipe);
    if (!equipeDoc) return res.status(404).json({ erro: 'Equipe do projeto não encontrada' });
    const membro = (equipeDoc.membros || []).some(m => String(m.user) === String(userId));
    if (!membro) return res.status(403).json({ erro: 'Acesso negado: não é membro da equipe' });

    tarefa.associado = userId;
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
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ erro: 'Usuário não autenticado' });
    const proj = await Projeto.findById(tarefa.projeto);
    if (!proj) return res.status(400).json({ erro: 'Projeto inválido' });
    const equipeDoc = await Equipe.findById(proj.equipe);
    if (!equipeDoc) return res.status(404).json({ erro: 'Equipe do projeto não encontrada' });
    const membro = (equipeDoc.membros || []).some(m => String(m.user) === String(userId));
    if (!membro) return res.status(403).json({ erro: 'Acesso negado: não é membro da equipe' });

    tarefa.associado = null;
    tarefa.status = 'pendente';
    await tarefa.save();

    res.status(200).json({ message: 'Tarefa desassociada com sucesso', tarefa });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao desassociar tarefa' });
  }
};

// MEMBRO: concluir tarefa atribuída a si
exports.concluirTarefa = async (req, res) => {
  try {
    const tarefa = await Tarefa.findById(req.params.id);
    if (!tarefa) return res.status(404).json({ erro: 'Tarefa não encontrada' });
    const userId = req.user && req.user.id;
    if (!userId) return res.status(401).json({ erro: 'Usuário não autenticado' });
    if (String(tarefa.associado) !== String(userId)) {
      return res.status(403).json({ erro: 'Somente o usuário associado pode concluir a tarefa' });
    }
    const proj = await Projeto.findById(tarefa.projeto);
    if (!proj) return res.status(400).json({ erro: 'Projeto inválido' });
    const equipeDoc = await Equipe.findById(proj.equipe);
    if (!equipeDoc) return res.status(404).json({ erro: 'Equipe do projeto não encontrada' });
    const membro = (equipeDoc.membros || []).some(m => String(m.user) === String(userId));
    if (!membro) return res.status(403).json({ erro: 'Acesso negado: não é membro da equipe' });

    tarefa.status = 'concluido';
    await tarefa.save();
    res.status(200).json({ message: 'Tarefa concluída com sucesso', tarefa });
  } catch (err) {
    res.status(500).json({ erro: 'Erro ao concluir tarefa' });
  }
};

