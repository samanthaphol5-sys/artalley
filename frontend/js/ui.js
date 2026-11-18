// =====================================================================
// ui.js — ฟังก์ชันช่วยแสดงผลและคอมโพเนนต์ที่ใช้ร่วมกันทุกหน้า
// ทุกข้อความจากผู้ใช้ต้องผ่าน esc() ก่อนใส่ใน HTML (กัน XSS)
// =====================================================================
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const imgExt = (d) => ({ "image/svg+xml": "svg", "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[((d || "").match(/^data:([^;,]+)/) || [])[1]] || "png");
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const baht = (n) => (n == null || n === "" ? "-" : "฿" + Number(n).toLocaleString("en-US"));
const locale = () => (lang === "th" ? "th-TH" : "en-GB");
function when(ts) {
  const m = Math.round((Date.now() - ts) / 6e4);
  if (m < 1) return t("ago_now");
  if (m < 60) return t("ago_m", { n: m });
  if (m < 1440) return t("ago_h", { n: Math.round(m / 60) });
  if (m < 10080) return t("ago_d", { n: Math.round(m / 1440) });
  return new Date(ts).toLocaleDateString(locale(), { day: "numeric", month: "short" });
}
const fmtDate = (s) => (s ? new Date(s).toLocaleDateString(locale(), { day: "numeric", month: "short", year: "numeric" }) : t("notSet"));
function toast(msg, err) {
  const el = document.createElement("div");
  el.className = "toast" + (err ? " err" : "");
  el.textContent = msg;
  $("#toasts").append(el);
  setTimeout(() => el.remove(), 2800);
}
const ICON = {
  cart: '<path d="M3 4h2l2.4 11.2a1 1 0 0 0 1 .8h9.2a1 1 0 0 0 1-.8L20 8H6.2"/><circle cx="9" cy="20" r="1.3"/><circle cx="17" cy="20" r="1.3"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9M10 21a2 2 0 0 0 4 0"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>',
  down: '<path d="M6 9l6 6 6-6"/>', up: '<path d="M6 15l6-6 6 6"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  heart: '<path d="M12 20s-7-4.4-9-9.2C1.7 7.5 4 4 7.4 4c2 0 3.4 1.1 4.6 2.6C13.2 5.1 14.6 4 16.6 4 20 4 22.3 7.5 21 10.8 19 15.6 12 20 12 20z"/>',
  spark: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>',
  image: '<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5-9 9"/>',
  link: '<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>',
};
const icon = (n) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n]}</svg>`;


const AVC = ["#6e1f22", "#2d6a48", "#3d5a80", "#8a5a00", "#5f0f40", "#264653", "#9d4e15", "#4a4e69"];
const av = (u, size = "") => u.avatar
  ? `<span class="av ${size}" aria-hidden="true"><img src="${u.avatar}" alt=""></span>`
  : `<span class="av ${size}" style="background:${AVC[u.id % AVC.length]}" aria-hidden="true">${esc(u.name.trim()[0])}</span>`;
const stars = (n) => `<span class="stars" aria-label="${n}/5">${"★".repeat(Math.round(n))}${"☆".repeat(5 - Math.round(n))}</span>`;


// ---------------- shared components ----------------
function workCard(a) {
  const u = meU();
  const fav = u && db.favorites.some(([x, y]) => x === u.id && y === a.id);
  const availTxt = a.purpose === "portfolio" ? "" : a.avail !== "available" ? t(a.avail) : ""; // ผลงานโชว์ไม่มีสถานะการขาย
  return `<article class="work">
    <div class="frame">
      <a href="#/artwork/${a.id}" tabindex="-1" aria-hidden="true"><img src="${a.img}" alt="" loading="lazy"></a>
      <span class="fmt">${t(a.format)}</span>
      ${canBuy(u) && !(u && u.id === a.artist) ? `<button class="heart" data-act="fav" data-id="${a.id}" aria-pressed="${!!fav}" aria-label="${t(fav ? "savedOn" : "saveIt")}">${icon("heart")}</button>` : ""}
      ${availTxt ? `<span class="avail">${availTxt}</span>` : ""}
    </div>
    <div class="by">${esc(user(a.artist).name)}</div>
    <div class="tl"><a href="#/artwork/${a.id}">${esc(a.title)}</a><span class="price">${a.purpose === "for_sale" ? `${a.sale ? `<span class="price-old">${baht(a.price)}</span>` : ""}${baht(eff(a))}` : ""}</span></div>
    <div class="sub">${a.tags.map(tn).join(" · ")}</div>
  </article>`;
}
function artistRow(a, { hits = [], selTags = [], showMatch = false } = {}) {
  const cover = a.arts[0];
  return `<div class="mrow">
    <a class="ph" href="#/artist/${a.id}" tabindex="-1" aria-hidden="true">${cover ? `<img src="${cover.img}" alt="">` : icon("image")}</a>
    <div>
      <h3><a href="#/artist/${a.id}">${esc(a.name)}</a></h3>
      <div class="meta">${t("fromPrice", { p: baht(a.min) })} · ${typesText(a.types)}${a.city ? ` · ${esc(a.city)}` : ""}${a.rating ? ` · ${stars(a.rating)} ${a.rating}` : ""}</div>
      <div class="chips">${a.tags.map((x) => `<span class="tag ${hits.includes(x) ? "hit" : ""}">${tn(x)}</span>`).join("")}</div>
      ${showMatch && selTags.length ? `<div class="xs muted" style="margin-top:.45rem">${t("matchCount", { m: hits.length, t: selTags.length })}</div>` : ""}
      ${!a.open ? `<div style="margin-top:.4rem"><span class="pill">${t("closed")}</span></div>` : ""}
    </div>
    <div class="act">
      <a class="btn line" href="#/artist/${a.id}">${t("viewProfile")}</a>
      ${a.open && canBuy(meU()) && a.id !== meU()?.id ? `<a class="btn" href="#/commission-new/${a.id}/${selTags.join(",")}">${t("selectArtist")}</a>` : ""}
    </div>
  </div>`;
}
const chips = (tags, name, sel = [], type = "checkbox") => tags.map((x) => `<label class="chip"><input type="${type}" name="${name}" value="${x.id}" ${sel.includes(x.id) ? "checked" : ""}>${esc(x[lang])}</label>`).join("");
const tagFields = (sel = [], name = "tag") => [["style", "styleTags"], ["subject", "subject"]].map(([cat, label]) => `<div class="field"><label class="f">${t(label)}</label><div class="chips">${chips(TAGS.filter((x) => x.cat === cat), name, sel)}</div></div>`).join("");
const checked = (root, name) => $$(`input[name="${name}"]:checked`, root).map((i) => +i.value);
let loginNext = null;
let pendingBuy = null; // ผู้เยี่ยมชมกดซื้อ → เก็บไว้ทำต่อหลังเข้าสู่ระบบ
let formImgs = [], formImgsFor = null; // รูปในฟอร์มลงผลงาน
const MAX_IMGS = 8;
const needLogin = () => { loginNext = currentHash; return `<div class="narrow page"><div class="empty">${t("needLogin")}<br><br><a class="btn" href="#/login">${t("signIn")}</a></div></div>`; };
const onlyFor = (r) => `<div class="narrow page"><div class="empty">${t("onlyFor", { r })}</div></div>`;
const notFound = () => `<div class="narrow page"><div class="empty">${t("notFound")}</div></div>`;
const head = (eyebrow, title, lead) => `${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ""}<h1 class="display">${title}</h1>${lead ? `<p class="lead">${lead}</p>` : ""}`;
function socialLinks(s) {
  const items = SOCIALS.filter(([k]) => s?.[k]);
  if (!items.length) return `<p class="sm muted">${t("noSocial")}</p>`;
  const url = (k, v) => (/^https?:/.test(v) ? v : k === "website" ? "https://" + v : `https://${{ instagram: "instagram.com", x: "x.com", facebook: "facebook.com", tiktok: "tiktok.com/@" }[k]}${k === "tiktok" ? "" : "/"}${v}`);
  return `<div class="socials">${items.map(([k, label]) => `<a href="${esc(url(k, s[k]))}" target="_blank" rel="noopener">${icon("link")}${label}<span class="muted">${k === "website" ? "" : " @" + esc(s[k].replace(/^@/, ""))}</span></a>`).join("")}</div>`;
}
const howBox = () => `<div class="how">${[["how1", "#/match"], ["how2", "#/match"], ["how3", "#/artists"], ["how4", "#/commissions"]].map(([k, href], i) => `<a href="${href}"><b>${i + 1}</b><p>${t(k)}</p></a>`).join("")}</div>`;
function artistBand() {
  const [href, label] = meU()?.role === "artist" ? ["#/dashboard", t("goDashboard")] : ["#/join", t("joinArtist")];
  return `<section class="band"><span class="eyebrow">${t("bandEyebrow")}</span><h2>${t("bandTitle")}</h2><p>${t("bandText")}</p><a class="btn s" href="${href}">${label} →</a></section>`;
}


