const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/checkAdmin');
const authMiddleware = require('../middleware/authMiddleware');

router.use(auth, authMiddleware);

router.post('/convidarMembro', isAdmin, conviteController.convidarMembro);
router.get('/convite/aceitar/:token', conviteController.aceitarConvite);

module.exports = router;