const express = require('express');
const router = express.Router();
const purchaseController = require('../../controllers/purchase.controller');
const { authenticate } = require('../../middleware/auth.middleware');

router.get('/', authenticate, purchaseController.getPurchasePage);

module.exports = router;