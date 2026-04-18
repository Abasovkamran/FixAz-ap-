const express = require('express');
const router = express.Router();

// Şəkildəki cədvələ əsasən tam usta bazamız (Mock Database)
const repairmenDb = [
    { id: 9, fullName: "İlkin", profession: "Elektrik ustası", level: "Pro", rating: 4.9, price: "30 AZN" },
    { id: 10, fullName: "Kamil", profession: "Santexnik", level: "Pro", rating: 4.8, price: "40 AZN" },
    { id: 11, fullName: "Rüfət", profession: "Boya ustası", level: "Pro", rating: 4.7, price: "25 AZN" },
    { id: 12, fullName: "Rüstəm", profession: "Laminat ustası", level: "Pro", rating: 4.6, price: "35 AZN" },
    { id: 13, fullName: "Azər", profession: "Kondisioner ustası", level: "Pro", rating: 4.9, price: "50 AZN" },
    { id: 14, fullName: "Emil", profession: "Qapı-pəncərə ustası", level: "Pro", rating: 4.5, price: "45 AZN" },
    { id: 15, fullName: "Nihat", profession: "Mebel ustası", level: "Pro", rating: 4.8, price: "60 AZN" },
    { id: 16, fullName: "Orxan", profession: "Alçpan ustası", level: "Pro", rating: 4.7, price: "55 AZN" },
    { id: 17, fullName: "Tofiq", profession: "Mebel ustası", level: "Intern", masterId: 15, rating: 4.0, price: "20 AZN" },
    { id: 18, fullName: "Elşən", profession: "Elektrik ustası", level: "Intern", masterId: 9, rating: 4.2, price: "15 AZN" },
    { id: 19, fullName: "Emil", profession: "Santexnik", level: "Intern",masterId: 10, rating: 4.1, price: "15 AZN" }
];

// 1. Kateqoriyalar (Ustaların peşələrinə uyğunlaşdırıldı)
router.get('/categories', (req, res) => {
    res.status(200).json({
        success: true,
        categories: [
            "Elektrik", "Santexnik", "Boya", "Laminat", 
            "Kondisioner", "Qapı-pəncərə", "Mebel", "Alçpan"
        ]
    });
});

// 2. Axtarış və Dinamik Filtrləmə API-si
router.get('/search', (req, res) => {
    // Postmandan gələn axtarış sözlərini alırıq
    const { profession, level } = req.query; 
    
    let results = repairmenDb;

    // Əgər spesifik bir peşə axtarılırsa (məs: ?profession=Mebel)
    if (profession) {
        results = results.filter(u => u.profession.toLowerCase().includes(profession.toLowerCase()));
    }
    
    // Əgər yalnız İnternlər və ya Pro-lar axtarılırsa (məs: ?level=Intern)
    if (level) {
        results = results.filter(u => u.level.toLowerCase() === level.toLowerCase());
    }

    res.status(200).json({
        success: true,
        totalFound: results.length, // Neçə usta tapıldığını göstəririk
        results: results
    });
});

module.exports = router;