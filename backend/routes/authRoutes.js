const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController.js');
const auth = require('../middleware/auth');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/registrar', authController.registrar);
router.post('/login', authController.login);
router.get('/users', authController.listarUsuarios);
router.get('/verify/:userId/:token', authController.verificarEmail);
router.get('/me', auth, authMiddleware, authController.me);
router.post('/change-password', auth, authMiddleware, authController.alterarSenha);

module.exports = router;