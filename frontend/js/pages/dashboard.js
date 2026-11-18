// =====================================================================
// pages/dashboard.js — แดชบอร์ดศิลปิน และฟอร์มลงผลงาน (หลายรูป)
// =====================================================================
pages.dashboard = (tab = "artworks") => {
  const u = meU();
  if (!u) return needLogin();
  if (u.role !== "artist") return onlyFor(t("artist"));
  if (tab === "settings") return redirect("#/account"); // ตั้งค่าโปรไฟล์ย้ายไปรวมกับ "บัญชีของฉัน"
  const mine = db.artworks.filter((a) => a.artist === u.id).sort((a, b) => b.created - a.created);
  const orders = db.orders.filter((o) => o.artist === u.id).sort((a, b) => b.at - a.at);
  const coms = db.commissions.filter((c) => c.artist === u.id);
  const earn = orders.reduce((s, o) => s + o.items.reduce((x, i) => x + i.price, 0) * 0.85, 0);
  const p = db.profiles[u.id];
  const ST = { published: "ok", draft: "", unpublished: "" };
  let body = "";
  if (tab === "artworks") body = mine.length ? `<div class="card tw"><table><thead><tr><th></th><th>${t("artworkH")}</th><th>${t("format")}</th><th>${t("price")}</th><th>${t("status")}</th><th></th></tr></thead><tbody>
    ${mine.map((a) => `<tr><td><img class="thumb" src="${a.img}" alt=""></td><td><a href="#/artwork/${a.id}">${esc(a.title)}</a><div class="xs muted">${a.purpose === "for_sale" ? t(a.avail) : t("portfolio")}</div></td><td class="sm">${t(a.format)}</td>
      <td>${a.purpose === "for_sale" ? baht(a.price) : "-"}</td><td><span class="pill ${ST[a.status]}">${t(a.status)}</span>${a.hidden ? ` <span class="pill bad">${t("adminHidden")}</span>` : ""}</td>
      <td><div class="row" style="flex-wrap:nowrap;gap:.2rem"><a class="btn line s" href="#/artwork-form/${a.id}">${t("edit")}</a>${a.hidden ? "" : `<button class="btn ghost s" data-act="del-art" data-id="${a.id}">${t("delete")}</button>`}</div></td></tr>`).join("")}</tbody></table></div>`
    : `<div class="empty">${t("noWorks")}<br><br><a class="btn" href="#/artwork-form/new">${t("firstArtwork")}</a></div>`;
  if (tab === "orders") body = orders.map((o) => { const sub = o.items.reduce((x, i) => x + i.price, 0);
    return `<div class="card"><div class="row between"><div><b>${t("order")} #${o.id}</b> <span class="xs muted">· ${t("buyer")} ${esc(user(o.buyer).name)} · ${when(o.at)}</span></div><span class="pill ${ORDER_CLS[o.status]}">${t("o_" + o.status)}</span></div>
      ${o.items.map((i) => { const a = artwork(i.art); return `<div class="li" style="align-items:center"><img class="thumb" src="${a.img}" alt=""><div style="flex:1">${esc(a.title)}<div class="xs muted">${t(i.format)} · ${optLabel(a, i.opt)}</div>${i.note ? `<div class="xs muted">${t("noteFromBuyer")}: “${esc(i.note)}”</div>` : ""}</div><span>${baht(i.price)}</span></div>`; }).join("")}
      <p class="sm" style="margin:.6rem 0">${t("youReceive", { p: `<b>${baht(sub * 0.85)}</b>` })}</p>
      ${o.address ? `<p class="sm muted" style="margin:0 0 .6rem">${t("shipTo")}: ${esc(o.address.name)} · ${esc(o.address.phone)}<br>${esc(o.address.addr)}</p>` : ""}
      ${o.status === "paid" && o.address ? `<form data-form="ship" data-id="${o.id}" class="row" style="flex-wrap:nowrap"><input type="text" name="tracking" placeholder="${t("tracking")}" style="max-width:240px" aria-label="${t("tracking")}"><button class="btn s">${t("markShipped")}</button></form>` : ""}
      ${o.tracking ? `<p class="sm" style="margin:0">${t("tracking")} <b>${esc(o.tracking)}</b></p>` : ""}</div>`; }).join("") || `<div class="empty">${t("noOrders")}</div>`;
  if (tab === "commissions") body = `<div class="card" style="padding-block:.3rem">${coms.sort((a, b) => b.updated - a.updated).map((c) => comRow(c, true)).join("") || `<div class="empty" style="border:0">${t("noCommissions")}</div>`}</div>`;
  return `<div class="wrap page"><div class="row between"><div><span class="eyebrow">${t("studio")}</span>${head("", t("dashTitle"))}</div><div class="row"><a class="btn line" href="#/artist/${u.id}">${t("myPublicProfile")}</a><a class="btn" href="#/artwork-form/new">${t("uploadArt")}</a></div></div>
    <div class="stats"><a class="stat" href="#/dashboard/artworks"><b>${mine.filter(visible).length}</b><span class="sm muted">${t("statPublished")}</span></a>
      <a class="stat" href="#/dashboard/commissions"><b>${coms.filter((c) => ["pending", "accepted", "delivered"].includes(c.status)).length}</b><span class="sm muted">${t("statActive")}</span></a>
      <a class="stat" href="#/dashboard/orders"><b>${orders.filter((o) => o.status === "paid" && o.address).length}</b><span class="sm muted">${t("statToShip")}</span></a>
      <a class="stat" href="#/dashboard/orders"><b>${baht(earn)}</b><span class="sm muted">${t("statEarn")}</span></a></div>
    <div class="tabs">${[["artworks", "tabArtworks"], ["orders", "tabOrders"], ["commissions", "tabCommissions"], ["settings", "tabSettings"]].map(([k, l]) => `<button data-go="${k === "settings" ? "#/account" : "#/dashboard/" + k}" class="${tab === k ? "on" : ""}">${t(l)}</button>`).join("")}</div>${body}</div>`;
};

