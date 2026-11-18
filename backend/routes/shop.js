// ตะกร้า ชำระเงิน และคำสั่งซื้อ (ลูกค้าเท่านั้นที่ซื้อได้)
const router = require("express").Router();
const pool = require("../config/db");
const { asyncHandler, HttpError, str, toInt } = require("../utils/helpers");
const { requireAuth, requireRole } = require("../middleware/auth");
const { linePrice, optionsFor } = require("../utils/pricing");
const { absolutePath } = require("../utils/upload");
const { notify } = require("../utils/notify");

const BUYABLE_SQL = `SELECT a.*, u.suspended_at AS artist_suspended FROM artworks a JOIN users u ON u.id = a.artist_id WHERE a.id = ?`;
const buyable = (a, userId) => a && a.status === "published" && !a.moderation_hidden && !a.artist_suspended
  && a.purpose === "for_sale" && a.availability === "available" && a.artist_id !== userId;

// ---------- ตะกร้า ----------
// PUT /api/cart/:artId { opt, note }  ใส่ตะกร้า หรือแก้ตัวเลือก
router.put("/cart/:artId", requireAuth, requireRole("customer"), asyncHandler(async (req, res) => {
  const [[a]] = await pool.query(BUYABLE_SQL, [toInt(req.params.artId)]);
  if (!buyable(a, req.user.id)) throw new HttpError(400, "ผลงานนี้ไม่พร้อมขาย");
  const opt = String(req.body.opt || "");
  if (!(opt in optionsFor(a))) throw new HttpError(400, "กรุณาเลือกตัวเลือก");
  await pool.query(
    `INSERT INTO cart_items (user_id, artwork_id, option_key, note) VALUES (?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE option_key = VALUES(option_key), note = VALUES(note)`,
    [req.user.id, a.id, opt, str(req.body.note, 300)],
  );
  res.json({ ok: true });
}));

router.delete("/cart/:artId", requireAuth, asyncHandler(async (req, res) => {
  await pool.query("DELETE FROM cart_items WHERE user_id = ? AND artwork_id = ?", [req.user.id, toInt(req.params.artId)]);
  res.json({ ok: true });
}));

// ---------- ชำระเงิน (สาธิต ไม่ตัดเงินจริง) ----------
// POST /api/checkout { pay, name, phone, addr }
router.post("/checkout", requireAuth, requireRole("customer"), asyncHandler(async (req, res) => {
  const pay = req.body.pay === "card" ? "card" : "promptpay";
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    // ล็อกแถวผลงานกันคนอื่นซื้อชิ้นเดียวกันพร้อมกัน
    const [items] = await conn.query(
      `SELECT c.option_key, c.note, a.*, u.suspended_at AS artist_suspended, p.ship_fee
       FROM cart_items c JOIN artworks a ON a.id = c.artwork_id JOIN users u ON u.id = a.artist_id
       LEFT JOIN artist_profiles p ON p.user_id = a.artist_id
       WHERE c.user_id = ? FOR UPDATE`, [req.user.id],
    );
    const ok = items.filter((a) => buyable(a, req.user.id) && linePrice(a, a.option_key) !== null);
    if (!ok.length) throw new HttpError(400, "ไม่มีสินค้าที่ซื้อได้ในตะกร้า");
    const needAddr = ok.some((a) => a.format === "physical");
    const addr = { name: str(req.body.name, 120), phone: str(req.body.phone, 40), addr: str(req.body.addr, 500) };
    if (needAddr && (!addr.name || !addr.phone || !addr.addr)) throw new HttpError(400, "กรุณากรอกที่อยู่จัดส่งให้ครบ");

    const orderIds = [];
    for (const artistId of [...new Set(ok.map((a) => a.artist_id))]) {
      const group = ok.filter((a) => a.artist_id === artistId);
      const phys = group.some((a) => a.format === "physical");
      const [o] = await conn.query(
        "INSERT INTO orders (buyer_id, artist_id, shipping_fee, ship_name, ship_phone, ship_address, pay_method, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [req.user.id, artistId, phys ? Number(group[0].ship_fee ?? 60) : 0, phys ? addr.name : null, phys ? addr.phone : null, phys ? addr.addr : null, pay, phys ? "paid" : "completed"],
      );
      for (const a of group) {
        await conn.query("INSERT INTO order_items (order_id, artwork_id, price, format, option_key, note) VALUES (?, ?, ?, ?, ?, ?)",
          [o.insertId, a.id, linePrice(a, a.option_key), a.format, a.option_key, a.note]);
        if (a.format === "physical") await conn.query("UPDATE artworks SET availability = 'sold' WHERE id = ?", [a.id]); // งานต้นฉบับมีชิ้นเดียว
      }
      await notify({ to: artistId, actor: req.user.id, icon: "📦", key: "n_order", vars: { id: o.insertId, n: req.user.display_name }, body: group.map((a) => a.title).join(", "), link: "#/dashboard/orders" }, conn);
      orderIds.push(o.insertId);
    }
    await conn.query("DELETE FROM cart_items WHERE user_id = ? AND artwork_id IN (?)", [req.user.id, ok.map((a) => a.id)]);
    await conn.commit();
    res.status(201).json({ orders: orderIds });
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}));

