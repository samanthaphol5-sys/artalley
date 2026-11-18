// =====================================================================
// app.js — เมนูด้านบน/ล่าง, ตัวเปลี่ยนหน้า (router) และการกดปุ่ม/ส่งฟอร์มทั้งหมด
// =====================================================================
// ---------------- header, footer, switcher ----------------
let openMenu = null; // "find" | "acct" | null
// เมนูแยกตามประเภทบัญชี
function navLinks(u) {
  if (u?.role === "artist") {
    const toShip = db.orders.filter((o) => o.artist === u.id && o.status === "paid" && o.address).length;
    const todo = db.commissions.filter((c) => c.artist === u.id && nextStep(c, u.id)).length;
    return [["#/explore", t("explore"), "explore"], ["FIND"], ["#/dashboard/artworks", t("tabArtworks"), "dashboard/artworks"],
      ["#/dashboard/orders", t("tabOrders"), "dashboard/orders", toShip], ["#/dashboard/commissions", t("tabCommissions"), "dashboard/commissions", todo]];
  }
  if (u?.role === "admin") return [["#/", t("home"), "home"], ["#/explore", t("explore"), "explore"], ["#/admin", t("admin"), "admin"]];
  const list = [["#/", t("home"), "home"], ["#/explore", t("explore"), "explore"], ["FIND"]];
  list.push(["#/commissions", t("myCommissions"), "commissions", u ? db.commissions.filter((c) => c.customer === u.id && nextStep(c, u.id)).length : 0]);
  return list;
}
const buyerLinks = (u) => { const todo = db.commissions.filter((c) => c.customer === u.id && nextStep(c, u.id)).length;
  return `<a href="#/orders">${t("myOrders")}</a><a href="#/commissions">${t("myCommissions")}${todo ? `<span class="nb">${todo}</span>` : ""}</a><a href="#/saved">${t("saved")}</a><a href="#/cart">${t("cart")}</a>`; };
function accountLinks(u, inDrawer = false) { // inDrawer: ไม่ซ้ำกับลิงก์ที่อยู่ในเมนูหลักแล้ว
  if (!u) return `<a href="#/login">${icon("user")}<span>${t("signIn")}</span></a><a href="#/join">${icon("spark")}<span>${t("joinArtist")}</span></a>`;
  const out = `<a href="#/messages">${t("messages")}</a><a href="#/notifications">${t("notifications")}</a><a href="#/account">${t("settings")}</a><hr><button data-act="logout">${t("signOut")}</button>`;
  if (u.role === "artist") return `${inDrawer ? "" : `<a href="#/dashboard/artworks">${t("tabArtworks")}</a><a href="#/dashboard/orders">${t("tabOrders")}</a><a href="#/dashboard/commissions">${t("tabCommissions")}</a>`}<a href="#/artwork-form/new">${t("uploadArt")}</a><hr><a href="#/account">${lang === "th" ? "สลับ / สร้างบัญชีลูกค้า" : "Switch / create Customer"}</a><hr><a href="#/artist/${u.id}">${t("myPublicProfile")}</a>${out}`;
  if (u.role === "admin") return `${inDrawer ? "" : `<a href="#/admin">${t("admin")}</a><hr>`}${out}`;
  return `<a href="#/account">${lang === "th" ? "สลับ / สร้างบัญชีศิลปิน" : "Switch / create Artist"}</a><hr><a href="#/orders">${t("myOrders")}</a>${inDrawer ? "" : `<a href="#/commissions">${t("myCommissions")}</a>`}<a href="#/saved">${t("saved")}</a><a href="#/cart">${t("cart")}</a><hr>${out}`;
}
const langToggle = () => `<div class="lang" role="group" aria-label="${t("language")}"><button data-act="lang" data-v="th" class="${lang === "th" ? "on" : ""}" aria-pressed="${lang === "th"}">TH</button><button data-act="lang" data-v="en" class="${lang === "en" ? "on" : ""}" aria-pressed="${lang === "en"}">EN</button></div>`;

