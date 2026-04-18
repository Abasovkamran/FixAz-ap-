// src/modules/payments/payments.service.js
// Payment business logic:
//   - initPayment   → creates a pending payment row and returns a SMARTPAY redirect URL
//   - handleWebhook → receives SMARTPAY callback, marks payment success/fail,
//                     credits repairman balance if applicable
//   - topUpBalance  → customer tops up their wallet (card → repairman balance)
//
// In production replace the SMARTPAY_* placeholders with the real SDK/API calls.

const pool = require('../../config/db');

// ─── Helpers ──────────────────────────────────────────────

/**
 * mockSmartpayInit
 * Replace this with the real SMARTPAY payment initiation API call.
 * Should return { provider_ref, redirect_url }
 */
const mockSmartpayInit = async ({ amount, orderId, userId }) => ({
  provider_ref: `SP-${Date.now()}-${userId}`,
  redirect_url: `https://pay.smartpay.az/checkout?amount=${amount}&ref=SP-${Date.now()}`,
});

// ─── Service Functions ────────────────────────────────────

/**
 * initPayment
 * Called when a customer wants to pay for an accepted order or top up their balance.
 * Creates a 'pending' payment row and returns the SMARTPAY redirect URL.
 */
const initPayment = async (userId, { order_id, method, amount }) => {
  // If paying for an order, validate the order belongs to this user and is accepted
  if (order_id) {
    const [[order]] = await pool.execute(
      'SELECT id, user_id, status, price FROM orders WHERE id = ?',
      [order_id]
    );
    if (!order)                        throw { status: 404, message: 'Sifariş tapılmadı.' };
    if (order.user_id !== userId)      throw { status: 403, message: 'Bu sifariş sizə aid deyil.' };
    if (order.status !== 'accepted')   throw { status: 400, message: 'Yalnız qəbul edilmiş sifarişlər ödənilə bilər.' };

    // Use the agreed order price if amount not specified
    if (!amount) amount = order.price;
  }

  if (!amount || amount <= 0) throw { status: 400, message: 'Ödəniş məbləği müsbət olmalıdır.' };

  // Create pending payment record
  const [result] = await pool.execute(
    `INSERT INTO payments (user_id, order_id, type, method, amount, status)
     VALUES (?, ?, ?, ?, ?, 'pending')`,
    [
      userId,
      order_id || null,
      order_id ? 'order_payment' : 'top_up',
      method,
      amount,
    ]
  );
  const paymentId = result.insertId;

  // Call SMARTPAY to get a payment URL (replace with real API in production)
  const { provider_ref, redirect_url } = await mockSmartpayInit({ amount, orderId: order_id, userId });

  // Store provider reference for webhook matching
  await pool.execute(
    'UPDATE payments SET provider_ref = ? WHERE id = ?',
    [provider_ref, paymentId]
  );

  return {
    payment_id:   paymentId,
    provider_ref,
    redirect_url,
    amount,
    method,
  };
};

/**
 * handleWebhook
 * Receives the SMARTPAY callback after the customer completes (or fails) payment.
 * Validates the signature, updates payment status, and if successful:
 *   - For order_payment: marks the order as in_progress, credits repairman balance.
 *   - For top_up: credits the user's repairman balance (if they are a repairman).
 *
 * NOTE: In production verify the SMARTPAY HMAC signature before processing.
 */
const handleWebhook = async (payload) => {
  const { provider_ref, status: providerStatus, amount } = payload;

  // 1. Find the payment by provider reference
  const [[payment]] = await pool.execute(
    'SELECT * FROM payments WHERE provider_ref = ?',
    [provider_ref]
  );
  if (!payment) throw { status: 404, message: 'Ödəniş tapılmadı.' };
  if (payment.status !== 'pending') {
    // Idempotent — already processed (SMARTPAY may send duplicate webhooks)
    return { message: 'Already processed.' };
  }

  const newStatus  = providerStatus === 'success' ? 'success' : 'failed';
  const rawPayload = JSON.stringify(payload);

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 2. Update payment status and store raw payload for audit trail
    await conn.execute(
      'UPDATE payments SET status = ?, provider_payload = ? WHERE id = ?',
      [newStatus, rawPayload, payment.id]
    );

    if (newStatus === 'success') {
      if (payment.type === 'order_payment' && payment.order_id) {
        // 3a. Move order to in_progress
        await conn.execute(
          "UPDATE orders SET status = 'in_progress' WHERE id = ?",
          [payment.order_id]
        );

        // 3b. Credit the repairman's balance
        await conn.execute(
          `UPDATE repairmen SET balance = balance + ?
           WHERE id = (SELECT repairman_id FROM orders WHERE id = ?)`,
          [payment.amount, payment.order_id]
        );
      }

      if (payment.type === 'top_up') {
        // 4. Credit balance for repairman top-up
        await conn.execute(
          'UPDATE repairmen SET balance = balance + ? WHERE user_id = ?',
          [payment.amount, payment.user_id]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }

  return { message: `Ödəniş ${newStatus === 'success' ? 'uğurla tamamlandı' : 'uğursuz oldu'}.` };
};

/**
 * topUpBalance
 * Shortcut for repairmen/users to top up their wallet balance via card.
 * Internally calls initPayment with type=top_up.
 */
const topUpBalance = async (userId, { amount }) => {
  if (!amount || amount <= 0) throw { status: 400, message: 'Məbləğ müsbət olmalıdır.' };
  return initPayment(userId, { order_id: null, method: 'card', amount });
};

module.exports = { initPayment, handleWebhook, topUpBalance };