// ---------- คำสั่งซื้อ ----------
async function getOrder(id) {
  const [[o]] = await pool.query("SELECT * FROM orders WHERE id = ?", [toInt(id)]);
  return o || null;
}

// ศิลปินแจ้งจัดส่ง
router.post("/orders/:id/ship", requireAuth, asyncHandler(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o || o.artist_id !== req.user.id) throw new HttpError(404, "ไม่พบคำสั่งซื้อ");
  if (o.status !== "paid" || !o.ship_address) throw new HttpError(400, "คำสั่งซื้อนี้ไม่ต้องจัดส่ง");
  const tracking = str(req.body.tracking, 80);
  if (!tracking) throw new HttpError(400, "กรอกเลขพัสดุก่อน");
  await pool.query("UPDATE orders SET status = 'shipped', tracking_no = ? WHERE id = ?", [tracking, o.id]);
  await notify({ to: o.buyer_id, actor: req.user.id, icon: "🚚", key: "n_shipped", vars: { id: o.id }, body: tracking, link: "#/orders" });
  res.json({ ok: true });
}));

// ลูกค้ายืนยันรับของ
router.post("/orders/:id/received", requireAuth, asyncHandler(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o || o.buyer_id !== req.user.id) throw new HttpError(404, "ไม่พบคำสั่งซื้อ");
  if (o.status !== "shipped") throw new HttpError(400, "ยังยืนยันรับของไม่ได้");
  await pool.query("UPDATE orders SET status = 'completed' WHERE id = ?", [o.id]);
  await notify({ to: o.artist_id, actor: req.user.id, icon: "📦", key: "n_received", vars: { n: req.user.display_name, id: o.id }, link: "#/dashboard/orders" });
  res.json({ ok: true });
}));

// ดาวน์โหลดไฟล์ผลงานดิจิทัลที่ซื้อแล้ว
router.get("/orders/:id/items/:artId/file", requireAuth, asyncHandler(async (req, res) => {
  const o = await getOrder(req.params.id);
  if (!o || (o.buyer_id !== req.user.id && o.artist_id !== req.user.id)) throw new HttpError(404, "ไม่พบคำสั่งซื้อ");
  const [[item]] = await pool.query(
    `SELECT img.file_path AS image_path, a.title FROM order_items i JOIN artworks a ON a.id = i.artwork_id
     JOIN artwork_images img ON img.artwork_id = a.id AND img.position = 0
     WHERE i.order_id = ? AND i.artwork_id = ? AND i.format = 'digital'`,
    [o.id, toInt(req.params.artId)],
  );
  if (!item) throw new HttpError(404, "ไม่พบไฟล์");
  const ext = item.image_path.split(".").pop();
  res.download(absolutePath(item.image_path), `${item.title.replace(/[\\/:*?"<>|]/g, "")}.${ext}`);
}));

module.exports = router;
