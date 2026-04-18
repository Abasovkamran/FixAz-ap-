// src/modules/admin/admin.routes.js
// Module 7 — Admin Panel routes.
// ALL routes require authentication AND role='admin'.

const { Router }      = require('express');
const { param, query }= require('express-validator');
const validate        = require('../../middleware/validate');
const { authenticate, authorize } = require('../../middleware/auth');
const ctrl            = require('./admin.controller');

const router = Router();

// Apply auth + admin guard to every route in this module
router.use(authenticate, authorize('admin'));

// GET /api/admin/users
router.get('/users', [
  query('role').optional().isIn(['user', 'repairman', 'admin']).withMessage('Yanlış rol filteri.'),
  query('page').optional().isInt({ min: 1 }),
  query('per_page').optional().isInt({ min: 1, max: 100 }),
], validate, ctrl.listAllUsers);

// PUT /api/admin/repairmen/:id/approve
router.put('/repairmen/:id/approve', [
  param('id').isInt({ min: 1 }).withMessage('Usta ID müsbət tam ədəd olmalıdır.'),
], validate, ctrl.approveRepairman);

// GET /api/admin/statistics
router.get('/statistics', ctrl.getStatistics);

module.exports = router;
