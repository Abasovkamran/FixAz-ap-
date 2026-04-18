const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Postmandan gələn məlumatları (JSON) oxumaq üçün icazələr
app.use(express.json());
app.use(cors());

// --- BURA DİQQƏT: Digər faylları dondurmuşuq ki xəta verməsin ---
// const paymentsRouter = require('./payments.routes');
// const reviewsRouter  = require('./reviews.routes');
// const adminRouter    = require('./admin.routes');

// Sadəcə yeni yaratdığımız Qeydiyyat faylını qoşuruq
const authRouter = require('./auth');
app.use('/api/auth', authRouter);

const usersRouter = require('./users');
app.use('/api/users', usersRouter);

const catalogRouter = require('./catalog');
app.use('/api/catalog', catalogRouter);

const ordersRouter = require('./orders');
app.use('/api/orders', ordersRouter);

// Yeni əlavə etdiyimiz 2 modul:
const paymentsRouter = require('./payments');
app.use('/api/payments', paymentsRouter);

const reviewsRouter = require('./reviews');
app.use('/api/reviews', reviewsRouter);

const adminRouter = require('./admin');
app.use('/api/admin', adminRouter);
// Serveri işə salırıq
app.listen(PORT, () => {
    console.log(`Möhtəşəm! Server ${PORT} portunda işləyir.`);
});