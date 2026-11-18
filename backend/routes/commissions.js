// =====================================================================
// งานจ้างวาด
//   ลูกค้าส่งคำขอ (pending) -> ศิลปินเสนอราคา -> ลูกค้าตกลง -> ศิลปินรับงาน (accepted)
//   -> ส่งสเก็ตช์ / ลูกค้าอนุมัติหรือขอแก้ -> ศิลปินส่งงาน (delivered) -> ลูกค้ายืนยัน (completed) -> รีวิว
// =====================================================================
const router = require("express").Router();
const pool = require("../config/db");
const { asyncHandler, HttpError, str, toInt, toNumber, parseIdList, isDate } = require("../utils/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");
const { imageUpload, storedPath, removeFile, absolutePath } = require("../utils/upload");
const { notify } = require("../utils/notify");

const refUpload = imageUpload("references");
const sketchUpload = imageUpload("sketches");
router.use(requireAuth);

async function load(req) {
  const [[c]] = await pool.query("SELECT * FROM commission_requests WHERE id = ?", [toInt(req.params.id)]);
  if (!c || (c.customer_id !== req.user.id && c.artist_id !== req.user.id)) throw new HttpError(404, "ไม่พบงานจ้างนี้");
  return c;
}
const other = (c, uid) => (uid === c.customer_id ? c.artist_id : c.customer_id);
const tell = (c, req, icon, key, vars = {}, body = "") =>
  notify({ to: other(c, req.user.id), actor: req.user.id, icon, key, vars, body, link: `#/commission/${c.id}` });
const touch = (id) => pool.query("UPDATE commission_requests SET updated_at = NOW() WHERE id = ?", [id]);

// ---------- ส่งคำขอ (ลูกค้า) ----------
router.post("/", requireRole("customer"), refUpload.single("ref"), asyncHandler(async (req, res) => {
  const ref = storedPath("references", req.file);
  try {
    const artistId = toInt(req.body.artistId);
    const [[ap]] = await pool.query(
      "SELECT p.commission_open FROM users u JOIN artist_profiles p ON p.user_id = u.id WHERE u.id = ? AND u.role = 'artist' AND u.suspended_at IS NULL", [artistId],
    );
    if (!ap) throw new HttpError(404, "ไม่พบศิลปิน");
    if (!ap.commission_open) throw new HttpError(400, "ศิลปินปิดรับงานจ้างอยู่");
    const desc = str(req.body.desc, 2000), budget = toNumber(req.body.budget);
    if (desc.length < 20) throw new HttpError(400, "รายละเอียดต้องยาวอย่างน้อย 20 ตัวอักษร");
    if (budget === null || budget <= 0) throw new HttpError(400, "งบประมาณไม่ถูกต้อง");
    const deadline = isDate(req.body.deadline) ? req.body.deadline : null;
    const artType = ["physical", "digital"].includes(req.body.artType) ? req.body.artType : null;
    const delivery = ["digital_file", "physical_shipping", "pickup"].includes(req.body.delivery) ? req.body.delivery : null;
    const [r] = await pool.query(
      "INSERT INTO commission_requests (customer_id, artist_id, description, budget, deadline, art_type, delivery_method, reference_image_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [req.user.id, artistId, desc, budget, deadline, artType, delivery, ref],
    );
    const tags = parseIdList(req.body.tags);
    if (tags.length) await pool.query("INSERT INTO commission_request_tags (request_id, tag_id) SELECT ?, id FROM tags WHERE id IN (?)", [r.insertId, tags]);
    await notify({ to: artistId, actor: req.user.id, icon: "🎨", key: "n_newReq", vars: { n: req.user.display_name }, body: desc.slice(0, 120), link: `#/commission/${r.insertId}` });
    res.status(201).json({ id: r.insertId });
  } catch (e) { removeFile(ref); throw e; }
}));

