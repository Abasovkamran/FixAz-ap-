const express = require('express');
const router = express.Router();

// 1. Müştəri Qeydiyyatı (Bunu artıq test etmişdik)
router.post('/register/user', (req, res) => {
    res.status(201).json({
        success: true,
        message: "Təbriklər! Müştəri uğurla qeydiyyatdan keçdi.",
        user: req.body
    });
});

// 2. Usta Qeydiyyatı (Bunu da test etdik)
router.post('/register/repairman', (req, res) => {
    res.status(201).json({
        success: true,
        message: "Təbriklər! Usta uğurla qeydiyyatdan keçdi.",
        repairman: req.body
    });
});

// 3. OTP (Kodu) Təsdiqləmə
router.post('/verify-otp', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Nömrəniz uğurla təsdiqləndi!"
    });
});

// 4. Hesaba Giriş (Login)
router.post('/login', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Sistemə uğurla daxil oldunuz!",
        token: "bizim_saxta_tehlukesizlik_tokenimiz_12345"
    });
});

// 5. Şifrəni Yeniləmə (Reset Password)
router.post('/reset-password', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Şifrəniz uğurla yeniləndi. Yeni şifrə ilə daxil ola bilərsiniz."
    });
});

module.exports = router;