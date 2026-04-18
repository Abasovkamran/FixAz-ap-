// src/modules/payments/payments.routes.js
// Module 5 — Payment routes.
// Note: /webhook is intentionally unauthenticated (called by SMARTPAY server).

const { Router } = require('express');
const { body }   = require('express-validator');
const validate   = require('../../middleware/validate');
const { authenticate } = require('../../middleware/auth');
const ctrl       = require('./payments.controller');

const router = Router();

// POST /api/payments/init — authenticated user
router.post('/init', authenticate, [
  body('method').isIn(['card', 'balance']).withMessage('Ödəniş üsulu "card" və ya "balance" olmalıdır.'),
  body('amount').optional({ nullable: true }).isFloat({ min: 0.01 }).withMessage('Məbləğ müsbət olmalıdır.'),
  body('order_id').optional({ nullable: true }).isInt({ min: 1 }).withMessage('order_id müsbət tam ədəd olmalıdır.'),
], validate, ctrl.initPayment);

// POST /api/payments/webhook — NO auth (called by SMARTPAY)
// In production: add express-raw-body middleware and verify HMAC signature here.
router.post('/webhook', [
  body('provider_ref').notEmpty().withMessage('provider_ref tələb olunur.'),
  body('status').isIn(['success', 'failed']).withMessage('status "success" və ya "failed" olmalıdır.'),
  body('amount').isFloat({ min: 0.01 }).withMessage('amount tələb olunur.'),
], validate, ctrl.handleWebhook);

// POST /api/payments/top-up — authenticated user
router.post('/top-up', authenticate, [
  body('amount').isFloat({ min: 0.01 }).withMessage('Balansa əlavə ediləcək məbləğ müsbət olmalıdır.'),
], validate, ctrl.topUpBalance);

module.exports = router;