function chrome(route, sub) {
  const full = sub ? route + "/" + sub : route;
  const u = meU();
  document.documentElement.lang = lang;
  $("#demo-bar").textContent = t("demoBar");
  const unread = u ? db.notifications.filter((n) => n.to === u.id && !n.read).length : 0;
  const cartN = cart().length;
  const favN = u ? db.favorites.filter(([x, y]) => x === u.id && visible(artwork(y))).length : 0;
  const findOn = route === "match" || route === "artists";
  $("#bar").classList.toggle("long", u?.role === "artist");
  $("#bar").innerHTML = `
    <a class="wordmark" href="${u?.role === "artist" ? "#/dashboard" : "#/"}">Art Alley</a>${u?.role === "artist" ? `<span class="studio">${t("studio")}</span>` : ""}
    <nav class="nav" aria-label="main">
      ${navLinks(u).map(([href, label, key, n]) => href === "FIND"
        ? `<div class="dd"><button data-act="menu" data-v="find" class="${findOn ? "on" : ""}" aria-expanded="${openMenu === "find"}">${t("findArtist")} ${icon(openMenu === "find" ? "up" : "down")}</button>
        ${openMenu === "find" ? `<div class="dd-menu"><a href="#/match">${icon("spark")}<span>${t("findYourArtist")}<small>${t("findYourArtistSub")}</small></span></a><a href="#/artists">${icon("search")}<span>${t("artistSearch")}<small>${t("artistSearchSub")}</small></span></a></div>` : ""}</div>`
        : `<a href="${href}" class="${full === key || (key === "dashboard/artworks" && full === "dashboard") ? "on" : ""}">${label}${n ? `<span class="nb">${n}</span>` : ""}</a>`).join("")}
    </nav>
    <div class="tools">
      ${canBuy(u) ? `<a class="icon-btn ${route === "saved" ? "on" : ""}" href="${u ? "#/saved" : "#/login"}" aria-label="${t("favorites")} (${favN})" title="${t("favorites")}">${icon("heart")}${favN ? `<b>${favN}</b>` : ""}</a>
      <a class="icon-btn ${route === "cart" ? "on" : ""}" href="#/cart" aria-label="${t("cart")} (${cartN})" title="${t("cart")}">${icon("cart")}${cartN ? `<b>${cartN}</b>` : ""}</a>` : ""}
      <a class="icon-btn ${route === "messages" ? "on" : ""}" href="#/messages" title="${t("messages")}" aria-label="${t("messages")} (${unreadDMs(u?.id)})">${icon("mail")}${unreadDMs(u?.id) ? `<b>${unreadDMs(u.id)}</b>` : ""}</a>
      <a class="icon-btn ${route === "notifications" ? "on" : ""}" href="#/notifications" title="${t("notifications")}" aria-label="${t("notifications")} (${unread})">${icon("bell")}${unread ? `<b>${unread}</b>` : ""}</a>
      ${u ? `<div class="dd acct"><button data-act="menu" data-v="acct" aria-expanded="${openMenu === "acct"}">${av(u, "xs")} <span class="acct-name">${esc(u.name)}</span> ${icon("down")}</button>
        ${openMenu === "acct" ? `<div class="dd-menu">${accountLinks(u)}</div>` : ""}</div>`
        : `<a class="btn s acct" href="#/login" style="display:inline-flex">${t("signIn")}</a>`}
      ${langToggle()}
      <button class="icon-btn menu-btn" data-act="drawer" aria-label="${t("menu")}">${icon("menu")}</button>
    </div>`;

  $("#foot").innerHTML = `<div class="wrap">
    <div><a class="wordmark" href="#/" style="font-size:1.3rem">Art Alley</a><p class="tagline">${t("tagline")}</p><p class="xs muted" style="max-width:22rem">${t("footNote")}</p></div>
    <div><span class="eyebrow">${t("discover")}</span><ul><li><a href="#/explore">${t("explore")}</a></li><li><a href="#/match">${t("findYourArtist")}</a></li><li><a href="#/artists">${t("artistSearch")}</a></li></ul></div>
    <div><span class="eyebrow">${t("platform")}</span><ul><li><a href="#/about">${t("howItWorks")}</a></li><li>${u?.role === "artist" ? `<a href="#/dashboard">${t("dashboard")}</a>` : `<a href="#/join">${t("joinArtist")}</a>`}</li>${canBuy(u) ? `<li><a href="#/cart">${t("cart")}</a></li>` : ""}</ul></div></div>`;

}

function drawer(open) {
  const u = meU();
  $("#drawer-root").innerHTML = open ? `<div class="drawer" data-act="drawer-close"><div>
    <div class="row between" style="margin-bottom:.5rem"><span class="wordmark" style="font-size:1.3rem">Art Alley</span>${langToggle()}</div>
    ${u ? `<a href="#/account" class="row" style="gap:.7rem">${av(u)}<span><b>${esc(u.name)}</b><small class="muted" style="display:block;font-size:.76rem">${t("role_" + u.role)}</small></span></a>` : `<a class="btn full" href="#/login" style="color:var(--on-wine);margin:.3rem 0">${t("signIn")}</a>`}
    ${u?.role === "artist" ? `<span class="studio" style="align-self:flex-start;margin:0 0 .5rem .5rem">${t("studio")}</span>` : ""}
    ${navLinks(u).map(([href, label, , n]) => href === "FIND" ? `<a href="#/match">${t("findYourArtist")}</a><a href="#/artists">${t("artistSearch")}</a>` : `<a href="${href}">${label}${n ? `<span class="nb">${n}</span>` : ""}</a>`).join("")}<a href="#/about">${t("howItWorks")}</a>
    <span class="eyebrow">${t("myAccount")}</span>${accountLinks(u, true).replace(/<hr>/g, "")}
  </div></div>` : "";
}

