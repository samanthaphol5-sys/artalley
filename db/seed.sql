-- =====================================================================
-- Art Alley : ข้อมูลตัวอย่าง (รันหลัง schema.sql)
-- ทุกบัญชีใช้รหัสผ่าน password123
--   ลูกค้า customer@artalley.local · แอดมิน admin@artalley.local
--   ศิลปิน ploy@ mali@ kai@ nina@ arthit@ (ต้น ton@ ถูกระงับไว้เป็นตัวอย่าง)
-- =====================================================================
USE artalley;

INSERT INTO tags (id, category, name, name_th, slug) VALUES
 (1, 'style', 'Anime', 'อนิเมะ', 'anime'),
 (2, 'style', 'Realistic', 'เหมือนจริง', 'realistic'),
 (3, 'style', 'Cartoon', 'การ์ตูน', 'cartoon'),
 (4, 'style', 'Minimalist', 'มินิมอล', 'minimalist'),
 (5, 'style', 'Watercolor', 'สีน้ำ', 'watercolor'),
 (6, 'style', 'Pixel Art', 'พิกเซลอาร์ต', 'pixel-art'),
 (7, 'subject', 'Portrait', 'ภาพเหมือนบุคคล', 'portrait'),
 (8, 'subject', 'Character Design', 'ออกแบบตัวละคร', 'character-design'),
 (9, 'subject', 'Illustration', 'ภาพประกอบ', 'illustration'),
 (10, 'subject', 'Landscape', 'ภาพทิวทัศน์', 'landscape'),
 (11, 'subject', 'Fan Art', 'แฟนอาร์ต', 'fan-art'),
 (12, 'subject', 'Original Character', 'ตัวละครออริจินัล', 'original-character'),
 (13, 'style', 'Other', 'อื่น ๆ', 'other-style'),
 (14, 'subject', 'Other', 'อื่น ๆ', 'other-subject');