pages["artwork-form"] = (id) => {
  const u = meU();
  if (!u) return needLogin();
  if (u.role !== "artist") return onlyFor(t("artist"));
  const a = id && id !== "new" ? artwork(+id) : null;
  if (a && a.artist !== u.id) return `<div class="narrow page"><div class="empty">${t("onlyYours")}</div></div>`;
  const fkey = a ? String(a.id) : "new";
  if (formImgsFor !== fkey) { formImgsFor = fkey; formImgs = a ? [...(a.imgs || [a.img])] : []; }
  const opt = (v, cur, label) => `<option value="${v}" ${cur === v ? "selected" : ""}>${label}</option>`;
  return `<div class="narrow page" style="max-width:860px">${head("", t(a ? "editArtwork" : "newArtwork"))}
    <form class="card" data-form="artwork" data-id="${a?.id || ""}" style="margin-top:1.5rem">
      <div class="two" style="align-items:start;gap:1.5rem">
        <div class="field"><label class="f">${t("imgsLabel")}</label>
          <div id="wimgs" class="imgs-grid"></div>
          <div class="row" style="margin-top:.7rem"><label class="btn line s" for="wi" style="cursor:pointer">${t("addImages")}</label></div>
          <input type="file" id="wi" accept="image/*" multiple class="hide">
          <div class="hint" id="wimg-hint"></div></div>
        <div><div class="field"><label class="f" for="wt">${t("title")}</label><input type="text" id="wt" name="ttl" required value="${esc(a?.title || "")}"></div>
          <div class="field"><label class="f" for="wf">${t("format")}</label><select id="wf" name="fmt">${opt("physical", a?.format, t("physical"))}${opt("digital", a?.format || "digital", t("digital"))}</select><div class="hint">${t("formatHint")}</div></div>
          <div class="field"><label class="f" for="wp">${t("purpose")}</label><select id="wp" name="purpose">${opt("for_sale", a?.purpose, t("forSale"))}${opt("portfolio", a?.purpose, t("portfolio"))}</select>
            <div class="hint ${a?.purpose === "portfolio" ? "" : "hide"}" id="pf-hint">${t("saleFieldsHint")}</div></div>
          <div id="sale-fields" class="${a?.purpose === "portfolio" ? "hide" : ""}">
            <div class="field"><label class="f" for="wr">${t("price")}</label><input type="number" id="wr" name="price" min="0" ${a?.purpose === "portfolio" ? "" : "required"} value="${a?.price ?? ""}"></div>
            <div class="field"><label class="f" for="wa">${t("availability")}</label><select id="wa" name="avail">${["available", "reserved", "sold"].map((k) => opt(k, a?.avail, t(k))).join("")}</select></div>
          </div></div>
      </div>
      <div class="field"><label class="f" for="wd">${t("description")}</label><textarea id="wd" name="desc" placeholder="${t("descArtPh")}">${esc(a?.desc || "")}</textarea></div>
      <div class="field"><label class="f">${t("styleTags")}</label><div class="chips">${chips(TAGS.filter((x) => x.cat === "style"), "tag", a?.tags || [])}</div></div>
      <div class="field"><label class="f">${t("subject")}</label><div class="chips">${chips(TAGS.filter((x) => x.cat === "subject"), "tag", a?.tags || [])}</div></div>
      <div class="field"><label class="f" for="ws">${t("visibility")}</label><select id="ws" name="status">${["published", "draft", "unpublished"].map((k) => opt(k, a?.status, t(k))).join("")}</select></div>
      <div class="row"><button class="btn">${t(a ? "saveChanges" : "publish")}</button><a class="btn line" href="#/dashboard">${t("cancel")}</a></div>
    </form></div>`;
};
// ย่อรูปที่ยาวเกิน 1600px เพื่อไม่ให้หน่วยความจำของหน้าสาธิตบวม
const fitImage = (file) => new Promise((ok) => {
  if (!file || !file.size || !file.type.startsWith("image/")) return ok(null);
  const rd = new FileReader();
  rd.onerror = () => ok(null);
  rd.onload = () => {
    if (file.type === "image/svg+xml" || file.type === "image/gif") return ok(rd.result);
    const img = new Image();
    img.onerror = () => ok(rd.result);
    img.onload = () => {
      const k = Math.min(1, 1600 / Math.max(img.width, img.height));
      if (k === 1) return ok(rd.result);
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext("2d").drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL(file.type === "image/png" ? "image/png" : "image/jpeg", 0.9));
    };
    img.src = rd.result;
  };
  rd.readAsDataURL(file);
});
function drawFormImgs() {
  const box = $("#wimgs"); if (!box) return;
  const n = formImgs.length;
  box.innerHTML = formImgs.map((src, i) => `<div class="it"><img src="${src}" alt="${t("imgN", { n: i + 1 })}">${i === 0 ? `<span class="cv">${t("coverBadge")}</span>` : ""}
    <div class="tb"><span><button type="button" data-i="${i}" data-m="left" aria-label="${t("moveLeft")}" ${i === 0 ? "disabled" : ""}>◀</button><button type="button" data-i="${i}" data-m="right" aria-label="${t("moveRight")}" ${i === n - 1 ? "disabled" : ""}>▶</button></span><button type="button" data-i="${i}" data-m="del" aria-label="${t("removeImg")}">✕</button></div></div>`).join("")
    || `<div class="empty" style="grid-column:1/-1;padding:1.4rem .5rem">${icon("image").replace("<svg", '<svg width="28" height="28"')}<div class="sm" style="margin-top:.4rem">${t("noImgsYet")}</div></div>`;
  const h = $("#wimg-hint"); if (h) h.textContent = t("nImages", { n }) + " · " + t("imgsHint");
}
pages["artwork-form"].after = () => {
  const wp = $("#wp");
  wp && wp.addEventListener("change", () => {
    const pf = wp.value === "portfolio";
    $("#sale-fields").classList.toggle("hide", pf); $("#pf-hint").classList.toggle("hide", !pf); $("#wr").required = !pf;
  });
  const box = $("#wimgs"), inp = $("#wi");
  if (!box || !inp) return;
  drawFormImgs();
  box.addEventListener("click", (e) => {
    const b = e.target.closest("button[data-m]"); if (!b) return;
    const i = +b.dataset.i, m = b.dataset.m;
    if (m === "del") formImgs.splice(i, 1);
    else { const j = m === "left" ? i - 1 : i + 1; if (j < 0 || j >= formImgs.length) return; [formImgs[i], formImgs[j]] = [formImgs[j], formImgs[i]]; }
    drawFormImgs();
  });
  inp.addEventListener("change", async () => {
    const files = [...inp.files]; inp.value = "";
    let full = false, bad = false;
    for (const f of files) {
      if (formImgs.length >= MAX_IMGS) { full = true; continue; }
      const d = await fitImage(f);
      if (d) formImgs.push(d); else bad = true;
    }
    if (full) toast(t("maxImgs"), true);
    if (bad) toast(t("notImage"), true);
    drawFormImgs();
  });
};
