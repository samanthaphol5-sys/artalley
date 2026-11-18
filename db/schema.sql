-- =====================================================================
-- Art Alley : ฐานข้อมูล MySQL 8.0.16+
-- วิธีใช้: เปิดใน MySQL Workbench แล้วกด ⚡ (Execute) ทั้งไฟล์ จากนั้นรัน seed.sql
-- คำเตือน: ลบฐานข้อมูล artalley เดิมทั้งหมดแล้วสร้างใหม่
-- =====================================================================
DROP DATABASE IF EXISTS artalley;
CREATE DATABASE artalley CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE artalley;

-- ---------------------------------------------------------------------
-- 1) บัญชี (อีเมล + รหัสผ่าน) และโปรไฟล์
--    1 บัญชีมีได้ 2 โปรไฟล์: ลูกค้า และ ศิลปิน (ใช้อีเมล/รหัสผ่านเดียวกัน สลับกันได้)
--    ตาราง users = "โปรไฟล์" ทุกตารางอื่นอ้างอิง users.id
-- ---------------------------------------------------------------------
CREATE TABLE accounts (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE users (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  account_id     INT NOT NULL,
  display_name   VARCHAR(100) NOT NULL,
  avatar_path    VARCHAR(255) NULL,
  role           ENUM('customer','artist','admin') NOT NULL DEFAULT 'customer',
  suspended_at   DATETIME NULL,              -- ไม่ NULL = ถูกระงับ
  suspend_reason VARCHAR(500) NULL,
  is_demo        BOOLEAN NOT NULL DEFAULT FALSE,
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (account_id, role),                 -- โปรไฟล์ละ 1 ประเภทต่อบัญชี
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

-- ลืมรหัสผ่าน: เก็บเฉพาะค่า hash ของ token (ลิงก์ใช้ได้ครั้งเดียว อายุ 30 นาที)
CREATE TABLE password_resets (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  account_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL UNIQUE,
  expires_at DATETIME NOT NULL,
  used_at    DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
);

CREATE TABLE artist_profiles (
  user_id         INT PRIMARY KEY,
  bio             TEXT NOT NULL,
  city            VARCHAR(100) NULL,
  cover_path      VARCHAR(255) NULL,          -- รูปปกหน้าโปรไฟล์
  commission_open BOOLEAN NOT NULL DEFAULT FALSE,
  commission_min  DECIMAL(10,2) NOT NULL DEFAULT 0,
  offers_physical BOOLEAN NOT NULL DEFAULT FALSE,
  offers_digital  BOOLEAN NOT NULL DEFAULT TRUE,
  -- การจัดส่ง (ศิลปินกำหนดเอง)
  prep_days       TINYINT NOT NULL DEFAULT 3,
  transit_min     TINYINT NOT NULL DEFAULT 2,
  transit_max     TINYINT NOT NULL DEFAULT 4,
  ship_fee        DECIMAL(10,2) NOT NULL DEFAULT 60,
  return_days     TINYINT NOT NULL DEFAULT 7,   -- 0 = ไม่รับคืน
  -- ช่องทางโซเชียล
  social_instagram VARCHAR(120) NULL,
  social_x         VARCHAR(120) NULL,
  social_facebook  VARCHAR(120) NULL,
  social_tiktok    VARCHAR(120) NULL,
  social_website   VARCHAR(200) NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CHECK (transit_min <= transit_max)
);

-- ---------------------------------------------------------------------
-- 2) แท็ก
-- ---------------------------------------------------------------------
CREATE TABLE tags (
  id       INT AUTO_INCREMENT PRIMARY KEY,
  category ENUM('style','subject') NOT NULL,
  name     VARCHAR(60) NOT NULL,
  name_th  VARCHAR(60) NOT NULL,
  slug     VARCHAR(60) NOT NULL UNIQUE
);

CREATE TABLE artist_profile_tags (
  artist_id INT NOT NULL,
  tag_id    INT NOT NULL,
  PRIMARY KEY (artist_id, tag_id),
  FOREIGN KEY (artist_id) REFERENCES artist_profiles(user_id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 3) ผลงาน
-- ---------------------------------------------------------------------
CREATE TABLE artworks (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  artist_id         INT NOT NULL,
  title             VARCHAR(200) NOT NULL,
  description       TEXT NOT NULL,
  format            ENUM('physical','digital') NOT NULL DEFAULT 'digital',  -- งานวาดมือ / งานดิจิทัล
  purpose           ENUM('for_sale','portfolio') NOT NULL DEFAULT 'for_sale',
  price             DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (price >= 0),
  sale_percent      TINYINT NOT NULL DEFAULT 0 CHECK (sale_percent BETWEEN 0 AND 90),
  availability      ENUM('available','reserved','sold') NOT NULL DEFAULT 'available',
  status            ENUM('draft','published','unpublished') NOT NULL DEFAULT 'published',
  moderation_hidden BOOLEAN NOT NULL DEFAULT FALSE,
  is_bestseller     BOOLEAN NOT NULL DEFAULT FALSE,
  carts_seed        INT NOT NULL DEFAULT 0,       -- ตัวเลขตั้งต้นสำหรับ "อยู่ในตะกร้า N คน" (ข้อมูลตัวอย่าง)
  is_demo           BOOLEAN NOT NULL DEFAULT FALSE,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_artworks_public (status, moderation_hidden, created_at)
);

-- รูปผลงาน (1 ผลงานมี 1–8 รูป, position 0 = ภาพปก)
CREATE TABLE artwork_images (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  artwork_id  INT NOT NULL,
  file_path   VARCHAR(255) NOT NULL,
  position    TINYINT NOT NULL,
  caption_key VARCHAR(30) NULL,               -- คำบรรยายสำเร็จรูป เช่น g_room (ใช้กับรูปตัวอย่าง) / NULL = "รูปที่ n"
  UNIQUE (artwork_id, position),
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

CREATE TABLE artwork_tags (
  artwork_id INT NOT NULL,
  tag_id     INT NOT NULL,
  PRIMARY KEY (artwork_id, tag_id),
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE favorites (
  user_id    INT NOT NULL,
  artwork_id INT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, artwork_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

CREATE TABLE artist_follows (
  follower_id INT NOT NULL,
  artist_id   INT NOT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (follower_id, artist_id),
  FOREIGN KEY (follower_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE artwork_comments (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  artwork_id INT NOT NULL,
  author_id  INT NOT NULL,
  body       VARCHAR(1000) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE artwork_reports (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  artwork_id  INT NOT NULL,
  reporter_id INT NOT NULL,
  reason      ENUM('inappropriate','copyright','spam','other') NOT NULL,
  details     VARCHAR(1000) NOT NULL DEFAULT '',
  status      ENUM('open','resolved','dismissed') NOT NULL DEFAULT 'open',
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reviewed_at DATETIME NULL,
  UNIQUE (artwork_id, reporter_id),
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
  FOREIGN KEY (reporter_id) REFERENCES users(id) ON DELETE CASCADE
);

-- รีวิวผลงาน (เฉพาะคนที่ซื้อแล้ว)
CREATE TABLE artwork_reviews (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  artwork_id INT NOT NULL,
  user_id    INT NOT NULL,
  rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT NOT NULL,
  categories VARCHAR(120) NOT NULL DEFAULT '',  -- เช่น "appearance,quality"
  photo_path VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (artwork_id, user_id),
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 4) ตะกร้าและคำสั่งซื้อ
-- ---------------------------------------------------------------------
CREATE TABLE cart_items (
  user_id    INT NOT NULL,
  artwork_id INT NOT NULL,
  option_key VARCHAR(30) NOT NULL,          -- none/oak/black หรือ personal/commercial
  note       VARCHAR(300) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, artwork_id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- 1 คำสั่งซื้อ = สินค้าของศิลปิน 1 คน (ตอนชำระเงินระบบแยกตามศิลปิน)
CREATE TABLE orders (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  buyer_id     INT NOT NULL,
  artist_id    INT NOT NULL,
  shipping_fee DECIMAL(10,2) NOT NULL DEFAULT 0,
  ship_name    VARCHAR(120) NULL,
  ship_phone   VARCHAR(40) NULL,
  ship_address VARCHAR(500) NULL,
  pay_method   ENUM('promptpay','card') NOT NULL,
  status       ENUM('paid','shipped','completed') NOT NULL DEFAULT 'paid',
  tracking_no  VARCHAR(80) NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (buyer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE order_items (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT NOT NULL,
  artwork_id INT NOT NULL,
  price      DECIMAL(10,2) NOT NULL,         -- ราคาตอนซื้อ (รวมตัวเลือกแล้ว)
  format     ENUM('physical','digital') NOT NULL,
  option_key VARCHAR(30) NOT NULL,
  note       VARCHAR(300) NOT NULL DEFAULT '',
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 5) งานจ้างวาด
-- ---------------------------------------------------------------------
CREATE TABLE commission_requests (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  customer_id          INT NOT NULL,
  artist_id            INT NOT NULL,
  description          TEXT NOT NULL,
  budget               DECIMAL(10,2) NOT NULL CHECK (budget > 0),
  deadline             DATE NULL,
  art_type             ENUM('physical','digital') NULL,
  delivery_method      ENUM('digital_file','physical_shipping','pickup') NULL,
  reference_image_path VARCHAR(255) NULL,
  status               ENUM('pending','accepted','declined','cancelled','delivered','completed') NOT NULL DEFAULT 'pending',
  quote_price          DECIMAL(10,2) NULL,
  quote_deadline       DATE NULL,
  quote_status         ENUM('none','proposed','agreed') NOT NULL DEFAULT 'none',
  created_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (customer_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (artist_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE commission_request_tags (
  request_id INT NOT NULL,
  tag_id     INT NOT NULL,
  PRIMARY KEY (request_id, tag_id),
  FOREIGN KEY (request_id) REFERENCES commission_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
);

CREATE TABLE request_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  request_id INT NOT NULL,
  sender_id  INT NOT NULL,
  body       TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES commission_requests(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE commission_sketches (
  request_id        INT PRIMARY KEY,
  file_path         VARCHAR(255) NOT NULL,
  artist_note       TEXT NOT NULL,
  customer_feedback TEXT NOT NULL,
  status            ENUM('submitted','revision_requested','approved') NOT NULL DEFAULT 'submitted',
  round_no          TINYINT NOT NULL DEFAULT 1,
  created_at        DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES commission_requests(id) ON DELETE CASCADE
);

CREATE TABLE commission_reviews (
  request_id INT PRIMARY KEY,
  rating     TINYINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  body       TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (request_id) REFERENCES commission_requests(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 6) ข้อความส่วนตัว (ติดต่อศิลปิน)
-- ---------------------------------------------------------------------
CREATE TABLE message_threads (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  user_a     INT NOT NULL,                  -- คนเริ่มคุย
  user_b     INT NOT NULL,
  artwork_id INT NULL,                      -- คุยเรื่องผลงานไหน (ถ้ามี)
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_a) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (user_b) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (artwork_id) REFERENCES artworks(id) ON DELETE SET NULL
);

CREATE TABLE thread_messages (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  thread_id  INT NOT NULL,
  sender_id  INT NOT NULL,
  body       TEXT NOT NULL,
  created_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE thread_reads (
  thread_id INT NOT NULL,
  user_id   INT NOT NULL,
  read_at   DATETIME(3) NOT NULL,
  PRIMARY KEY (thread_id, user_id),
  FOREIGN KEY (thread_id) REFERENCES message_threads(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------
-- 7) การแจ้งเตือน และบันทึกการกระทำของแอดมิน
-- ---------------------------------------------------------------------
-- msg_key + vars ใช้แปลข้อความตามภาษาที่ผู้ใช้เลือก (ไทย/อังกฤษ) ฝั่งหน้าเว็บ
CREATE TABLE notifications (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  recipient_id INT NOT NULL,
  actor_id     INT NULL,
  icon         VARCHAR(8) NOT NULL DEFAULT '🔔',
  msg_key      VARCHAR(40) NOT NULL,
  vars         TEXT NOT NULL,               -- JSON
  body         VARCHAR(500) NOT NULL DEFAULT '',
  link         VARCHAR(255) NULL,
  read_at      DATETIME NULL,
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (recipient_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_notif (recipient_id, created_at)
);

CREATE TABLE admin_audit (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  admin_id       INT NOT NULL,
  action         ENUM('act_as','suspend','unsuspend','role','hide','unhide','report') NOT NULL,
  target_user_id INT NULL,
  detail         VARCHAR(500) NOT NULL DEFAULT '',
  created_at     DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (admin_id) REFERENCES users(id) ON DELETE CASCADE
);
