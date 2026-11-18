// ผู้ดูแลระบบ: ซ่อนผลงาน, ตัดสินรายงาน, เปลี่ยนประเภทบัญชี, ระงับบัญชี, เข้าใช้ในฐานะ
// ทุกการกระทำสำคัญบันทึกลงตาราง admin_audit
const router = require("express").Router();
const pool = require("../config/db");
const { asyncHandler, HttpError, str, toInt } = require("../utils/helpers");
const { requireAuth, requireRole, signToken } = require("../middleware/auth");
const { notify } = require("../utils/notify");

router.use(requireAuth, requireRole("admin"));
router.use((req, res, next) => (req.user.impersonator ? next(new HttpError(403, "ออกจากโหมดเข้าใช้ในฐานะก่อน")) : next()));

const audit = (req, action, target, detail = "") =>
  pool.query("INSERT INTO admin_audit (admin_id, action, target_user_id, detail) VALUES (?, ?, ?, ?)", [req.user.id, action, target, String(detail).slice(0, 500)]);

async function targetUser(req) {
  const [[u]] = await pool.query("SELECT * FROM users WHERE id = ?", [toInt(req.params.id)]);
  if (!u) throw new HttpError(404, "ไม่พบผู้ใช้");
  if (u.id === req.user.id) throw new HttpError(400, "ทำกับบัญชีตัวเองไม่ได้");
  if (u.role === "admin") throw new HttpError(400, "ทำกับบัญชีแอดมินคนอื่นไม่ได้");
  return u;
}

router.post("/artworks/:id/hidden", asyncHandler(async (req, res) => {
  const hidden = req.body.hidden === true;
  const [[a]] = await pool.query("SELECT id, title, artist_id FROM artworks WHERE id = ?", [toInt(req.params.id)]);
  if (!a) throw new HttpError(404, "ไม่พบผลงาน");
  await pool.query("UPDATE artworks SET moderation_hidden = ? WHERE id = ?", [hidden, a.id]);
  await audit(req, hidden ? "hide" : "unhide", a.artist_id, `artwork #${a.id}`);
  if (hidden) await notify({ to: a.artist_id, actor: req.user.id, icon: "📣", key: "n_hidden", vars: { t: a.title }, link: "#/dashboard" });
  res.json({ ok: true });
}));

router.post("/reports/:id", asyncHandler(async (req, res) => {
  const status = req.body.status;
  if (!["resolved", "dismissed"].includes(status)) throw new HttpError(400, "สถานะไม่ถูกต้อง");
  const [r] = await pool.query("UPDATE artwork_reports SET status = ?, reviewed_at = NOW() WHERE id = ?", [status, toInt(req.params.id)]);
  if (!r.affectedRows) throw new HttpError(404, "ไม่พบรายงาน");
  await audit(req, "report", null, `report #${req.params.id}: ${status}`);
  res.json({ ok: true });
}));

router.put("/users/:id/role", asyncHandler(async (req, res) => {
  const u = await targetUser(req), role = req.body.role;
  if (!["customer", "artist", "admin"].includes(role)) throw new HttpError(400, "ประเภทบัญชีไม่ถูกต้อง");
  const [[dup]] = await pool.query("SELECT id FROM users WHERE account_id = ? AND role = ? AND id <> ?", [u.account_id, role, u.id]);
  if (dup) throw new HttpError(409, "บัญชีนี้มีโปรไฟล์ประเภทนี้อยู่แล้ว");
  await pool.query("UPDATE users SET role = ? WHERE id = ?", [role, u.id]);
  if (role === "artist") await pool.query("INSERT IGNORE INTO artist_profiles (user_id, bio) VALUES (?, '')", [u.id]);
  await audit(req, "role", u.id, `${u.role} -> ${role}`);
  res.json({ ok: true });
}));

router.post("/users/:id/suspend", asyncHandler(async (req, res) => {
  const u = await targetUser(req), reason = str(req.body.reason, 500);
  if (!reason) throw new HttpError(400, "กรุณาใส่เหตุผล");
  await pool.query("UPDATE users SET suspended_at = NOW(), suspend_reason = ? WHERE id = ?", [reason, u.id]);
  await audit(req, "suspend", u.id, reason);
  res.json({ ok: true });
}));

router.post("/users/:id/unsuspend", asyncHandler(async (req, res) => {
  const u = await targetUser(req);
  await pool.query("UPDATE users SET suspended_at = NULL, suspend_reason = NULL WHERE id = ?", [u.id]);
  await audit(req, "unsuspend", u.id);
  res.json({ ok: true });
}));

// เข้าใช้ในฐานะผู้ใช้อื่น: ออกโทเคนอายุ 2 ชม. ที่จำว่าแอดมินคนไหนเป็นคนใช้
router.post("/users/:id/act-as", asyncHandler(async (req, res) => {
  const u = await targetUser(req);
  await audit(req, "act_as", u.id);
  res.json({ token: signToken(u.id, req.user.id), name: u.display_name, role: u.role });
}));

module.exports = router;
