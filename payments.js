const express = require('express');
const router = express.Router();

// 1. Ödənişə başla (POST)
router.post('/init', (req, res) => res.status(200).json({ success: true, message: "SMARTPAY ödəniş linki yaradıldı" }));
// 2. Webhook (SMARTPAY avtomatik cavabı - POST)
router.post('/webhook', (req, res) => res.status(200).json({ success: true, message: "Ödəniş təsdiqləndi" }));
// 3. Balans artır (POST)
router.post('/top-up', (req, res) => res.status(200).json({ success: true, message: "Balans uğurla artırıldı" }));

module.exports = router;