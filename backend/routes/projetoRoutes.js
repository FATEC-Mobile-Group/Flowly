const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/checkAdmin');
const projetoController = require('../controllers/projetoController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(auth, authMiddleware);

router.post('/', projetoController.criarProjeto);
router.get('/', projetoController.listarProjetos);
router.get('/:id', projetoController.obterProjeto);
router.put('/:id', isAdmin, projetoController.editarProjeto);
router.delete('/:id', isAdmin, projetoController.excluirProjeto);

module.exports = router;