// ---------------- รูปส่วนตัว (รูปอ้างอิง / สเก็ตช์) ต้องโหลดพร้อมโทเคน ----------------
const privImg = (src, attrs = "") => `<img data-psrc="${esc(src)}" ${attrs}>`;

// ---------------- แกลเลอรีหน้าสินค้า (a.imgs = รูปทั้งหมด, a.caps = คำบรรยาย) ----------------
function gallery(a) { return (a.imgs && a.imgs.length ? a.imgs : [a.img]).map((src, i) => [src, a.caps?.[i] || null]); }
const galCap = (k, i) => (k ? t(k) : t("imgN", { n: i + 1 }));

// ---------------- หน้าต่างยืนยัน / ติดต่อศิลปิน ----------------
let contactFor = null; // { artist, art }
let askResolve = null;
function ask({ title, body = "", ok, danger = false, input = null }) {
  return new Promise((resolve) => {
    askResolve = resolve;
    $("#modal-root").innerHTML = `<div class="modal" data-act="ask-cancel" role="alertdialog" aria-modal="true" aria-labelledby="ask-t"><div style="max-width:440px">
      <h2 id="ask-t" style="font-size:1.3rem">${esc(title)}</h2>${body ? `<p class="sm muted">${esc(body)}</p>` : ""}
      ${input ? `<div class="field"><label class="f" for="ask-in">${esc(input)}</label><textarea id="ask-in" style="min-height:80px"></textarea></div>` : ""}
      <div class="row" style="justify-content:flex-end;margin-top:1rem"><button class="btn line" data-act="ask-cancel">${t("cancel")}</button><button class="btn ${danger ? "bad" : ""}" data-act="ask-ok">${esc(ok || t("yes"))}</button></div></div></div>`;
    setTimeout(() => ($("#ask-in") || $("[data-act=ask-ok]"))?.focus());
  });
}
function closeAsk(value) { $("#modal-root").innerHTML = ""; const r = askResolve; askResolve = null; r && r(value); }
function contactModal() {
  if (!contactFor) return "";
  const ar = artistInfo(contactFor.artist), arts = ar.arts;
  return `<div class="modal" data-act="contact-close" role="dialog" aria-modal="true" aria-labelledby="ct-title"><div>
    <div class="row between" style="margin-bottom:.3rem"><div class="row">${av(ar)}<div><h2 id="ct-title" style="margin:0;font-size:1.35rem">${t("contactTitle", { a: esc(ar.name) })}</h2><div class="xs muted">${t("replyTime")}</div></div></div>
      <button class="btn ghost s" data-act="contact-close" aria-label="${t("close")}">✕</button></div>
    <p class="sm muted">${t("contactLead")}</p>
    <form data-form="contact" data-id="${ar.id}">
      <div class="two"><div class="field"><label class="f" for="ct-topic">${t("topic")}</label><select id="ct-topic" name="topic">${["general", "artwork", "commission", "collab"].map((k) => `<option value="${k}" ${(contactFor.art ? "artwork" : "general") === k ? "selected" : ""}>${t("tp_" + k)}</option>`).join("")}</select></div>
        <div class="field"><label class="f" for="ct-art">${t("whichArtwork")}</label><select id="ct-art" name="art"><option value="">${t("noneSel")}</option>${arts.map((x) => `<option value="${x.id}" ${contactFor.art === x.id ? "selected" : ""}>${esc(x.title)}</option>`).join("")}</select></div></div>
      <div class="field"><label class="f" for="ct-msg">${t("yourMsg")}</label><textarea id="ct-msg" name="body" placeholder="${t("msgPh")}" style="min-height:120px"></textarea></div>
      <button class="btn full">${t("sendMsg")}</button>
    </form>
    ${Object.keys(ar.social || {}).length ? `<div style="margin-top:1.2rem"><span class="eyebrow">${t("orReach")}</span>${socialLinks(ar.social)}</div>` : ""}
  </div></div>`;
}
