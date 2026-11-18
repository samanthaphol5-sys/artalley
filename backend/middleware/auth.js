// ตรวจการล็อกอินด้วย JWT  (Authorization: Bearer <token>)
// โทเคนของ "เข้าใช้ในฐานะ" มีช่อง imp = id ของแอดมินที่ใช้
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
const { HttpError } = require("../utils/helpers");

const SECRET = () => process.env.JWT_SECRET || "dev-secret-change-me";

function signToken(userId, impersonatorId = null) {
  const payload = { id: userId };
  if (impersonatorId) payload.imp = impersonatorId;
  return jwt.sign(payload, SECRET(), { expiresIn: impersonatorId ? "2h" : "7d" });
}

async function loadUser(req) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return null;
  let payload;
  try { payload = jwt.verify(token, SECRET()); } catch { return null; }
  const [rows] = await pool.query(
    `SELECT u.id, u.account_id, a.email, u.display_name, u.role, u.avatar_path, u.suspended_at, u.suspend_reason
     FROM users u JOIN accounts a ON a.id = u.account_id WHERE u.id = ?`,
    [payload.id],
  );
  const user = rows[0];
  if (!user) return null;
  if (payload.imp) {
    // แอดมินที่ออกโทเคนต้องยังเป็นแอดมินและไม่ถูกระงับ
    const [[admin]] = await pool.query("SELECT id, display_name FROM users WHERE id = ? AND role = 'admin' AND suspended_at IS NULL", [payload.imp]);
    if (!admin) return null;
    user.impersonator = { id: admin.id, name: admin.display_name };
  }
  return user;
}

// ต้องล็อกอิน และบัญชีต้องไม่ถูกระงับ
async function requireAuth(req, res, next) {
  try {
    req.user = await loadUser(req);
    if (!req.user) return next(new HttpError(401, "กรุณาเข้าสู่ระบบ"));
    if (req.user.suspended_at) return next(new HttpError(403, "บัญชีนี้ถูกระงับ"));
    next();
  } catch (e) { next(e); }
}

// ล็อกอินหรือไม่ก็ได้ (บัญชีที่ถูกระงับก็โหลดได้ เพื่อให้หน้าเว็บแสดงข้อความแจ้ง)
async function optionalAuth(req, res, next) {
  try { req.user = await loadUser(req); next(); } catch (e) { next(e); }
}

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) return next(new HttpError(401, "กรุณาเข้าสู่ระบบ"));
  if (!roles.includes(req.user.role)) return next(new HttpError(403, "คุณไม่มีสิทธิ์ทำรายการนี้"));
  next();
};

module.exports = { signToken, requireAuth, optionalAuth, requireRole };
