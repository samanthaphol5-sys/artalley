// อ่านการแจ้งเตือน
const router = require("express").Router();
const pool = require("../config/db");
const { asyncHandler, toInt } = require("../utils/helpers");
const { requireAuth } = require("../middleware/auth");

router.use(requireAuth);
router.post("/read-all", asyncHandler(async (req, res) => {
  await pool.query("UPDATE notifications SET read_at = NOW() WHERE recipient_id = ? AND read_at IS NULL", [req.user.id]);
  res.json({ ok: true });
}));
router.post("/:id/read", asyncHandler(async (req, res) => {
  await pool.query("UPDATE notifications SET read_at = NOW() WHERE id = ? AND recipient_id = ? AND read_at IS NULL", [toInt(req.params.id), req.user.id]);
  res.json({ ok: true });
}));

module.exports = router;
