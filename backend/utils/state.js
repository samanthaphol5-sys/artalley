// =====================================================================
// สร้าง "สถานะ" ทั้งหมดที่หน้าเว็บต้องใช้ ในรูปแบบเดียวกับ prototype
// ข้อมูลส่วนตัว (ตะกร้า ออเดอร์ งานจ้าง ข้อความ แจ้งเตือน) ส่งให้เฉพาะเจ้าของ
// หมายเหตุ: เหมาะกับข้อมูลขนาดเล็ก (โปรเจกต์สาธิต) ถ้าข้อมูลเยอะควรแยกเป็น API ทีละหน้า + แบ่งหน้า
// =====================================================================
const pool = require("../config/db");

const ms = (d) => (d ? new Date(d).getTime() : null);
const url = (p) => (p ? `/uploads/${p}` : null);
const inList = (ids) => (ids.length ? ids : [0]); // กัน IN () ว่าง

async function buildState(user) {
  const me = user?.id || null;
  const isAdmin = user?.role === "admin";
  const q = async (sql, params = []) => (await pool.query(sql, params))[0];

  // ---------- ผู้ใช้ (ข้อมูลสาธารณะ) ----------
  const userRows = await q(`SELECT u.id, u.account_id, a.email, u.display_name, u.role, u.avatar_path, u.suspended_at, u.suspend_reason
    FROM users u JOIN accounts a ON a.id = u.account_id ORDER BY u.id`);
  const myAccount = user?.account_id;
  const users = userRows.map((u) => ({
    id: u.id,
    name: u.display_name,
    role: u.role,
    avatar: url(u.avatar_path),
    email: isAdmin || (myAccount && u.account_id === myAccount) ? u.email : undefined,
    suspended: u.suspended_at ? { at: ms(u.suspended_at), reason: isAdmin || u.id === me ? u.suspend_reason : "" } : null,
  }));
  // โปรไฟล์อื่นในบัญชีเดียวกัน (ลูกค้า <-> ศิลปิน) สำหรับปุ่มสลับโปรไฟล์
  const myProfiles = myAccount ? userRows.filter((u) => u.account_id === myAccount && u.role !== "admin").map((u) => ({ id: u.id, role: u.role, name: u.display_name })) : [];
  const suspendedIds = new Set(userRows.filter((u) => u.suspended_at).map((u) => u.id));

  // ---------- แท็ก ----------
  const tags = (await q("SELECT id, category, name, name_th FROM tags ORDER BY id")).map((x) => ({ id: x.id, cat: x.category, en: x.name, th: x.name_th }));

  // ---------- โปรไฟล์ศิลปิน ----------
  const profiles = {};
  for (const p of await q("SELECT * FROM artist_profiles")) {
    const social = {};
    for (const k of ["instagram", "x", "facebook", "tiktok", "website"]) if (p["social_" + k]) social[k] = p["social_" + k];
    profiles[p.user_id] = {
      bio: p.bio, city: p.city || "", cover: url(p.cover_path), open: !!p.commission_open, min: Number(p.commission_min),
      physical: !!p.offers_physical, digital: !!p.offers_digital, tags: [], social, followers: 0,
      ship: { prep: p.prep_days, min: p.transit_min, max: p.transit_max, fee: Number(p.ship_fee), returns: p.return_days },
    };
  }
  for (const r of await q("SELECT artist_id, tag_id FROM artist_profile_tags")) profiles[r.artist_id]?.tags.push(r.tag_id);
  for (const r of await q("SELECT artist_id, COUNT(*) n FROM artist_follows GROUP BY artist_id")) if (profiles[r.artist_id]) profiles[r.artist_id].followers = r.n;

  // ---------- ข้อมูลส่วนตัวที่ใช้กรองผลงาน ----------
  const myCart = me ? await q("SELECT artwork_id, option_key, note FROM cart_items WHERE user_id = ? ORDER BY created_at", [me]) : [];
  const myFavs = me ? await q("SELECT artwork_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC", [me]) : [];
  const orderRows = me ? await q(isAdmin ? "SELECT * FROM orders WHERE 1=0" : "SELECT * FROM orders WHERE buyer_id = ? OR artist_id = ? ORDER BY created_at DESC", [me, me]) : [];
  const orderItems = orderRows.length ? await q("SELECT * FROM order_items WHERE order_id IN (?)", [orderRows.map((o) => o.id)]) : [];
  const mustInclude = new Set([...myCart.map((r) => r.artwork_id), ...myFavs.map((r) => r.artwork_id), ...orderItems.map((i) => i.artwork_id)]);

  // ---------- ผลงาน ----------
  const artRows = await q("SELECT * FROM artworks ORDER BY created_at DESC");
  const publicArt = (a) => a.status === "published" && !a.moderation_hidden && !suspendedIds.has(a.artist_id);
  const shown = artRows.filter((a) => isAdmin || publicArt(a) || a.artist_id === me || mustInclude.has(a.id));
  const ids = inList(shown.map((a) => a.id));
  const tagMap = {}, favCount = {}, cartCount = {}, imgMap = {};
  for (const r of await q("SELECT id, artwork_id, file_path, caption_key FROM artwork_images WHERE artwork_id IN (?) ORDER BY position", [ids])) (imgMap[r.artwork_id] ||= []).push(r);
  for (const r of await q("SELECT artwork_id, tag_id FROM artwork_tags WHERE artwork_id IN (?)", [ids])) (tagMap[r.artwork_id] ||= []).push(r.tag_id);
  for (const r of await q("SELECT artwork_id, COUNT(*) n FROM favorites WHERE artwork_id IN (?) GROUP BY artwork_id", [ids])) favCount[r.artwork_id] = r.n;
  for (const r of await q("SELECT artwork_id, COUNT(*) n FROM cart_items WHERE artwork_id IN (?) GROUP BY artwork_id", [ids])) cartCount[r.artwork_id] = r.n;
  const artworks = shown.map((a) => ({
    id: a.id, artist: a.artist_id, title: a.title, desc: a.description,
    // รูปผลงาน: img = ภาพปก (รูปแรก), imgs = ทุกรูป, imgIds = id ของแต่ละรูป (ใช้ตอนแก้ไขลำดับ), caps = คำบรรยายสำเร็จรูป
    img: url(imgMap[a.id]?.[0]?.file_path), imgs: (imgMap[a.id] || []).map((x) => url(x.file_path)),
    imgIds: (imgMap[a.id] || []).map((x) => x.id), caps: (imgMap[a.id] || []).map((x) => x.caption_key),
    price: Number(a.price), sale: a.sale_percent, purpose: a.purpose, format: a.format, avail: a.availability,
    status: a.status, hidden: !!a.moderation_hidden, best: !!a.is_bestseller, created: ms(a.created_at),
    tags: tagMap[a.id] || [], favCount: favCount[a.id] || 0, inCarts: a.carts_seed + (cartCount[a.id] || 0),
  }));

  // ---------- ความคิดเห็น / รีวิวผลงาน ----------
  const comments = (await q("SELECT * FROM artwork_comments WHERE artwork_id IN (?) ORDER BY created_at", [ids]))
    .map((c) => ({ id: c.id, art: c.artwork_id, by: c.author_id, body: c.body, at: ms(c.created_at) }));
  const artReviews = (await q(
    "SELECT r.*, u.display_name FROM artwork_reviews r JOIN users u ON u.id = r.user_id WHERE r.artwork_id IN (?) ORDER BY r.created_at DESC", [ids],
  )).map((r) => ({ id: r.id, art: r.artwork_id, by: r.user_id, name: r.display_name, rating: r.rating, body: r.body,
    cats: r.categories ? r.categories.split(",") : [], photo: url(r.photo_path), at: ms(r.created_at) }));

  // ---------- รีวิวงานจ้าง (สาธารณะ ใช้คำนวณคะแนนศิลปิน) ----------
  const reviews = {};
  for (const r of await q(`SELECT r.*, c.artist_id, c.customer_id, u.display_name FROM commission_reviews r
      JOIN commission_requests c ON c.id = r.request_id JOIN users u ON u.id = c.customer_id`)) {
    reviews[r.request_id] = { rating: r.rating, body: r.body, at: ms(r.created_at), artist: r.artist_id, customer: r.customer_id, customerName: r.display_name };
  }

  // ---------- ออเดอร์ ----------
  const orders = orderRows.map((o) => ({
    id: o.id, buyer: o.buyer_id, artist: o.artist_id, shipping: Number(o.shipping_fee), pay: o.pay_method, status: o.status,
    tracking: o.tracking_no || "", at: ms(o.created_at),
    address: o.ship_address ? { name: o.ship_name, phone: o.ship_phone, addr: o.ship_address } : null,
    items: orderItems.filter((i) => i.order_id === o.id).map((i) => ({ art: i.artwork_id, price: Number(i.price), format: i.format, opt: i.option_key, note: i.note })),
  }));

  // ---------- งานจ้าง (เฉพาะงานที่เราเป็นลูกค้าหรือศิลปิน) ----------
  let commissions = [], messages = [], sketches = {};
  if (me) {
    const crs = await q("SELECT * FROM commission_requests WHERE customer_id = ? OR artist_id = ? ORDER BY updated_at DESC", [me, me]);
    const cids = inList(crs.map((c) => c.id));
    const ctags = {};
    for (const r of await q("SELECT request_id, tag_id FROM commission_request_tags WHERE request_id IN (?)", [cids])) (ctags[r.request_id] ||= []).push(r.tag_id);
    commissions = crs.map((c) => ({
      id: c.id, customer: c.customer_id, artist: c.artist_id, desc: c.description, budget: Number(c.budget), deadline: c.deadline,
      artType: c.art_type, delivery: c.delivery_method, tags: ctags[c.id] || [], status: c.status,
      quote: c.quote_price === null ? null : Number(c.quote_price), quoteDeadline: c.quote_deadline, quoteStatus: c.quote_status,
      created: ms(c.created_at), updated: ms(c.updated_at),
      ref: c.reference_image_path ? `/api/commissions/${c.id}/reference` : null, // ไฟล์ส่วนตัว ต้องโหลดพร้อมโทเคน
    }));
    messages = (await q("SELECT * FROM request_messages WHERE request_id IN (?) ORDER BY created_at, id", [cids]))
      .map((m) => ({ id: m.id, req: m.request_id, by: m.sender_id, body: m.body, at: ms(m.created_at) }));
    for (const s of await q("SELECT * FROM commission_sketches WHERE request_id IN (?)", [cids])) {
      sketches[s.request_id] = { status: s.status, note: s.artist_note, feedback: s.customer_feedback, at: ms(s.created_at), v: s.round_no, img: `/api/commissions/${s.request_id}/sketch` };
    }
  }

  // ---------- ข้อความส่วนตัว ----------
  let threads = [];
  if (me) {
    const trs = await q("SELECT * FROM message_threads WHERE user_a = ? OR user_b = ?", [me, me]);
    const tids = inList(trs.map((x) => x.id));
    const msgs = await q("SELECT * FROM thread_messages WHERE thread_id IN (?) ORDER BY created_at, id", [tids]);
    const reads = await q("SELECT * FROM thread_reads WHERE thread_id IN (?)", [tids]);
    threads = trs.map((x) => ({
      id: x.id, a: x.user_a, b: x.user_b, about: x.artwork_id,
      read: Object.fromEntries(reads.filter((r) => r.thread_id === x.id).map((r) => [r.user_id, ms(r.read_at)])),
      msgs: msgs.filter((m) => m.thread_id === x.id).map((m) => ({ by: m.sender_id, body: m.body, at: ms(m.created_at) })),
    })).filter((x) => x.msgs.length);
  }

  // ---------- การแจ้งเตือน ----------
  const notifications = me
    ? (await q("SELECT * FROM notifications WHERE recipient_id = ? ORDER BY created_at DESC, id DESC LIMIT 100", [me])).map((n) => ({
        id: n.id, to: n.recipient_id, kind: n.icon, key: n.msg_key, vars: safeJson(n.vars), body: n.body, link: n.link || "#/", at: ms(n.created_at), read: !!n.read_at,
      }))
    : [];

  // ---------- เฉพาะแอดมิน ----------
  let reports = [], stats = null;
  if (isAdmin) {
    reports = (await q("SELECT * FROM artwork_reports ORDER BY status = 'open' DESC, created_at DESC"))
      .map((r) => ({ id: r.id, art: r.artwork_id, by: r.reporter_id, reason: r.reason, details: r.details, status: r.status, at: ms(r.created_at) }));
    const [[oc]] = await pool.query("SELECT COUNT(*) n FROM orders");
    const [[cc]] = await pool.query("SELECT COUNT(*) n FROM commission_requests");
    stats = { orders: oc.n, commissions: cc.n };
  }

  return {
    me, impersonator: user?.impersonator || null, myProfiles,
    users, tags, profiles, artworks, comments, artReviews, reviews, orders, commissions, messages, sketches, threads, notifications, reports, stats,
    favorites: myFavs.map((r) => [me, r.artwork_id]),
    follows: me ? (await q("SELECT artist_id FROM artist_follows WHERE follower_id = ?", [me])).map((r) => [me, r.artist_id]) : [],
    cart: myCart.map((r) => r.artwork_id),
    cartOpts: Object.fromEntries(myCart.map((r) => [r.artwork_id, { opt: r.option_key, note: r.note }])),
  };
}

function safeJson(s) {
  try { return JSON.parse(s || "{}"); } catch { return {}; }
}

module.exports = { buildState };
