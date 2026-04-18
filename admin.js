const express = require('express');
const router = express.Router();

// 1. Bütün istifadəçilər və ustalar (GET)
router.get('/users', (req, res) => res.status(200).json({ success: true, message: "İstifadəçi bazası yükləndi" }));
// 2. Yeni ustanı təsdiqləmək (PUT)
router.put('/repairmen/:id/approve', (req, res) => res.status(200).json({ success: true, message: "Ustanın sənədləri yoxlandı və təsdiqləndi" }));
// 3. Ümumi Statistika (GET)
router.get('/statistics', (req, res) => res.status(200).json({ success: true, data: { income: "15,000 AZN", totalOrders: 350 } }));

module.exports = router;