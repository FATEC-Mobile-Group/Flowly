const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roles');
const tarefaController = require('../controllers/tarefaController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(auth, authMiddleware);

router.post('/', isAdmin, tarefaController.criarTarefa);
router.get('/', tarefaController.listarTarefas);
router.get('/', isAdmin, tarefaController.listarTarefasPrivadas);
router.put('/:id', isAdmin, tarefaController.editarTarefa);
router.delete('/:id', isAdmin, tarefaController.excluirTarefa);
router.get('/minhas-tarefas', tarefaController.listarMinhasTarefas);
router.post('/:id/associar', tarefaController.associarTarefa);
router.post('/:id/desassociar', tarefaController.desassociarTarefa);

module.exports = router;