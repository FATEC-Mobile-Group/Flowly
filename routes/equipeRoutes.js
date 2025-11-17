const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/checkAdmin');
const equipeController = require('../controllers/equipeController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(auth, authMiddleware);

router.post('/', equipeController.criarEquipe);
router.get('/', equipeController.listarEquipes);
router.get('/:equipeId', equipeController.obterEquipe);
router.put('/:equipeId', isAdmin, equipeController.editarEquipe);
router.delete('/:equipeId', isAdmin, equipeController.excluirEquipe);
router.get('/:equipeId/membros', equipeController.obterMembrosEquipe);

module.exports = router;