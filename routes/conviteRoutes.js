const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const { isAdmin } = require('../middleware/checkAdmin');
const authMiddleware = require('../middleware/authMiddleware');
const conviteController = require('../controllers/conviteController');

router.use(auth, authMiddleware);

router.post('/convidarMembro/:equipeId', isAdmin, conviteController.convidarMembro);

module.exports = router;