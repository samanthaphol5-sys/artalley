// =====================================================================
// store.js — ข้อมูลทั้งหมดของหน้าเว็บ (โหลดจาก GET /api/state) และฟังก์ชันคำนวณ
// =====================================================================
let db = null;   // สถานะจากเซิร์ฟเวอร์
let me = 0;      // id โปรไฟล์ที่ใช้อยู่ (0 = ผู้เยี่ยมชม)
let TAGS = [];
const pages = {}; // แต่ละหน้าอยู่ใน js/pages/*.js

const tagById = (id) => TAGS.find((x) => x.id === id) || { th: "?", en: "?" };
const tn = (id) => tagById(id)[lang];
const SOCIALS = [["instagram", "Instagram"], ["x", "X"], ["facebook", "Facebook"], ["tiktok", "TikTok"], ["website", "Website"]];
const DEFAULT_SHIP = { prep: 3, min: 2, max: 4, fee: 60, returns: 7 };
const shipOf = (artistId) => ({ ...DEFAULT_SHIP, ...(db.profiles[artistId]?.ship || {}) });

const user = (id) => db.users.find((u) => u.id === id);
const artwork = (id) => db.artworks.find((a) => a.id === id);
const visible = (a) => a && a.status === "published" && !a.hidden && !user(a.artist)?.suspended;
const meU = () => (me ? user(me) : null);
const cart = () => (db.carts[me] = db.carts[me] || []);
const canBuy = (u) => !u || u.role === "customer"; // Only Customer mode may buy or commission; guests must sign in.
// 1 บัญชี (อีเมล/รหัสผ่านเดียว) มีโปรไฟล์ลูกค้าและศิลปินแยกกัน — รายการมาจาก db.myProfiles
const linkedProfiles = (u) => (u ? (db.myProfiles || []).map((p) => user(p.id)).filter(Boolean) : []);
const counterpart = (u) => linkedProfiles(u).find(x => x.role !== u.role);
const accountRoleCard = (u) => {
  if (!u || u.role === "admin") return "";
  const other = counterpart(u);
  const target = u.role === "artist" ? "customer" : "artist";
  return `<section class="card" style="margin-top:1rem;border:1px solid var(--wine,#74171c)">
    <span class="eyebrow">${lang === "th" ? "บัญชีของคุณ" : "YOUR ACCOUNTS"}</span>
    <h3 style="margin:.5rem 0">${lang === "th" ? "บัญชีที่ใช้อยู่" : "Active profile"}: ${t("role_" + u.role)}</h3>
    <p class="sm muted">${esc(u.email)} · ${lang === "th" ? "ใช้อีเมลเดียวกันสำหรับทั้งสองโปรไฟล์" : "One email, two separate profiles"}</p>
    ${other ? `<button type="button" class="btn full" data-act="switch-linked" data-id="${other.id}">${lang === "th" ? "สลับเป็นบัญชี" : "Switch to"} ${t("role_" + other.role)}</button>`
      : `<button type="button" class="btn full" data-act="create-linked" data-role="${target}">${lang === "th" ? "สร้างบัญชี" : "Create"} ${t("role_" + target)}</button>`}
    <p class="xs muted" style="margin-top:.8rem">${lang === "th" ? "บัญชีศิลปินจัดการผลงานและรับงานจ้างเท่านั้น หากต้องการซื้อหรือจ้างศิลปิน ให้สลับเป็นบัญชีลูกค้า" : "Artist mode manages artworks and commissions only. Switch to Customer to buy or commission."}</p>
  </section>`;
};
const redirect = (hash) => { setTimeout(() => go(hash)); return ""; };
const eff = (a) => Math.round(a.price * (1 - (a.sale || 0) / 100));
const FRAME_FEE = 450;
const optionDef = (a) => a.format === "physical"
  ? { key: "opt_frame", choices: [["none", 0, () => t("frame_none")], ["oak", FRAME_FEE, () => t("frame_oak", { p: baht(FRAME_FEE) })], ["black", FRAME_FEE, () => t("frame_black", { p: baht(FRAME_FEE) })]] }
  : { key: "opt_license", choices: [["personal", 0, () => t("lic_personal")], ["commercial", Math.round(eff(a) * 1.5), () => t("lic_commercial", { p: baht(Math.round(eff(a) * 1.5)) })]] };
const cartOpt = (a) => ((db.cartOpts[me] = db.cartOpts[me] || {})[a.id]) || { opt: optionDef(a).choices[0][0], note: "" };
const optLabel = (a, opt) => { const c = optionDef(a).choices.find((x) => x[0] === opt); return c ? c[2]().replace(/ \(\+.*\)$/, "") : ""; };
const linePrice = (a, opt = cartOpt(a).opt) => eff(a) + (optionDef(a).choices.find((x) => x[0] === opt)?.[1] || 0);
const threadUnread = (th, uid) => th.msgs.filter((m) => m.by !== uid && m.at > (th.read[uid] || 0)).length;
const unreadDMs = (uid) => db.threads.filter((th) => th.a === uid || th.b === uid).reduce((n, th) => n + threadUnread(th, uid), 0);
const buyable = (a) => visible(a) && a.purpose === "for_sale" && a.avail === "available";

function artistInfo(id) {
  const u = user(id), p = db.profiles[id];
  if (!u || !p) return null;
  const arts = db.artworks.filter((a) => a.artist === id && visible(a));
  const tagSet = new Set([...p.tags, ...arts.flatMap((a) => a.tags)]);
  const revs = Object.values(db.reviews).filter((r) => r.artist === id);
  return { ...u, ...p, arts, tags: [...tagSet], reviews: revs, followers: p.followers || 0,
    rating: (() => { const rs = [...revs.map((r) => r.rating), ...(db.artReviews || []).filter((r) => artwork(r.art)?.artist === id).map((r) => r.rating)];
      return rs.length ? +(rs.reduce((x, y) => x + y, 0) / rs.length).toFixed(1) : null; })(),
    types: [p.physical && "physical", p.digital && "digital"].filter(Boolean) };
}
const artists = () => db.users.filter((u) => u.role === "artist" && db.profiles[u.id] && !u.suspended).map((u) => artistInfo(u.id));
const STATUS_CLS = { pending: "warn", accepted: "wine", delivered: "wine", completed: "ok", declined: "bad", cancelled: "bad" };
const pillStatus = (s) => `<span class="pill ${STATUS_CLS[s]}">${t("s_" + s)}</span>`;
const typesText = (types) => types.map((x) => t(x)).join(" / ");

