// src/modules/reviews/reviews.routes.js
// Module 6 — Reviews & Ratings.

const { Router }      = require('express');
const { body, param, query } = require('express-validator');
const validate        = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl            = require('./reviews.controller');

const router = Router();

// POST /api/reviews — authenticated customers only
router.post('/', authenticate, authorize('user'), [
  body('order_id').isInt({ min: 1 }).withMessage('order_id tələb olunur.'),
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Reytinq 1–5 arasında tam ədəd olmalıdır.'),
  body('comment').optional().isLength({ max: 1000 }).withMessage('Şərh 1000 simvoldan çox ola bilməz.'),
], validate, ctrl.submitReview);

// GET /api/reviews/repairman/:id — public
router.get('/repairman/:id', [
  param('id').isInt({ min: 1 }).withMessage('Usta ID müsbət tam ədəd olmalıdır.'),
  query('page').optional().isInt({ min: 1 }),
  query('per_page').optional().isInt({ min: 1, max: 50 }),
], validate, ctrl.getRepairmanReviews);

module.exports = router;
