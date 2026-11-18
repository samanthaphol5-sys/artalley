// ผลงาน: ลง/แก้/ลบ (หลายรูป), บันทึก (♡), ความคิดเห็น, รายงาน, รีวิว
const router = require("express").Router();
const pool = require("../config/db");
const { asyncHandler, HttpError, str, toInt, toNumber, parseIdList } = require("../utils/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");
const { imageUpload, storedPath, removeFile } = require("../utils/upload");
const { notify, notifyAdmins } = require("../utils/notify");

const artUpload = imageUpload("artworks");
const reviewUpload = imageUpload("reviews");

async function getArt(id) {
  const [[a]] = await pool.query(
    "SELECT a.*, u.suspended_at AS artist_suspended FROM artworks a JOIN users u ON u.id = a.artist_id WHERE a.id = ?", [toInt(id)],
  );
  return a || null;
}
const isPublic = (a) => a && a.status === "published" && !a.moderation_hidden && !a.artist_suspended;

function readFields(body) {
  const purpose = body.purpose === "portfolio" ? "portfolio" : "for_sale";
  const price = toNumber(body.price);
  const f = {
    title: str(body.title, 200),
    description: str(body.description, 2000),
    format: body.format === "physical" ? "physical" : "digital",
    purpose,
    // ผลงานโชว์ไม่มีราคาและสถานะการขาย
    price: purpose === "portfolio" ? 0 : price,
    availability: purpose === "portfolio" ? "available" : ["available", "reserved", "sold"].includes(body.availability) ? body.availability : "available",
    status: ["published", "draft", "unpublished"].includes(body.status) ? body.status : "published",
    tags: parseIdList(body.tags),
  };
  if (!f.title) throw new HttpError(400, "กรุณากรอกชื่อผลงาน");
  if (purpose === "for_sale" && (price === null || price <= 0 || price > 10000000)) throw new HttpError(400, "ราคาไม่ถูกต้อง");
  return f;
}
async function setTags(artId, tagIds) {
  await pool.query("DELETE FROM artwork_tags WHERE artwork_id = ?", [artId]);
  if (tagIds.length) await pool.query("INSERT INTO artwork_tags (artwork_id, tag_id) SELECT ?, id FROM tags WHERE id IN (?)", [artId, tagIds]);
}

// ---------- รูปผลงาน (1–8 รูป, รูปแรก = ภาพปก) ----------
// ฟอร์มส่ง: images = ไฟล์ใหม่ (หลายไฟล์), order = JSON ลำดับรูป เช่น ["e12","n0","e15"]
//   e<id> = รูปเดิม id นั้น · n<index> = ไฟล์ใหม่ลำดับที่ index ใน images
const MAX_IMAGES = 8;
async function saveImages(conn, artId, order, files, existing) {
  const newPaths = files.map((f) => storedPath("artworks", f));
  const byId = new Map(existing.map((x) => [x.id, x]));
  const rows = [];
  for (const token of order) {
    const m = /^([en])(\d+)$/.exec(String(token));
    if (!m) throw new HttpError(400, "ลำดับรูปไม่ถูกต้อง");
    if (m[1] === "e") {
      const old = byId.get(+m[2]);
      if (!old) throw new HttpError(400, "รูปเดิมไม่ถูกต้อง");
      rows.push([old.file_path, old.caption_key]);
      byId.delete(old.id);
    } else {
      const p = newPaths[+m[2]];
      if (!p) throw new HttpError(400, "ไฟล์รูปไม่ครบ");
      rows.push([p, null]);
    }
  }
  if (rows.length < 1) throw new HttpError(400, "ต้องมีรูปผลงานอย่างน้อย 1 รูป");
  if (rows.length > MAX_IMAGES) throw new HttpError(400, `ใส่รูปได้สูงสุด ${MAX_IMAGES} รูป`);
  if (new Set(rows.map((r) => r[0])).size !== rows.length) throw new HttpError(400, "มีรูปซ้ำกัน");
  await conn.query("DELETE FROM artwork_images WHERE artwork_id = ?", [artId]);
  await conn.query("INSERT INTO artwork_images (artwork_id, file_path, position, caption_key) VALUES ?", [rows.map(([p, c], i) => [artId, p, i, c])]);
  const used = new Set(rows.map((r) => r[0]));
  return { removed: [...byId.values()].map((x) => x.file_path), unusedNew: newPaths.filter((p) => !used.has(p)) };
}
function parseOrder(raw, fileCount) {
  if (raw === undefined || raw === "") return Array.from({ length: fileCount }, (_, i) => "n" + i);
  try { const v = JSON.parse(raw); if (Array.isArray(v)) return v; } catch { /* ด้านล่าง */ }
  throw new HttpError(400, "ลำดับรูปไม่ถูกต้อง");
}
const cleanup = (files) => (files || []).forEach((f) => removeFile(storedPath("artworks", f)));