// ---------------- router ----------------
function render() {
  if (!db) return;
  const parts = currentHash.replace(/^#\/?/, "").split("/").filter(Boolean);
  const route = parts[0] || "home";
  const page = pages[route] || pages.home;
  chrome(route, parts[1]);
  const actBar = $("#act-bar");
  if (db.impersonator && meU()) { actBar.innerHTML = `<span>👁 ${t("actingAs", { n: esc(meU().name), r: t("role_" + meU().role) })}</span><button class="btn s" data-act="stop-act">${t("backToAdmin")}</button>`; actBar.classList.remove("hide"); }
  else actBar.classList.add("hide");
  if (meU()?.suspended) { $("#app").innerHTML = suspendedPage(meU()); return; }
  $("#app").innerHTML = page(...parts.slice(1));
  page.after && page.after(...parts.slice(1));
  $("#modal-root").innerHTML = contactModal();
  hydratePrivateImages();
}
// เปลี่ยนหน้า (ใช้ #/... ใน URL กดย้อนกลับของเบราว์เซอร์ได้)
let currentHash = location.hash || "#/";
function go(hash) {
  hash = hash || "#/";
  if (hash !== currentHash) { currentHash = hash; history.pushState(null, "", hash); }
  openMenu = null; contactFor = null; drawer(false); render(); window.scrollTo(0, 0);
}
window.addEventListener("popstate", () => { currentHash = location.hash || "#/"; openMenu = null; contactFor = null; drawer(false); render(); });

// =====================================================================
// การกดปุ่ม (data-act) — ทุกการเปลี่ยนข้อมูลส่งไป backend แล้วโหลดสถานะใหม่
// =====================================================================
async function run(fn, okMsg) {
  try {
    await fn();
    if (okMsg) toast(okMsg);
    await refresh();
    return true;
  } catch (err) {
    toast(err.message, true);
    if (err.status === 401) { await refresh(); }
    return false;
  }
}
const needLoginGo = () => { loginNext = currentHash; go("#/login"); };

document.addEventListener("click", async (e) => {
  // ลิงก์ภายในเว็บ (href="#/...")
  const link = e.target.closest('a[href^="#"]');
  if (link) {
    e.preventDefault();
    if (link.dataset.act === "read") {
      const n = db.notifications.find((x) => x.id === +link.dataset.id);
      if (n && !n.read) { n.read = true; api(`/api/notifications/${n.id}/read`, { method: "POST" }).catch(() => {}); }
    }
    const href = link.getAttribute("href");
    if (href.length > 1) go(href);
    return;
  }
  const goBtn = e.target.closest("[data-go]");
  if (goBtn) return go(goBtn.dataset.go);
  const el = e.target.closest("[data-act]");
  if (!el || el.tagName === "SELECT") { if (openMenu) { openMenu = null; render(); } return; }
  const act = el.dataset.act, id = +el.dataset.id, u = meU();

  // ---------- เมนู / หน้าต่าง / สถานะหน้าจอ ----------
  if (act === "menu") { openMenu = openMenu === el.dataset.v ? null : el.dataset.v; render(); return; }
  if (openMenu && act !== "lang") openMenu = null;
  if (act === "drawer") return drawer(true);
  if (act === "drawer-close") { if (e.target === el) drawer(false); return; }
  if (act === "lang") { lang = el.dataset.v; localStorage.setItem("artalley_lang", lang); render(); if ($(".drawer")) drawer(true); return; }
  if (act === "ask-ok") { const inp = $("#ask-in"); if (inp && !inp.value.trim()) { inp.classList.add("invalid"); return toast(t("needReason"), true); } return closeAsk(inp ? inp.value.trim() : true); }
  if (act === "ask-cancel") { if (e.target === el || el.tagName === "BUTTON") closeAsk(false); return; }
  if (act === "contact-close") { if (e.target === el || el.tagName === "BUTTON") { contactFor = null; $("#modal-root").innerHTML = ""; } return; }
  if (act === "contact") {
    if (!u) return needLoginGo();
    if (u.id === id) return toast(t("cantSelf"), true);
    contactFor = { artist: id, art: el.dataset.art ? +el.dataset.art : null };
    $("#modal-root").innerHTML = contactModal(); setTimeout(() => $("#ct-msg")?.focus()); return;
  }
  if (act === "aw-clear") { window.__awClear?.(); return; }
  if (act === "gal") { galleryIdx = +el.dataset.v; render(); return; }
  if (act === "desc-toggle") { descOpen = !descOpen; render(); return; }
  if (act === "note-open") { noteOpen = true; render(); setTimeout(() => $("#pnote")?.focus()); return; }
  if (act === "rv-filter") { rvFilter = el.dataset.v; rvAll = false; render(); $("#reviews")?.scrollIntoView(); return; }
  if (act === "rv-all") { rvAll = !rvAll; render(); if (!rvAll) $("#reviews")?.scrollIntoView(); return; }
  if (act === "ptab") { ptab = el.dataset.v; render(); return; }
  if (act === "pw-eye") { const inp = $("#" + el.dataset.for); const show = inp.type === "password"; inp.type = show ? "text" : "password"; el.textContent = t(show ? "hidePw" : "showPw"); return; }
  if (act === "demo-fill") { $("#le").value = el.dataset.email; $("#lp").value = "password123"; $("#le").classList.remove("invalid"); $("#lp").classList.remove("invalid"); $("form[data-form=login] button.btn.full").focus(); return; }
  if (act === "forgot") { toast(t("forgotMsg")); return; }

  // ---------- บัญชี ----------
  if (act === "logout") {
    if (db.impersonator) return stopActing();
    setToken(null); loginNext = null; drawer(false); await loadState(); toast(t("signedOutMsg")); go("#/"); return;
  }
  if (act === "stop-act") return stopActing();
  if (act === "avatar-remove") return run(() => api("/api/me/avatar", { method: "DELETE" }), t("picRemoved"));
  if (act === "cover-remove") return run(() => api("/api/me/cover", { method: "DELETE" }), t("coverRemoved"));
  if (act === "forgot-again") { forgotSent = null; render(); return; }
  if (act === "switch-linked") {
    const target = user(id);
    if (!target || !(await ask({ title: t("switchTitle"), body: t("switchBody", { r: t("role_" + target.role) }), ok: t("yesSwitch") }))) return;
    return useToken(() => api("/api/auth/switch", { method: "POST", body: { profileId: id } }), (r) => t("switched", { n: r.name }), (r) => (r.role === "artist" ? "#/dashboard" : "#/"));
  }
  if (act === "create-linked") {
    const role = el.dataset.role;
    if (!(await ask({ title: t("createTitle", { r: t("role_" + role) }), body: t("createBody", { r: t("role_" + role), e: u.email }), ok: t("yesConfirm") }))) return;
    return useToken(() => api("/api/auth/profiles", { method: "POST", body: { role } }), () => t("profileCreated"), (r) => (r.role === "artist" ? "#/account" : "#/"));
  }
  if (act === "dl") { downloadArt(+el.dataset.order, artwork(id)); return; }

  // ---------- บันทึก / ติดตาม ----------
  if (act === "fav") {
    if (!u) return needLoginGo();
    const on = db.favorites.some(([, y]) => y === id);
    return run(() => api(`/api/artworks/${id}/favorite`, { method: on ? "DELETE" : "POST" }), t(on ? "unsaved" : "savedOn"));
  }
  if (act === "follow") {
    if (!u) return needLoginGo();
    const on = db.follows.some(([, x]) => x === id);
    return run(() => api(`/api/artists/${id}/follow`, { method: on ? "DELETE" : "POST" }), t(on ? "unfollowed" : "followed"));
  }

  // ---------- ตะกร้า ----------
  if (act === "add-cart" || act === "buy-now") {
    const a = artwork(id);
    if (!canBuy(u)) { toast(t("switchToCustomerFirst"), true); return go("#/account"); }
    if (u && a.artist === u.id) return toast(t("ownArt"), true);
    let sel = null;
    const so = $("#popt");
    if (so) {
      if (!so.value) { so.classList.add("invalid"); so.focus(); return toast(t("pleaseSelect", { o: t(optionDef(a).key) }), true); }
      sel = { opt: so.value, note: ($("#pnote")?.value || "").trim() };
    }
    if (!u) { // ผู้เยี่ยมชม: เข้าสู่ระบบก่อน แล้วระบบจะใส่ตะกร้าให้
      pendingBuy = { act, id, sel }; loginNext = currentHash;
      toast(t("loginToBuy")); return go("#/login");
    }
    const body = sel || cartOpt(a);
    const ok = await run(() => api(`/api/cart/${id}`, { method: "PUT", body }), act === "add-cart" ? t("addedToCart") : "");
    if (ok && act === "buy-now") go("#/checkout");
    return;
  }
  if (act === "rm-cart") return run(() => api(`/api/cart/${id}`, { method: "DELETE" }));
  if (act === "received") return run(() => api(`/api/orders/${id}/received`, { method: "POST" }), t("receivedToast"));

  // ---------- ความคิดเห็น / ผลงาน ----------
  if (act === "del-comment") return run(() => api(`/api/artworks/comments/${id}`, { method: "DELETE" }));
  if (act === "del-art") {
    if (await ask({ title: t("confirmDelete"), danger: true, ok: t("delete") })) run(() => api(`/api/artworks/${id}`, { method: "DELETE" }), t("deleted"));
    return;
  }

  // ---------- งานจ้าง ----------
  if (act === "agree") return run(() => api(`/api/commissions/${id}/agree`, { method: "POST" }), t("agreedToast"));
  if (act === "status") {
    const v = el.dataset.v;
    if (el.dataset.confirm && !(await ask({ title: el.dataset.confirm, danger: ["declined", "cancelled"].includes(v) }))) return;
    return run(() => api(`/api/commissions/${id}/status`, { method: "POST", body: { status: v } }), t("s_" + v));
  }

  // ---------- การแจ้งเตือน ----------
  if (act === "read-all") return run(() => api("/api/notifications/read-all", { method: "POST" }));

  // ---------- แอดมิน ----------
  if (act === "hide") { const a = artwork(id); return run(() => api(`/api/admin/artworks/${id}/hidden`, { method: "POST", body: { hidden: !a.hidden } }), t(a.hidden ? "shownToast" : "hiddenToast")); }
  if (act === "report") return run(() => api(`/api/admin/reports/${id}`, { method: "POST", body: { status: el.dataset.v } }), t("decisionSaved"));
  if (act === "suspend") {
    const x = user(id);
    const reason = await ask({ title: t("suspendTitle", { n: x.name }), body: t("suspendBody"), input: t("suspendReason"), ok: t("suspend"), danger: true });
    if (reason) run(() => api(`/api/admin/users/${id}/suspend`, { method: "POST", body: { reason } }), t("suspendedToast"));
    return;
  }
  if (act === "unsuspend") return run(() => api(`/api/admin/users/${id}/unsuspend`, { method: "POST" }), t("unsuspendedToast"));
  if (act === "act-as") {
    try {
      const r = await api(`/api/admin/users/${id}/act-as`, { method: "POST" });
      localStorage.setItem(ADMIN_TOKEN_KEY, getToken()); setToken(r.token);
      await loadState(); toast(t("actStarted", { n: r.name }));
      go(r.role === "artist" ? "#/dashboard" : "#/");
    } catch (err) { toast(err.message, true); }
  }
});

// รับโทเคนใหม่ (สลับ/สร้างโปรไฟล์) แล้วโหลดสถานะใหม่
async function useToken(fn, okMsg, nextHash) {
  try {
    const r = await fn();
    setToken(r.token);
    await loadState(); toast(okMsg(r)); go(nextHash(r));
  } catch (err) { toast(err.message, true); }
}

// หลังเข้าสู่ระบบ/สมัคร: ทำรายการซื้อที่ค้างไว้ต่อ (ใส่ตะกร้าให้)
async function resumePending(role) {
  const p = pendingBuy; pendingBuy = null;
  if (!p || role !== "customer") return null;
  const a = artwork(p.id);
  if (!a || a.artist === me || !buyable(a)) return null;
  const optKey = p.sel?.opt || optionDef(a).choices[0][0];
  try { await api(`/api/cart/${p.id}`, { method: "PUT", body: { opt: optKey, note: p.sel?.note || "" } }); await loadState(); }
  catch { return null; }
  return p.act === "buy-now" ? "#/checkout" : `#/artwork/${p.id}`;
}

async function stopActing() {
  setToken(localStorage.getItem(ADMIN_TOKEN_KEY));
  localStorage.removeItem(ADMIN_TOKEN_KEY);
  drawer(false);
  await loadState();
  go("#/admin/users");
}

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (askResolve) return closeAsk(false);
  if (contactFor) { contactFor = null; $("#modal-root").innerHTML = ""; return; }
  if (openMenu || $(".drawer")) { openMenu = null; drawer(false); render(); }
});

