// บัญชีของฉัน: ชื่อ รูปโปรไฟล์ รูปปก (ศิลปิน) รหัสผ่าน และตั้งค่าโปรไฟล์ศิลปิน
const router = require("express").Router();
const pool = require("../config/db");
const { asyncHandler, HttpError, str, toNumber, toInt, parseIdList, bool } = require("../utils/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");
const { imageUpload, storedPath, removeFile } = require("../utils/upload");
const { hashPassword, verifyPassword } = require("../utils/password");

const avatarUpload = imageUpload("avatars");
const coverUpload = imageUpload("covers");
router.use(requireAuth);

router.put("/profile", asyncHandler(async (req, res) => {
  const name = str(req.body.name, 100);
  if (!name) throw new HttpError(400, "กรุณากรอกชื่อ");
  await pool.query("UPDATE users SET display_name = ? WHERE id = ?", [name, req.user.id]);
  res.json({ ok: true });
}));

// อัปโหลดรูปโปรไฟล์ (หน้าเว็บครอปเป็นสี่เหลี่ยมให้แล้ว)
router.put("/avatar", avatarUpload.single("avatar"), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, "กรุณาเลือกรูป");
  await pool.query("UPDATE users SET avatar_path = ? WHERE id = ?", [storedPath("avatars", req.file), req.user.id]);
  removeFile(req.user.avatar_path);
  res.json({ ok: true });
}));

router.delete("/avatar", asyncHandler(async (req, res) => {
  await pool.query("UPDATE users SET avatar_path = NULL WHERE id = ?", [req.user.id]);
  removeFile(req.user.avatar_path);
  res.json({ ok: true });
}));

// รูปปกหน้าโปรไฟล์ศิลปิน (หน้าเว็บครอปเป็นแถบกว้าง 1600×330 ให้แล้ว)
router.put("/cover", requireRole("artist"), coverUpload.single("cover"), asyncHandler(async (req, res) => {
  if (!req.file) throw new HttpError(400, "กรุณาเลือกรูป");
  const [[p]] = await pool.query("SELECT cover_path FROM artist_profiles WHERE user_id = ?", [req.user.id]);
  await pool.query("UPDATE artist_profiles SET cover_path = ? WHERE user_id = ?", [storedPath("covers", req.file), req.user.id]);
  removeFile(p?.cover_path);
  res.json({ ok: true });
}));

router.delete("/cover", requireRole("artist"), asyncHandler(async (req, res) => {
  const [[p]] = await pool.query("SELECT cover_path FROM artist_profiles WHERE user_id = ?", [req.user.id]);
  await pool.query("UPDATE artist_profiles SET cover_path = NULL WHERE user_id = ?", [req.user.id]);
  removeFile(p?.cover_path);
  res.json({ ok: true });
}));

// รหัสผ่านเป็นของบัญชี (ใช้ร่วมกันทั้งโปรไฟล์ลูกค้าและศิลปิน)
router.put("/password", asyncHandler(async (req, res) => {
  const { current, next } = req.body;
  const [[u]] = await pool.query("SELECT password_hash FROM accounts WHERE id = ?", [req.user.account_id]);
  if (!verifyPassword(String(current || ""), u.password_hash)) { const e = new HttpError(400, "รหัสผ่านปัจจุบันไม่ถูกต้อง"); e.code = "wrong_current"; throw e; }
  if (typeof next !== "string" || next.length < 8) throw new HttpError(400, "รหัสผ่านใหม่ต้องมีอย่างน้อย 8 ตัวอักษร");
  if (next === current) throw new HttpError(400, "รหัสผ่านใหม่ต้องไม่ซ้ำกับรหัสเดิม");
  await pool.query("UPDATE accounts SET password_hash = ? WHERE id = ?", [hashPassword(next), req.user.account_id]);
  res.json({ ok: true });
}));

// ตั้งค่าโปรไฟล์ศิลปิน (ชื่อ ข้อมูลสตูดิโอ การจัดส่ง ช่องทางโซเชียล) — ฟอร์มเดียวในหน้า "บัญชีของฉัน"
router.put("/artist-profile", requireRole("artist"), asyncHandler(async (req, res) => {
  const b = req.body, ship = b.ship || {}, social = b.social || {};
  if (b.name !== undefined) {
    const name = str(b.name, 100);
    if (!name) throw new HttpError(400, "กรุณากรอกชื่อ");
    await pool.query("UPDATE users SET display_name = ? WHERE id = ?", [name, req.user.id]);
  }
  const physical = bool(b.physical), digital = bool(b.digital);
  if (!physical && !digital) throw new HttpError(400, "เลือกอย่างน้อย 1 ประเภทงาน");
  const prep = toInt(ship.prep), tmin = toInt(ship.min), tmax = toInt(ship.max), fee = toNumber(ship.fee), ret = toInt(ship.returns);
  if ([prep, tmin, tmax, ret].some((v) => v === null || v < 0 || v > 60) || fee === null || fee < 0) throw new HttpError(400, "ค่าการจัดส่งไม่ถูกต้อง");
  if (prep < 1 || tmin < 1) throw new HttpError(400, "จำนวนวันต้องอย่างน้อย 1");
  if (tmin > tmax) throw new HttpError(400, "ขนส่งเร็วสุดต้องไม่มากกว่าช้าสุด");
  const min = toNumber(b.min);
  const s = (k) => str(social[k], k === "website" ? 200 : 120) || null;
  await pool.query(
    `UPDATE artist_profiles SET bio = ?, city = ?, commission_open = ?, commission_min = ?, offers_physical = ?, offers_digital = ?,
       prep_days = ?, transit_min = ?, transit_max = ?, ship_fee = ?, return_days = ?,
       social_instagram = ?, social_x = ?, social_facebook = ?, social_tiktok = ?, social_website = ?
     WHERE user_id = ?`,
    [str(b.bio, 2000), str(b.city, 100) || null, bool(b.open), min === null || min < 0 ? 0 : min, physical, digital,
      prep, tmin, tmax, fee, ret, s("instagram"), s("x"), s("facebook"), s("tiktok"), s("website"), req.user.id],
  );
  const tagIds = parseIdList(b.tags);
  await pool.query("DELETE FROM artist_profile_tags WHERE artist_id = ?", [req.user.id]);
  if (tagIds.length) await pool.query("INSERT INTO artist_profile_tags (artist_id, tag_id) SELECT ?, id FROM tags WHERE id IN (?)", [req.user.id, tagIds]);
  res.json({ ok: true });
}));

module.exports = router;
