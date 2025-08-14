const express = require('express');
const router = express.Router();
const { authenticate } = require('../../middleware/auth.middleware');
const purchaseController = require('../../controllers/purchase.controller');

router.post('/process', authenticate, purchaseController.processPayment);

module.exports = router;