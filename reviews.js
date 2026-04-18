const express = require('express');
const router = express.Router();

// 1. Rəy və ulduz vermək (POST)
router.post('/', (req, res) => res.status(201).json({ success: true, message: "Usta üçün rəyiniz qeydə alındı" }));
// 2. Ustanın rəylərini gətir (GET)
router.get('/repairman/:id', (req, res) => res.status(200).json({ success: true, reviews: ["Əla usta!", "Razı qaldım"] }));

module.exports = router;