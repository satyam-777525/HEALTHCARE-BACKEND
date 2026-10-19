const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const validate = require('../middleware/validate.middleware');
const { registerSchema, loginSchema } = require('../validators/auth.validator');

// Register endpoint
router.post('/register', validate({ body: registerSchema }), authController.register);

// Login endpoint
router.post('/login', validate({ body: loginSchema }), authController.login);

module.exports = router;
