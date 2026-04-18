-- ============================================================
-- FixAz Database Schema — MySQL
-- mysql -u root -p -e "CREATE DATABASE fixaz_db CHARACTER SET utf8mb4;"
-- mysql -u root -p fixaz_db < schema.sql
-- ============================================================

USE fixaz_db;

-- ─── Users ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id          INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  full_name   VARCHAR(100)  NOT NULL,
  phone       VARCHAR(20)   NOT NULL,
  email       VARCHAR(150)  NOT NULL,
  password    VARCHAR(255)  NOT NULL,
  avatar_url  VARCHAR(500)  DEFAULT NULL,
  role        ENUM('user','repairman','admin') NOT NULL DEFAULT 'user',
  is_verified TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at  DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY  uq_phone  (phone),
  UNIQUE KEY  uq_email  (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Repairman Profiles ───────────────────────────────────
CREATE TABLE IF NOT EXISTS repairmen (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED  NOT NULL,
  fin_code     VARCHAR(20)   NOT NULL,
  address      TEXT          NOT NULL,
  bio          TEXT          DEFAULT NULL,
  skills       JSON          DEFAULT NULL,
  hourly_rate  DECIMAL(10,2) DEFAULT NULL,
  is_approved  TINYINT(1)   NOT NULL DEFAULT 0,
  rating_avg   DECIMAL(3,2) NOT NULL DEFAULT 0.00,
  review_count INT UNSIGNED  NOT NULL DEFAULT 0,
  balance      DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY  (id),
  UNIQUE KEY   uq_repairman_user (user_id),
  UNIQUE KEY   uq_repairman_fin  (fin_code),
  CONSTRAINT   fk_repairmen_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── OTP Codes ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS otp_codes (
  id         INT UNSIGNED NOT NULL AUTO_INCREMENT,
  user_id    INT UNSIGNED NOT NULL,
  code       VARCHAR(6)   NOT NULL,
  purpose    ENUM('verify_account','reset_password') NOT NULL,
  expires_at DATETIME     NOT NULL,
  used       TINYINT(1)  NOT NULL DEFAULT 0,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY         idx_otp_lookup (user_id, purpose, used),
  CONSTRAINT  fk_otp_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Service Categories ───────────────────────────────────
CREATE TABLE IF NOT EXISTS categories (
  id          INT UNSIGNED NOT NULL AUTO_INCREMENT,
  name        VARCHAR(100) NOT NULL,
  icon_url    VARCHAR(500) DEFAULT NULL,
  description TEXT         DEFAULT NULL,
  is_active   TINYINT(1)  NOT NULL DEFAULT 1,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY  uq_category_name (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed categories
INSERT IGNORE INTO categories (name, description) VALUES
  ('Santexnika',      'Boru təmiri, quraşdırma və su sistemləri'),
  ('Elektrik',        'Naqil, pano, rozetka və işıqlandırma'),
  ('Rəngkarlıq',      'Daxili və xarici rəngkarlıq xidmətləri'),
  ('Dülgərlik',       'Mebel yığımı, ağac işləri və təmirlər'),
  ('Təmizlik',        'Dərin təmizlik, daimi baxım, tikinti sonrası'),
  ('Kondisioner',     'İstilik, ventilyasiya və soyutma sistemləri'),
  ('Məişət texnikası','Paltaryuyan, soyuducu, sobalar və digərləri'),
  ('Kafel işləri',    'Döşəmə və divar kafel quraşdırma/təmiri'),
  ('Bağçılıq',        'Bağ dizaynı, çəmən baxımı və açıq ərazilər'),
  ('Təhlükəsizlik',   'CCTV, həyəcan siqnalı və ağıllı kilit quraşdırma');

-- ─── Repairman ↔ Category ─────────────────────────────────
CREATE TABLE IF NOT EXISTS repairman_categories (
  repairman_id INT UNSIGNED NOT NULL,
  category_id  INT UNSIGNED NOT NULL,
  PRIMARY KEY  (repairman_id, category_id),
  CONSTRAINT   fk_rc_repairman FOREIGN KEY (repairman_id) REFERENCES repairmen(id) ON DELETE CASCADE,
  CONSTRAINT   fk_rc_category  FOREIGN KEY (category_id)  REFERENCES categories(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Orders ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS orders (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id      INT UNSIGNED  NOT NULL,
  repairman_id INT UNSIGNED  NOT NULL,
  category_id  INT UNSIGNED  DEFAULT NULL,
  title        VARCHAR(200)  NOT NULL,
  description  TEXT          DEFAULT NULL,
  address      TEXT          NOT NULL,
  scheduled_at DATETIME      DEFAULT NULL,
  status       ENUM('pending','accepted','in_progress','completed','cancelled')
               NOT NULL DEFAULT 'pending',
  price        DECIMAL(10,2) DEFAULT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY  (id),
  KEY          idx_orders_user      (user_id),
  KEY          idx_orders_repairman (repairman_id),
  KEY          idx_orders_status    (status),
  CONSTRAINT   fk_orders_user      FOREIGN KEY (user_id)      REFERENCES users(id),
  CONSTRAINT   fk_orders_repairman FOREIGN KEY (repairman_id) REFERENCES repairmen(id),
  CONSTRAINT   fk_orders_category  FOREIGN KEY (category_id)  REFERENCES categories(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Payments ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS payments (
  id              INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  user_id         INT UNSIGNED  NOT NULL,
  order_id        INT UNSIGNED  DEFAULT NULL,      -- NULL for balance top-ups
  type            ENUM('order_payment','top_up')   NOT NULL,
  method          ENUM('card','balance')           NOT NULL,
  amount          DECIMAL(10,2) NOT NULL,
  status          ENUM('pending','success','failed') NOT NULL DEFAULT 'pending',
  provider_ref    VARCHAR(255)  DEFAULT NULL,      -- SMARTPAY transaction ID
  provider_payload JSON         DEFAULT NULL,      -- raw webhook body stored for audit
  created_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY     (id),
  KEY             idx_payments_user  (user_id),
  KEY             idx_payments_order (order_id),
  CONSTRAINT      fk_payments_user  FOREIGN KEY (user_id)  REFERENCES users(id),
  CONSTRAINT      fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ─── Reviews ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reviews (
  id           INT UNSIGNED  NOT NULL AUTO_INCREMENT,
  order_id     INT UNSIGNED  NOT NULL UNIQUE,       -- one review per order
  user_id      INT UNSIGNED  NOT NULL,              -- reviewer (customer)
  repairman_id INT UNSIGNED  NOT NULL,              -- reviewed party
  rating       TINYINT       NOT NULL,              -- 1–5
  comment      TEXT          DEFAULT NULL,
  created_at   DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY  (id),
  KEY          idx_reviews_repairman (repairman_id),
  CONSTRAINT   fk_reviews_order     FOREIGN KEY (order_id)     REFERENCES orders(id),
  CONSTRAINT   fk_reviews_user      FOREIGN KEY (user_id)      REFERENCES users(id),
  CONSTRAINT   fk_reviews_repairman FOREIGN KEY (repairman_id) REFERENCES repairmen(id),
  CONSTRAINT   chk_rating CHECK (rating BETWEEN 1 AND 5)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
