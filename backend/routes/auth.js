// =====================================================================
// บัญชีผู้ใช้: สถานะทั้งหมด, เข้าสู่ระบบ, สมัคร, สลับ/เพิ่มโปรไฟล์, ลืมรหัสผ่าน
// 1 บัญชี (อีเมล + รหัสผ่าน) มีได้ 2 โปรไฟล์: ลูกค้า และ ศิลปิน
// =====================================================================
const router = require("express").Router();
const crypto = require("crypto");
const pool = require("../config/db");
const { asyncHandler, HttpError, str, toInt } = require("../utils/helpers");
const { hashPassword, verifyPassword } = require("../utils/password");
const { signToken, optionalAuth, requireAuth } = require("../middleware/auth");
const { buildState } = require("../utils/state");
const { notify } = require("../utils/notify");

const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
const fail = (status, message, code, extra = {}) => Object.assign(new HttpError(status, message), { code }, extra);

// GET /api/state  -> ข้อมูลทั้งหมดที่หน้าเว็บใช้ (ตามสิทธิ์ของคนที่ล็อกอิน)
router.get("/state", optionalAuth, asyncHandler(async (req, res) => {
  res.json(await buildState(req.user));
}));

async function profilesOf(accountId) {
  const [rows] = await pool.query("SELECT * FROM users WHERE account_id = ? ORDER BY role = 'customer' DESC, id", [accountId]);
  return rows;
}
const loginResult = (u) => ({ token: signToken(u.id), id: u.id, role: u.role, name: u.display_name });

// POST /api/auth/login { email, password }
// ถ้ามีทั้งสองโปรไฟล์ จะเข้าโปรไฟล์ลูกค้าก่อน (สลับได้ในหน้าบัญชี)
router.post("/auth/login", asyncHandler(async (req, res) => {
  const email = str(req.body.email, 255).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!email || !password) throw new HttpError(400, "กรอกอีเมลและรหัสผ่าน");
  const [[acc]] = await pool.query("SELECT * FROM accounts WHERE email = ?", [email]);
  if (!acc || !verifyPassword(password, acc.password_hash)) throw new HttpError(401, "อีเมลหรือรหัสผ่านไม่ถูกต้อง");
  const profiles = await profilesOf(acc.id);
  const usable = profiles.find((p) => !p.suspended_at);
  if (!usable) {
    const reason = profiles[0]?.suspend_reason || "";
    throw fail(403, `บัญชีนี้ถูกระงับ (${reason})`, "suspended", { reason });
  }
  res.json(loginResult(usable));
}));

