const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/checkAdmin');
const tarefaController = require('../controllers/tarefaController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(auth, authMiddleware);

router.post('/', tarefaController.criarTarefa);
router.get('/', tarefaController.listarTarefas);
router.get('/privadas', isAdmin, tarefaController.listarTarefasPrivadas);
router.get('/minhas-tarefas', tarefaController.listarMinhasTarefas);
router.post('/:id/associar', tarefaController.associarTarefa);
router.post('/:id/desassociar', tarefaController.desassociarTarefa);
router.post('/:id/concluir', tarefaController.concluirTarefa);
router.post('/concluir/:id', tarefaController.concluirTarefa);
router.put('/:id', isAdmin, tarefaController.editarTarefa);
router.delete('/:id', isAdmin, tarefaController.excluirTarefa);

module.exports = router;