const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/roles');
const projetoController = require('../controllers/projetoController');
const authMiddleware = require('../middlewares/authMiddleware');

router.use(auth, authMiddleware);

router.post('/', isAdmin, projetoController.criarProjeto);
router.get('/', projetoController.listarProjetos);
router.get('/:id', projetoController.obterProjeto);
router.put('/:id', isAdmin, projetoController.editarProjeto);
router.delete('/:id', isAdmin, projetoController.excluirProjeto);

module.exports = router;