// ---------- ไฟล์ส่วนตัว (เห็นเฉพาะลูกค้ากับศิลปินของงาน) ----------
router.get("/:id/reference", asyncHandler(async (req, res) => {
  const c = await load(req);
  if (!c.reference_image_path) throw new HttpError(404, "ไม่มีรูปอ้างอิง");
  res.sendFile(absolutePath(c.reference_image_path));
}));
router.get("/:id/sketch", asyncHandler(async (req, res) => {
  const c = await load(req);
  const [[s]] = await pool.query("SELECT file_path FROM commission_sketches WHERE request_id = ?", [c.id]);
  if (!s) throw new HttpError(404, "ยังไม่มีสเก็ตช์");
  res.sendFile(absolutePath(s.file_path));
}));

// ---------- แชท ----------
router.post("/:id/messages", asyncHandler(async (req, res) => {
  const c = await load(req);
  if (!["pending", "accepted", "delivered"].includes(c.status)) throw new HttpError(400, "ปิดแชทแล้ว");
  const body = str(req.body.body, 2000);
  if (!body) throw new HttpError(400, "กรุณาพิมพ์ข้อความ");
  await pool.query("INSERT INTO request_messages (request_id, sender_id, body) VALUES (?, ?, ?)", [c.id, req.user.id, body]);
  await touch(c.id);
  await tell(c, req, "💬", "n_msg", { n: req.user.display_name }, body.slice(0, 120));
  res.status(201).json({ ok: true });
}));

// ---------- เสนอราคา (ศิลปิน) / ตกลงราคา (ลูกค้า) ----------
router.post("/:id/quote", asyncHandler(async (req, res) => {
  const c = await load(req);
  if (c.artist_id !== req.user.id || c.status !== "pending") throw new HttpError(400, "เสนอราคาไม่ได้");
  const price = toNumber(req.body.price);
  if (price === null || price <= 0) throw new HttpError(400, "ราคาไม่ถูกต้อง");
  await pool.query("UPDATE commission_requests SET quote_price = ?, quote_deadline = ?, quote_status = 'proposed' WHERE id = ?",
    [price, isDate(req.body.deadline) ? req.body.deadline : null, c.id]);
  await tell(c, req, "💰", "n_quote", { n: req.user.display_name, p: "฿" + price.toLocaleString("en-US") });
  res.json({ ok: true });
}));

router.post("/:id/agree", asyncHandler(async (req, res) => {
  const c = await load(req);
  if (c.customer_id !== req.user.id || c.status !== "pending" || c.quote_status !== "proposed") throw new HttpError(400, "ยังไม่มีราคาที่รอตกลง");
  await pool.query("UPDATE commission_requests SET quote_status = 'agreed' WHERE id = ?", [c.id]);
  await tell(c, req, "💰", "n_agreed", { n: req.user.display_name });
  res.json({ ok: true });
}));

// ---------- เปลี่ยนสถานะ ----------
router.post("/:id/status", asyncHandler(async (req, res) => {
  const c = await load(req), next = req.body.status;
  const isA = c.artist_id === req.user.id, isC = c.customer_id === req.user.id;
  let ok = false;
  if (isA && c.status === "pending" && next === "accepted") {
    if (c.quote_status !== "agreed") throw new HttpError(400, "ต้องให้ลูกค้าตกลงราคาก่อน");
    ok = true;
  }
  if (isA && c.status === "pending" && next === "declined") ok = true;
  if (isA && c.status === "accepted" && next === "delivered") {
    const [[s]] = await pool.query("SELECT status FROM commission_sketches WHERE request_id = ?", [c.id]);
    if (s?.status !== "approved") throw new HttpError(400, "ต้องให้ลูกค้าอนุมัติสเก็ตช์ก่อน");
    ok = true;
  }
  if (isC && c.status === "pending" && next === "cancelled") ok = true;
  if (isC && c.status === "delivered" && next === "completed") ok = true;
  if (!ok) throw new HttpError(400, "เปลี่ยนสถานะนี้ไม่ได้");
  await pool.query("UPDATE commission_requests SET status = ? WHERE id = ?", [next, c.id]);
  await tell(c, req, "🎨", "n_status", { id: c.id, s: "s_" + next }); // หน้าเว็บแปล s_xxx เป็นข้อความ
  res.json({ ok: true });
}));

