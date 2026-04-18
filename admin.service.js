// src/modules/admin/admin.service.js
// Admin-only business logic.
// All functions require the caller to have role='admin' (enforced in the router).

const pool = require('../../config/db');

/**
 * listAllUsers
 * Returns a paginated list of all users and repairmen.
 * Supports filtering by role and a keyword search on name/email/phone.
 */
const listAllUsers = async ({ role_filter, search, page = 1, per_page = 20 }) => {
  const params  = [];
  const filters = [];

  if (role_filter) {
    filters.push('u.role = ?');
    params.push(role_filter);
  }
  if (search) {
    filters.push('(u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)');
    const like = `%${search}%`;
    params.push(like, like, like);
  }

  const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

  const [[{ total }]] = await pool.execute(
    `SELECT COUNT(*) AS total FROM users u ${where}`, params
  );

  const offset = (page - 1) * per_page;
  const [rows] = await pool.execute(
    `SELECT u.id, u.full_name, u.phone, u.email, u.role,
            u.is_verified, u.created_at,
            r.id         AS repairman_id,
            r.fin_code,
            r.is_approved,
            r.rating_avg,
            r.review_count,
            r.balance
     FROM users u
     LEFT JOIN repairmen r ON r.user_id = u.id
     ${where}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, per_page, offset]
  );

  return {
    results:  rows,
    total,
    page,
    per_page,
    pages: Math.ceil(total / per_page) || 0,
  };
};

/**
 * approveRepairman
 * Sets is_approved = 1 on the repairman row so they can appear in search
 * and accept orders. Only admin can call this.
 */
const approveRepairman = async (repairmanId) => {
  const [[rep]] = await pool.execute(
    'SELECT id, is_approved FROM repairmen WHERE id = ?', [repairmanId]
  );
  if (!rep) throw { status: 404, message: 'Usta tapılmadı.' };
  if (rep.is_approved) throw { status: 409, message: 'Usta artıq təsdiqlənib.' };

  await pool.execute(
    'UPDATE repairmen SET is_approved = 1 WHERE id = ?', [repairmanId]
  );

  // Return joined user+repairman data for the response
  const [[updated]] = await pool.execute(
    `SELECT u.id AS user_id, u.full_name, u.email, u.phone,
            r.id AS repairman_id, r.fin_code, r.address, r.is_approved
     FROM repairmen r
     JOIN users u ON u.id = r.user_id
     WHERE r.id = ?`,
    [repairmanId]
  );
  return updated;
};

/**
 * getPlatformStatistics
 * Returns key metrics for the admin dashboard.
 * Uses a single multi-query approach to minimise round trips.
 */
const getPlatformStatistics = async () => {
  // Run all count/sum queries in parallel for speed
  const [
    [[userStats]],
    [[orderStats]],
    [[paymentStats]],
    [[reviewStats]],
    [recentOrders],
    [topRepairmen],
  ] = await Promise.all([
    // User counts by role and verification status
    pool.execute(`
      SELECT
        COUNT(*)                                      AS total_users,
        SUM(role = 'user')                            AS customers,
        SUM(role = 'repairman')                       AS repairmen,
        SUM(role = 'admin')                           AS admins,
        SUM(is_verified = 1)                          AS verified_users,
        SUM(role = 'repairman' AND EXISTS (
          SELECT 1 FROM repairmen r WHERE r.user_id = users.id AND r.is_approved = 0
        ))                                            AS pending_approvals
      FROM users
    `),

    // Order counts by status
    pool.execute(`
      SELECT
        COUNT(*)                              AS total_orders,
        SUM(status = 'pending')               AS pending,
        SUM(status = 'accepted')              AS accepted,
        SUM(status = 'in_progress')           AS in_progress,
        SUM(status = 'completed')             AS completed,
        SUM(status = 'cancelled')             AS cancelled
      FROM orders
    `),

    // Revenue from successful payments
    pool.execute(`
      SELECT
        COUNT(*)                              AS total_payments,
        SUM(status = 'success')               AS successful,
        SUM(status = 'failed')                AS failed,
        COALESCE(SUM(CASE WHEN status = 'success' THEN amount END), 0) AS total_revenue
      FROM payments
    `),

    // Review stats
    pool.execute(`
      SELECT
        COUNT(*)           AS total_reviews,
        ROUND(AVG(rating), 2) AS avg_rating
      FROM reviews
    `),

    // Last 5 orders
    pool.execute(`
      SELECT o.id, o.title, o.status, o.created_at,
             u.full_name AS customer_name,
             ru.full_name AS repairman_name
      FROM orders o
      JOIN users u   ON u.id = o.user_id
      JOIN repairmen r ON r.id = o.repairman_id
      JOIN users ru  ON ru.id = r.user_id
      ORDER BY o.created_at DESC LIMIT 5
    `),

    // Top 5 repairmen by rating
    pool.execute(`
      SELECT u.full_name, r.rating_avg, r.review_count, r.hourly_rate
      FROM repairmen r
      JOIN users u ON u.id = r.user_id
      WHERE r.is_approved = 1
      ORDER BY r.rating_avg DESC, r.review_count DESC
      LIMIT 5
    `),
  ]);

  return {
    users:         userStats,
    orders:        orderStats,
    payments:      paymentStats,
    reviews:       reviewStats,
    recent_orders: recentOrders,
    top_repairmen: topRepairmen,
  };
};

module.exports = { listAllUsers, approveRepairman, getPlatformStatistics };