INSERT INTO accounts (id, email, password_hash) VALUES
 (1, 'admin@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (2, 'customer@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (3, 'mali@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (4, 'kai@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (5, 'nina@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (6, 'ton@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (7, 'ploy@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (8, 'arthit@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (20, 'buyer1@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (21, 'buyer2@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (22, 'buyer3@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (23, 'buyer4@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (24, 'buyer5@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (25, 'buyer6@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (26, 'buyer7@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (27, 'buyer8@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (28, 'buyer9@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457'),
 (29, 'buyer10@artalley.local', 'd834c9d382dadff22799071bcd990ba4:ed9b24705ade8302e4cc4fc123fd466706a2324889110d1ee2c5a0e46aa17556e5bb2e1340773ee8e2713fc77c58be36b5866f16d90ae08d8a42b0afa6b17457');

INSERT INTO users (id, account_id, display_name, role, is_demo, suspended_at, suspend_reason) VALUES
 (1, 1, 'Art Alley Admin', 'admin', TRUE, NULL, NULL),
 (2, 2, 'ลูกค้าทดลอง', 'customer', TRUE, NULL, NULL),
 (3, 3, 'มะลิ สีน้ำ', 'artist', TRUE, NULL, NULL),
 (4, 4, 'Kai Pixel', 'artist', TRUE, NULL, NULL),
 (5, 5, 'Nina Portrait', 'artist', TRUE, NULL, NULL),
 (6, 6, 'ต้น การ์ตูน', 'artist', TRUE, NOW() - INTERVAL 4320 MINUTE, 'ลงผลงานที่ละเมิดลิขสิทธิ์ซ้ำหลายครั้ง'),
 (7, 7, 'พลอย อนิเมะ', 'artist', TRUE, NULL, NULL),
 (8, 8, 'อาทิตย์ แลนด์สเคป', 'artist', TRUE, NULL, NULL),
 (20, 20, 'Garry', 'customer', TRUE, NULL, NULL),
 (21, 21, 'Jenn', 'customer', TRUE, NULL, NULL),
 (22, 22, 'Belinda', 'customer', TRUE, NULL, NULL),
 (23, 23, 'ณัฐ', 'customer', TRUE, NULL, NULL),
 (24, 24, 'Mew', 'customer', TRUE, NULL, NULL),
 (25, 25, 'ปิ่น', 'customer', TRUE, NULL, NULL),
 (26, 26, 'Tom', 'customer', TRUE, NULL, NULL),
 (27, 27, 'แพร', 'customer', TRUE, NULL, NULL),
 (28, 28, 'Aom', 'customer', TRUE, NULL, NULL),
 (29, 29, 'Ken', 'customer', TRUE, NULL, NULL);

INSERT INTO artist_profiles (user_id, bio, city, commission_open, commission_min, offers_physical, offers_digital, prep_days, transit_min, transit_max, ship_fee, return_days, social_instagram, social_x, social_facebook, social_tiktok, social_website) VALUES
 (3, 'วาดภาพสีน้ำโทนอบอุ่น ชอบดอกไม้และทิวทัศน์เมืองเล็ก ๆ', 'เชียงใหม่', TRUE, 1500, TRUE, FALSE, 2, 2, 3, 50, 7, 'mali.watercolor', NULL, 'MaliWatercolor', NULL, NULL),
 (4, 'นักวาดพิกเซลอาร์ต รับทำตัวละครเกมและไอคอน', 'กรุงเทพฯ', TRUE, 800, FALSE, TRUE, 3, 2, 4, 60, 7, NULL, 'kaipixel', NULL, NULL, 'kaipixel.itch.io'),
 (5, 'ภาพเหมือนบุคคลแบบเหมือนจริง ทั้งดิจิทัลและสีน้ำมัน', 'ขอนแก่น', TRUE, 3000, TRUE, TRUE, 5, 2, 4, 80, 14, 'nina.portrait', NULL, NULL, NULL, NULL),
 (6, 'การ์ตูนสนุก ๆ สีสด เหมาะกับของขวัญและสติกเกอร์', 'ภูเก็ต', FALSE, 600, FALSE, TRUE, 3, 2, 4, 60, 7, NULL, NULL, NULL, 'toncartoon', NULL),
 (7, 'วาดสไตล์อนิเมะ รับออกแบบตัวละครออริจินัลและแฟนอาร์ต', 'กรุงเทพฯ', TRUE, 1200, FALSE, TRUE, 3, 2, 4, 60, 7, 'ploy.anime', 'ploy_draws', NULL, 'ploydraws', NULL),
 (8, 'ภาพทิวทัศน์มินิมอล เน้นแสงและพื้นที่ว่าง', 'นครราชสีมา', TRUE, 2000, TRUE, TRUE, 7, 3, 5, 0, 0, NULL, NULL, NULL, NULL, 'arthit.art');

INSERT INTO artist_profile_tags (artist_id, tag_id) VALUES
 (3, 5),
 (3, 10),
 (3, 9),
 (4, 6),
 (4, 8),
 (4, 12),
 (5, 2),
 (5, 7),
 (6, 3),
 (6, 9),
 (6, 7),
 (7, 1),
 (7, 8),
 (7, 11),
 (7, 12),
 (8, 4),
 (8, 10),
 (8, 9);

INSERT INTO artworks (id, artist_id, title, description, price, purpose, format, sale_percent, availability, is_bestseller, carts_seed, is_demo, created_at) VALUES
 (1, 3, 'ทุ่งดอกไม้ยามเช้า', 'สีน้ำบนกระดาษ 300 แกรม ขนาด A4', 2500, 'for_sale', 'physical', 0, 'available', FALSE, 4, TRUE, NOW() - INTERVAL 20160 MINUTE),
 (2, 3, 'ตลาดเช้าเชียงใหม่', 'ภาพประกอบสีน้ำ บรรยากาศตลาดเช้า ขนาด A3', 3200, 'for_sale', 'physical', 0, 'sold', FALSE, 0, TRUE, NOW() - INTERVAL 18720 MINUTE),
 (3, 4, 'นักรบพิกเซล', 'ตัวละครเกมขนาด 64x64 พร้อมแอนิเมชันเดิน (ไฟล์ PNG + GIF)', 900, 'for_sale', 'digital', 20, 'available', TRUE, 22, TRUE, NOW() - INTERVAL 17280 MINUTE),
 (4, 4, 'หมู่บ้านพิกเซล', 'ฉากเกมแนว RPG ขนาด 320x180', 0, 'portfolio', 'digital', 0, 'available', FALSE, 0, TRUE, NOW() - INTERVAL 15840 MINUTE),
 (5, 5, 'ภาพเหมือนคุณยาย', 'ภาพเหมือนบุคคลสีน้ำมันบนผ้าใบ', 0, 'portfolio', 'physical', 0, 'available', FALSE, 0, TRUE, NOW() - INTERVAL 14400 MINUTE),
 (6, 5, 'Portrait ดิจิทัล', 'ภาพเหมือนดิจิทัล ความละเอียดสูง พร้อมไฟล์ PSD', 3500, 'for_sale', 'digital', 0, 'available', FALSE, 0, TRUE, NOW() - INTERVAL 12960 MINUTE),
 (7, 6, 'แมวส้มจอมซน', 'การ์ตูนแมวสีสด ไฟล์ PNG พื้นหลังใส เหมาะทำสติกเกอร์', 700, 'for_sale', 'digital', 0, 'available', FALSE, 0, TRUE, NOW() - INTERVAL 11520 MINUTE),
 (8, 6, 'ครอบครัวการ์ตูน', 'วาดครอบครัวเป็นการ์ตูน ตัวอย่างงานรับวาด', 0, 'portfolio', 'digital', 0, 'available', FALSE, 0, TRUE, NOW() - INTERVAL 10080 MINUTE),
 (9, 7, 'สาวน้อยใต้แสงจันทร์', 'ตัวละครออริจินัลสไตล์อนิเมะ ไฟล์ 4K', 1800, 'for_sale', 'digital', 15, 'available', TRUE, 12, TRUE, NOW() - INTERVAL 8640 MINUTE),
 (10, 7, 'ออกแบบตัวละคร: นักเวทย์', 'Character sheet 3 มุมมอง', 2400, 'for_sale', 'digital', 0, 'available', FALSE, 0, TRUE, NOW() - INTERVAL 7200 MINUTE),
 (11, 8, 'ภูเขาในหมอก', 'ภาพทิวทัศน์มินิมอล ไฟล์สำหรับพิมพ์ขนาด A2', 2200, 'for_sale', 'digital', 25, 'available', TRUE, 7, TRUE, NOW() - INTERVAL 5760 MINUTE),
 (12, 8, 'ทะเลสาบยามเย็น', 'อะคริลิกบนแคนวาส 40x60 ซม.', 4500, 'for_sale', 'physical', 0, 'reserved', FALSE, 0, TRUE, NOW() - INTERVAL 4320 MINUTE);

INSERT INTO artwork_images (artwork_id, file_path, position, caption_key) VALUES
 (1, 'artworks/demo-1.svg', 0, 'g_main'),
 (1, 'artworks/demo-1-zoom.svg', 1, 'g_zoom'),
 (1, 'artworks/demo-1-room.svg', 2, 'g_room'),
 (1, 'artworks/demo-1-side.svg', 3, 'g_side'),
 (2, 'artworks/demo-2.svg', 0, 'g_main'),
 (2, 'artworks/demo-2-zoom.svg', 1, 'g_zoom'),
 (2, 'artworks/demo-2-room.svg', 2, 'g_room'),
 (2, 'artworks/demo-2-side.svg', 3, 'g_side'),
 (3, 'artworks/demo-3.svg', 0, 'g_main'),
 (3, 'artworks/demo-3-zoom.svg', 1, 'g_zoom'),
 (3, 'artworks/demo-3-room.svg', 2, 'g_room'),
 (3, 'artworks/demo-3-device.svg', 3, 'g_device'),
 (4, 'artworks/demo-4.svg', 0, 'g_main'),
 (4, 'artworks/demo-4-zoom.svg', 1, 'g_zoom'),
 (4, 'artworks/demo-4-room.svg', 2, 'g_room'),
 (4, 'artworks/demo-4-device.svg', 3, 'g_device'),
 (5, 'artworks/demo-5.svg', 0, 'g_main'),
 (5, 'artworks/demo-5-zoom.svg', 1, 'g_zoom'),
 (5, 'artworks/demo-5-room.svg', 2, 'g_room'),
 (5, 'artworks/demo-5-side.svg', 3, 'g_side'),
 (6, 'artworks/demo-6.svg', 0, 'g_main'),
 (6, 'artworks/demo-6-zoom.svg', 1, 'g_zoom'),
 (6, 'artworks/demo-6-room.svg', 2, 'g_room'),
 (6, 'artworks/demo-6-device.svg', 3, 'g_device'),
 (7, 'artworks/demo-7.svg', 0, 'g_main'),
 (7, 'artworks/demo-7-zoom.svg', 1, 'g_zoom'),
 (7, 'artworks/demo-7-room.svg', 2, 'g_room'),
 (7, 'artworks/demo-7-device.svg', 3, 'g_device'),
 (8, 'artworks/demo-8.svg', 0, 'g_main'),
 (8, 'artworks/demo-8-zoom.svg', 1, 'g_zoom'),
 (8, 'artworks/demo-8-room.svg', 2, 'g_room'),
 (8, 'artworks/demo-8-device.svg', 3, 'g_device'),
 (9, 'artworks/demo-9.svg', 0, 'g_main'),
 (9, 'artworks/demo-9-zoom.svg', 1, 'g_zoom'),
 (9, 'artworks/demo-9-room.svg', 2, 'g_room'),
 (9, 'artworks/demo-9-device.svg', 3, 'g_device'),
 (10, 'artworks/demo-10.svg', 0, 'g_main'),
 (10, 'artworks/demo-10-zoom.svg', 1, 'g_zoom'),
 (10, 'artworks/demo-10-room.svg', 2, 'g_room'),
 (10, 'artworks/demo-10-device.svg', 3, 'g_device'),
 (11, 'artworks/demo-11.svg', 0, 'g_main'),
 (11, 'artworks/demo-11-zoom.svg', 1, 'g_zoom'),
 (11, 'artworks/demo-11-room.svg', 2, 'g_room'),
 (11, 'artworks/demo-11-device.svg', 3, 'g_device'),
 (12, 'artworks/demo-12.svg', 0, 'g_main'),
 (12, 'artworks/demo-12-zoom.svg', 1, 'g_zoom'),
 (12, 'artworks/demo-12-room.svg', 2, 'g_room'),
 (12, 'artworks/demo-12-side.svg', 3, 'g_side');

INSERT INTO artwork_tags (artwork_id, tag_id) VALUES
 (1, 5),
 (1, 10),
 (2, 5),
 (2, 9),
 (3, 6),
 (3, 8),
 (4, 6),
 (4, 9),
 (4, 14),
 (5, 2),
 (5, 7),
 (6, 2),
 (6, 7),
 (7, 3),
 (7, 9),
 (8, 3),
 (8, 7),
 (9, 1),
 (9, 12),
 (10, 1),
 (10, 8),
 (11, 4),
 (11, 10),
 (12, 4),
 (12, 10);

INSERT INTO favorites (user_id, artwork_id) VALUES
 (2, 1),
 (2, 9),
 (20, 9),
 (21, 3),
 (22, 11);

INSERT INTO artist_follows (follower_id, artist_id) VALUES
 (2, 7),
 (2, 3),
 (20, 7);

INSERT INTO artwork_comments (artwork_id, author_id, body, created_at) VALUES
 (1, 2, 'สีสวยมากเลยค่ะ อยากได้ไปแขวนที่บ้าน', NOW() - INTERVAL 2880 MINUTE);

INSERT INTO artwork_reports (artwork_id, reporter_id, reason, details, created_at) VALUES
 (7, 2, 'copyright', 'คล้ายตัวละครจากแบรนด์ดังมาก', NOW() - INTERVAL 1440 MINUTE);

INSERT INTO orders (id, buyer_id, artist_id, shipping_fee, pay_method, status, created_at) VALUES
 (401, 21, 3, 60, 'promptpay', 'completed', NOW() - INTERVAL 14400 MINUTE),
 (402, 22, 3, 60, 'promptpay', 'completed', NOW() - INTERVAL 21600 MINUTE),
 (403, 23, 3, 60, 'promptpay', 'completed', NOW() - INTERVAL 28800 MINUTE),
 (404, 23, 4, 0, 'promptpay', 'completed', NOW() - INTERVAL 17280 MINUTE),
 (405, 24, 4, 0, 'promptpay', 'completed', NOW() - INTERVAL 24480 MINUTE),
 (406, 25, 4, 0, 'promptpay', 'completed', NOW() - INTERVAL 31680 MINUTE),
 (407, 26, 4, 0, 'promptpay', 'completed', NOW() - INTERVAL 38880 MINUTE),
 (408, 26, 5, 0, 'promptpay', 'completed', NOW() - INTERVAL 21600 MINUTE),
 (409, 27, 5, 0, 'promptpay', 'completed', NOW() - INTERVAL 28800 MINUTE),
 (410, 27, 6, 0, 'promptpay', 'completed', NOW() - INTERVAL 23040 MINUTE),
 (411, 28, 6, 0, 'promptpay', 'completed', NOW() - INTERVAL 30240 MINUTE),
 (412, 29, 7, 0, 'promptpay', 'completed', NOW() - INTERVAL 25920 MINUTE),
 (413, 20, 7, 0, 'promptpay', 'completed', NOW() - INTERVAL 33120 MINUTE),
 (414, 21, 7, 0, 'promptpay', 'completed', NOW() - INTERVAL 40320 MINUTE),
 (415, 22, 7, 0, 'promptpay', 'completed', NOW() - INTERVAL 47520 MINUTE),
 (416, 23, 7, 0, 'promptpay', 'completed', NOW() - INTERVAL 54720 MINUTE),
 (417, 20, 7, 0, 'promptpay', 'completed', NOW() - INTERVAL 27360 MINUTE),
 (418, 21, 7, 0, 'promptpay', 'completed', NOW() - INTERVAL 34560 MINUTE),
 (419, 21, 8, 0, 'promptpay', 'completed', NOW() - INTERVAL 28800 MINUTE),
 (420, 22, 8, 0, 'promptpay', 'completed', NOW() - INTERVAL 36000 MINUTE),
 (421, 23, 8, 0, 'promptpay', 'completed', NOW() - INTERVAL 43200 MINUTE),
 (422, 22, 8, 60, 'promptpay', 'completed', NOW() - INTERVAL 30240 MINUTE),
 (501, 2, 7, 0, 'promptpay', 'completed', NOW() - INTERVAL 5760 MINUTE),
 (502, 2, 3, 50, 'card', 'paid', NOW() - INTERVAL 1440 MINUTE);

UPDATE orders SET ship_name = 'ลูกค้าทดลอง', ship_phone = '081-234-5678', ship_address = '99/1 ถ.สุขุมวิท แขวงคลองตัน เขตคลองเตย กรุงเทพฯ 10110' WHERE id = 502;

INSERT INTO order_items (order_id, artwork_id, price, format, option_key) VALUES
 (401, 1, 2500, 'physical', 'none'),
 (402, 1, 2500, 'physical', 'none'),
 (403, 1, 2500, 'physical', 'none'),
 (404, 3, 900, 'digital', 'personal'),
 (405, 3, 900, 'digital', 'personal'),
 (406, 3, 900, 'digital', 'personal'),
 (407, 3, 900, 'digital', 'personal'),
 (408, 6, 3500, 'digital', 'personal'),
 (409, 6, 3500, 'digital', 'personal'),
 (410, 7, 700, 'digital', 'personal'),
 (411, 7, 700, 'digital', 'personal'),
 (412, 9, 1800, 'digital', 'personal'),
 (413, 9, 1800, 'digital', 'personal'),
 (414, 9, 1800, 'digital', 'personal'),
 (415, 9, 1800, 'digital', 'personal'),
 (416, 9, 1800, 'digital', 'personal'),
 (417, 10, 2400, 'digital', 'personal'),
 (418, 10, 2400, 'digital', 'personal'),
 (419, 11, 2200, 'digital', 'personal'),
 (420, 11, 2200, 'digital', 'personal'),
 (421, 11, 2200, 'digital', 'personal'),
 (422, 12, 4500, 'physical', 'none'),
 (501, 9, 1530, 'digital', 'personal'),
 (502, 2, 3200, 'physical', 'none');

INSERT INTO artwork_reviews (artwork_id, user_id, rating, body, categories, photo_path, created_at) VALUES
 (1, 21, 5, 'คุณภาพดี คุ้มราคา', 'quality,value', 'artworks/demo-1.svg', NOW() - INTERVAL 5760 MINUTE),
 (1, 22, 5, 'ศิลปินตอบไว น่ารักมาก', 'service', NULL, NOW() - INTERVAL 12960 MINUTE),
 (1, 23, 4, 'สวยค่ะ แต่ส่งช้ากว่าที่คิดนิดหน่อย', 'appearance,shipping', 'artworks/demo-1.svg', NOW() - INTERVAL 20160 MINUTE),
 (3, 23, 5, 'งานละเอียด เห็นฝีมือชัดเจน', 'quality,appearance', 'artworks/demo-3.svg', NOW() - INTERVAL 8640 MINUTE),
 (3, 24, 5, 'ตรงตามรูปเป๊ะ ส่งไวมาก ขอบคุณค่ะ', 'description,shipping', NULL, NOW() - INTERVAL 15840 MINUTE),
 (3, 25, 5, 'ชอบมาก สีสวยกว่าในรูปอีก', 'appearance', 'artworks/demo-3.svg', NOW() - INTERVAL 23040 MINUTE),
 (3, 26, 5, 'แพ็กมาดีมาก ไม่มีรอยยับเลย', 'shipping,quality', NULL, NOW() - INTERVAL 30240 MINUTE),
 (6, 26, 4, 'โอเค ตามราคา', 'value', 'artworks/demo-6.svg', NOW() - INTERVAL 12960 MINUTE),
 (6, 27, 5, 'งานละเอียด เห็นฝีมือชัดเจน', 'quality,appearance', NULL, NOW() - INTERVAL 20160 MINUTE),
 (7, 27, 5, 'ชอบมาก สีสวยกว่าในรูปอีก', 'appearance', 'artworks/demo-7.svg', NOW() - INTERVAL 14400 MINUTE),
 (7, 28, 5, 'แพ็กมาดีมาก ไม่มีรอยยับเลย', 'shipping,quality', NULL, NOW() - INTERVAL 21600 MINUTE),
 (9, 29, 5, 'ไฟล์ละเอียดมาก พิมพ์ออกมาสวย', 'quality', 'artworks/demo-9.svg', NOW() - INTERVAL 17280 MINUTE),
 (9, 20, 4, 'โอเค ตามราคา', 'value', NULL, NOW() - INTERVAL 24480 MINUTE),
 (9, 21, 5, 'งานละเอียด เห็นฝีมือชัดเจน', 'quality,appearance', 'artworks/demo-9.svg', NOW() - INTERVAL 31680 MINUTE),
 (9, 22, 5, 'ตรงตามรูปเป๊ะ ส่งไวมาก ขอบคุณค่ะ', 'description,shipping', NULL, NOW() - INTERVAL 38880 MINUTE),
 (9, 23, 5, 'ชอบมาก สีสวยกว่าในรูปอีก', 'appearance', 'artworks/demo-9.svg', NOW() - INTERVAL 46080 MINUTE),
 (10, 20, 5, 'ตรงตามรูปเป๊ะ ส่งไวมาก ขอบคุณค่ะ', 'description,shipping', 'artworks/demo-10.svg', NOW() - INTERVAL 18720 MINUTE),
 (10, 21, 5, 'ชอบมาก สีสวยกว่าในรูปอีก', 'appearance', NULL, NOW() - INTERVAL 25920 MINUTE),
 (11, 21, 5, 'คุณภาพดี คุ้มราคา', 'quality,value', 'artworks/demo-11.svg', NOW() - INTERVAL 20160 MINUTE),
 (11, 22, 5, 'ศิลปินตอบไว น่ารักมาก', 'service', NULL, NOW() - INTERVAL 27360 MINUTE),
 (11, 23, 4, 'สวยค่ะ แต่ส่งช้ากว่าที่คิดนิดหน่อย', 'appearance,shipping', 'artworks/demo-11.svg', NOW() - INTERVAL 34560 MINUTE),
 (12, 22, 5, 'ซื้อเป็นของขวัญ คนรับชอบมาก', 'appearance,value', 'artworks/demo-12.svg', NOW() - INTERVAL 21600 MINUTE);

INSERT INTO cart_items (user_id, artwork_id, option_key) VALUES
 (2, 11, 'personal');

INSERT INTO commission_requests (id, customer_id, artist_id, description, budget, deadline, art_type, delivery_method, status, quote_price, quote_deadline, quote_status, created_at, updated_at) VALUES
 (1, 2, 7, 'อยากได้ภาพตัวละครออริจินัลสไตล์อนิเมะ ผมสีเงิน ถือดาบ พื้นหลังท้องฟ้ายามค่ำ', 1500, NULL, 'digital', 'digital_file', 'completed', 1600, NULL, 'agreed', NOW() - INTERVAL 14400 MINUTE, NOW() - INTERVAL 4320 MINUTE),
 (2, 2, 3, 'ภาพสีน้ำบ้านไม้ริมทุ่งนา ขนาด A3 เอาไว้เป็นของขวัญขึ้นบ้านใหม่ของคุณแม่', 2000, CURDATE() + INTERVAL 40 DAY, 'physical', 'physical_shipping', 'pending', 2400, CURDATE() + INTERVAL 35 DAY, 'proposed', NOW() - INTERVAL 2880 MINUTE, NOW() - INTERVAL 1440 MINUTE),
 (3, 2, 7, 'วาดแมวของฉันเป็นนักเวทย์สไตล์อนิเมะ ใส่หมวกแม่มดสีม่วง ถือไม้เท้า', 1800, CURDATE() + INTERVAL 25 DAY, 'digital', 'digital_file', 'accepted', 1800, CURDATE() + INTERVAL 21 DAY, 'agreed', NOW() - INTERVAL 8640 MINUTE, NOW() - INTERVAL 288 MINUTE),
 (4, 5, 7, 'ขอภาพแฟนอาร์ตตัวละครจากเกมที่ชอบ ท่ายืนเต็มตัว พื้นหลังโปร่งใส ใช้ทำสแตนดี้', 1300, NULL, 'digital', 'digital_file', 'pending', NULL, NULL, 'none', NOW() - INTERVAL 720 MINUTE, NOW() - INTERVAL 720 MINUTE);

INSERT INTO commission_request_tags (request_id, tag_id) VALUES
 (1, 1),
 (1, 12),
 (2, 5),
 (2, 10),
 (3, 1),
 (3, 8),
 (4, 1),
 (4, 11);

INSERT INTO request_messages (request_id, sender_id, body, created_at) VALUES
 (1, 2, 'สวัสดีค่ะ สนใจจ้างวาดตามรายละเอียดนะคะ', NOW() - INTERVAL 14400 MINUTE),
 (1, 7, 'ได้เลยค่ะ ขอเสนอราคา 1,600 บาท รวมแก้ 2 ครั้งนะคะ', NOW() - INTERVAL 12960 MINUTE),
 (2, 3, 'สวัสดีค่ะ ภาพ A3 สีน้ำใช้เวลาประมาณ 2 สัปดาห์ รวมค่าส่งแบบมีกรอบนะคะ', NOW() - INTERVAL 1440 MINUTE),
 (3, 2, 'แนบรูปแมวในแชทได้ไหมคะ', NOW() - INTERVAL 7200 MINUTE),
 (3, 7, 'ส่งสเก็ตช์รอบแรกแล้วนะคะ ลองดูท่าทางก่อน', NOW() - INTERVAL 288 MINUTE);

INSERT INTO commission_sketches (request_id, file_path, artist_note, customer_feedback, status, round_no, created_at) VALUES
 (3, 'sketches/demo-sketch-3.svg', 'ท่ายกไม้เท้าขึ้น หมวกเอียงนิดหน่อย', '', 'submitted', 1, NOW() - INTERVAL 288 MINUTE);

INSERT INTO commission_reviews (request_id, rating, body, created_at) VALUES
 (1, 5, 'งานสวยมาก ส่งตรงเวลา คุยง่ายค่ะ', NOW() - INTERVAL 4320 MINUTE);

INSERT INTO message_threads (id, user_a, user_b, artwork_id, created_at) VALUES
 (701, 2, 7, 9, NOW() - INTERVAL 2880 MINUTE);

INSERT INTO thread_messages (thread_id, sender_id, body, created_at) VALUES
 (701, 2, 'สวัสดีค่ะ ภาพสาวน้อยใต้แสงจันทร์ มีไฟล์แนวตั้งสำหรับทำวอลเปเปอร์มือถือไหมคะ', NOW() - INTERVAL 2880 MINUTE),
 (701, 7, 'มีค่ะ ซื้อแล้วจะได้ทั้งแนวนอนและแนวตั้งเลยนะคะ', NOW() - INTERVAL 2592 MINUTE),
 (701, 2, 'ขอบคุณค่ะ เดี๋ยวสั่งเลย', NOW() - INTERVAL 2448 MINUTE);

INSERT INTO thread_reads (thread_id, user_id, read_at) VALUES
 (701, 2, NOW(3));

INSERT INTO notifications (recipient_id, icon, msg_key, vars, body, link, read_at, created_at) VALUES
 (2, '🎨', 'n_sketch', '{}', 'ท่ายกไม้เท้าขึ้น หมวกเอียงนิดหน่อย', '#/commission/3', NULL, NOW() - INTERVAL 288 MINUTE),
 (2, '💰', 'n_quote', '{"n":"มะลิ สีน้ำ","p":"฿2,400"}', '', '#/commission/2', NULL, NOW() - INTERVAL 1440 MINUTE),
 (2, '📣', 'n_welcome', '{}', '', '#/match', NOW() - INTERVAL 15840 MINUTE, NOW() - INTERVAL 17280 MINUTE),
 (7, '🎨', 'n_newReq', '{"n":"Nina Portrait"}', 'ขอภาพแฟนอาร์ตตัวละครจากเกมที่ชอบ...', '#/commission/4', NULL, NOW() - INTERVAL 720 MINUTE),
 (3, '📦', 'n_order', '{"id":502,"n":"ลูกค้าทดลอง"}', 'ตลาดเช้าเชียงใหม่', '#/dashboard/orders', NULL, NOW() - INTERVAL 1440 MINUTE),
 (1, '🚩', 'n_report', '{"t":"แมวส้มจอมซน"}', '', '#/admin', NULL, NOW() - INTERVAL 1440 MINUTE);

