const express = require('express');
const router = express.Router();
const auth = require('../middlewares/auth');
const { isAdmin } = require('../middlewares/checkAdmin');
const equipeController = require('../controllers/equipeController');
const authMiddleware = require('../middlewares/authMiddleware');

// Middleware: autenticado + admin
router.use(auth, authMiddleware);

router.post('/', equipeController.criarEquipe);
router.get('/', equipeController.listarEquipes);
router.get('/:id', equipeController.obterEquipe);
router.put('/:id', isAdmin, equipeController.editarEquipe);
router.delete('/:id', isAdmin, equipeController.excluirEquipe);
router.get("/:id/membros", equipeController.obterMembrosEquipe);

module.exports = router;