// ---------- select ที่เปลี่ยนแล้วมีผลทันที ----------
document.addEventListener("change", (e) => {
  if (e.target.matches("select[data-act=rv-sort]")) { rvSort = e.target.value; render(); $("#reviews")?.scrollIntoView(); return; }
  if (e.target.matches("select[data-act=pick-opt]")) {
    e.target.classList.remove("invalid");
    const a = artwork(+e.target.dataset.id), value = e.target.value;
    if (!cart().includes(a.id) || !value) { pending.opt = value; return; }
    run(() => api(`/api/cart/${a.id}`, { method: "PUT", body: { ...cartOpt(a), opt: value } }));
    return;
  }
  const el = e.target.closest("select[data-act=role]");
  if (el) run(() => api(`/api/admin/users/${el.dataset.id}/role`, { method: "PUT", body: { role: el.value } }), t("roleChanged"));
});

// ข้อความถึงศิลปิน: บันทึกเมื่อพิมพ์เสร็จ (ถ้าอยู่ในตะกร้าแล้ว)
let noteTimer;
document.addEventListener("input", (e) => {
  if (e.target.id !== "pnote") return;
  const a = artwork(galleryFor);
  if (!a || !cart().includes(a.id)) { pending.note = e.target.value; return; }
  const note = e.target.value;
  db.cartOpts[me][a.id] = { ...cartOpt(a), note };
  clearTimeout(noteTimer);
  noteTimer = setTimeout(() => api(`/api/cart/${a.id}`, { method: "PUT", body: { ...cartOpt(a), note } }).catch((err) => toast(err.message, true)), 600);
});