// POST /api/auth/register { name, email, password, role, confirmLink }
// อีเมลที่มีบัญชีแล้ว: ใช้รหัสผ่านเดิมเพื่อเพิ่มโปรไฟล์อีกประเภท (ต้องยืนยัน confirmLink = true)
router.post("/auth/register", asyncHandler(async (req, res) => {
  const name = str(req.body.name, 100);
  const email = str(req.body.email, 255).toLowerCase();
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const role = req.body.role === "artist" ? "artist" : "customer"; // สมัครเป็นแอดมินเองไม่ได้
  if (!name) throw new HttpError(400, "กรุณากรอกชื่อ");
  if (!validEmail(email)) throw new HttpError(400, "อีเมลไม่ถูกต้อง");
  if (password.length < 8) throw new HttpError(400, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");

  const [[acc]] = await pool.query("SELECT * FROM accounts WHERE email = ?", [email]);
  if (acc) {
    const profiles = await profilesOf(acc.id);
    if (profiles.some((p) => p.role === role || p.role === "admin")) throw fail(409, "อีเมลนี้มีบัญชีแล้ว", "email_taken");
    if (!verifyPassword(password, acc.password_hash)) throw fail(400, "อีเมลนี้มีบัญชีแล้ว กรุณาใช้รหัสผ่านเดิมเพื่อเพิ่มอีกโปรไฟล์", "existing_password");
    if (req.body.confirmLink !== true) throw fail(409, "ยืนยันการเพิ่มโปรไฟล์ด้วยอีเมลเดิม", "confirm_link");
  }

  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    let accountId = acc?.id;
    if (!accountId) {
      const [a] = await conn.query("INSERT INTO accounts (email, password_hash) VALUES (?, ?)", [email, hashPassword(password)]);
      accountId = a.insertId;
    }
    const [r] = await conn.query("INSERT INTO users (account_id, display_name, role) VALUES (?, ?, ?)", [accountId, name, role]);
    if (role === "artist") await conn.query("INSERT INTO artist_profiles (user_id, bio) VALUES (?, '')", [r.insertId]);
    await notify({ to: r.insertId, icon: "📣", key: "n_welcome", link: role === "artist" ? "#/account" : "#/match" }, conn);
    await conn.commit();
    res.status(201).json({ token: signToken(r.insertId), id: r.insertId, role, name });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// POST /api/auth/switch { profileId }  สลับไปอีกโปรไฟล์ของบัญชีเดียวกัน
router.post("/auth/switch", requireAuth, asyncHandler(async (req, res) => {
  if (req.user.impersonator) throw new HttpError(403, "ออกจากโหมดเข้าใช้ในฐานะก่อน");
  const [[target]] = await pool.query("SELECT * FROM users WHERE id = ? AND account_id = ?", [toInt(req.body.profileId), req.user.account_id]);
  if (!target || target.id === req.user.id) throw new HttpError(404, "ไม่พบโปรไฟล์");
  if (target.suspended_at) throw fail(403, "โปรไฟล์นี้ถูกระงับ", "suspended", { reason: target.suspend_reason });
  res.json(loginResult(target));
}));

// POST /api/auth/profiles { role }  สร้างอีกโปรไฟล์ด้วยบัญชีเดิม (ชื่อและรูปโปรไฟล์คัดลอกมาให้)
router.post("/auth/profiles", requireAuth, asyncHandler(async (req, res) => {
  if (req.user.impersonator) throw new HttpError(403, "ออกจากโหมดเข้าใช้ในฐานะก่อน");
  if (req.user.role === "admin") throw new HttpError(400, "บัญชีแอดมินเพิ่มโปรไฟล์ไม่ได้");
  const role = req.body.role === "artist" ? "artist" : "customer";
  if (role === req.user.role) throw new HttpError(400, "มีโปรไฟล์นี้อยู่แล้ว");
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    const [r] = await conn.query("INSERT INTO users (account_id, display_name, avatar_path, role) VALUES (?, ?, ?, ?)",
      [req.user.account_id, req.user.display_name, req.user.avatar_path, role]); // ซ้ำ -> ER_DUP_ENTRY (มีอยู่แล้ว)
    if (role === "artist") await conn.query("INSERT INTO artist_profiles (user_id, bio) VALUES (?, '')", [r.insertId]);
    await conn.commit();
    res.status(201).json({ token: signToken(r.insertId), id: r.insertId, role, name: req.user.display_name });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// ---------------------------------------------------------------------
// ลืมรหัสผ่าน
// POST /api/auth/forgot { email }  ตอบเหมือนกันเสมอ ไม่บอกว่าอีเมลมีในระบบหรือไม่
// ยังไม่ได้ต่อระบบส่งอีเมล: ลิงก์จะพิมพ์ใน console ของเซิร์ฟเวอร์
// และส่งกลับมาใน devLink เฉพาะตอนพัฒนา (NODE_ENV ไม่ใช่ production)
// ---------------------------------------------------------------------
const sha256 = (s) => crypto.createHash("sha256").update(s).digest("hex");

router.post("/auth/forgot", asyncHandler(async (req, res) => {
  const email = str(req.body.email, 255).toLowerCase();
  if (!validEmail(email)) throw new HttpError(400, "อีเมลไม่ถูกต้อง");
  const [[acc]] = await pool.query("SELECT id FROM accounts WHERE email = ?", [email]);
  let devLink = null;
  if (acc) {
    const profiles = await profilesOf(acc.id);
    if (profiles.some((p) => !p.suspended_at)) {
      const token = crypto.randomBytes(32).toString("hex");
      await pool.query("UPDATE password_resets SET used_at = NOW() WHERE account_id = ? AND used_at IS NULL", [acc.id]); // ลิงก์เก่าใช้ไม่ได้
      await pool.query("INSERT INTO password_resets (account_id, token_hash, expires_at) VALUES (?, ?, NOW() + INTERVAL 30 MINUTE)", [acc.id, sha256(token)]);
      devLink = `#/reset/${token}`;
      console.log(`[ลืมรหัสผ่าน] ${email}: http://localhost:${process.env.PORT || 3000}/${devLink}`);
    }
  }
  res.json({ ok: true, devLink: process.env.NODE_ENV === "production" ? null : devLink });
}));

async function validReset(token) {
  if (!/^[a-f0-9]{64}$/.test(token || "")) return null;
  const [[r]] = await pool.query(
    `SELECT r.id, r.account_id, a.email FROM password_resets r JOIN accounts a ON a.id = r.account_id
     WHERE r.token_hash = ? AND r.used_at IS NULL AND r.expires_at > NOW()`, [sha256(token)],
  );
  return r || null;
}

// GET /api/auth/reset/:token  ตรวจลิงก์ (หน้าเว็บใช้แสดงอีเมล)
router.get("/auth/reset/:token", asyncHandler(async (req, res) => {
  const r = await validReset(req.params.token);
  if (!r) throw fail(400, "ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว", "bad_link");
  res.json({ email: r.email });
}));

// POST /api/auth/reset { token, password }
router.post("/auth/reset", asyncHandler(async (req, res) => {
  const r = await validReset(req.body.token);
  if (!r) throw fail(400, "ลิงก์นี้ไม่ถูกต้องหรือหมดอายุแล้ว", "bad_link");
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (password.length < 8) throw new HttpError(400, "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
  await pool.query("UPDATE accounts SET password_hash = ? WHERE id = ?", [hashPassword(password), r.account_id]);
  await pool.query("UPDATE password_resets SET used_at = NOW() WHERE id = ?", [r.id]);
  res.json({ ok: true });
}));

module.exports = router;