// ---------- สเก็ตช์ ----------
router.post("/:id/sketch", sketchUpload.single("file"), asyncHandler(async (req, res) => {
  const file = storedPath("sketches", req.file);
  try {
    const c = await load(req);
    if (c.artist_id !== req.user.id || c.status !== "accepted") throw new HttpError(400, "ส่งสเก็ตช์ไม่ได้");
    if (!file) throw new HttpError(400, "กรุณาเลือกไฟล์สเก็ตช์");
    const note = str(req.body.note, 2000);
    const [[old]] = await pool.query("SELECT * FROM commission_sketches WHERE request_id = ?", [c.id]);
    if (old?.status === "approved") throw new HttpError(400, "สเก็ตช์อนุมัติแล้ว");
    if (old?.status === "submitted") throw new HttpError(400, "รอลูกค้าตรวจสเก็ตช์ก่อน");
    if (old) {
      await pool.query("UPDATE commission_sketches SET file_path = ?, artist_note = ?, status = 'submitted', round_no = round_no + 1, created_at = NOW() WHERE request_id = ?", [file, note, c.id]);
      removeFile(old.file_path);
    } else {
      await pool.query("INSERT INTO commission_sketches (request_id, file_path, artist_note, customer_feedback) VALUES (?, ?, ?, '')", [c.id, file, note]);
    }
    await touch(c.id);
    await tell(c, req, "🎨", "n_sketch", {}, note.slice(0, 120));
    res.json({ ok: true });
  } catch (e) { removeFile(file); throw e; }
}));

router.post("/:id/sketch/review", asyncHandler(async (req, res) => {
  const c = await load(req);
  if (c.customer_id !== req.user.id || c.status !== "accepted") throw new HttpError(400, "ตรวจสเก็ตช์ไม่ได้");
  const decision = req.body.decision, feedback = str(req.body.feedback, 2000);
  if (!["approved", "revision_requested"].includes(decision)) throw new HttpError(400, "ผลการตรวจไม่ถูกต้อง");
  if (decision === "revision_requested" && !feedback) throw new HttpError(400, "บอกศิลปินว่าอยากให้แก้ตรงไหน");
  const [r] = await pool.query("UPDATE commission_sketches SET status = ?, customer_feedback = ? WHERE request_id = ? AND status = 'submitted'", [decision, feedback, c.id]);
  if (!r.affectedRows) throw new HttpError(400, "ไม่มีสเก็ตช์ที่รอตรวจ");
  await touch(c.id);
  await tell(c, req, "🎨", decision === "approved" ? "n_skOk" : "n_skRev", {}, feedback.slice(0, 120));
  res.json({ ok: true });
}));

// ---------- รีวิวงานจ้าง (ลูกค้า หลังงานเสร็จ) ----------
router.post("/:id/review", asyncHandler(async (req, res) => {
  const c = await load(req);
  if (c.customer_id !== req.user.id || c.status !== "completed") throw new HttpError(400, "รีวิวได้หลังงานเสร็จ");
  const rating = toInt(req.body.rating);
  if (!rating || rating < 1 || rating > 5) throw new HttpError(400, "ให้คะแนน 1–5 ดาว");
  const body = str(req.body.body, 2000);
  await pool.query("INSERT INTO commission_reviews (request_id, rating, body) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rating = VALUES(rating), body = VALUES(body)", [c.id, rating, body]);
  await notify({ to: c.artist_id, actor: req.user.id, icon: "⭐", key: "n_review", vars: { r: rating }, body: body.slice(0, 120), link: `#/artist/${c.artist_id}` });
  res.json({ ok: true });
}));

module.exports = router;
