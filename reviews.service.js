// src/modules/reviews/reviews.service.js
// Review business logic.
// Rules:
//   - Only customers (role='user') can submit reviews.
//   - The order must be 'completed'.
//   - Each order can only have ONE review (enforced by UNIQUE KEY on order_id).
//   - After inserting, repairmen.rating_avg and review_count are recalculated.

const pool = require('../../config/db');

/**
 * submitReview
 * Creates a review for a completed order and updates the repairman's rating.
 */
const submitReview = async (userId, { order_id, rating, comment }) => {
  // 1. Validate the order: must exist, belong to this user, and be completed
  const [[order]] = await pool.execute(
    'SELECT id, user_id, repairman_id, status FROM orders WHERE id = ?',
    [order_id]
  );
  if (!order)                      throw { status: 404, message: 'Sifariş tapılmadı.' };
  if (order.user_id !== userId)    throw { status: 403, message: 'Bu sifariş sizə aid deyil.' };
  if (order.status !== 'completed') {
    throw { status: 400, message: 'Yalnız tamamlanmış sifarişlər üçün rəy bildirə bilərsiniz.' };
  }

  // 2. Check for duplicate review (also enforced at DB level via UNIQUE KEY)
  const [[existing]] = await pool.execute(
    'SELECT id FROM reviews WHERE order_id = ?', [order_id]
  );
  if (existing) throw { status: 409, message: 'Bu sifariş üçün artıq rəy bildirmisiz.' };

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // 3. Insert the review
    const [result] = await conn.execute(
      `INSERT INTO reviews (order_id, user_id, repairman_id, rating, comment)
       VALUES (?, ?, ?, ?, ?)`,
      [order_id, userId, order.repairman_id, rating, comment || null]
    );
    const reviewId = result.insertId;

    // 4. Recalculate repairman's average rating and review count
    await conn.execute(
      `UPDATE repairmen SET
         review_count = (SELECT COUNT(*) FROM reviews WHERE repairman_id = ?),
         rating_avg   = (SELECT ROUND(AVG(rating), 2) FROM reviews WHERE repairman_id = ?)
       WHERE id = ?`,
      [order.repairman_id, order.repairman_id, order.repairman_id]
    );

    await conn.commit();

    // 5. Return the newly created review
    const [[review]] = await pool.execute(
      `SELECT r.id, r.order_id, r.rating, r.comment, r.created_at,
              u.full_name AS reviewer_name
       FROM reviews r
       JOIN users u ON u.id = r.user_id
       WHERE r.id = ?`,
      [reviewId]
    );
    return review;
  } catch (err) {
    await conn.rollback();
    // Surface the duplicate-key constraint as a friendly message
    if (err.code === 'ER_DUP_ENTRY') {
      throw { status: 409, message: 'Bu sifariş üçün artıq rəy bildirmisiz.' };
    }
    throw err;
  } finally {
    conn.release();
  }
};

/**
 * getRepairmanReviews
 * Returns paginated reviews for a specific repairman, newest first.
 */
const getRepairmanReviews = async (repairmanId, { page = 1, per_page = 10 }) => {
  // Verify the repairman exists
  const [[rep]] = await pool.execute(
    'SELECT id FROM repairmen WHERE id = ?', [repairmanId]
  );
  if (!rep) throw { status: 404, message: 'Usta tapılmadı.' };

  // Total count
  const [[{ total }]] = await pool.execute(
    'SELECT COUNT(*) AS total FROM reviews WHERE repairman_id = ?',
    [repairmanId]
  );

  const offset = (page - 1) * per_page;
  const [rows] = await pool.execute(
    `SELECT r.id, r.order_id, r.rating, r.comment, r.created_at,
            u.full_name  AS reviewer_name,
            u.avatar_url AS reviewer_avatar
     FROM reviews r
     JOIN users u ON u.id = r.user_id
     WHERE r.repairman_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [repairmanId, per_page, offset]
  );

  // Also return the repairman's current aggregate stats
  const [[stats]] = await pool.execute(
    'SELECT rating_avg, review_count FROM repairmen WHERE id = ?',
    [repairmanId]
  );

  return {
    rating_avg:   stats.rating_avg,
    review_count: stats.review_count,
    results:      rows,
    total,
    page,
    per_page,
    pages: Math.ceil(total / per_page) || 0,
  };
};

module.exports = { submitReview, getRepairmanReviews };
