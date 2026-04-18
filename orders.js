
const express = require('express');
const router = express.Router();

// 1. Sifariş yarat (POST)
router.post('/', (req, res) => res.status(201).json({ success: true, message: "Sifariş yaradıldı" }));
// 2. Sifarişlərin siyahısı (GET)
router.get('/', (req, res) => res.status(200).json({ success: true, orders: [] }));
// 3. Konkret sifarişə bax (GET)
router.get('/:id', (req, res) => res.status(200).json({ success: true, orderId: req.params.id }));
// 4. Ustanın qəbul etməsi (PUT)
router.put('/:id/accept', (req, res) => res.status(200).json({ success: true, message: "Usta sifarişi qəbul etdi" }));
// 5. Statusun dəyişməsi (PUT)
router.put('/:id/status', (req, res) => res.status(200).json({ success: true, message: "Sifariş statusu yeniləndi" }));

module.exports = router;