// ---------- ลง / แก้ / ลบผลงาน (ศิลปินเจ้าของ) ----------
router.post("/", requireAuth, requireRole("artist"), artUpload.array("images", MAX_IMAGES), asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const f = readFields(req.body);
    await conn.beginTransaction();
    const [r] = await conn.query(
      "INSERT INTO artworks (artist_id, title, description, format, purpose, price, availability, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [req.user.id, f.title, f.description, f.format, f.purpose, f.price, f.availability, f.status],
    );
    const { unusedNew } = await saveImages(conn, r.insertId, parseOrder(req.body.order, req.files.length), req.files, []);
    await conn.commit();
    unusedNew.forEach(removeFile);
    await setTags(r.insertId, f.tags);
    res.status(201).json({ id: r.insertId });
  } catch (e) {
    await conn.rollback(); cleanup(req.files); throw e;
  } finally { conn.release(); }
}));

router.put("/:id", requireAuth, artUpload.array("images", MAX_IMAGES), asyncHandler(async (req, res) => {
  const conn = await pool.getConnection();
  try {
    const a = await getArt(req.params.id);
    if (!a || a.artist_id !== req.user.id) throw new HttpError(404, "ไม่พบผลงานของคุณ");
    const f = readFields(req.body);
    const [existing] = await conn.query("SELECT id, file_path, caption_key FROM artwork_images WHERE artwork_id = ?", [a.id]);
    await conn.beginTransaction();
    await conn.query(
      "UPDATE artworks SET title=?, description=?, format=?, purpose=?, price=?, availability=?, status=? WHERE id = ?",
      [f.title, f.description, f.format, f.purpose, f.price, f.availability, f.status, a.id],
    );
    const { removed, unusedNew } = await saveImages(conn, a.id, parseOrder(req.body.order, req.files.length), req.files, existing);
    await conn.commit();
    [...removed, ...unusedNew].forEach(removeFile);
    await setTags(a.id, f.tags);
    res.json({ ok: true });
  } catch (e) {
    await conn.rollback(); cleanup(req.files); throw e;
  } finally { conn.release(); }
}));

router.delete("/:id", requireAuth, asyncHandler(async (req, res) => {
  const a = await getArt(req.params.id);
  if (!a || (a.artist_id !== req.user.id && req.user.role !== "admin")) throw new HttpError(404, "ไม่พบผลงาน");
  if (a.moderation_hidden && req.user.role !== "admin") throw new HttpError(403, "ผลงานนี้ถูกแอดมินซ่อน ลบเองไม่ได้");
  const [[sold]] = await pool.query("SELECT COUNT(*) n FROM order_items WHERE artwork_id = ?", [a.id]);
  if (sold.n) throw new HttpError(400, "ผลงานนี้มีคำสั่งซื้อแล้ว ลบไม่ได้ ให้เปลี่ยนเป็น \"ซ่อน\" แทน");
  const [imgs] = await pool.query("SELECT file_path FROM artwork_images WHERE artwork_id = ?", [a.id]);
  await pool.query("DELETE FROM artworks WHERE id = ?", [a.id]);
  imgs.forEach((x) => removeFile(x.file_path));
  res.json({ ok: true });
}));

// ---------- บันทึก (♡) — เฉพาะลูกค้า ----------
router.post("/:id/favorite", requireAuth, requireRole("customer"), asyncHandler(async (req, res) => {
  const a = await getArt(req.params.id);
  if (!isPublic(a)) throw new HttpError(404, "ไม่พบผลงาน");
  await pool.query("INSERT IGNORE INTO favorites (user_id, artwork_id) VALUES (?, ?)", [req.user.id, a.id]);
  res.json({ ok: true });
}));
router.delete("/:id/favorite", requireAuth, asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM favorites WHERE user_id = ? AND artwork_id = ?", [req.user.id, toInt(req.params.id)]);
  res.json({ ok: true });
}));

