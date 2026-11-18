// สร้างการแจ้งเตือน
// msgKey + vars จะถูกแปลเป็นไทย/อังกฤษที่หน้าเว็บ (ดูคีย์ n_... ใน frontend/js/i18n.js)
const pool = require("../config/db");

async function notify({ to, actor = null, icon = "🔔", key, vars = {}, body = "", link = null }, conn = pool) {
  if (!to || to === actor) return; // ไม่แจ้งเตือนตัวเอง
  await conn.query(
    "INSERT INTO notifications (recipient_id, actor_id, icon, msg_key, vars, body, link) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [to, actor, icon, key, JSON.stringify(vars), String(body).slice(0, 500), link],
  );
}

async function notifyAdmins(payload) {
  const [admins] = await pool.query("SELECT id FROM users WHERE role = 'admin' AND suspended_at IS NULL");
  for (const a of admins) await notify({ ...payload, to: a.id });
}

module.exports = { notify, notifyAdmins };
