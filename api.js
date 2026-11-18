// =====================================================================
// api.js — คุยกับ backend
//   api("/api/xxx")                                  GET
//   api("/api/xxx", { method: "POST", body: {...} })  ส่ง JSON
//   api("/api/xxx", { method: "POST", form: fd })     ส่งไฟล์ (FormData)
// =====================================================================
const TOKEN_KEY = "artalley_token";
const ADMIN_TOKEN_KEY = "artalley_admin_token"; // เก็บโทเคนแอดมินไว้ตอน "เข้าใช้ในฐานะ"

const getToken = () => localStorage.getItem(TOKEN_KEY);
function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function api(path, { method = "GET", body, form } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body !== undefined) { headers["Content-Type"] = "application/json"; payload = JSON.stringify(body); }
  let res;
  try {
    res = await fetch(path, { method, headers, body: payload });
  } catch {
    throw Object.assign(new Error(t("serverDown")), { status: 0 });
  }
  const data = await res.json().catch(() => ({}));
  if (res.status === 401 && token && path !== "/api/auth/login") setToken(null); // โทเคนหมดอายุ
  if (!res.ok) throw Object.assign(new Error(data.error || `Error ${res.status}`), { status: res.status, code: data.code, reason: data.reason });
  return data;
}

// ---------- โหลดสถานะทั้งหมดจากเซิร์ฟเวอร์ ----------
async function loadState() {
  const s = await api("/api/state");
  me = s.me || 0;
  TAGS = s.tags;
  // จัดรูปแบบให้ตรงกับโค้ดหน้าเว็บ: carts/cartOpts แยกตาม id โปรไฟล์ (ผู้เยี่ยมชมไม่มีตะกร้า ต้องเข้าสู่ระบบก่อนซื้อ)
  s.carts = { [me]: me ? s.cart : [] };
  s.cartOpts = { [me]: me ? s.cartOpts : {} };
  db = s;
}
async function refresh() {
  await loadState();
  render();
}

// ---------- รูปส่วนตัว: โหลดด้วยโทเคนแล้วแสดงเป็น blob ----------
const privCache = new Map();
function hydratePrivateImages() {
  document.querySelectorAll("img[data-psrc]").forEach(async (img) => {
    const src = img.dataset.psrc;
    if (!privCache.has(src)) {
      privCache.set(src, fetch(src, { headers: { Authorization: `Bearer ${getToken()}` } })
        .then((r) => (r.ok ? r.blob() : null)).then((b) => (b ? URL.createObjectURL(b) : null)).catch(() => null));
    }
    const url = await privCache.get(src);
    if (url) img.src = url;
  });
}

// ---------- อัปโหลดรูปเดี่ยว (รูปโปรไฟล์ / รูปปก) ----------
async function uploadImage(path, field, blob, okMsg) {
  const fd = new FormData();
  fd.append(field, blob, field + ".jpg");
  try { await api(path, { method: "PUT", form: fd }); toast(okMsg); await refresh(); }
  catch (err) { toast(err.message, true); }
}
// data URL (จากการย่อรูปในเบราว์เซอร์) -> Blob สำหรับอัปโหลด
async function dataUrlToBlob(dataUrl) {
  return (await fetch(dataUrl)).blob();
}

// ---------- ดาวน์โหลดไฟล์ผลงานดิจิทัลที่ซื้อแล้ว ----------
async function downloadArt(orderId, art) {
  const res = await fetch(`/api/orders/${orderId}/items/${art.id}/file`, { headers: { Authorization: `Bearer ${getToken()}` } });
  if (!res.ok) return toast((await res.json().catch(() => ({}))).error || "Download failed", true);
  const blob = await res.blob();
  const name = (res.headers.get("Content-Disposition") || "").match(/filename\*?=(?:UTF-8'')?"?([^";]+)/i);
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = name ? decodeURIComponent(name[1]) : `${art.title}.png`;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(link.href), 2000);
}