// ---------- ความคิดเห็น ----------
router.post("/:id/comments", requireAuth, asyncHandler(async (req, res) => {
  const a = await getArt(req.params.id);
  if (!isPublic(a)) throw new HttpError(404, "ไม่พบผลงาน");
  const body = str(req.body.body, 1000);
  if (!body) throw new HttpError(400, "กรุณาพิมพ์ความคิดเห็น");
  await pool.query("INSERT INTO artwork_comments (artwork_id, author_id, body) VALUES (?, ?, ?)", [a.id, req.user.id, body]);
  await notify({ to: a.artist_id, actor: req.user.id, icon: "💬", key: "n_comment", vars: { n: req.user.display_name, t: a.title }, body, link: `#/artwork/${a.id}` });
  res.status(201).json({ ok: true });
}));

router.delete("/comments/:cid", requireAuth, asyncHandler(async (req, res) => {
  const [[c]] = await pool.query("SELECT c.id, c.author_id, a.artist_id FROM artwork_comments c JOIN artworks a ON a.id = c.artwork_id WHERE c.id = ?", [toInt(req.params.cid)]);
  if (!c) throw new HttpError(404, "ไม่พบความคิดเห็น");
  if (![c.author_id, c.artist_id].includes(req.user.id) && req.user.role !== "admin") throw new HttpError(403, "ลบไม่ได้");
  await pool.query("DELETE FROM artwork_comments WHERE id = ?", [c.id]);
  res.json({ ok: true });
}));

// ---------- รายงาน ----------
router.post("/:id/report", requireAuth, asyncHandler(async (req, res) => {
  const a = await getArt(req.params.id);
  if (!isPublic(a)) throw new HttpError(404, "ไม่พบผลงาน");
  if (a.artist_id === req.user.id) throw new HttpError(400, "รายงานผลงานของตัวเองไม่ได้");
  const reason = ["inappropriate", "copyright", "spam", "other"].includes(req.body.reason) ? req.body.reason : null;
  if (!reason) throw new HttpError(400, "กรุณาเลือกเหตุผล");
  const [r] = await pool.query("INSERT IGNORE INTO artwork_reports (artwork_id, reporter_id, reason, details) VALUES (?, ?, ?, ?)", [a.id, req.user.id, reason, str(req.body.details, 1000)]);
  if (!r.affectedRows) { const e = new HttpError(409, "คุณรายงานผลงานนี้ไปแล้ว"); e.code = "already_reported"; throw e; }
  await notifyAdmins({ actor: req.user.id, icon: "🚩", key: "n_report", vars: { t: a.title }, link: "#/admin" });
  res.status(201).json({ ok: true });
}));

// ---------- รีวิวผลงาน (ต้องซื้อและได้รับของแล้ว) ----------
router.post("/:id/reviews", requireAuth, reviewUpload.single("photo"), asyncHandler(async (req, res) => {
  const photo = storedPath("reviews", req.file);
  try {
    const a = await getArt(req.params.id);
    if (!a) throw new HttpError(404, "ไม่พบผลงาน");
    const [[bought]] = await pool.query(
      "SELECT COUNT(*) n FROM orders o JOIN order_items i ON i.order_id = o.id WHERE o.buyer_id = ? AND o.status = 'completed' AND i.artwork_id = ?",
      [req.user.id, a.id],
    );
    if (!bought.n) throw new HttpError(403, "รีวิวได้หลังซื้อและได้รับผลงานแล้ว");
    const rating = toInt(req.body.rating);
    if (!rating || rating < 1 || rating > 5) throw new HttpError(400, "ให้คะแนน 1–5 ดาว");
    const cats = parseCats(req.body.cats);
    const [r] = await pool.query(
      "INSERT IGNORE INTO artwork_reviews (artwork_id, user_id, rating, body, categories, photo_path) VALUES (?, ?, ?, ?, ?, ?)",
      [a.id, req.user.id, rating, str(req.body.body, 2000), cats.join(","), photo],
    );
    if (!r.affectedRows) throw new HttpError(409, "คุณรีวิวผลงานนี้แล้ว");
    await notify({ to: a.artist_id, actor: req.user.id, icon: "⭐", key: "n_review", vars: { r: rating }, body: str(req.body.body, 120), link: `#/artwork/${a.id}` });
    res.status(201).json({ ok: true });
  } catch (e) { removeFile(photo); throw e; }
}));
const CATS = ["appearance", "quality", "shipping", "description", "service", "value"];
function parseCats(v) {
  const list = Array.isArray(v) ? v : String(v || "").split(",");
  return [...new Set(list.map((x) => String(x).trim()).filter((x) => CATS.includes(x)))];
}

module.exports = router;