// =====================================================================
// ฟอร์ม (data-form)
// =====================================================================
document.addEventListener("submit", async (e) => {
  const f = e.target.closest("form[data-form]");
  if (!f) return;
  e.preventDefault();
  const kind = f.dataset.form, id = +f.dataset.id, u = meU(), fd = new FormData(f);
  const btn = e.submitter;
  const authErr = (msg, ...fields) => {
    const box = $("#auth-err"); if (box) { box.textContent = msg; box.classList.remove("hide"); } else toast(msg, true);
    $$("input", f).forEach((i) => i.classList.toggle("invalid", fields.includes(i.name)));
    (fields.length ? f.elements.namedItem(fields[0]) : null)?.focus();
  };
  const validEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
  const busy = (on) => { if (btn) btn.disabled = on; };
  if (!u && !["login", "register", "forgot", "reset"].includes(kind)) { loginNext = currentHash; toast(t("loginFirst"), true); return go("#/login"); }
  // ส่งแบบทั่วไป: เรียก API -> แจ้งผล -> โหลดสถานะใหม่ -> (ไปหน้าอื่น)
  const submit = async (fn, okMsg, nextHash) => {
    busy(true);
    try {
      const r = await fn();
      if (okMsg) toast(okMsg);
      await loadState();
      if (nextHash) go(typeof nextHash === "function" ? nextHash(r) : nextHash); else render();
    } catch (err) { toast(err.message, true); busy(false); }
  };

  // ---------- เข้าสู่ระบบ / สมัคร ----------
  if (kind === "login") {
    const email = fd.get("email").trim().toLowerCase(), pw = fd.get("pw");
    if (!email || !pw) return authErr(t("fillAll"), ...(!email ? ["email"] : []), ...(!pw ? ["pw"] : []));
    if (!validEmail(email)) return authErr(t("badEmail"), "email");
    if (btn) { btn.disabled = true; btn.textContent = t("signingIn"); }
    try {
      const r = await api("/api/auth/login", { method: "POST", body: { email, password: pw } });
      setToken(r.token);
      await loadState();
      toast(t("welcome", { n: r.name }));
      const resumed = await resumePending(r.role);
      if (resumed) { if (resumed !== "#/checkout") toast(t("addedToCart")); loginNext = null; return go(resumed); }
      const fallback = r.role === "artist" ? "#/dashboard" : r.role === "admin" ? "#/admin" : "#/";
      const next = loginNext; loginNext = null;
      go(next && !["#/login", "#/register", "#/join"].includes(next) ? next : fallback);
    } catch (err) {
      if (btn) { btn.disabled = false; btn.textContent = t("signIn"); }
      if (err.code === "suspended") return authErr(t("loginSuspended", { r: err.reason }));
      authErr(err.status === 401 ? t("badLogin") : err.message, "pw");
    }
    return;
  }
  if (kind === "register") {
    const name = fd.get("name").trim(), email = fd.get("email").trim().toLowerCase(), pw = fd.get("pw"), pw2 = fd.get("pw2"), role = fd.get("role");
    if (!name) return authErr(t("fillAll"), "name");
    if (!validEmail(email)) return authErr(t("badEmail"), "email");
    if (pw.length < 8) return authErr(t("pwShort"), "pw");
    if (pw !== pw2) return authErr(t("pwMismatch"), "pw2");
    busy(true);
    const send = (confirmLink) => api("/api/auth/register", { method: "POST", body: { name, email, password: pw, role, confirmLink } });
    try {
      let r;
      try { r = await send(false); }
      catch (err) {
        // อีเมลนี้มีบัญชีอยู่แล้ว: ยืนยันเพื่อเพิ่มอีกโปรไฟล์ด้วยรหัสผ่านเดิม
        if (err.code !== "confirm_link") throw err;
        if (!(await ask({ title: t("confirmLinkTitle"), body: t("confirmLinkBody", { e: email, r: t("role_" + role) }), ok: t("yesConfirm") }))) return busy(false);
        r = await send(true);
      }
      setToken(r.token);
      await loadState(); toast(t("created"));
      const resumed = await resumePending(r.role);
      if (resumed) { if (resumed !== "#/checkout") toast(t("addedToCart")); return go(resumed); }
      go("#/account");
    } catch (err) {
      busy(false);
      if (err.code === "email_taken") return authErr(t("emailTaken"), "email");
      if (err.code === "existing_password") return authErr(t("existingPw"), "pw");
      authErr(err.message, "email");
    }
    return;
  }
  if (kind === "forgot") {
    const email = fd.get("email").trim().toLowerCase();
    if (!email) return authErr(t("fillAll"), "email");
    if (!validEmail(email)) return authErr(t("badEmail"), "email");
    busy(true);
    try {
      const r = await api("/api/auth/forgot", { method: "POST", body: { email } });
      // devLink มีเฉพาะตอนพัฒนา (ยังไม่ได้ต่อระบบส่งอีเมล) หน้าเว็บจะโชว์เป็น "อีเมลจำลอง"
      forgotSent = { email, token: r.devLink ? r.devLink.replace("#/reset/", "") : null };
      render();
    } catch (err) { busy(false); authErr(err.message, "email"); }
    return;
  }
  if (kind === "reset") {
    const pw = fd.get("pw"), pw2 = fd.get("pw2");
    if (pw.length < 8) return authErr(t("pwShort"), "pw");
    if (pw !== pw2) return authErr(t("pwMismatch"), "pw2");
    busy(true);
    try {
      await api("/api/auth/reset", { method: "POST", body: { token: f.dataset.token, password: pw } });
      forgotSent = null; resetCheck = { token: null, status: "idle", email: "" };
      toast(t("fpDone")); go("#/login");
    } catch (err) {
      busy(false);
      if (err.code === "bad_link") { resetCheck = { token: f.dataset.token, status: "bad", email: "" }; return render(); }
      authErr(err.message, "pw");
    }
    return;
  }

  // ---------- ซื้อขาย ----------
  if (kind === "checkout") {
    return submit(() => api("/api/checkout", { method: "POST", body: { pay: fd.get("pay"), name: fd.get("name"), phone: fd.get("phone"), addr: fd.get("addr") } }), t("orderPlaced"), "#/orders");
  }
  if (kind === "ship") {
    const tracking = (fd.get("tracking") || "").trim();
    if (!tracking) return toast(t("needTracking"), true);
    return submit(() => api(`/api/orders/${id}/ship`, { method: "POST", body: { tracking } }), t("shippedToast"));
  }

  // ---------- ผลงาน ----------
  if (kind === "report") {
    busy(true);
    try { await api(`/api/artworks/${id}/report`, { method: "POST", body: { reason: fd.get("reason"), details: fd.get("details") } }); toast(t("reportSent")); await refresh(); }
    catch (err) { busy(false); toast(err.code === "already_reported" ? t("alreadyReported") : err.message, true); }
    return;
  }
  if (kind === "comment") return submit(() => api(`/api/artworks/${id}/comments`, { method: "POST", body: { body: fd.get("body").trim() } }));
  if (kind === "art-review") {
    if (!fd.get("rating")) return toast(t("needRating"), true);
    const form = new FormData();
    form.append("rating", fd.get("rating")); form.append("body", fd.get("body") || ""); form.append("cats", fd.getAll("cat").join(","));
    if (fd.get("photo")?.size) form.append("photo", fd.get("photo"));
    return submit(() => api(`/api/artworks/${id}/reviews`, { method: "POST", form }), t("reviewPosted"));
  }
  if (kind === "artwork") {
    if (!formImgs.length) { toast(t("needImg"), true); $("#wimgs")?.scrollIntoView({ block: "center" }); return; }
    const form = new FormData(), order = [];
    const a0 = id ? artwork(id) : null;
    const idByUrl = new Map((a0?.imgs || []).map((src, k) => [src, a0.imgIds[k]]));
    let n = 0;
    for (const src of formImgs) {
      if (src.startsWith("data:")) { form.append("images", await dataUrlToBlob(src), `image-${n}.${imgExt(src)}`); order.push("n" + n++); }
      else order.push("e" + idByUrl.get(src)); // รูปเดิม
    }
    form.append("order", JSON.stringify(order));
    for (const [k, v] of [["title", fd.get("ttl")], ["format", fd.get("fmt")], ["purpose", fd.get("purpose")], ["price", fd.get("price") || 0],
      ["availability", fd.get("avail")], ["description", fd.get("desc")], ["status", fd.get("status")], ["tags", checked(f, "tag").join(",")]]) form.append(k, v ?? "");
    return submit(() => api(id ? `/api/artworks/${id}` : "/api/artworks", { method: id ? "PUT" : "POST", form }),
      t(id ? "savedToast" : "publishedToast"), (r) => { formImgsFor = null; return `#/artwork/${id || r.id}`; });
  }

  // ---------- งานจ้าง ----------
  if (kind === "new-commission") {
    const form = new FormData();
    for (const k of ["desc", "budget", "deadline", "artType", "delivery"]) form.append(k, fd.get(k) || "");
    form.append("artistId", id); form.append("tags", checked(f, "tag").join(","));
    if (fd.get("ref")?.size) form.append("ref", fd.get("ref"));
    return submit(() => api("/api/commissions", { method: "POST", form }), t("requestSent"), (r) => `#/commission/${r.id}`);
  }
  if (kind === "chat") return submit(() => api(`/api/commissions/${id}/messages`, { method: "POST", body: { body: fd.get("body").trim() } }));
  if (kind === "quote") return submit(() => api(`/api/commissions/${id}/quote`, { method: "POST", body: { price: fd.get("price"), deadline: fd.get("deadline") } }), t("quoteSent"));
  if (kind === "sketch") {
    if (!fd.get("file")?.size) return toast(t("needSketch"), true);
    const form = new FormData(); form.append("file", fd.get("file")); form.append("note", fd.get("note") || "");
    return submit(() => api(`/api/commissions/${id}/sketch`, { method: "POST", form }), t("sketchSent"));
  }
  if (kind === "sketch-review") {
    const decision = btn.value, feedback = fd.get("fb").trim();
    if (decision === "revision_requested" && !feedback) return toast(t("needFeedback"), true);
    return submit(() => api(`/api/commissions/${id}/sketch/review`, { method: "POST", body: { decision, feedback } }), t(decision === "approved" ? "sk_approved" : "sk_revision_requested"));
  }
  if (kind === "review") return submit(() => api(`/api/commissions/${id}/review`, { method: "POST", body: { rating: fd.get("rating"), body: fd.get("body") } }), t("reviewSaved"));

  // ---------- ข้อความ ----------
  if (kind === "contact") {
    const body = (fd.get("body") || "").trim();
    if (body.length < 5) return toast(t("msgShort"), true);
    contactFor = null;
    return submit(() => api("/api/messages", { method: "POST", body: { to: id, art: fd.get("art") || null, topic: fd.get("topic"), topicLabel: t("tp_" + fd.get("topic")), body } }), t("msgSent"), (r) => `#/messages/${r.thread}`);
  }
  if (kind === "dm") return submit(() => api(`/api/messages/${id}`, { method: "POST", body: { body: fd.get("body").trim() } }));

  // ---------- ตั้งค่า ----------
  if (kind === "settings") {
    if (!f.physical.checked && !f.digital.checked) return toast(t("pickOneType"), true);
    const ship = { prep: +fd.get("sh_prep"), min: +fd.get("sh_min"), max: +fd.get("sh_max"), fee: +fd.get("sh_fee"), returns: +fd.get("sh_ret") };
    if (ship.min > ship.max) return toast(t("badTransit"), true);
    const social = {}; SOCIALS.forEach(([k]) => { social[k] = (fd.get("s_" + k) || "").trim(); });
    const name = (fd.get("name") || "").trim();
    if (!name) return toast(t("fillAll"), true);
    return submit(() => api("/api/me/artist-profile", { method: "PUT", body: {
      name, open: f.open.checked, min: f.min.value, city: f.city.value, bio: f.bio.value, physical: f.physical.checked, digital: f.digital.checked,
      tags: checked(f, "tag"), social, ship } }), t("profileSaved"));
  }
  if (kind === "profile") return submit(() => api("/api/me/profile", { method: "PUT", body: { name: fd.get("name").trim() } }), t("savedToast"));
  if (kind === "password") {
    const cur = fd.get("cur"), nxt = fd.get("next");
    if (nxt.length < 8) return authErr(t("pwShort"), "next");
    if (nxt === cur) return authErr(t("samePw"), "next");
    busy(true);
    try { await api("/api/me/password", { method: "PUT", body: { current: cur, next: nxt } }); f.reset(); $$("input", f).forEach((i) => i.classList.remove("invalid")); toast(t("pwChanged")); }
    catch (err) { authErr(err.code === "wrong_current" ? t("wrongCurrentPw") : err.message, "cur"); }
    busy(false);
  }
});

// =====================================================================
// เริ่มต้น: โหลดสถานะแล้วแสดงหน้าแรก
// =====================================================================
(async function start() {
  $("#app").innerHTML = `<div class="narrow page"><div class="empty">${t("loading")}</div></div>`;
  try {
    await loadState();
    render();
  } catch (err) {
    $("#app").innerHTML = `<div class="narrow page"><div class="empty">${esc(err.message)}<br><br><button class="btn" onclick="location.reload()">${t("retry")}</button></div></div>`;
  }
})();
