// ข้อความส่วนตัว (ปุ่ม "ติดต่อศิลปิน")
const router = require("express").Router();
const pool = require("../config/db");
const { asyncHandler, HttpError, str, toInt } = require("../utils/helpers");
const { requireAuth } = require("../middleware/auth");
const { notify } = require("../utils/notify");

router.use(requireAuth);
const TOPICS = ["general", "artwork", "commission", "collab"];

async function markRead(threadId, userId) {
  await pool.query("INSERT INTO thread_reads (thread_id, user_id, read_at) VALUES (?, ?, NOW(3)) ON DUPLICATE KEY UPDATE read_at = NOW(3)", [threadId, userId]);
}

// POST /api/messages { to, art, topic, topicLabel, body }  เริ่มคุย (หรือต่อในบทสนทนาเดิมเรื่องเดียวกัน)
router.post("/", asyncHandler(async (req, res) => {
  const to = toInt(req.body.to), art = toInt(req.body.art) || null;
  const body = str(req.body.body, 2000);
  if (to === req.user.id) throw new HttpError(400, "ส่งข้อความหาตัวเองไม่ได้");
  if (body.length < 5) throw new HttpError(400, "พิมพ์ข้อความอย่างน้อย 5 ตัวอักษร");
  const [[target]] = await pool.query("SELECT id FROM users WHERE id = ? AND suspended_at IS NULL", [to]);
  if (!target) throw new HttpError(404, "ไม่พบผู้ใช้");
  const topic = TOPICS.includes(req.body.topic) ? req.body.topic : "general";
  const label = str(req.body.topicLabel, 40) || topic;
  let [[th]] = await pool.query(
    "SELECT id FROM message_threads WHERE ((user_a = ? AND user_b = ?) OR (user_a = ? AND user_b = ?)) AND artwork_id <=> ?",
    [req.user.id, to, to, req.user.id, art],
  );
  if (!th) {
    const [r] = await pool.query("INSERT INTO message_threads (user_a, user_b, artwork_id) VALUES (?, ?, ?)", [req.user.id, to, art]);
    th = { id: r.insertId };
  }
  await pool.query("INSERT INTO thread_messages (thread_id, sender_id, body) VALUES (?, ?, ?)", [th.id, req.user.id, `[${label}] ${body}`]);
  await markRead(th.id, req.user.id);
  await notify({ to, actor: req.user.id, icon: "✉️", key: "n_dm", vars: { n: req.user.display_name }, body: body.slice(0, 80), link: `#/messages/${th.id}` });
  res.status(201).json({ thread: th.id });
}));

async function loadThread(req) {
  const [[th]] = await pool.query("SELECT * FROM message_threads WHERE id = ? AND (user_a = ? OR user_b = ?)", [toInt(req.params.id), req.user.id, req.user.id]);
  if (!th) throw new HttpError(404, "ไม่พบบทสนทนา");
  return th;
}

// ตอบกลับในบทสนทนา
router.post("/:id", asyncHandler(async (req, res) => {
  const th = await loadThread(req);
  const body = str(req.body.body, 2000);
  if (!body) throw new HttpError(400, "กรุณาพิมพ์ข้อความ");
  await pool.query("INSERT INTO thread_messages (thread_id, sender_id, body) VALUES (?, ?, ?)", [th.id, req.user.id, body]);
  await markRead(th.id, req.user.id);
  const to = th.user_a === req.user.id ? th.user_b : th.user_a;
  await notify({ to, actor: req.user.id, icon: "✉️", key: "n_dm", vars: { n: req.user.display_name }, body: body.slice(0, 80), link: `#/messages/${th.id}` });
  res.status(201).json({ ok: true });
}));

router.post("/:id/read", asyncHandler(async (req, res) => {
  const th = await loadThread(req);
  await markRead(th.id, req.user.id);
  res.json({ ok: true });
}));

module.exports = router;
