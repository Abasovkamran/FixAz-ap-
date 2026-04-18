const express = require('express');
const router = express.Router();

// 1. Şəxsi profilə baxış (İstifadəçi və ya Usta öz məlumatlarını görür - GET)
router.get('/profile', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Profil məlumatları uğurla gətirildi",
        data: {
            id: 1,
            fullName: "Emin Məmmədov",
            email: "emin@gmail.com",
            phone: "+994501234567",
            role: "user"
        }
    });
});

// 2. Profili yeniləmək (Ad, nömrə və s. dəyişmək - PUT)
router.put('/profile', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Profiliniz uğurla yeniləndi!",
        updatedData: req.body
    });
});

// 3. Ustanın ictimai profilinə baxış (Müştərilər ustaları incələmək üçün - GET)
router.get('/repairman/:id', (req, res) => {
    res.status(200).json({
        success: true,
        message: "Usta məlumatları tapıldı",
        data: {
            id: req.params.id,
            fullName: "Əli Usta",
            profession: "Santexnik",
            rating: 4.8,
            completedJobs: 24
        }
    });
});

module.exports = router;