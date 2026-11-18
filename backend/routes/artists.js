// ติดตามศิลปิน (เฉพาะลูกค้า)
const router = require("express").Router();
const pool = require("../config/db");
const { asyncHandler, HttpError, toInt } = require("../utils/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");
const { notify } = require("../utils/notify");

router.post("/:id/follow", requireAuth, requireRole("customer"), asyncHandler(async (req, res) => {
  const id = toInt(req.params.id);
  const [[a]] = await pool.query("SELECT id FROM users WHERE id = ? AND role = 'artist' AND suspended_at IS NULL", [id]);
  if (!a) throw new HttpError(404, "ไม่พบศิลปิน");
  const [r] = await pool.query("INSERT IGNORE INTO artist_follows (follower_id, artist_id) VALUES (?, ?)", [req.user.id, id]);
  if (r.affectedRows) await notify({ to: id, actor: req.user.id, icon: "➕", key: "n_follow", vars: { n: req.user.display_name }, link: `#/artist/${id}` });
  res.json({ ok: true });
}));

router.delete("/:id/follow", requireAuth, asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM artist_follows WHERE follower_id = ? AND artist_id = ?", [req.user.id, toInt(req.params.id)]);
  res.json({ ok: true });
}));

module.exports = router;
